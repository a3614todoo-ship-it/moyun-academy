"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CoursePurchaseStatus, EmailStatus, EmailType, MemberUserStatus } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/admin/auth";
import { sendEmailLog } from "@/lib/email/mailer";
import { prisma } from "@/lib/prisma";
import { recordAdminAudit } from "@/lib/security/admin-audit";

function text(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

export async function updateCoursePurchaseStatus(formData: FormData) {
  const session = await requireAdmin();
  const purchaseId = text(formData, "purchaseId");
  const nextStatus = text(formData, "status") as CoursePurchaseStatus;

  if (!Object.values(CoursePurchaseStatus).includes(nextStatus)) {
    throw new Error("不支援的課程購買狀態。");
  }

  const purchase = await prisma.coursePurchase.findUnique({
    where: { id: purchaseId },
    include: {
      course: { select: { title: true } },
    },
  });

  if (!purchase) throw new Error("找不到課程購買資料。");
  if (purchase.status === nextStatus) {
    redirect(`/admin/course-purchases/${purchaseId}`);
  }

  if (nextStatus === CoursePurchaseStatus.APPROVED && !purchase.bankLast5) {
    throw new Error("尚未收到匯款回報，不能審核通過。");
  }

  const emailLogId = await prisma.$transaction(async (transaction) => {
    let memberUserId: string | undefined;

    if (nextStatus === CoursePurchaseStatus.APPROVED) {
      const memberUser = await transaction.memberUser.upsert({
        where: { email: purchase.email },
        update: {
          name: purchase.name,
          phone: purchase.phone,
        },
        create: {
          email: purchase.email,
          name: purchase.name,
          phone: purchase.phone,
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
    }

    await transaction.coursePurchase.update({
      where: { id: purchaseId },
      data: {
        status: nextStatus,
        memberUserId,
        reviewedAt: new Date(),
        reviewedById: session.adminUser.id,
        approvedAt: nextStatus === CoursePurchaseStatus.APPROVED ? new Date() : undefined,
        rejectedAt: nextStatus === CoursePurchaseStatus.REJECTED ? new Date() : undefined,
      },
    });

    if (nextStatus !== CoursePurchaseStatus.APPROVED) return null;

    const emailLog = await transaction.emailLog.create({
      data: {
        coursePurchaseId: purchase.id,
        type: EmailType.COURSE_PURCHASE_APPROVED,
        recipient: purchase.email,
        subject: `您的課程已審核通過：${purchase.course.title}`,
        status: EmailStatus.PENDING,
      },
    });

    return emailLog.id;
  });

  if (emailLogId) await sendEmailLog(emailLogId);

  await recordAdminAudit({
    adminUserId: session.adminUser.id,
    action: "COURSE_PURCHASE_STATUS_CHANGED",
    targetType: "CoursePurchase",
    targetId: purchaseId,
    metadata: { fromStatus: purchase.status, toStatus: nextStatus },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/course-purchases");
  revalidatePath(`/admin/course-purchases/${purchaseId}`);
  redirect(`/admin/course-purchases/${purchaseId}?updated=1`);
}

export async function resendCoursePurchaseEmail(formData: FormData) {
  await requireAdmin();
  const emailLogId = text(formData, "emailLogId");
  const purchaseId = text(formData, "purchaseId");

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
  revalidatePath(`/admin/course-purchases/${purchaseId}`);
}
