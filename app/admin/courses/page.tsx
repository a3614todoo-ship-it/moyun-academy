import Link from "next/link";
import { toggleCoursePublished } from "@/app/admin/courses/actions";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ updated?: string }>;
};

function accessLabel(accessType: string, price: number) {
  if (accessType === "PUBLIC_FREE") return "免費";
  if (accessType === "PAID") return `付費 NT$ ${price.toLocaleString("zh-TW")}`;
  return "會員免費";
}

function formatDate(value: Date | null) {
  if (!value) return "未設定";
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
}

export default async function AdminCoursesPage({ searchParams }: Props) {
  const [session, courses, params] = await Promise.all([
    requireAdmin(),
    prisma.course.findMany({
      include: { liveSession: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    searchParams,
  ]);

  return (
    <AdminShell adminName={session.adminUser.name}>
      <div className="admin-page-heading">
        <div>
          <span>課程、付費權限與直播設定</span>
          <h1>課程管理</h1>
        </div>
        <Link className="admin-primary-link" href="/admin/courses/new">
          新增課程
        </Link>
      </div>
      {params.updated === "1" ? (
        <div className="admin-success-message">課程狀態已更新。</div>
      ) : null}
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <h2>共 {courses.length} 門課程</h2>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>排序</th>
                <th>課程名稱</th>
                <th>分類</th>
                <th>權限</th>
                <th>開課時間</th>
                <th>課程時長</th>
                <th>上課方式</th>
                <th>觀看權限</th>
                <th>直播</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>{course.sortOrder}</td>
                  <td><Link href={`/admin/courses/${course.id}`}>{course.title}</Link></td>
                  <td>{course.category}</td>
                  <td>{accessLabel(course.accessType, course.price)}</td>
                  <td>{formatDate(course.courseStartAt)}</td>
                  <td>{course.durationText || "未設定"}</td>
                  <td>{course.courseFormatText || "未設定"}</td>
                  <td>{course.viewingPolicyText || "未設定"}</td>
                  <td>{course.liveSession?.isEnabled ? "已啟用" : "未啟用"}</td>
                  <td>
                    <span className={`admin-publish-state ${course.isPublished ? "is-published" : ""}`}>
                      {course.isPublished ? "已上架" : "草稿"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      <Link href={`/admin/courses/${course.id}`}>編輯</Link>
                      <form action={toggleCoursePublished}>
                        <input name="id" type="hidden" value={course.id} />
                        <button type="submit">{course.isPublished ? "下架" : "上架"}</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {!courses.length ? (
                <tr><td colSpan={11}>目前還沒有課程。</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
