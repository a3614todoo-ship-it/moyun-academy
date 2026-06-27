import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { upvoteLiveQuestion } from "@/app/courses/[slug]/live/actions";
import { LiveQuestionForm } from "@/components/live-question-form";
import { CoursePurchaseStatus, LivePlatform, LiveQuestionStatus } from "@/generated/prisma/enums";
import { hasCourseAccessSession } from "@/lib/course-access-session";
import {
  externalPlatformActionLabel,
  getVimeoEmbedUrl,
  getYouTubeLiveEmbedUrl,
  liveWindowState,
  maskEmail,
  platformLabel,
} from "@/lib/live";
import { prisma } from "@/lib/prisma";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "學習教室",
};

function formatDateTime(value: Date | null) {
  if (!value) return "時間待公告";
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
}

function materialEmbedUrl(rawUrl: string | null) {
  if (!rawUrl) return "";
  return getYouTubeEmbedUrl(rawUrl) || getVimeoEmbedUrl(rawUrl);
}

function AccessRequired({ slug }: { slug: string }) {
  return (
    <main className="result-page">
      <section className="container result-card">
        <span className="result-mark">!</span>
        <h1>請重新驗證課程權限</h1>
        <p>
          為了避免學習教室網址被轉傳後直接觀看，請回到課程頁輸入購買編號與 Email，
          或使用會員申請編號與 Email 重新進入。
        </p>
        <Link className="button button-forest" href={`/courses/${slug}`}>
          回到課程頁
        </Link>
      </section>
    </main>
  );
}

