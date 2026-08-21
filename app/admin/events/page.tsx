import Link from "next/link";
import { toggleEventPublished } from "@/app/admin/events/actions";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin/auth";
import { formatTaipeiDateTime } from "@/lib/admin/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = { DRAFT: "草稿", PUBLISHED: "已上架", CANCELLED: "已取消" };

export default async function AdminEventsPage() {
  const [session, events] = await Promise.all([
    requireAdmin(),
    prisma.inPersonEvent.findMany({ orderBy: [{ startsAt: "desc" }], include: { registrations: { select: { status: true } }, checkIns: { where: { reversedAt: null }, select: { id: true } } } }),
  ]);
  return <AdminShell adminName={session.adminUser.name} adminRole={session.adminUser.role}>
    <div className="admin-page-heading"><div><span>上架、報名、候補與現場營運</span><h1>實體活動</h1></div><Link className="admin-primary-link" href="/admin/events/new">新增活動</Link></div>
    <section className="admin-panel"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>活動</th><th>時間</th><th>名額</th><th>候補</th><th>已報到</th><th>狀態</th><th>操作</th></tr></thead><tbody>
      {events.map((event) => {
        const confirmed = event.registrations.filter((item) => ["PENDING_PAYMENT", "PAYMENT_REPORTED", "CONFIRMED", "WAITLIST_OFFERED"].includes(item.status)).length;
        const waiting = event.registrations.filter((item) => item.status === "WAITLISTED").length;
        return <tr key={event.id}><td><Link href={`/admin/events/${event.id}`}>{event.title}</Link><small>{event.venueName}</small></td><td>{formatTaipeiDateTime(event.startsAt)}</td><td>{confirmed}／{event.capacity}</td><td>{waiting}</td><td>{event.checkIns.length}</td><td><span className={`admin-status ${event.status === "PUBLISHED" ? "is-approved" : ""}`}>{statusLabels[event.status]}</span></td><td><div className="admin-table-actions"><Link href={`/admin/events/${event.id}/registrations`}>名單</Link><Link href={`/admin/check-in/${event.id}`}>報到</Link>{event.status !== "CANCELLED" ? <form action={toggleEventPublished}><input type="hidden" name="id" value={event.id} /><button type="submit">{event.status === "PUBLISHED" ? "下架" : "上架"}</button></form> : null}</div></td></tr>;
      })}
      {!events.length ? <tr><td colSpan={7}>尚未建立實體活動。</td></tr> : null}
    </tbody></table></div></section>
  </AdminShell>;
}
