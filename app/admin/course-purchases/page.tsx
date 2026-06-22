import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { CoursePurchaseStatus } from "@/generated/prisma/enums";
import {
  coursePurchaseStatusLabels,
  formatTaipeiDateTime,
  statusClass,
} from "@/lib/admin/labels";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminCoursePurchasesPage({ searchParams }: Props) {
  const [session, params] = await Promise.all([requireAdmin(), searchParams]);
  const status = Object.values(CoursePurchaseStatus).includes(params.status as CoursePurchaseStatus)
    ? (params.status as CoursePurchaseStatus)
    : undefined;

  const purchases = await prisma.coursePurchase.findMany({
    where: status ? { status } : undefined,
    include: {
      course: { select: { title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <AdminShell adminName={session.adminUser.name}>
      <div className="admin-page-heading">
        <div>
          <span>付費課程報名、匯款與審核</span>
          <h1>課程購買審核</h1>
        </div>
      </div>
      <form className="admin-filter-bar">
        <select defaultValue={status || ""} name="status">
          <option value="">全部狀態</option>
          {Object.values(CoursePurchaseStatus).map((value) => (
            <option key={value} value={value}>
              {coursePurchaseStatusLabels[value]}
            </option>
          ))}
        </select>
        <button type="submit">篩選</button>
      </form>
      <section className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>購買編號</th>
                <th>課程</th>
                <th>姓名</th>
                <th>金額</th>
                <th>狀態</th>
                <th>建立時間</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link href={`/admin/course-purchases/${item.id}`}>
                      {item.purchaseNo}
                    </Link>
                  </td>
                  <td>{item.course.title}</td>
                  <td>{item.name}</td>
                  <td>NT$ {item.amount.toLocaleString("zh-TW")}</td>
                  <td>
                    <span className={statusClass(item.status)}>
                      {coursePurchaseStatusLabels[item.status]}
                    </span>
                  </td>
                  <td>{formatTaipeiDateTime(item.createdAt)}</td>
                </tr>
              ))}
              {!purchases.length ? (
                <tr>
                  <td colSpan={6}>目前沒有課程購買資料。</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
