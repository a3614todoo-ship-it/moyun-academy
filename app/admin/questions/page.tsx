import { updateQuestion } from "./actions";
import { AdminShell } from "@/components/admin-shell";
import { LiveQuestionStatus } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ q?: string; status?: string; course?: string }> };
export default async function QuestionsPage({ searchParams }: Props) {
  const [session, query] = await Promise.all([requireAdmin(), searchParams]);
  const status = Object.values(LiveQuestionStatus).includes(query.status as LiveQuestionStatus) ? query.status as LiveQuestionStatus : undefined;
  const [courses, questions] = await Promise.all([
    prisma.course.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.liveQuestion.findMany({ where: { status, liveSession: query.course ? { courseId: query.course } : undefined, OR: query.q ? [{ body: { contains: query.q, mode: "insensitive" } }, { displayName: { contains: query.q, mode: "insensitive" } }] : undefined }, include: { liveSession: { include: { course: { select: { title: true } }, lesson: { select: { title: true } } } } }, orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }], take: 200 }),
  ]);
  return <AdminShell adminName={session.adminUser.name}><div className="admin-page-heading"><div><span>集中回覆、置頂與隱藏</span><h1>課程問答</h1></div></div>
    <section className="admin-panel"><form className="admin-filter-bar"><input name="q" defaultValue={query.q || ""} placeholder="搜尋問題或姓名" /><select name="course" defaultValue={query.course || ""}><option value="">全部課程</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select><select name="status" defaultValue={status || ""}><option value="">全部狀態</option><option value="OPEN">待回覆</option><option value="ANSWERED">已回覆</option><option value="HIDDEN">已隱藏</option></select><button type="submit">篩選</button></form></section>
    <section className="admin-question-list">{questions.map((question) => <article className={`admin-panel admin-question-card ${question.isPinned ? "is-pinned" : ""}`} key={question.id}><div className="admin-question-meta"><strong>{question.liveSession.course.title}｜{question.liveSession.lesson?.title || question.liveSession.title}</strong><span>{question.displayName} · {question.emailMasked} · {question.upvoteCount} 人同問</span></div><blockquote>{question.body}</blockquote><form action={updateQuestion}><input name="id" type="hidden" value={question.id} /><textarea name="answer" defaultValue={question.answer || ""} placeholder="輸入老師或管理員回覆" rows={4} /><div className="admin-table-actions"><button name="intent" value="answer">儲存回覆</button><button name="intent" value={question.isPinned ? "unpin" : "pin"}>{question.isPinned ? "取消置頂" : "置頂"}</button>{question.status === "HIDDEN" ? <button name="intent" value="reopen">恢復</button> : <button name="intent" value="hide">隱藏</button>}</div></form></article>)}{!questions.length ? <section className="admin-panel">目前沒有符合條件的問題。</section> : null}</section>
  </AdminShell>;
}