export default async function CourseLivePage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const token = query.token?.trim();

  if (!token) notFound();

  const purchase = await prisma.coursePurchase.findFirst({
    where: {
      accessToken: token,
      status: CoursePurchaseStatus.APPROVED,
      course: { slug, isPublished: true },
    },
    include: {
      course: {
        include: {
          lessonUnits: {
            where: { isPublished: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
          liveSession: {
            include: {
              questions: {
                where: { status: { not: LiveQuestionStatus.HIDDEN } },
                orderBy: [
                  { upvoteCount: "desc" },
                  { createdAt: "desc" },
                ],
                take: 50,
              },
            },
          },
        },
      },
    },
  });

  if (!purchase) notFound();
  if (!(await hasCourseAccessSession(purchase))) {
    return <AccessRequired slug={slug} />;
  }

  const liveSession = purchase.course.liveSession;
  const upvotes = liveSession
    ? await prisma.liveQuestionUpvote.findMany({
        where: {
          coursePurchaseId: purchase.id,
          liveQuestion: { liveSessionId: liveSession.id },
        },
        select: { liveQuestionId: true },
      })
    : [];
  const upvotedQuestionIds = new Set(upvotes.map((item) => item.liveQuestionId));

  const now = new Date();
  const windowState = liveSession
    ? liveWindowState({
        now,
        openAt: liveSession.playerOpenAt,
        closeAt: liveSession.playerCloseAt,
      })
    : "NOT_OPEN";
  const playerIsOpen = Boolean(liveSession?.isEnabled && windowState === "OPEN");
  const platform = liveSession?.platform || LivePlatform.YOUTUBE_LIVE;
  const youtubeEmbedUrl =
    playerIsOpen && platform === LivePlatform.YOUTUBE_LIVE && liveSession?.youtubeVideoId
      ? getYouTubeLiveEmbedUrl(liveSession.youtubeVideoId)
      : "";
  const vimeoEmbedUrl =
    playerIsOpen && platform === LivePlatform.VIMEO_LIVE && liveSession?.externalUrl
      ? getVimeoEmbedUrl(liveSession.externalUrl)
      : "";
  const isExternalPlatform =
    platform === LivePlatform.ZOOM_WEBINAR ||
    platform === LivePlatform.ZOOM_MEETING ||
    platform === LivePlatform.EXTERNAL_URL;
  const externalUrl = playerIsOpen && isExternalPlatform ? liveSession?.externalUrl || "" : "";
  const watermarkText = `${purchase.name} / ${maskEmail(purchase.email)}`;

  return (
    <main>
      <section className="section live-classroom">
        <div className="container">
          <Link className="back-link" href={`/courses/${slug}`}>
            回到課程頁
          </Link>
          <span className="eyebrow">學習教室｜{platformLabel(platform)}</span>
          <h1>{liveSession?.title || purchase.course.title}</h1>
          <p className="lead">
            {liveSession?.startsAt
              ? `直播時間：${formatDateTime(liveSession.startsAt)}－${formatDateTime(liveSession.endsAt)}`
              : "這裡會集中直播、回放、講義、文本共讀與 Q&A。"}
          </p>

          <div className="live-classroom-grid">
            <section className="live-player-card">
              {youtubeEmbedUrl || vimeoEmbedUrl ? (
                <div className="live-player-frame">
                  <iframe
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                    allowFullScreen
                    loading="lazy"
                    src={youtubeEmbedUrl || vimeoEmbedUrl}
                    title={`${liveSession?.title || purchase.course.title} ${platformLabel(platform)}`}
                  />
                  {liveSession?.showWatermark ? (
                    <div className="live-watermark">{watermarkText}</div>
                  ) : null}
                </div>
              ) : externalUrl ? (
                <div className="live-external-card">
                  <span>{platformLabel(platform)}</span>
                  <h2>請從這裡進入直播</h2>
                  <p>外部直播連結只會在播放器開放時間內顯示。請不要轉傳連結，避免影響自己的課程權益。</p>
                  <a className="button button-gold" href={externalUrl} rel="noreferrer" target="_blank">
                    {externalPlatformActionLabel(platform)}
                  </a>
                  {liveSession?.showWatermark ? <small>購買者：{watermarkText}</small> : null}
                </div>
              ) : (
                <div className="live-locked-card">
                  <h2>{windowState === "CLOSED" ? "直播播放器已關閉" : "直播播放器尚未開放"}</h2>
                  <p>
                    播放器開放時間：{formatDateTime(liveSession?.playerOpenAt || null)}－
                    {formatDateTime(liveSession?.playerCloseAt || null)}
                  </p>
                  <p>你仍可在下方查看已上架的單元教材、提問卡、講義與回放。</p>
                </div>
              )}
              <div className="live-meta-note">
                <strong>權限資訊</strong>
                <span>購買編號：{purchase.purchaseNo}</span>
              </div>
            </section>

            <aside className="live-interaction-panel">
              {liveSession?.enableQuestions ? (
                <section className="live-panel-section">
                  <h2>站內 Q&A</h2>
                  <LiveQuestionForm slug={slug} token={token} />
                  <div className="live-question-list">
                    {liveSession.questions.map((question) => (
                      <article className="live-question-item" key={question.id}>
                        <div>
                          <strong>{question.displayName}</strong>
                          <span>{question.emailMasked}</span>
                        </div>
                        <p>{question.body}</p>
                        <form action={upvoteLiveQuestion} className="live-upvote-form">
                          <input name="slug" type="hidden" value={slug} />
                          <input name="token" type="hidden" value={token} />
                          <input name="questionId" type="hidden" value={question.id} />
                          <button disabled={upvotedQuestionIds.has(question.id)} type="submit">
                            {upvotedQuestionIds.has(question.id) ? "已按讚" : "我也想問"} · {question.upvoteCount}
                          </button>
                        </form>
                        {question.answer ? <blockquote>{question.answer}</blockquote> : null}
                      </article>
                    ))}
                    {!liveSession.questions.length ? (
                      <p className="admin-empty">目前還沒有提問。</p>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {platform === LivePlatform.YOUTUBE_LIVE && liveSession?.enableYoutubeChat && liveSession.youtubeChatEmbedUrl ? (
                <section className="live-panel-section">
                  <h2>YouTube Chat</h2>
                  <div className="live-chat-frame">
                    <iframe loading="lazy" src={liveSession.youtubeChatEmbedUrl} title="YouTube Live Chat" />
                  </div>
                  <small>YouTube Chat 會依 YouTube 帳號狀態顯示，站內 Q&A 會保存在本網站。</small>
                </section>
              ) : null}
            </aside>
          </div>

          <section className="learning-room-section">
            <div className="section-heading">
              <span className="eyebrow">文本共讀</span>
              <h2>單元、講義與提問卡</h2>
            </div>
            {purchase.course.lessonUnits.length ? (
              <div className="learning-lesson-list">
                {purchase.course.lessonUnits.map((lesson, index) => {
                  const replayEmbedUrl = materialEmbedUrl(lesson.replayVideoUrl);
                  return (
                    <article className="learning-lesson-card" key={lesson.id}>
                      <div className="learning-lesson-heading">
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <div>
                          <h3>{lesson.title}</h3>
                          <p>{lesson.summary || "這堂單元的摘要可由後台補上。"}</p>
                        </div>
                      </div>
                      <div className="learning-material-grid">
                        {lesson.originalText ? (
                          <section>
                            <h4>原文</h4>
                            <p>{lesson.originalText}</p>
                          </section>
                        ) : null}
                        {lesson.translation ? (
                          <section>
                            <h4>白話翻譯</h4>
                            <p>{lesson.translation}</p>
                          </section>
                        ) : null}
                        {lesson.annotation ? (
                          <section>
                            <h4>字詞註解</h4>
                            <p>{lesson.annotation}</p>
                          </section>
                        ) : null}
                        {lesson.teacherNote ? (
                          <section>
                            <h4>老師導讀</h4>
                            <p>{lesson.teacherNote}</p>
                          </section>
                        ) : null}
                      </div>
                      {lesson.reflectionPrompt ? (
                        <blockquote className="reflection-card">
                          <strong>文學提問卡</strong>
                          {lesson.reflectionPrompt}
                        </blockquote>
                      ) : null}
                      <div className="learning-resource-row">
                        {lesson.handoutUrl ? (
                          <a className="button button-outline" href={lesson.handoutUrl} rel="noreferrer" target="_blank">
                            下載講義
                          </a>
                        ) : null}
                        {lesson.replayVideoUrl ? (
                          <a className="button button-outline" href={lesson.replayVideoUrl} rel="noreferrer" target="_blank">
                            開啟回放
                          </a>
                        ) : null}
                      </div>
                      {replayEmbedUrl ? (
                        <div className="youtube-preview learning-replay-frame">
                          <iframe
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            loading="lazy"
                            src={replayEmbedUrl}
                            title={`${lesson.title} 回放`}
                          />
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <section className="result-card">
                <span className="result-mark">!</span>
                <h2>單元教材尚未上架</h2>
                <p>管理員可在後台課程管理中新增文本、講義、提問卡與回放連結。</p>
              </section>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
