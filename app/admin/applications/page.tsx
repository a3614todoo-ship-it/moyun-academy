import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { ApplicationStatus } from "@/generated/prisma/enums";
import { applicationStatusLabels, formatTaipeiDateTime, statusClass } from "@/lib/admin/labels";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string; status?: string }>;
};

export default async function AdminApplicationsPage({ searchParams }: Props) {
  const session = await requireAdmin();
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const status = Object.values(ApplicationStatus).includes(params.status as ApplicationStatus)
    ? (params.status as ApplicationStatus)
    : undefined;

  const applications = await prisma.application.findMany({
    where: {
      status,
      OR: q
        ? [
            { applicationNo: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
          ]
        : undefined,
    },
    include: { plan: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <AdminShell adminName={session.adminUser.name}>
      <div className="admin-page-heading">
        <div><span>會員與付款流程</span><h1>報名名單</h1></div>
        <a className="admin-primary-link" href={`/admin/applications/export?q=${encodeURIComponent(q)}&status=${status || ""}`}>匯出 CSV</a>
      </div>
      <form className="admin-filters">
        <input defaultValue={q} name="q" placeholder="搜尋報名編號、姓名、電話或 Email" />
        <select defaultValue={status || ""} name="status">
          <option value="">全部狀態</option>
          {Object.values(ApplicationStatus).map((value) => <option key={value} value={value}>{applicationStatusLabels[value]}</option>)}
        </select>
        <button type="submit">套用篩選</button>
        <Link href="/admin/applications">清除</Link>
      </form>
      <section className="admin-panel">
        <div className="admin-panel-heading"><h2>共 {applications.length} 筆</h2></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>報名編號</th><th>姓名</th><th>手機</th><th>Email</th><th>方案</th><th>狀態</th><th>建立時間</th></tr></thead>
            <tbody>
              {applications.map((item) => (
                <tr key={item.id}>
                  <td><Link href={`/admin/applications/${item.id}`}>{item.applicationNo}</Link></td>
                  <td>{item.name}</td><td>{item.phone}</td><td>{item.email}</td><td>{item.plan.name}</td>
                  <td><span className={statusClass(item.status)}>{applicationStatusLabels[item.status]}</span></td>
                  <td>{formatTaipeiDateTime(item.createdAt)}</td>
                </tr>
              ))}
              {!applications.length ? <tr><td colSpan={7}>沒有符合條件的報名資料。</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
