import { EmailStatus, EmailType, EventRegistrationStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

export async function promoteNextWaitlist(transaction: Prisma.TransactionClient, eventId: string) {
  const event = await transaction.inPersonEvent.findUnique({
    where: { id: eventId },
    select: { capacity: true, waitlistPaymentHours: true },
  });
  if (!event) return null;
  const occupied = await transaction.eventRegistration.count({
    where: {
      eventId,
      status: {
        in: [
          EventRegistrationStatus.PENDING_PAYMENT,
          EventRegistrationStatus.PAYMENT_REPORTED,
          EventRegistrationStatus.CONFIRMED,
          EventRegistrationStatus.WAITLIST_OFFERED,
        ],
      },
    },
  });
  if (occupied >= event.capacity) return null;
  const next = await transaction.eventRegistration.findFirst({
    where: { eventId, status: EventRegistrationStatus.WAITLISTED },
    orderBy: [{ waitlistSequence: "asc" }, { createdAt: "asc" }],
  });
  if (!next) return null;
  const free = next.amount === 0;
  const offeredAt = new Date();
  const offerExpiresAt = free ? null : new Date(offeredAt.getTime() + event.waitlistPaymentHours * 60 * 60 * 1000);
  const updated = await transaction.eventRegistration.updateMany({ where: { id: next.id, status: EventRegistrationStatus.WAITLISTED }, data: { status: free ? EventRegistrationStatus.CONFIRMED : EventRegistrationStatus.WAITLIST_OFFERED, offeredAt, offerExpiresAt, confirmedAt: free ? offeredAt : null } });
  if (updated.count !== 1) return null;
  const email = await transaction.emailLog.create({ data: { eventRegistrationId: next.id, type: free ? EmailType.EVENT_REGISTRATION_CONFIRMED : EmailType.EVENT_WAITLIST_OFFERED, recipient: next.email, subject: free ? "候補已轉為正取" : "候補名額已保留", status: EmailStatus.PENDING } });
  return email.id;
}
