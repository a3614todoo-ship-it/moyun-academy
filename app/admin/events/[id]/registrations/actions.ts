"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EmailStatus, EmailType, EventRegistrationStatus } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/admin/auth";
import { sendEmailLogs } from "@/lib/email/mailer";
import { promoteNextWaitlist } from "@/lib/events/waitlist";
import { prisma } from "@/lib/prisma";
import { recordAdminAudit } from "@/lib/security/admin-audit";

function text(data: FormData, name: string) { return String(data.get(name) || "").trim(); }

export async function updateEventRegistrationStatus(formData: FormData) {
  const session = await requireAdmin();
  const eventId = text(formData, "eventId"); const registrationId = text(formData, "registrationId"); const nextStatus = text(formData, "status") as EventRegistrationStatus;
  if (!Object.values(EventRegistrationStatus).includes(nextStatus)) throw new Error("不支援的活動報名狀態。");
  const current = await prisma.eventRegistration.findFirst({ where: { id: registrationId, eventId }, include: { event: { select: { title: true, slug: true } } } });
  if (!current) redirect(`/admin/events/${eventId}/registrations`);
  if (nextStatus === EventRegistrationStatus.CONFIRMED && current.amount > 0 && !current.bankLast5) throw new Error("尚未收到匯款回報，不能審核通過。");
  const emailIds = await prisma.$transaction(async (transaction) => {
    await transaction.eventRegistration.update({ where: { id: registrationId }, data: { status: nextStatus, reviewedAt: new Date(), reviewedById: session.adminUser.id, confirmedAt: nextStatus === EventRegistrationStatus.CONFIRMED ? new Date() : undefined, cancelledAt: nextStatus === EventRegistrationStatus.CANCELLED ? new Date() : undefined, rejectedAt: nextStatus === EventRegistrationStatus.REJECTED ? new Date() : undefined } });
    const ids: string[] = [];
    if (nextStatus === EventRegistrationStatus.CONFIRMED) {
      const log = await transaction.emailLog.create({ data: { eventRegistrationId: registrationId, type: EmailType.EVENT_REGISTRATION_CONFIRMED, recipient: current.email, subject: `活動報名確認：${current.event.title}`, status: EmailStatus.PENDING } }); ids.push(log.id);
    }
    const releasesSeat = nextStatus === EventRegistrationStatus.CANCELLED || nextStatus === EventRegistrationStatus.REJECTED;
    const previouslyHeldSeat = current.status !== EventRegistrationStatus.CANCELLED && current.status !== EventRegistrationStatus.REJECTED && current.status !== EventRegistrationStatus.WAITLISTED;
    if (releasesSeat && previouslyHeldSeat) {
      const promoted = await promoteNextWaitlist(transaction, eventId); if (promoted) ids.push(promoted);
    }
    return ids;
  });
  await sendEmailLogs(emailIds);
  await recordAdminAudit({ adminUserId: session.adminUser.id, action: "EVENT_REGISTRATION_STATUS_CHANGED", targetType: "EventRegistration", targetId: registrationId, metadata: { eventId, fromStatus: current.status, toStatus: nextStatus } });
  revalidatePath(`/admin/events/${eventId}/registrations`); revalidatePath(`/events/${current.event.slug}`);
  redirect(`/admin/events/${eventId}/registrations?updated=1`);
}

export async function promoteWaitlistManually(formData: FormData) {
  const session = await requireAdmin(); const eventId = text(formData, "eventId");
  const emailId = await prisma.$transaction((transaction) => promoteNextWaitlist(transaction, eventId));
  if (emailId) await sendEmailLogs([emailId]);
  await recordAdminAudit({ adminUserId: session.adminUser.id, action: "EVENT_WAITLIST_PROMOTED", targetType: "InPersonEvent", targetId: eventId, metadata: { promoted: Boolean(emailId) } });
  revalidatePath(`/admin/events/${eventId}/registrations`); redirect(`/admin/events/${eventId}/registrations?promoted=${emailId ? "1" : "0"}`);
}
