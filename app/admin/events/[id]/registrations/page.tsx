import Link from "next/link";
import { notFound } from "next/navigation";
import { promoteWaitlistManually, updateEventRegistrationStatus } from "@/app/admin/events/[id]/registrations/actions";
import { AdminShell } from "@/components/admin-shell";
import { EventRegistrationStatus } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/admin/auth";
import { formatTaipeiDateTime } from "@/lib/admin/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const labels: Record<string, string> = { PENDING_PAYMENT: "待付款", PAYMENT_REPORTED: "匯款待審", CONFIRMED: "已確認", WAITLISTED: "候補中", WAITLIST_OFFERED: "候補保留", REJECTED: "已拒絕", CANCELLED: "已取消" };

export default async function EventRegistrationsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string; status?: string }> }) {
  const [{ id }, query, session] = await Promise.all([params, searchParams, requireAdmin()]); const q = query.q?.trim() || ""; const status = Object.values(EventRegistrationStatus).includes(query.status as EventRegistrationStatus) ? query.status as EventRegistrationStatus : undefined;
  const event = await prisma.inPersonEvent.findUnique({ where: { id }, include: { registrations: { where: { status, OR: q ? [{ registrationNo: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] : undefined }, orderBy: [{ waitlistSequence: "asc" }, { createdAt: "asc" }], include: { checkIn: true } } } });
  if (!event) notFound();
  const counts = { confirmed: event.registrations.filter((r) => r.status === "CONFIRMED").length, waiting: event.registrations.filter((r) => r.status === "WAITLISTED").length, checked: event.registrations.filter((r) => r.checkIn && !r.checkIn.reversedAt).length };
  return <AdminShell adminName={session.adminUser.name} adminRole={session.adminUser.role}><div className="admin-page-heading"><div><Link className="admin-breadcrumb" href={`/admin/events/${id}`}>← 返回活動</Link><h1>{event.title}｜報名名單</h1><span>已確認 {counts.confirmed}・候補 {counts.waiting}・已報到 {counts.checked}</span></div><div className="admin-heading-actions"><form action={promoteWaitlistManually}><input type="hidden" name="eventId" value={id} /><button className="admin-primary-link" type="submit">遞補下一位</button></form><Link href={`/admin/events/${id}/registrations/export`}>匯出 CSV</Link><Link href={`/admin/check-in/${id}`}>進入報到</Link></div></div>
    <form className="admin-filter-bar"><input name="q" defaultValue={q} placeholder="搜尋編號、姓名、電話或 Email" /><select name="status" defaultValue={status || ""}><option value="">全部狀態</option>{Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><button type="submit">篩選</button></form>
    <section className="admin-panel"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>編號／姓名</th><th>聯絡方式</th><th>費用</th><th>狀態</th><th>候補／期限</th><th>報到</th><th>處理</th></tr></thead><tbody>{event.registrations.map((item) => <tr key={item.id}><td><strong>{item.registrationNo}</strong><small>{item.name}</small></td><td>{item.phone}<small>{item.email}</small></td><td>{item.amount ? `NT$ ${item.amount.toLocaleString("zh-TW")}` : "免費"}</td><td>{labels[item.status]}</td><td>{item.waitlistSequence ? `第 ${item.waitlistSequence} 順位` : "—"}<small>{item.offerExpiresAt ? `至 ${formatTaipeiDateTime(item.offerExpiresAt)}` : ""}</small></td><td>{item.checkIn && !item.checkIn.reversedAt ? formatTaipeiDateTime(item.checkIn.checkedInAt) : "未報到"}</td><td><form action={updateEventRegistrationStatus} className="admin-inline-form"><input type="hidden" name="eventId" value={id} /><input type="hidden" name="registrationId" value={item.id} /><select name="status" defaultValue={item.status}>{Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><button type="submit">更新</button></form></td></tr>)}{!event.registrations.length ? <tr><td colSpan={7}>沒有符合條件的報名。</td></tr> : null}</tbody></table></div></section>
  </AdminShell>;
}
