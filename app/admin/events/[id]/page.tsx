import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminEventForm } from "@/components/admin-event-form";
import { cancelEvent } from "@/app/admin/events/actions";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, session] = await Promise.all([params, requireAdmin()]);
  const event = await prisma.inPersonEvent.findUnique({ where: { id } });
  if (!event) notFound();
  return <AdminShell adminName={session.adminUser.name} adminRole={session.adminUser.role}><div className="admin-page-heading"><div><span>活動設定</span><h1>{event.title}</h1></div><div className="admin-heading-actions"><Link href={`/events/${event.slug}`}>前台預覽</Link><Link href={`/admin/events/${event.id}/registrations`}>報名名單</Link><Link href={`/admin/check-in/${event.id}`}>現場報到</Link></div></div><AdminEventForm event={event} />{event.status !== "CANCELLED" ? <section className="admin-course-info-box"><div className="form-section-heading"><span>DANGER</span><div><h2>取消活動</h2><p>取消後會下架活動並通知所有有效報名者，無法重新上架。</p></div></div><form action={cancelEvent} className="admin-inline-form"><input type="hidden" name="id" value={event.id} /><label>輸入完整活動名稱確認<input required name="confirmTitle" /></label><button type="submit">確認取消活動</button></form></section> : null}</AdminShell>;
}
