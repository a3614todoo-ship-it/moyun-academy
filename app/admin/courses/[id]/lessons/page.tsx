import Link from "next/link";
import { notFound } from "next/navigation";
import { moveLesson } from "./actions";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ deleted?: string }> };
function statusText(lesson: { replayEnabled: boolean; replayProductionStatus: string; liveSession: null | { isEnabled: boolean; platform: string } }) {
  if (lesson.liveSession?.isEnabled) return lesson.liveSession.platform === "FACEBOOK_GROUP" ? "FB 直播" : "Vimeo 直播";
  if (lesson.replayEnabled) return lesson.replayProductionStatus === "READY" ? "回看已就緒" : "回看整理中";
  return "內容課堂";
}
export default async function CourseLessonsPage({ params, searchParams }: Props) {
  const [{ id }, query, session] = await Promise.all([params, searchParams, requireAdmin()]);
  const course = await prisma.course.findUnique({ where: { id }, include: { lessonUnits: { include: { liveSession: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } } });
  if (!course) notFound();
  return <AdminShell adminName={session.adminUser.name}>
    <div className="admin-page-heading"><div><Link className="admin-breadcrumb" href={`/admin/courses/${course.id}`}>回到課程設定</Link><h1>逐堂內容管理</h1><span>{course.title}</span></div><Link className="admin-primary-link" href={`/admin/courses/${course.id}/lessons/new`}>新增課堂</Link></div>
    {query.deleted === "1" ? <div className="admin-success-message">課堂已刪除。</div> : null}
    <section className="admin-panel"><div className="admin-panel-heading"><h2>共 {course.lessonUnits.length} 堂</h2><p>{course.accessType === "MEMBER_INCLUDED" ? "會員課直播使用 FB 私密社團。" : course.accessType === "PAID" ? "付費課直播使用 Vimeo Live 並嵌入網站。" : "公開課可自行選擇直播平台。"}</p></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>順序</th><th>課堂</th><th>時間</th><th>狀態</th><th>發布</th><th>操作</th></tr></thead><tbody>
      {course.lessonUnits.map((lesson, index) => <tr key={lesson.id}><td>{index + 1}</td><td><Link href={`/admin/courses/${course.id}/lessons/${lesson.id}`}>{lesson.title}</Link></td><td>{lesson.startsAt ? new Intl.DateTimeFormat("zh-TW", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Taipei" }).format(lesson.startsAt) : "未設定"}</td><td>{statusText(lesson)}</td><td>{lesson.isPublished ? "已發布" : "草稿"}</td><td><div className="admin-table-actions"><Link href={`/admin/courses/${course.id}/lessons/${lesson.id}`}>編輯</Link><form action={moveLesson}><input name="courseId" type="hidden" value={course.id} /><input name="lessonId" type="hidden" value={lesson.id} /><button disabled={index === 0} name="direction" value="up">上移</button><button disabled={index === course.lessonUnits.length - 1} name="direction" value="down">下移</button></form></div></td></tr>)}
      {!course.lessonUnits.length ? <tr><td colSpan={6}>尚未建立課堂，請先新增第一堂。</td></tr> : null}
      </tbody></table></div>
    </section>
  </AdminShell>;
}
