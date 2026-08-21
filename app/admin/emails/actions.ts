"use server";

import { revalidatePath } from "next/cache";
import { EmailStatus } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/admin/auth";
import { sendEmailLog } from "@/lib/email/mailer";
import { prisma } from "@/lib/prisma";
import { recordAdminAudit } from "@/lib/security/admin-audit";

export async function retryEmailDelivery(formData: FormData) {
  const session = await requireAdmin();
  const emailLogId = String(formData.get("emailLogId") || "");
  if (!emailLogId) throw new Error("缺少 Email 紀錄識別碼。");

  const emailLog = await prisma.emailLog.findUnique({
    where: { id: emailLogId },
    select: { id: true, status: true, type: true },
  });
  if (!emailLog) throw new Error("找不到 Email 紀錄。");
  if (emailLog.status === EmailStatus.SENT) {
    throw new Error("已寄送成功的 Email 不會從此頁重複寄送。");
  }

  await prisma.emailLog.update({
    where: { id: emailLog.id },
    data: {
      status: EmailStatus.PENDING,
      providerId: null,
      errorMessage: null,
      sentAt: null,
    },
  });

  const result = await sendEmailLog(emailLog.id);
  await recordAdminAudit({
    adminUserId: session.adminUser.id,
    action: "EMAIL_DELIVERY_RETRIED",
    targetType: "EmailLog",
    targetId: emailLog.id,
    metadata: { type: emailLog.type, success: result.success },
  });
  revalidatePath("/admin/emails");
}
