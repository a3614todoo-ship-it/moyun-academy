"use server";

import { redirect } from "next/navigation";
import { ApplicationStatus, EmailStatus, EmailType } from "@/generated/prisma/enums";
import { getEmailConfig } from "@/lib/email/config";
import { sendEmailLogs } from "@/lib/email/mailer";
import { paymentReportSchema } from "@/lib/payment-report-validation";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { publicReferenceQuery } from "@/lib/security/public-reference";

export type PaymentReportActionState = {
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

class ExistingPaymentReportError extends Error {}

export async function createPaymentReport(
  _previousState: PaymentReportActionState,
  formData: FormData,
): Promise<PaymentReportActionState> {
  const parsed = paymentReportSchema.safeParse({
    applicationNo: formData.get("applicationNo"),
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
      message: "請確認標示的欄位後再送出。",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const values = parsed.data;
  const rateLimit = await checkRateLimit({
    scope: "membership-payment-report",
    limit: 5,
    windowSeconds: 10 * 60,
    identifiers: [values.applicationNo, values.phone],
  });
  if (!rateLimit.allowed) return { message: "送出次數過多，請稍後再試。" };
  const application = await prisma.application.findFirst({
    where: {
      applicationNo: values.applicationNo,
      name: values.name,
      phone: values.phone,
    },
    include: {
      plan: { select: { price: true } },
      paymentReports: { select: { id: true }, take: 1 },
    },
  });

  if (!application) {
    return { message: "找不到相符的報名資料，請確認報名編號、姓名與手機。" };
  }

  if (application.paymentReports.length > 0) {
    redirect(`/payment-report/success?${publicReferenceQuery("application", application.applicationNo)}`);
  }

  if (values.amount !== application.plan.price) {
    return {
      message: `匯款金額應為 NT$ ${application.plan.price.toLocaleString("zh-TW")}，請確認後再送出。`,
      fieldErrors: { amount: ["匯款金額與申請方案不符"] },
    };
  }

  let emailLogIds: string[];

  try {
    emailLogIds = await prisma.$transaction(async (transaction) => {
      // 同一份申請序列化處理，避免兩個並行請求建立重複付款回報。
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${application.id}))`;
      const existingReport = await transaction.paymentReport.findFirst({
        where: { applicationId: application.id },
        select: { id: true },
      });
      if (existingReport) throw new ExistingPaymentReportError();

      await transaction.paymentReport.create({
        data: {
          applicationId: application.id,
          amount: values.amount,
          bankLast5: values.bankLast5,
          payerName: values.payerName,
          paidAt: values.paidAt,
          note: values.note,
        },
      });

      await transaction.application.update({
        where: { id: application.id },
        data: { status: ApplicationStatus.PAYMENT_REPORTED },
      });

      await transaction.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          fromStatus: application.status,
          toStatus: ApplicationStatus.PAYMENT_REPORTED,
          note: "申請人完成匯款回報",
        },
      });

      const userEmailLog = await transaction.emailLog.create({
        data: {
          applicationId: application.id,
          type: EmailType.PAYMENT_REPORTED_USER,
          recipient: application.email,
          subject: "我們已收到您的匯款回報",
          status: EmailStatus.PENDING,
        },
      });

      const adminEmailLog = await transaction.emailLog.create({
        data: {
          applicationId: application.id,
          type: EmailType.PAYMENT_REPORTED_ADMIN,
          recipient: getEmailConfig().adminEmail,
          subject: "有新的會員匯款回報待審核",
          status: EmailStatus.PENDING,
        },
      });

      return [userEmailLog.id, adminEmailLog.id];
    });
  } catch (error) {
    if (error instanceof ExistingPaymentReportError) {
      redirect(`/payment-report/success?${publicReferenceQuery("application", application.applicationNo)}`);
    }
    console.error("建立匯款回報失敗", error);
    return { message: "系統暫時無法送出匯款回報，請稍後再試。" };
  }

  await sendEmailLogs(emailLogIds);
  redirect(`/payment-report/success?${publicReferenceQuery("application", application.applicationNo)}`);
}
