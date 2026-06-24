import Link from "next/link";
import { AdminCourseForm } from "@/components/admin-course-form";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  required: "請確認必填欄位與日期格式是否正確。",
  slug: "課程網址代稱只能使用小寫英文、數字與連字號。",
  youtube: "請填寫有效的 YouTube 試看片網址。",
  cover: "請填寫有效的課程封面圖片網址。",
  full_video: "請填寫有效的完整課程影片網址。",
  lesson_url: "請確認單元講義或回放網址格式正確。",
  paid_price: "付費課程的價格必須大於 0。",
  duplicate_slug: "這個課程網址代稱已經被其他課程使用。",
  live_required: "啟用直播教室時，請填寫直播標題。",
  live_youtube: "YouTube Live 請填寫有效的 Video ID。",
  live_vimeo: "Vimeo Live 請填寫有效的 Vimeo 影片、活動或 embed 網址。",
  live_chat: "YouTube Chat 只能搭配 YouTube Live，並且需要有效的 Chat Embed URL。",
  live_external: "Zoom 或外部直播平台請填寫有效連結。",
  live_window: "播放器開放時間必須早於關閉時間。",
};

export default async function NewCoursePage({ searchParams }: Props) {
  const [session, params] = await Promise.all([requireAdmin(), searchParams]);

  return (
    <AdminShell adminName={session.adminUser.name}>
      <div className="admin-page-heading">
        <div>
          <Link className="admin-breadcrumb" href="/admin/courses">
            回到課程管理
          </Link>
          <h1>新增課程</h1>
        </div>
      </div>
      {params.error ? (
        <div className="admin-form-error admin-course-message">
          {errorMessages[params.error] || "課程資料儲存失敗，請再檢查一次。"}
        </div>
      ) : null}
      <section className="admin-panel admin-course-panel">
        <AdminCourseForm />
      </section>
    </AdminShell>
  );
}
