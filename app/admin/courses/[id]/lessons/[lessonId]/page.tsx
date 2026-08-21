import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminLessonForm } from "@/components/admin-lesson-form";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string; lessonId: string }>; searchParams: Promise<{ saved?: string; error?: string }> };
const errors: Record<string, string> = { required: "請檢查必填欄位與日期格式。", replay_window: "回看開放時間必須早於截止時間。", replay_url: "回看影片請使用 Vimeo 網址，聲音回看請使用 HTTPS 網址。", platform: "會員課程必須使用 FB 私密社團；付費課程必須使用 Vimeo Live。", live_url: "請填寫安全的直播或社團網址。", vimeo: "請填寫有效的 Vimeo 直播活動或播放器網址。", live_window: "直播開始時間必須早於結束時間。", player_window: "網站直播入口開放時間必須早於關閉時間。", delete_confirm: "輸入的課堂名稱不相符。", delete_blocked: "這堂課已有教材或問答紀錄，為避免遺失資料，目前不可刪除。" };
export default async function LessonEditorPage({ params, searchParams }: Props) {
  const [{ id, lessonId }, query, session] = await Promise.all([params, searchParams, requireAdmin()]);
  const course = await prisma.course.findUnique({ where: { id }, select: { id: true, title: true, accessType: true, lessonUnits: { select: { sortOrder: true }, orderBy: { sortOrder: "desc" }, take: 1 } } });
  if (!course) notFound();
  const lesson = lessonId === "new" ? null : await prisma.courseLesson.findFirst({ where: { id: lessonId, courseId: id }, include: { liveSession: true } });
  if (lessonId !== "new" && !lesson) notFound();
  return <AdminShell adminName={session.adminUser.name} adminRole={session.adminUser.role}>
    <div className="admin-page-heading"><div><Link className="admin-breadcrumb" href={`/admin/courses/${id}/lessons`}>回到逐堂管理</Link><h1>{lesson ? "編輯課堂" : "新增課堂"}</h1><span>{course.title}</span></div></div>
    {query.saved === "1" ? <div className="admin-success-message">課堂資料已儲存。</div> : null}
    {query.error ? <div className="admin-form-error admin-course-message">{errors[query.error] || "儲存失敗，請再檢查一次。"}</div> : null}
    <AdminLessonForm course={course} lesson={lesson} nextSortOrder={(course.lessonUnits[0]?.sortOrder ?? -1) + 1} />
  </AdminShell>;
}
