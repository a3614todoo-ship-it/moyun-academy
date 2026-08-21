"use server";

import { revalidatePath } from "next/cache";
import { EventCheckInMethod, EventRegistrationStatus } from "@/generated/prisma/enums";
import { requireEventCheckInAccess } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { recordAdminAudit } from "@/lib/security/admin-audit";

function text(data: FormData, name: string) { return String(data.get(name) || "").trim(); }

export async function manualEventCheckIn(formData: FormData) {
  const eventId = text(formData, "eventId"); const registrationId = text(formData, "registrationId"); const session = await requireEventCheckInAccess(eventId);
  const registration = await prisma.eventRegistration.findFirst({ where: { id: registrationId, eventId, status: EventRegistrationStatus.CONFIRMED }, include: { checkIn: true } }); if (!registration) throw new Error("找不到可報到的正取資料。");
  if (registration.checkIn && !registration.checkIn.reversedAt) return;
  await prisma.eventCheckIn.upsert({ where: { registrationId }, create: { eventId, registrationId, method: EventCheckInMethod.MANUAL, checkedInById: session.adminUser.id }, update: { method: EventCheckInMethod.MANUAL, checkedInAt: new Date(), checkedInById: session.adminUser.id, reversedAt: null, reversedById: null, note: null } });
  await recordAdminAudit({ adminUserId: session.adminUser.id, action: "EVENT_CHECKED_IN_MANUAL", targetType: "EventRegistration", targetId: registrationId, metadata: { eventId } }); revalidatePath(`/admin/check-in/${eventId}`);
}

export async function reverseEventCheckIn(formData: FormData) {
  const eventId = text(formData, "eventId"); const registrationId = text(formData, "registrationId"); const note = text(formData, "note"); const session = await requireEventCheckInAccess(eventId);
  await prisma.eventCheckIn.updateMany({ where: { eventId, registrationId, reversedAt: null }, data: { reversedAt: new Date(), reversedById: session.adminUser.id, note: note || "管理員撤銷誤報到" } });
  await recordAdminAudit({ adminUserId: session.adminUser.id, action: "EVENT_CHECK_IN_REVERSED", targetType: "EventRegistration", targetId: registrationId, metadata: { eventId } }); revalidatePath(`/admin/check-in/${eventId}`);
}
