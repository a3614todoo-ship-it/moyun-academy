import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { ApplicationStatus } from "@/generated/prisma/enums";
import { applicationStatusLabels, formatTaipeiDateTime, statusClass } from "@/lib/admin/labels";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  const [
    total,
    pendingPayment,
    paymentReported,
    approved,
    joined,
    recentApplications,
  ] = await Promise.all([
    prisma.application.count(),
    prisma.application.count({ where: { status: ApplicationStatus.PENDING_PAYMENT } }),
    prisma.application.count({ where: { status: ApplicationStatus.PAYMENT_REPORTED } }),
    prisma.application.count({ where: { status: ApplicationStatus.APPROVED } }),
    prisma.application.count({ where: { status: ApplicationStatus.JOINED_FACEBOOK_GROUP } }),
    prisma.application.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { plan: { select: { name: true } } },
    }),
  ]);

  const cards = [
    ["總報名數", total],
    ["待匯款", pendingPayment],
    ["待審核", paymentReported],
    ["審核通過", approved],
    ["已加入社團", joined],
  ] as const;

  return (
    <AdminShell adminName={session.adminUser.name}>
      <div className="admin-page-heading">
        <div><span>2026 年會員營運</span><h1>營運總覽</h1></div>
        <Link className="admin-primary-link" href="/admin/applications">查看全部報名</Link>
      </div>
      <section className="admin-kpi-grid">
        {cards.map(([label, value]) => (
          <article className="admin-kpi-card" key={label}><span>{label}</span><strong>{value}</strong></article>
        ))}
      </section>
      <section className="admin-panel">
        <div className="admin-panel-heading"><h2>最近報名</h2><Link href="/admin/applications">完整名單 →</Link></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>報名編號</th><th>姓名</th><th>方案</th><th>狀態</th><th>建立時間</th></tr></thead>
            <tbody>
              {recentApplications.map((item) => (
                <tr key={item.id}>
                  <td><Link href={`/admin/applications/${item.id}`}>{item.applicationNo}</Link></td>
                  <td>{item.name}</td><td>{item.plan.name}</td>
                  <td><span className={statusClass(item.status)}>{applicationStatusLabels[item.status]}</span></td>
                  <td>{formatTaipeiDateTime(item.createdAt)}</td>
                </tr>
              ))}
              {!recentApplications.length ? <tr><td colSpan={5}>目前尚無報名資料。</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
