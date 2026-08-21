import { inviteAdminUser, saveEventStaffAssignments, updateAdminUser } from "@/app/admin/admin-users/actions";
import { AdminShell } from "@/components/admin-shell";
import { AdminRole } from "@/generated/prisma/enums";
import { requireOwner } from "@/lib/admin/auth";
import { formatTaipeiDateTime } from "@/lib/admin/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const roleLabels = { OWNER: "系統擁有者", ADMIN: "管理員", CHECKIN_STAFF: "現場報到人員" } as const;

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ invited?: string; error?: string }> }) {
  const [session, query, users, invitations, events] = await Promise.all([
    requireOwner(), searchParams,
    prisma.adminUser.findMany({ orderBy: { createdAt: "asc" }, include: { eventAssignments: { select: { eventId: true } } } }),
    prisma.adminInvitation.findMany({ where: { acceptedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } }),
    prisma.inPersonEvent.findMany({ where: { status: { not: "CANCELLED" } }, orderBy: { startsAt: "desc" }, select: { id: true, title: true, startsAt: true } }),
  ]);
  const errors: Record<string, string> = { invalid: "請確認姓名、Email 與角色。", exists: "此 Email 已有後台帳號。", self: "不能停用目前登入的帳號。", last_owner: "系統至少必須保留一位啟用中的擁有者。" };
  return <AdminShell adminName={session.adminUser.name} adminRole={session.adminUser.role}><div className="admin-page-heading"><div><span>角色、邀請與活動指派</span><h1>管理員帳號</h1></div></div>{query.invited ? <p className="admin-notice success">邀請信已寄出，有效期限為 48 小時。</p> : null}{query.error ? <p className="admin-notice error">{errors[query.error] || "帳號操作未完成。"}</p> : null}
    <section className="admin-course-info-box"><div className="form-section-heading"><span>INVITE</span><div><h2>邀請新帳號</h2><p>受邀人會自行設定密碼；系統不會寄送明文密碼。</p></div></div><form action={inviteAdminUser} className="admin-course-grid"><label>姓名<input required name="name" /></label><label>Email<input required name="email" type="email" /></label><label>角色<select name="role"><option value="ADMIN">管理員</option><option value="CHECKIN_STAFF">現場報到人員</option></select></label><div className="admin-course-submit"><button type="submit">寄送邀請</button></div></form>{invitations.length ? <p className="admin-course-help">等待接受邀請：{invitations.map((item) => `${item.name}（${item.email}）`).join("、")}</p> : null}</section>
    <section className="admin-panel"><div className="admin-panel-heading"><h2>現有帳號</h2></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>姓名／Email</th><th>角色</th><th>狀態</th><th>最後登入</th><th>帳號操作</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><strong>{user.name}</strong><small>{user.email}</small></td><td>{roleLabels[user.role]}</td><td>{user.isActive ? "啟用" : "停用"}</td><td>{user.lastLoginAt ? formatTaipeiDateTime(user.lastLoginAt) : "尚未登入"}</td><td><div className="admin-table-actions"><form action={updateAdminUser}><input type="hidden" name="adminUserId" value={user.id} /><select name="intent" defaultValue={user.role}>{Object.entries(roleLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><button type="submit">變更角色</button></form><form action={updateAdminUser}><input type="hidden" name="adminUserId" value={user.id} /><input type="hidden" name="intent" value={user.isActive ? "deactivate" : "activate"} /><button type="submit">{user.isActive ? "停用" : "啟用"}</button></form></div></td></tr>)}</tbody></table></div></section>
    {users.filter((user) => user.role === AdminRole.CHECKIN_STAFF).map((user) => { const selected = new Set(user.eventAssignments.map((item) => item.eventId)); return <section className="admin-course-info-box" key={user.id}><div className="form-section-heading"><span>STAFF</span><div><h2>{user.name}｜活動指派</h2><p>只會看到勾選活動的報到名單。</p></div></div><form action={saveEventStaffAssignments}><input type="hidden" name="adminUserId" value={user.id} /><div className="admin-assignment-grid">{events.map((event) => <label key={event.id}><input type="checkbox" name="eventIds" value={event.id} defaultChecked={selected.has(event.id)} /><span>{event.title}<small>{formatTaipeiDateTime(event.startsAt)}</small></span></label>)}</div><div className="admin-course-submit"><button type="submit">儲存活動指派</button></div></form></section>; })}
  </AdminShell>;
}
