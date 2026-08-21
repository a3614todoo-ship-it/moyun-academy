import type { Metadata } from "next";
import Link from "next/link";
import { upvoteLiveQuestion } from "./actions";
import { LiveQuestionForm } from "@/components/live-question-form";
import { CourseAccessType, LivePlatform } from "@/generated/prisma/enums";
import { getAuthorizedCoursePurchase } from "@/lib/course-access-session";
import { getVimeoEmbedUrl, liveWindowState, maskEmail, platformLabel } from "@/lib/live";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ lesson?: string }> };
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "學習教室" };
function formatDateTime(value: Date | null) { return value ? new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", dateStyle: "medium", timeStyle: "short" }).format(value) : "時間待公告"; }
function AccessRequired({ slug }: { slug: string }) { return <main className="result-page"><section className="container result-card"><span className="result-mark">!</span><h1>請重新驗證課程權限</h1><p>請回到課程頁，以有效會員資格或已核准的購買資料進入學習教室。</p><Link className="button button-forest" href={`/courses/${slug}`}>回到課程頁</Link></section></main>; }

export default async function CourseLivePage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const purchase = await getAuthorizedCoursePurchase(slug);
  if (!purchase) return <AccessRequired slug={slug} />;
  const liveLessons = purchase.course.lessonUnits.filter((lesson) => lesson.liveSession?.isEnabled);
  const selected = liveLessons.find((lesson) => lesson.id === query.lesson) || liveLessons.find((lesson) => (lesson.liveSession?.playerCloseAt || lesson.liveSession?.endsAt || new Date(8640000000000000)) >= new Date()) || liveLessons[0] || purchase.course.lessonUnits[0];
  const live = selected?.liveSession || null;
  const state = live ? liveWindowState({ now: new Date(), openAt: live.playerOpenAt, closeAt: live.playerCloseAt }) : "NOT_OPEN";
  const playerOpen = Boolean(live?.isEnabled && state === "OPEN");
  const vimeoEmbed = playerOpen && live?.platform === LivePlatform.VIMEO_LIVE && live.externalUrl ? getVimeoEmbedUrl(live.externalUrl) : "";
  const isMemberFacebook = purchase.course.accessType === CourseAccessType.MEMBER_INCLUDED && live?.platform === LivePlatform.FACEBOOK_GROUP;
  const upvotes = live ? await prisma.liveQuestionUpvote.findMany({ where: { coursePurchaseId: purchase.id, liveQuestion: { liveSessionId: live.id } }, select: { liveQuestionId: true } }) : [];
  const upvoted = new Set(upvotes.map((item) => item.liveQuestionId));
  const watermark = `${purchase.name} / ${maskEmail(purchase.email)}`;

  return <main><section className="section live-classroom"><div className="container">
    <Link className="back-link" href={`/courses/${slug}`}>回到課程頁</Link><span className="eyebrow">學習教室</span><h1>{purchase.course.title}</h1><p className="lead">直播與回看皆依每堂課個別設定；觀看權限會持續驗證。</p>
    {purchase.course.lessonUnits.length ? <nav className="lesson-room-nav" aria-label="課堂選擇">{purchase.course.lessonUnits.map((lesson, index) => <Link className={lesson.id === selected?.id ? "is-active" : ""} href={`/courses/${slug}/live?lesson=${lesson.id}`} key={lesson.id}>{index + 1}. {lesson.title}</Link>)}</nav> : null}
    {selected ? <>
      <div className="live-classroom-grid"><section className="live-player-card"><span className="eyebrow">{live ? platformLabel(live.platform) : "課堂內容"}</span><h2>{live?.title || selected.title}</h2><p>{live?.startsAt ? `直播時間：${formatDateTime(live.startsAt)}－${formatDateTime(live.endsAt)}` : selected.summary || "直播時間待公告。"}</p>
        {vimeoEmbed ? <div className="live-player-frame"><iframe allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" allowFullScreen src={vimeoEmbed} title={`${selected.title} Vimeo Live`} />{live?.showWatermark ? <div className="live-watermark">{watermark}</div> : null}</div>
        : isMemberFacebook && playerOpen && live?.externalUrl ? <div className="live-external-card"><h2>直播在 Facebook 私密社團進行</h2><p>可直接在社團中觀看並與老師互動；網站會在課後依設定開放回看。</p><a className="button button-gold" href={live.externalUrl} rel="noreferrer" target="_blank">前往 Facebook 私密社團直播</a></div>
        : <div className="live-locked-card"><h2>{state === "CLOSED" ? "本堂直播已結束" : "直播入口尚未開放"}</h2><p>網站開放：{formatDateTime(live?.playerOpenAt || null)}－{formatDateTime(live?.playerCloseAt || null)}</p></div>}
        <div className="learning-resource-row">{selected.handoutStoragePath ? <a className="button button-outline" href={`/courses/${slug}/lessons/${selected.id}/handout`}>下載本堂 PDF 教材</a> : null}<Link className="button button-outline" href={`/courses/${slug}/watch?lesson=${selected.id}`}>查看本堂回看</Link></div>
      </section>
      <aside className="live-interaction-panel">{live?.enableQuestions ? <section className="live-panel-section"><h2>站內 Q&A</h2><LiveQuestionForm slug={slug} liveSessionId={live.id} /><div className="live-question-list">{live.questions.map((question) => <article className={`live-question-item ${question.isPinned ? "is-pinned" : ""}`} key={question.id}><div><strong>{question.isPinned ? "置頂｜" : ""}{question.displayName}</strong><span>{question.emailMasked}</span></div><p>{question.body}</p><form action={upvoteLiveQuestion} className="live-upvote-form"><input name="slug" type="hidden" value={slug} /><input name="liveSessionId" type="hidden" value={live.id} /><input name="questionId" type="hidden" value={question.id} /><button disabled={upvoted.has(question.id)} type="submit">{upvoted.has(question.id) ? "已按讚" : "我也想問"} · {question.upvoteCount}</button></form>{question.answer ? <blockquote>{question.answer}</blockquote> : null}</article>)}{!live.questions.length ? <p>目前還沒有提問。</p> : null}</div></section> : <section className="live-panel-section"><h2>站內 Q&A</h2><p>本堂未開放網站問答。</p></section>}</aside></div>
      <section className="learning-room-section"><div className="section-heading"><span className="eyebrow">本堂資料</span><h2>{selected.title}</h2></div><div className="learning-material-grid">{selected.originalText ? <section><h4>原文</h4><p>{selected.originalText}</p></section> : null}{selected.translation ? <section><h4>白話翻譯</h4><p>{selected.translation}</p></section> : null}{selected.annotation ? <section><h4>字詞註解</h4><p>{selected.annotation}</p></section> : null}{selected.teacherNote ? <section><h4>老師導讀</h4><p>{selected.teacherNote}</p></section> : null}</div>{selected.reflectionPrompt ? <blockquote className="reflection-card"><strong>文學提問卡</strong>{selected.reflectionPrompt}</blockquote> : null}</section>
    </> : <section className="result-card"><h2>課堂內容尚未上架</h2><p>管理員發布後會顯示在這裡。</p></section>}
  </div></section></main>;
}
