import { EventCheckInMethod, EventRegistrationStatus } from "@/generated/prisma/enums";
import { getAdminSession } from "@/lib/admin/auth";
import { hashTicketToken } from "@/lib/events/ticket";
import { prisma } from "@/lib/prisma";
import { recordAdminAudit } from "@/lib/security/admin-audit";
import { checkRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const session = await getAdminSession(); if (!session) return Response.json({ success: false, message: "管理員登入已失效。" }, { status: 401 });
  const body = await request.json().catch(() => null) as { eventId?: string; token?: string } | null; const eventId = body?.eventId?.trim(); const token = body?.token?.trim(); if (!eventId || !token || token.length > 200) return Response.json({ success: false, message: "票券格式不正確。" }, { status: 400 });
  const limit = await checkRateLimit({ scope: "event-check-in-scan", limit: 60, windowSeconds: 60, identifiers: [session.adminUser.id, eventId] }); if (!limit.allowed) return Response.json({ success: false, message: "掃描速度過快，請稍候再試。" }, { status: 429 });
  if (session.adminUser.role === "CHECKIN_STAFF") { const assignment = await prisma.eventStaffAssignment.findUnique({ where: { eventId_adminUserId: { eventId, adminUserId: session.adminUser.id } }, select: { id: true } }); if (!assignment) return Response.json({ success: false, message: "您未被指派至這場活動。" }, { status: 403 }); }
  const registration = await prisma.eventRegistration.findFirst({ where: { eventId, ticketTokenHash: hashTicketToken(token) }, include: { checkIn: true } });
  if (!registration) return Response.json({ success: false, message: "票券無效或不屬於這場活動。" }, { status: 404 });
  if (registration.status !== EventRegistrationStatus.CONFIRMED) return Response.json({ success: false, message: "這筆報名尚未確認，不能報到。" }, { status: 409 });
  if (registration.checkIn && !registration.checkIn.reversedAt) return Response.json({ success: false, message: `已於 ${registration.checkIn.checkedInAt.toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })} 完成報到。` }, { status: 409 });
  const now = new Date();
  await prisma.eventCheckIn.upsert({ where: { registrationId: registration.id }, create: { eventId, registrationId: registration.id, method: EventCheckInMethod.QR, checkedInById: session.adminUser.id, checkedInAt: now }, update: { method: EventCheckInMethod.QR, checkedInById: session.adminUser.id, checkedInAt: now, reversedAt: null, reversedById: null, note: null } });
  await recordAdminAudit({ adminUserId: session.adminUser.id, action: "EVENT_CHECKED_IN_QR", targetType: "EventRegistration", targetId: registration.id, metadata: { eventId } });
  return Response.json({ success: true, message: "報到成功", attendee: { name: registration.name, registrationNo: registration.registrationNo, checkedInAt: now.toISOString() } });
}
