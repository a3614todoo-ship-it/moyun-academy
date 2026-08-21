import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { requireAuthenticatedAdmin } from "@/lib/admin/auth";
import { formatTaipeiDateTime } from "@/lib/admin/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export default async function CheckInEventsPage() { const session = await requireAuthenticatedAdmin(); const where = session.adminUser.role === "CHECKIN_STAFF" ? { staffAssignments: { some: { adminUserId: session.adminUser.id } } } : {}; const events = await prisma.inPersonEvent.findMany({ where, orderBy: { startsAt: "desc" }, take: 30, include: { registrations: { where: { status: "CONFIRMED" }, select: { id: true } }, checkIns: { where: { reversedAt: null }, select: { id: true } } } }); return <AdminShell adminName={session.adminUser.name} adminRole={session.adminUser.role}><div className="admin-page-heading"><div><span>掃描票券或人工搜尋</span><h1>現場活動報到</h1></div></div><section className="admin-kpi-grid checkin-event-grid">{events.map((event) => <Link className="admin-kpi-card" href={`/admin/check-in/${event.id}`} key={event.id}><span>{formatTaipeiDateTime(event.startsAt)}</span><strong>{event.title}</strong><small>{event.venueName}・已報到 {event.checkIns.length}／{event.registrations.length}</small></Link>)}</section>{!events.length ? <section className="admin-panel"><p>目前沒有指派給您的活動。</p></section> : null}</AdminShell>; }
