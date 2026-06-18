"use server";

import { compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ApplicationStatus, EmailStatus, EmailType } from "@/generated/prisma/enums";
import {
  createAdminSession,
  destroyAdminSession,
  requireAdmin,
} from "@/lib/admin/auth";
import { sendEmailLog } from "@/lib/email/mailer";
import { prisma } from "@/lib/prisma";
import {
  BANK_SETTING_KEYS,
  FACEBOOK_GROUP_URL_KEY,
  isValidFacebookGroupUrl,
} from "@/lib/settings";

export type LoginActionState = { message: string };

export async function loginAdmin(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { message: "請輸入管理員 Email 與密碼。" };
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  const valid = admin?.isActive
    ? await compare(password, admin.passwordHash)
    : false;

  if (!admin || !valid) {
    return { message: "Email 或密碼錯誤。" };
  }

  await prisma.$transaction([
    prisma.adminSession.deleteMany({
      where: { adminUserId: admin.id, expiresAt: { lte: new Date() } },
    }),
    prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    }),
  ]);
  await createAdminSession(admin.id);
  redirect("/admin");
}

export async function logoutAdmin() {
  await destroyAdminSession();
  redirect("/admin/login");
}

export async function updateApplicationStatus(formData: FormData) {
  const session = await requireAdmin();
  const applicationId = String(formData.get("applicationId") || "");
  const nextStatus = String(formData.get("status") || "") as ApplicationStatus;
  const note = String(formData.get("note") || "").trim() || undefined;

  if (!Object.values(ApplicationStatus).includes(nextStatus)) {
    throw new Error("無效的報名狀態。");
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      status: true,
      email: true,
    },
  });

  if (!application) throw new Error("找不到報名資料。");
  if (application.status === nextStatus) redirect(`/admin/applications/${applicationId}`);

  const emailType =
    nextStatus === ApplicationStatus.APPROVED
      ? EmailType.APPLICATION_APPROVED
      : nextStatus === ApplicationStatus.JOINED_FACEBOOK_GROUP
        ? EmailType.FACEBOOK_GROUP_JOINED
        : null;

  const emailLogId = await prisma.$transaction(async (transaction) => {
    await transaction.application.update({
      where: { id: applicationId },
      data: {
        status: nextStatus,
        approvedAt:
          nextStatus === ApplicationStatus.APPROVED ? new Date() : undefined,
        joinedFacebookAt:
          nextStatus === ApplicationStatus.JOINED_FACEBOOK_GROUP
            ? new Date()
            : undefined,
        rejectedAt:
          nextStatus === ApplicationStatus.REJECTED ? new Date() : undefined,
        cancelledAt:
          nextStatus === ApplicationStatus.CANCELLED ? new Date() : undefined,
      },
    });

    await transaction.applicationStatusHistory.create({
      data: {
        applicationId,
        fromStatus: application.status,
        toStatus: nextStatus,
        note,
        changedById: session.adminUser.id,
      },
    });

    if (!emailType) return null;

    const emailLog = await transaction.emailLog.create({
      data: {
        applicationId,
        type: emailType,
        recipient: application.email,
        subject:
          emailType === EmailType.APPLICATION_APPROVED
            ? "您的會員申請已審核通過"
            : "您已完成會員加入流程",
        status: EmailStatus.PENDING,
      },
    });
    return emailLog.id;
  });

  if (emailLogId) await sendEmailLog(emailLogId);
  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${applicationId}`);
  redirect(`/admin/applications/${applicationId}?updated=1`);
}

export async function resendEmail(formData: FormData) {
  await requireAdmin();
  const emailLogId = String(formData.get("emailLogId") || "");
  const applicationId = String(formData.get("applicationId") || "");

  await prisma.emailLog.update({
    where: { id: emailLogId },
    data: {
      status: EmailStatus.PENDING,
      errorMessage: null,
      providerId: null,
      sentAt: null,
    },
  });
  await sendEmailLog(emailLogId);
  revalidatePath(`/admin/applications/${applicationId}`);
}

export async function saveFacebookGroupSetting(formData: FormData) {
  const session = await requireAdmin();
  const facebookGroupUrl = String(
    formData.get("facebookGroupUrl") || "",
  ).trim();

  if (!isValidFacebookGroupUrl(facebookGroupUrl)) {
    redirect("/admin/settings?error=invalid_url");
  }

  await prisma.systemSetting.upsert({
    where: { key: FACEBOOK_GROUP_URL_KEY },
    create: {
      key: FACEBOOK_GROUP_URL_KEY,
      value: facebookGroupUrl,
      description: "審核通過通知信使用的 Facebook 私密社團網址",
      updatedById: session.adminUser.id,
    },
    update: {
      value: facebookGroupUrl,
      updatedById: session.adminUser.id,
    },
  });

  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}

export async function saveBankTransferSettings(formData: FormData) {
  const session = await requireAdmin();
  const values = {
    bankName: String(formData.get("bankName") || "").trim(),
    bankBranch: String(formData.get("bankBranch") || "").trim(),
    bankAccountName: String(formData.get("bankAccountName") || "").trim(),
    bankAccountNumber: String(
      formData.get("bankAccountNumber") || "",
    ).trim(),
  };

  if (Object.values(values).some((value) => !value)) {
    redirect("/admin/settings?error=bank_required");
  }

  const descriptions = {
    bankName: "會員匯款使用的銀行名稱",
    bankBranch: "會員匯款使用的銀行分行",
    bankAccountName: "會員匯款使用的戶名",
    bankAccountNumber: "會員匯款使用的帳號",
  };

  await prisma.$transaction(
    Object.entries(values).map(([name, value]) => {
      const settingName = name as keyof typeof BANK_SETTING_KEYS;
      return prisma.systemSetting.upsert({
        where: { key: BANK_SETTING_KEYS[settingName] },
        create: {
          key: BANK_SETTING_KEYS[settingName],
          value,
          description: descriptions[settingName],
          updatedById: session.adminUser.id,
        },
        update: {
          value,
          updatedById: session.adminUser.id,
        },
      });
    }),
  );

  revalidatePath("/admin/settings");
  revalidatePath("/apply/success");
  redirect("/admin/settings?saved=bank");
}
