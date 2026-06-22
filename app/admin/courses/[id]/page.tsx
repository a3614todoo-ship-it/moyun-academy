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
  required: "請確認必填欄位、數字欄位、日期欄位與平台設定都已正確填寫。",
  slug: "課程網址代稱格式不正確，請使用小寫英文、數字與連字號。",
  youtube: "請輸入有效的 YouTube 試看片網址。",
  cover: "請輸入有效的課程封面圖片網址。",
  full_video: "請輸入有效的正式課程影片網址。",
  paid_price: "付費課程的售價必須大於 0。",
  duplicate_slug: "這個網址代稱已經被其他課程使用。",
  live_required: "啟用直播教室時，請填寫直播標題。",
  live_youtube: "YouTube Live 模式請填寫有效的 Video ID。",
  live_vimeo: "Vimeo Live 模式請填寫有效的 Vimeo 影片、活動或 embed 網址。",
  live_chat: "YouTube Chat 只能搭配 YouTube Live，並且需要有效的 Chat Embed URL。",
  live_external: "Zoom 或外部直播模式請填寫有效的直播網址。",
  live_window: "播放器開放時間不可晚於或等於關閉時間。",
};

export default async function EditCoursePage({ params, searchParams }: Props) {
  const [{ id }, query, session] = await Promise.all([
    params,
    searchParams,
    requireAdmin(),
  ]);
  const course = await prisma.course.findUnique({
    where: { id },
    include: { liveSession: true },
  });
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
        <div className="button-row">
          {course.isPublished ? (
            <Link className="admin-primary-link" href={`/courses/${course.slug}`} target="_blank">
              查看前台
            </Link>
          ) : null}
          {course.liveSession?.isEnabled ? (
            <Link className="admin-primary-link" href={`/courses/${course.slug}/live`} target="_blank">
              查看直播頁
            </Link>
          ) : null}
        </div>
      </div>
      {query.saved === "1" ? (
        <div className="admin-success-message">課程資料已儲存。</div>
      ) : null}
      {query.error ? (
        <div className="admin-form-error admin-course-message">
          {errorMessages[query.error] || "課程資料無法儲存，請再檢查一次。"}
        </div>
      ) : null}
      <section className="admin-panel admin-course-panel">
        <AdminCourseForm course={course} />
      </section>
    </AdminShell>
  );
}
