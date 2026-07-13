"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ApplicationStatus, EmailStatus, EmailType, MembershipSubscriptionStatus, MemberUserStatus } from "@/generated/prisma/enums";
import {
  createAdminMfaChallenge,
  destroyAdminSession,
  requireAdmin,
} from "@/lib/admin/auth";
import { sendEmailLog } from "@/lib/email/mailer";
import { issueAdminEmailOtp } from "@/lib/admin/email-otp-service";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { verifyPassword } from "@/lib/security/password";
import { recordAdminAudit } from "@/lib/security/admin-audit";
import {
  BANK_SETTING_KEYS,
  FACEBOOK_GROUP_URL_KEY,
  isValidFacebookGroupUrl,
} from "@/lib/settings";

export type LoginActionState = { message: string };

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

export async function loginAdmin(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { message: "請輸入管理員 Email 與密碼。" };
  }

  const rateLimit = await checkRateLimit({
    scope: "admin-login-password",
    limit: 5,
    windowSeconds: 15 * 60,
    identifiers: [email],
  });
  if (!rateLimit.allowed) {
    if (rateLimit.currentCount === 6) {
      await recordAdminAudit({
        action: "ADMIN_LOGIN_PASSWORD_RATE_LIMITED",
        metadata: { reason: "rate_limited" },
      });
    }
    return { message: "登入嘗試次數過多，請稍後再試。" };
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  const valid = await verifyPassword(password, admin?.isActive ? admin.passwordHash : null);

  if (!admin || !valid) {
    await recordAdminAudit({
      adminUserId: admin?.id,
      action: "ADMIN_LOGIN_PASSWORD_FAILED",
      metadata: { reason: "invalid_credentials" },
    });
    return { message: "Email 或密碼錯誤。" };
  }

  await createAdminMfaChallenge(admin.id);
  const emailSendLimit = await checkRateLimit({
    scope: "admin-login-email-code-send",
    limit: 5,
    windowSeconds: 15 * 60,
    identifiers: [admin.id],
  });
  if (!emailSendLimit.allowed) {
    await recordAdminAudit({
      adminUserId: admin.id,
      action: "ADMIN_LOGIN_EMAIL_CODE_SEND_RATE_LIMITED",
      metadata: { reason: "rate_limited" },
    });
    redirect("/admin/login/verify?delivery=limited");
  }

  await recordAdminAudit({
    adminUserId: admin.id,
    action: "ADMIN_LOGIN_PASSWORD_VERIFIED",
  });
  let delivery: "sent" | "failed" = "sent";
  try {
    await issueAdminEmailOtp(admin.id, admin.email);
    await checkRateLimit({
      scope: "admin-login-email-code-resend-cooldown",
      limit: 1,
      windowSeconds: 60,
      identifiers: [admin.id],
    });
    await recordAdminAudit({
      adminUserId: admin.id,
      action: "ADMIN_LOGIN_EMAIL_CODE_SENT",
    });
  } catch (error) {
    delivery = "failed";
    await recordAdminAudit({
      adminUserId: admin.id,
      action: "ADMIN_LOGIN_EMAIL_CODE_SEND_FAILED",
      metadata: { reason: "mail_delivery_failed" },
    });
    console.error("管理員登入驗證碼寄送失敗", error);
  }
  redirect(`/admin/login/verify?delivery=${delivery}`);
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
      name: true,
      phone: true,
      plan: { select: { name: true, price: true, durationDays: true } },
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

  const approvedAt = nextStatus === ApplicationStatus.APPROVED ? new Date() : undefined;
  const emailLogId = await prisma.$transaction(async (transaction) => {
    let memberUserId: string | undefined;

    if (approvedAt) {
      const memberUser = await transaction.memberUser.upsert({
        where: { email: application.email },
        update: {
          name: application.name,
          phone: application.phone,
        },
        create: {
          email: application.email,
          name: application.name,
          phone: application.phone,
          status: MemberUserStatus.PENDING_PASSWORD,
        },
        select: { id: true, passwordHash: true, status: true },
      });

      memberUserId = memberUser.id;

      if (memberUser.passwordHash && memberUser.status !== MemberUserStatus.DISABLED) {
        await transaction.memberUser.update({
          where: { id: memberUser.id },
          data: { status: MemberUserStatus.ACTIVE },
        });
      } else if (!memberUser.passwordHash && memberUser.status !== MemberUserStatus.DISABLED) {
        await transaction.memberUser.update({
          where: { id: memberUser.id },
          data: { status: MemberUserStatus.PENDING_PASSWORD },
        });
      }

      await transaction.membershipSubscription.upsert({
        where: { applicationId },
        update: {
          memberUserId: memberUser.id,
          planName: application.plan.name,
          planPrice: application.plan.price,
          durationDays: application.plan.durationDays,
          startsAt: approvedAt,
          endsAt: addDays(approvedAt, application.plan.durationDays),
          status: MembershipSubscriptionStatus.ACTIVE,
        },
        create: {
          applicationId,
          memberUserId: memberUser.id,
          planName: application.plan.name,
          planPrice: application.plan.price,
          durationDays: application.plan.durationDays,
          startsAt: approvedAt,
          endsAt: addDays(approvedAt, application.plan.durationDays),
          status: MembershipSubscriptionStatus.ACTIVE,
        },
      });

      await transaction.coursePurchase.updateMany({
        where: { email: application.email, memberUserId: null },
        data: { memberUserId: memberUser.id },
      });
    }

    await transaction.application.update({
      where: { id: applicationId },
      data: {
        status: nextStatus,
        memberUserId,
        approvedAt,
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
  await recordAdminAudit({
    adminUserId: session.adminUser.id,
    action: "APPLICATION_STATUS_CHANGED",
    targetType: "Application",
    targetId: applicationId,
    metadata: { fromStatus: application.status, toStatus: nextStatus },
  });
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

  await recordAdminAudit({
    adminUserId: session.adminUser.id,
    action: "FACEBOOK_GROUP_SETTING_CHANGED",
    targetType: "SystemSetting",
    targetId: FACEBOOK_GROUP_URL_KEY,
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

  await recordAdminAudit({
    adminUserId: session.adminUser.id,
    action: "BANK_TRANSFER_SETTINGS_CHANGED",
    targetType: "SystemSetting",
  });

  revalidatePath("/admin/settings");
  revalidatePath("/apply/success");
  redirect("/admin/settings?saved=bank");
}
