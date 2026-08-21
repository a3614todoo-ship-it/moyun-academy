"use server";

import { redirect } from "next/navigation";
import { EventRegistrationStatus, EventStatus, MembershipSubscriptionStatus, EmailStatus, EmailType } from "@/generated/prisma/enums";
import { sendEmailLogs } from "@/lib/email/mailer";
import { eventPrice, eventWindowState, initialRegistrationStatus, seatHoldingStatuses } from "@/lib/events/policy";
import { generateEventRegistrationNumber } from "@/lib/events/registration-number";
import { createTicketToken, hashTicketToken } from "@/lib/events/ticket";
import { eventRegistrationSchema } from "@/lib/events/validation";
import { getMemberSession } from "@/lib/member/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { publicReferenceQuery } from "@/lib/security/public-reference";

export type EventRegistrationActionState = { message: string; fieldErrors?: Record<string, string[] | undefined> };

export async function createEventRegistration(_state: EventRegistrationActionState, formData: FormData): Promise<EventRegistrationActionState> {
  const parsed = eventRegistrationSchema.safeParse({ eventId: formData.get("eventId"), name: formData.get("name"), phone: formData.get("phone"), email: formData.get("email"), agreedToPrivacy: formData.get("agreedToPrivacy") });
  if (!parsed.success) return { message: "請確認報名資料是否完整。", fieldErrors: parsed.error.flatten().fieldErrors };
  const values = parsed.data;
  const rateLimit = await checkRateLimit({ scope: "event-registration", limit: 5, windowSeconds: 10 * 60, identifiers: [values.email, values.phone] });
  if (!rateLimit.allowed) return { message: "送出次數過多，請稍後再試。" };
  const memberSession = await getMemberSession();
  const activeMembership = memberSession ? await prisma.membershipSubscription.findFirst({ where: { memberUserId: memberSession.memberUser.id, status: MembershipSubscriptionStatus.ACTIVE, startsAt: { lte: new Date() }, endsAt: { gte: new Date() } }, select: { id: true } }) : null;
  const isActiveMember = Boolean(activeMembership && memberSession && memberSession.memberUser.email.toLowerCase() === values.email);

  let completedReference = "";
  try {
    const result = await prisma.$transaction(async (transaction) => {
      const event = await transaction.inPersonEvent.findFirst({ where: { id: values.eventId, status: EventStatus.PUBLISHED }, select: { id: true, slug: true, title: true, capacity: true, waitlistEnabled: true, audience: true, pricingMode: true, publicPrice: true, memberPrice: true, registrationOpenAt: true, publicRegistrationOpenAt: true, registrationCloseAt: true } });
      if (!event) throw new Error("EVENT_NOT_FOUND");
      await transaction.inPersonEvent.update({ where: { id: event.id }, data: { updatedAt: new Date() } });
      const window = eventWindowState(event, isActiveMember);
      if (window !== "OPEN") throw new Error(window);
      const duplicate = await transaction.eventRegistration.findFirst({ where: { eventId: event.id, email: values.email, status: { notIn: [EventRegistrationStatus.CANCELLED, EventRegistrationStatus.REJECTED] } }, select: { registrationNo: true } });
      if (duplicate) return { reference: duplicate.registrationNo, emailLogId: null };
      const seatsTaken = await transaction.eventRegistration.count({ where: { eventId: event.id, status: { in: [...seatHoldingStatuses] } } });
      const amount = eventPrice(event, isActiveMember);
      const status = initialRegistrationStatus({ hasSeat: seatsTaken < event.capacity, amount, waitlistEnabled: event.waitlistEnabled });
      if (!status) throw new Error("FULL");
      const waitlistSequence = status === EventRegistrationStatus.WAITLISTED ? (await transaction.eventRegistration.aggregate({ where: { eventId: event.id }, _max: { waitlistSequence: true } }))._max.waitlistSequence ?? 0 : null;
      const registrationNo = generateEventRegistrationNumber();
      const registration = await transaction.eventRegistration.create({ data: { registrationNo, eventId: event.id, memberUserId: isActiveMember ? memberSession!.memberUser.id : null, name: values.name, phone: values.phone, email: values.email, status, amount, isMemberPrice: isActiveMember, waitlistSequence: waitlistSequence === null ? null : waitlistSequence + 1, agreedToPrivacyAt: new Date(), confirmedAt: status === EventRegistrationStatus.CONFIRMED ? new Date() : null } });
      const ticketToken = createTicketToken(registration.id);
      await transaction.eventRegistration.update({ where: { id: registration.id }, data: { ticketTokenHash: hashTicketToken(ticketToken) } });
      const type = status === EventRegistrationStatus.WAITLISTED ? EmailType.EVENT_WAITLISTED : status === EventRegistrationStatus.CONFIRMED ? EmailType.EVENT_REGISTRATION_CONFIRMED : EmailType.EVENT_REGISTRATION_CREATED;
      const emailLog = await transaction.emailLog.create({ data: { eventRegistrationId: registration.id, type, recipient: registration.email, subject: `活動報名：${event.title}`, status: EmailStatus.PENDING } });
      return { reference: registrationNo, emailLogId: emailLog.id };
    });
    if (result.emailLogId) await sendEmailLogs([result.emailLogId]);
    completedReference = result.reference;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "MEMBER_PRIORITY") return { message: "目前為會員優先或會員限定報名，請先登入有效會員帳號。" };
      if (error.message === "NOT_OPEN") return { message: "活動尚未開放報名。" };
      if (error.message === "CLOSED") return { message: "活動報名已截止。" };
      if (error.message === "FULL") return { message: "活動已額滿且未開放候補。" };
    }
    console.error("建立活動報名失敗", error);
    return { message: "系統暫時無法送出活動報名，請稍後再試。" };
  }
  redirect(`/event-registration/success?${publicReferenceQuery("event", completedReference)}`);
}
