import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { ApplicationStatus, CoursePurchaseStatus } from "@/generated/prisma/enums";
import {
  applicationStatusLabels,
  coursePurchaseStatusLabels,
  formatTaipeiDateTime,
  statusClass,
} from "@/lib/admin/labels";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  const [
    totalApplications,
    memberPaymentReported,
    approvedApplications,
    totalPurchases,
    coursePaymentReported,
    approvedPurchases,
    recentApplications,
    recentPurchases,
  ] = await Promise.all([
    prisma.application.count(),
    prisma.application.count({ where: { status: ApplicationStatus.PAYMENT_REPORTED } }),
    prisma.application.count({ where: { status: ApplicationStatus.APPROVED } }),
    prisma.coursePurchase.count(),
    prisma.coursePurchase.count({ where: { status: CoursePurchaseStatus.PAYMENT_REPORTED } }),
    prisma.coursePurchase.count({ where: { status: CoursePurchaseStatus.APPROVED } }),
    prisma.application.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { plan: { select: { name: true } } },
    }),
    prisma.coursePurchase.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { course: { select: { title: true } } },
    }),
  ]);

  const cards = [
    ["會員申請總數", totalApplications],
    ["會員匯款待審", memberPaymentReported],
    ["會員已通過", approvedApplications],
    ["課程購買總數", totalPurchases],
    ["課程匯款待審", coursePaymentReported],
    ["課程已開通", approvedPurchases],
  ] as const;

  return (
    <AdminShell adminName={session.adminUser.name}>
      <div className="admin-page-heading">
        <div>
          <span>我輩學堂管理中心</span>
          <h1>後台總覽</h1>
        </div>
        <Link className="admin-primary-link" href="/admin/course-purchases?status=PAYMENT_REPORTED">
          查看課程匯款
        </Link>
      </div>
      <section className="admin-kpi-grid">
        {cards.map(([label, value]) => (
          <article className="admin-kpi-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <h2>最新會員申請</h2>
          <Link href="/admin/applications">查看全部</Link>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>編號</th><th>姓名</th><th>方案</th><th>狀態</th><th>建立時間</th></tr>
            </thead>
            <tbody>
              {recentApplications.map((item) => (
                <tr key={item.id}>
                  <td><Link href={`/admin/applications/${item.id}`}>{item.applicationNo}</Link></td>
                  <td>{item.name}</td>
                  <td>{item.plan.name}</td>
                  <td><span className={statusClass(item.status)}>{applicationStatusLabels[item.status]}</span></td>
                  <td>{formatTaipeiDateTime(item.createdAt)}</td>
                </tr>
              ))}
              {!recentApplications.length ? <tr><td colSpan={5}>目前沒有會員申請。</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <h2>最新課程購買</h2>
          <Link href="/admin/course-purchases">查看全部</Link>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>編號</th><th>姓名</th><th>課程</th><th>狀態</th><th>建立時間</th></tr>
            </thead>
            <tbody>
              {recentPurchases.map((item) => (
                <tr key={item.id}>
                  <td><Link href={`/admin/course-purchases/${item.id}`}>{item.purchaseNo}</Link></td>
                  <td>{item.name}</td>
                  <td>{item.course.title}</td>
                  <td><span className={statusClass(item.status)}>{coursePurchaseStatusLabels[item.status]}</span></td>
                  <td>{formatTaipeiDateTime(item.createdAt)}</td>
                </tr>
              ))}
              {!recentPurchases.length ? <tr><td colSpan={5}>目前沒有課程購買資料。</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
