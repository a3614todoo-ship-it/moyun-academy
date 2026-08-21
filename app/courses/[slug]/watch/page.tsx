import type { Metadata } from "next";
import Link from "next/link";
import { getAuthorizedCoursePurchase } from "@/lib/course-access-session";
import { replayState, replayStateMessage } from "@/lib/course-replay";
import { getVimeoEmbedUrl } from "@/lib/live";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ lesson?: string }> };
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "課程回看" };
function stateMessage(lesson: { replayProductionStatus: string; replayEnabled: boolean; replayOpenAt: Date | null; replayCloseAt: Date | null }) {
  if (lesson.replayProductionStatus === "PROCESSING") return "直播影片整理中，完成後會在這裡開放。";
  if (lesson.replayProductionStatus === "SCHEDULED") return "本堂尚未進入回看階段。";
  return replayStateMessage(replayState(lesson)).replaceAll("這門課", "這堂課");
}
export default async function CourseWatchPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const purchase = await getAuthorizedCoursePurchase(slug);
  if (!purchase) return <main className="result-page"><section className="container result-card"><span className="result-mark">!</span><h1>請重新驗證課程權限</h1><p>回看頁僅提供有效會員或已核准購買者使用。</p><Link className="button button-forest" href={`/courses/${slug}`}>回到課程頁</Link></section></main>;
  const lessons = purchase.course.lessonUnits;
  const selected = lessons.find((lesson) => lesson.id === query.lesson) || lessons.find((lesson) => lesson.replayEnabled) || lessons[0];
  const open = Boolean(selected && selected.replayProductionStatus === "READY" && replayState(selected) === "OPEN");
  const embed = open && selected?.replayVideoUrl ? getVimeoEmbedUrl(selected.replayVideoUrl) : "";
  return <main><section className="section"><div className="container"><Link className="back-link" href={`/courses/${slug}/live${selected ? `?lesson=${selected.id}` : ""}`}>回到學習教室</Link><span className="eyebrow">逐堂回看</span><h1>{purchase.course.title}</h1>
    {lessons.length ? <nav className="lesson-room-nav" aria-label="回看課堂選擇">{lessons.map((lesson, index) => <Link className={lesson.id === selected?.id ? "is-active" : ""} href={`/courses/${slug}/watch?lesson=${lesson.id}`} key={lesson.id}>{index + 1}. {lesson.title}</Link>)}</nav> : null}
    {selected ? <section className="learning-room-section"><div className="section-heading"><span className="eyebrow">本堂回看</span><h2>{selected.title}</h2><p>{selected.summary}</p></div>
      {open && embed ? <div className="youtube-preview learning-replay-frame"><iframe allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" allowFullScreen loading="lazy" src={embed} title={`${selected.title} 回看`} /></div> : <section className="result-card"><span className="result-mark">!</span><h2>目前無法觀看</h2><p>{stateMessage(selected)}</p></section>}
      {open && selected.replayAudioUrl ? <div className="replay-audio-card"><h3>聲音回看</h3><audio controls preload="metadata" src={selected.replayAudioUrl}>你的瀏覽器不支援音訊播放。</audio></div> : null}
      {selected.handoutStoragePath ? <p><a className="button button-outline" href={`/courses/${slug}/lessons/${selected.id}/handout`}>下載本堂 PDF 教材</a></p> : null}
    </section> : <section className="result-card"><h2>回看尚未上架</h2><p>目前沒有已發布課堂。</p></section>}
  </div></section></main>;
}
