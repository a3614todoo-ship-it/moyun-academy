import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LiveQuestionForm } from "@/components/live-question-form";
import { CoursePurchaseStatus, LivePlatform, LiveQuestionStatus } from "@/generated/prisma/enums";
import {
  externalPlatformActionLabel,
  getVimeoEmbedUrl,
  getYouTubeLiveEmbedUrl,
  liveWindowState,
  maskEmail,
  platformLabel,
} from "@/lib/live";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "直播教室",
};

function formatDateTime(value: Date | null) {
  if (!value) return "未設定";
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
          liveSession: {
            include: {
              questions: {
                where: { status: { not: LiveQuestionStatus.HIDDEN } },
                orderBy: [
                  { status: "desc" },
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

  const liveSession = purchase.course.liveSession;
  if (!liveSession?.isEnabled) {
    return (
      <main className="result-page">
        <section className="container result-card">
          <span className="result-mark">!</span>
          <h1>直播尚未開放</h1>
          <p>這門課程目前尚未啟用直播教室，請回到課程頁確認最新資訊。</p>
          <Link className="button button-forest" href={`/courses/${slug}`}>
            返回課程頁
          </Link>
        </section>
      </main>
    );
  }

  const now = new Date();
  const windowState = liveWindowState({
    now,
    openAt: liveSession.playerOpenAt,
    closeAt: liveSession.playerCloseAt,
  });
  const playerIsOpen = windowState === "OPEN";
  const platform = liveSession.platform;
  const youtubeEmbedUrl =
    playerIsOpen && platform === LivePlatform.YOUTUBE_LIVE && liveSession.youtubeVideoId
      ? getYouTubeLiveEmbedUrl(liveSession.youtubeVideoId)
      : "";
  const vimeoEmbedUrl =
    playerIsOpen && platform === LivePlatform.VIMEO_LIVE && liveSession.externalUrl
      ? getVimeoEmbedUrl(liveSession.externalUrl)
      : "";
  const isExternalPlatform =
    platform === LivePlatform.ZOOM_WEBINAR ||
    platform === LivePlatform.ZOOM_MEETING ||
    platform === LivePlatform.EXTERNAL_URL;
  const externalUrl =
    playerIsOpen && isExternalPlatform
      ? liveSession.externalUrl
      : "";
  const watermarkText = `${purchase.name} / ${maskEmail(purchase.email)}`;

  return (
    <main>
      <section className="section live-classroom">
        <div className="container">
          <Link className="back-link" href={`/courses/${slug}`}>
            返回課程頁
          </Link>
          <span className="eyebrow">直播教室・{platformLabel(platform)}</span>
          <h1>{liveSession.title || purchase.course.title}</h1>
          <p className="lead">
            直播時間：{formatDateTime(liveSession.startsAt)}－{formatDateTime(liveSession.endsAt)}
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
                    title={`${liveSession.title} ${platformLabel(platform)}`}
                  />
                  {liveSession.showWatermark ? (
                    <div className="live-watermark">{watermarkText}</div>
                  ) : null}
                </div>
              ) : externalUrl ? (
                <div className="live-external-card">
                  <span>{platformLabel(platform)}</span>
                  <h2>請從這裡進入直播</h2>
                  <p>
                    這個平台目前以外部連結方式開啟。此入口只會在購買審核通過、且直播開放時間內顯示。
                  </p>
                  <a className="button button-gold" href={externalUrl} rel="noreferrer" target="_blank">
                    {externalPlatformActionLabel(platform)}
                  </a>
                  {liveSession.showWatermark ? (
                    <small>購買者識別：{watermarkText}</small>
                  ) : null}
                </div>
              ) : (
                <div className="live-locked-card">
                  <h2>
                    {windowState === "NOT_OPEN" ? "直播尚未開放" : "直播開放時間已結束"}
                  </h2>
                  <p>
                    播放器開放時間：{formatDateTime(liveSession.playerOpenAt)}－{formatDateTime(liveSession.playerCloseAt)}
                  </p>
                </div>
              )}
              <div className="live-meta-note">
                <strong>觀看權限</strong>
                <span>購買編號：{purchase.purchaseNo}</span>
              </div>
            </section>

            <aside className="live-interaction-panel">
              {liveSession.enableQuestions ? (
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
                        {question.answer ? <blockquote>{question.answer}</blockquote> : null}
                      </article>
                    ))}
                    {!liveSession.questions.length ? (
                      <p className="admin-empty">目前還沒有提問。</p>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {platform === LivePlatform.YOUTUBE_LIVE && liveSession.enableYoutubeChat && liveSession.youtubeChatEmbedUrl ? (
                <section className="live-panel-section">
                  <h2>YouTube Chat</h2>
                  <div className="live-chat-frame">
                    <iframe
                      loading="lazy"
                      src={liveSession.youtubeChatEmbedUrl}
                      title="YouTube Live Chat"
                    />
                  </div>
                  <small>YouTube Chat 會依照 YouTube 帳號與直播設定顯示。</small>
                </section>
              ) : null}
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
