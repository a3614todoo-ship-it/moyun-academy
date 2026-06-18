import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminCourseForm } from "@/components/admin-course-form";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
};

const errorMessages: Record<string, string> = {
  required: "請確認必填欄位、數字欄位與權限設定都正確。",
  slug: "網址代稱只能使用小寫英文、數字與連字號。",
  youtube: "請輸入有效的 YouTube 試看片網址。",
  cover: "請輸入有效的封面圖片網址。",
  full_video: "請輸入有效的正式影片網址。",
  paid_price: "付費課程的售價必須大於 0。",
  duplicate_slug: "這個網址代稱已被其他課程使用。",
};

export default async function EditCoursePage({ params, searchParams }: Props) {
  const [{ id }, query, session] = await Promise.all([
    params,
    searchParams,
    requireAdmin(),
  ]);
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) notFound();

  return (
    <AdminShell adminName={session.adminUser.name}>
      <div className="admin-page-heading">
        <div>
          <Link className="admin-breadcrumb" href="/admin/courses">
            返回課程管理
          </Link>
          <h1>編輯課程</h1>
          <span>{course.title}</span>
        </div>
        {course.isPublished ? (
          <Link
            className="admin-primary-link"
            href={`/courses/${course.slug}`}
            target="_blank"
          >
            查看前台
          </Link>
        ) : null}
      </div>
      {query.saved === "1" ? (
        <div className="admin-success-message">課程資料已儲存。</div>
      ) : null}
      {query.error ? (
        <div className="admin-form-error admin-course-message">
          {errorMessages[query.error] || "課程資料無法儲存。"}
        </div>
      ) : null}
      <section className="admin-panel admin-course-panel">
        <AdminCourseForm course={course} />
      </section>
    </AdminShell>
  );
}
