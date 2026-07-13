"use server";

import { redirect } from "next/navigation";
import { CoursePurchaseStatus, EmailStatus, EmailType } from "@/generated/prisma/enums";
import { coursePaymentReportSchema } from "@/lib/course-payment-report-validation";
import { getEmailConfig } from "@/lib/email/config";
import { sendEmailLogs } from "@/lib/email/mailer";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { publicReferenceQuery } from "@/lib/security/public-reference";

export type CoursePaymentReportActionState = {
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

class ExistingCoursePaymentReportError extends Error {}

export async function createCoursePaymentReport(
  _previousState: CoursePaymentReportActionState,
  formData: FormData,
): Promise<CoursePaymentReportActionState> {
  const parsed = coursePaymentReportSchema.safeParse({
    purchaseNo: formData.get("purchaseNo"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    bankLast5: formData.get("bankLast5"),
    amount: formData.get("amount"),
    paidAt: formData.get("paidAt"),
    payerName: formData.get("payerName"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return {
      message: "請確認匯款回報欄位是否完整。",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const values = parsed.data;
  const rateLimit = await checkRateLimit({
    scope: "course-payment-report",
    limit: 5,
    windowSeconds: 10 * 60,
    identifiers: [values.purchaseNo, values.phone],
  });
  if (!rateLimit.allowed) return { message: "送出次數過多，請稍後再試。" };
  const purchase = await prisma.coursePurchase.findFirst({
    where: {
      purchaseNo: values.purchaseNo,
      name: values.name,
      phone: values.phone,
    },
    include: {
      course: { select: { title: true } },
    },
  });

  if (!purchase) {
    return { message: "找不到符合的課程購買資料，請確認購買編號、姓名與手機。" };
  }

  if (purchase.status !== CoursePurchaseStatus.PENDING_PAYMENT) {
    redirect(`/course-payment-report/success?${publicReferenceQuery("purchase", purchase.purchaseNo)}`);
  }

  if (values.amount !== purchase.amount) {
    return {
      message: `這門課需匯款 NT$ ${purchase.amount.toLocaleString("zh-TW")}，請確認金額。`,
      fieldErrors: { amount: ["匯款金額與課程售價不一致。"] },
    };
  }

  let emailLogIds: string[];

  try {
    emailLogIds = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.coursePurchase.updateMany({
        where: { id: purchase.id, status: CoursePurchaseStatus.PENDING_PAYMENT },
        data: {
          status: CoursePurchaseStatus.PAYMENT_REPORTED,
          bankLast5: values.bankLast5,
          payerName: values.payerName,
          paidAt: values.paidAt,
          note: values.note,
        },
      });
      if (updated.count !== 1) throw new ExistingCoursePaymentReportError();

      const userEmailLog = await transaction.emailLog.create({
        data: {
          coursePurchaseId: purchase.id,
          type: EmailType.COURSE_PAYMENT_REPORTED_USER,
          recipient: purchase.email,
          subject: `已收到您的課程匯款回報：${purchase.course.title}`,
          status: EmailStatus.PENDING,
        },
      });

      const adminEmailLog = await transaction.emailLog.create({
        data: {
          coursePurchaseId: purchase.id,
          type: EmailType.COURSE_PAYMENT_REPORTED_ADMIN,
          recipient: getEmailConfig().adminEmail,
          subject: `新的課程匯款待審核：${purchase.course.title}`,
          status: EmailStatus.PENDING,
        },
      });

      return [userEmailLog.id, adminEmailLog.id];
    });
  } catch (error) {
    if (error instanceof ExistingCoursePaymentReportError) {
      redirect(`/course-payment-report/success?${publicReferenceQuery("purchase", purchase.purchaseNo)}`);
    }
    console.error("建立課程匯款回報失敗", error);
    return { message: "系統暫時無法送出課程匯款回報，請稍後再試。" };
  }

  await sendEmailLogs(emailLogIds);
  redirect(`/course-payment-report/success?${publicReferenceQuery("purchase", purchase.purchaseNo)}`);
}
