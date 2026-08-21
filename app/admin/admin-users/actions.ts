"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AdminRole } from "@/generated/prisma/enums";
import { createAdminInvitationToken, hashAdminInvitationToken } from "@/lib/admin/invitation";
import { requireOwner } from "@/lib/admin/auth";
import { getEmailConfig } from "@/lib/email/config";
import { sendAdminInvitation } from "@/lib/email/mailer";
import { prisma } from "@/lib/prisma";
import { recordAdminAudit } from "@/lib/security/admin-audit";
import { validateNewPassword } from "@/lib/security/password";

function text(data: FormData, name: string) { return String(data.get(name) || "").trim(); }

export async function inviteAdminUser(formData: FormData) {
  const session = await requireOwner(); const email = text(formData, "email").toLowerCase(); const name = text(formData, "name"); const role = text(formData, "role") as AdminRole;
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || (role !== AdminRole.ADMIN && role !== AdminRole.CHECKIN_STAFF)) redirect("/admin/admin-users?error=invalid");
  const existing = await prisma.adminUser.findUnique({ where: { email }, select: { id: true } }); if (existing) redirect("/admin/admin-users?error=exists");
  const token = createAdminInvitationToken(); const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const invitation = await prisma.$transaction(async (transaction) => { await transaction.adminInvitation.deleteMany({ where: { email, acceptedAt: null } }); return transaction.adminInvitation.create({ data: { email, name, role, tokenHash: hashAdminInvitationToken(token), invitedById: session.adminUser.id, expiresAt } }); });
  const url = `${getEmailConfig().siteUrl}/admin/accept-invitation?token=${encodeURIComponent(token)}`;
  await sendAdminInvitation(email, name, url, role === AdminRole.ADMIN ? "管理員" : "現場報到人員");
  await recordAdminAudit({ adminUserId: session.adminUser.id, action: "ADMIN_USER_INVITED", targetType: "AdminInvitation", targetId: invitation.id, metadata: { email, role } });
  revalidatePath("/admin/admin-users"); redirect("/admin/admin-users?invited=1");
}

export type AcceptInvitationState = { message: string };
export async function acceptAdminInvitation(_state: AcceptInvitationState, formData: FormData): Promise<AcceptInvitationState> {
  const token = text(formData, "token"); const password = String(formData.get("password") || ""); const confirm = String(formData.get("confirmPassword") || ""); const passwordError = validateNewPassword(password);
  if (!token) return { message: "邀請連結不完整。" }; if (passwordError) return { message: passwordError }; if (password !== confirm) return { message: "兩次輸入的密碼不一致。" };
  const invitation = await prisma.adminInvitation.findUnique({ where: { tokenHash: hashAdminInvitationToken(token) } });
  if (!invitation || invitation.acceptedAt || invitation.expiresAt <= new Date()) return { message: "邀請已失效，請管理員重新寄送。" };
  const passwordHash = await hash(password, 12);
  await prisma.$transaction(async (transaction) => { await transaction.adminUser.create({ data: { email: invitation.email, name: invitation.name, role: invitation.role, passwordHash, isActive: true } }); await transaction.adminInvitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } }); });
  redirect("/admin/login?invitation=accepted");
}

export async function updateAdminUser(formData: FormData) {
  const session = await requireOwner(); const adminUserId = text(formData, "adminUserId"); const intent = text(formData, "intent"); const target = await prisma.adminUser.findUnique({ where: { id: adminUserId } }); if (!target) redirect("/admin/admin-users");
  if (target.id === session.adminUser.id && intent === "deactivate") redirect("/admin/admin-users?error=self");
  if (target.role === AdminRole.OWNER && intent !== "activate") { const owners = await prisma.adminUser.count({ where: { role: AdminRole.OWNER, isActive: true } }); if (owners <= 1) redirect("/admin/admin-users?error=last_owner"); }
  if (intent === "activate" || intent === "deactivate") { await prisma.adminUser.update({ where: { id: target.id }, data: { isActive: intent === "activate" } }); if (intent === "deactivate") await prisma.adminSession.deleteMany({ where: { adminUserId: target.id } }); }
  else { const role = intent as AdminRole; if (![AdminRole.OWNER, AdminRole.ADMIN, AdminRole.CHECKIN_STAFF].includes(role)) redirect("/admin/admin-users?error=invalid"); await prisma.adminUser.update({ where: { id: target.id }, data: { role } }); }
  await recordAdminAudit({ adminUserId: session.adminUser.id, action: "ADMIN_USER_UPDATED", targetType: "AdminUser", targetId: target.id, metadata: { intent } }); revalidatePath("/admin/admin-users");
}

export async function saveEventStaffAssignments(formData: FormData) {
  const session = await requireOwner(); const adminUserId = text(formData, "adminUserId"); const target = await prisma.adminUser.findUnique({ where: { id: adminUserId }, select: { role: true } }); if (!target || target.role !== AdminRole.CHECKIN_STAFF) redirect("/admin/admin-users?error=invalid"); const eventIds = formData.getAll("eventIds").map(String);
  await prisma.$transaction(async (transaction) => { await transaction.eventStaffAssignment.deleteMany({ where: { adminUserId } }); if (eventIds.length) await transaction.eventStaffAssignment.createMany({ data: eventIds.map((eventId) => ({ eventId, adminUserId })), skipDuplicates: true }); });
  await recordAdminAudit({ adminUserId: session.adminUser.id, action: "EVENT_STAFF_ASSIGNMENTS_CHANGED", targetType: "AdminUser", targetId: adminUserId, metadata: { assignmentCount: eventIds.length } }); revalidatePath("/admin/admin-users");
}
