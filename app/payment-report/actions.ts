"use server";

import { redirect } from "next/navigation";
import { ApplicationStatus, EmailStatus, EmailType } from "@/generated/prisma/enums";
import { getEmailConfig } from "@/lib/email/config";
import { sendEmailLogs } from "@/lib/email/mailer";
import { paymentReportSchema } from "@/lib/payment-report-validation";
import { prisma } from "@/lib/prisma";

export type PaymentReportActionState = {
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

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
    redirect(`/payment-report/success?application_no=${application.applicationNo}`);
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
    console.error("建立匯款回報失敗", error);
    return { message: "系統暫時無法送出匯款回報，請稍後再試。" };
  }

  await sendEmailLogs(emailLogIds);
  redirect(`/payment-report/success?application_no=${application.applicationNo}`);
}
