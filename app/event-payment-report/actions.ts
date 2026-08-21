"use server";

import { redirect } from "next/navigation";
import { EmailStatus, EmailType, EventRegistrationStatus } from "@/generated/prisma/enums";
import { getEmailConfig } from "@/lib/email/config";
import { sendEmailLogs } from "@/lib/email/mailer";
import { eventPaymentReportSchema } from "@/lib/events/payment-validation";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { publicReferenceQuery } from "@/lib/security/public-reference";

export type EventPaymentReportActionState = { message: string; fieldErrors?: Record<string, string[] | undefined> };

export async function createEventPaymentReport(_state: EventPaymentReportActionState, formData: FormData): Promise<EventPaymentReportActionState> {
  const parsed = eventPaymentReportSchema.safeParse({ registrationNo: formData.get("registrationNo"), name: formData.get("name"), phone: formData.get("phone"), bankLast5: formData.get("bankLast5"), amount: formData.get("amount"), paidAt: formData.get("paidAt"), payerName: formData.get("payerName"), note: formData.get("note") || undefined });
  if (!parsed.success) return { message: "請確認匯款回報欄位。", fieldErrors: parsed.error.flatten().fieldErrors };
  const values = parsed.data;
  const limit = await checkRateLimit({ scope: "event-payment-report", limit: 5, windowSeconds: 10 * 60, identifiers: [values.registrationNo, values.phone] });
  if (!limit.allowed) return { message: "送出次數過多，請稍後再試。" };
  const registration = await prisma.eventRegistration.findFirst({ where: { registrationNo: values.registrationNo, name: values.name, phone: values.phone }, include: { event: { select: { title: true } } } });
  if (!registration) return { message: "找不到符合的活動報名資料。" };
  if (registration.status !== EventRegistrationStatus.PENDING_PAYMENT && registration.status !== EventRegistrationStatus.WAITLIST_OFFERED) redirect(`/event-payment-report/success?${publicReferenceQuery("event", registration.registrationNo)}`);
  if (registration.offerExpiresAt && registration.offerExpiresAt < new Date()) return { message: "候補付款保留時間已截止，請聯絡學堂確認名額。" };
  if (values.amount !== registration.amount) return { message: `本次應匯款 NT$ ${registration.amount.toLocaleString("zh-TW")}。`, fieldErrors: { amount: ["匯款金額不符"] } };
  const ids = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.eventRegistration.updateMany({ where: { id: registration.id, status: registration.status }, data: { status: EventRegistrationStatus.PAYMENT_REPORTED, bankLast5: values.bankLast5, payerName: values.payerName, paidAt: values.paidAt, paymentReportedAt: new Date(), note: values.note } });
    if (updated.count !== 1) return [];
    const [userLog, adminLog] = await Promise.all([
      transaction.emailLog.create({ data: { eventRegistrationId: registration.id, type: EmailType.EVENT_PAYMENT_REPORTED_USER, recipient: registration.email, subject: `已收到活動匯款回報：${registration.event.title}`, status: EmailStatus.PENDING } }),
      transaction.emailLog.create({ data: { eventRegistrationId: registration.id, type: EmailType.EVENT_PAYMENT_REPORTED_ADMIN, recipient: getEmailConfig().adminEmail, subject: `新的活動匯款待審核：${registration.event.title}`, status: EmailStatus.PENDING } }),
    ]);
    return [userLog.id, adminLog.id];
  });
  await sendEmailLogs(ids);
  redirect(`/event-payment-report/success?${publicReferenceQuery("event", registration.registrationNo)}`);
}
