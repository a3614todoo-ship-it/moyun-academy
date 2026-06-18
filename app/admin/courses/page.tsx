import Link from "next/link";
import { toggleCoursePublished } from "@/app/admin/courses/actions";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ updated?: string }>;
};

export default async function AdminCoursesPage({ searchParams }: Props) {
  const [session, courses, params] = await Promise.all([
    requireAdmin(),
    prisma.course.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    searchParams,
  ]);

  return (
    <AdminShell adminName={session.adminUser.name}>
      <div className="admin-page-heading">
        <div>
          <span>內容與試看片管理</span>
          <h1>課程管理</h1>
        </div>
        <Link className="admin-primary-link" href="/admin/courses/new">
          新增課程
        </Link>
      </div>
      {params.updated === "1" ? (
        <div className="admin-success-message">課程上下架狀態已更新。</div>
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
                <th>試看片</th>
                <th>首頁精選</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>{course.sortOrder}</td>
                  <td>
                    <Link href={`/admin/courses/${course.id}`}>
                      {course.title}
                    </Link>
                  </td>
                  <td>{course.category}</td>
                  <td>{course.previewVideoUrl ? "已設定" : "未設定"}</td>
                  <td>{course.isFeatured ? "是" : "否"}</td>
                  <td>
                    <span
                      className={`admin-publish-state ${course.isPublished ? "is-published" : ""}`}
                    >
                      {course.isPublished ? "已上架" : "草稿"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      <Link href={`/admin/courses/${course.id}`}>編輯</Link>
                      <form action={toggleCoursePublished}>
                        <input name="id" type="hidden" value={course.id} />
                        <button type="submit">
                          {course.isPublished ? "下架" : "上架"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
