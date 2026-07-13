import type { Metadata } from "next";
import Link from "next/link";
import { getAuthorizedCoursePurchase } from "@/lib/course-access-session";
import { getVimeoEmbedUrl } from "@/lib/live";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "課程回放",
};

function embedUrl(rawUrl: string | null) {
  if (!rawUrl) return "";
  return getYouTubeEmbedUrl(rawUrl) || getVimeoEmbedUrl(rawUrl);
}

function AccessRequired({ slug }: { slug: string }) {
  return (
    <main className="result-page">
      <section className="container result-card">
        <span className="result-mark">!</span>
        <h1>請重新驗證課程權限</h1>
        <p>為了保護課程內容，回放頁需要先從課程頁完成購買編號或會員資格驗證。</p>
        <Link className="button button-forest" href={`/courses/${slug}`}>
          回到課程頁
        </Link>
      </section>
    </main>
  );
}

export default async function CourseWatchPage({ params }: Props) {
  const { slug } = await params;
  const purchase = await getAuthorizedCoursePurchase(slug);
  if (!purchase) return <AccessRequired slug={slug} />;

  const courseEmbedUrl = embedUrl(purchase.course.fullVideoUrl);

  return (
    <main>
      <section className="section">
        <div className="container">
          <Link className="back-link" href={`/courses/${purchase.course.slug}/live`}>
            回到學習教室
          </Link>
          <span className="eyebrow">課程回放</span>
          <h1>{purchase.course.title}</h1>
          {purchase.course.subtitle ? <p className="lead">{purchase.course.subtitle}</p> : null}

          {purchase.course.fullVideoUrl ? (
            courseEmbedUrl ? (
              <div className="youtube-preview">
                <iframe
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  src={courseEmbedUrl}
                  title={`${purchase.course.title} 完整回放`}
                />
              </div>
            ) : (
              <section className="result-card success-card">
                <span className="eyebrow">外部回放連結</span>
                <h2>這堂課的回放在外部平台觀看</h2>
                <p>請從下方按鈕開啟課程回放。</p>
                <a className="button button-gold" href={purchase.course.fullVideoUrl} rel="noreferrer" target="_blank">
                  開啟完整回放
                </a>
              </section>
            )
          ) : null}

          <section className="learning-room-section">
            <div className="section-heading">
              <span className="eyebrow">單元回放</span>
              <h2>依單元觀看</h2>
            </div>
            {purchase.course.lessonUnits.some((lesson) => lesson.replayVideoUrl) ? (
              <div className="learning-lesson-list">
                {purchase.course.lessonUnits.map((lesson) => {
                  const lessonEmbedUrl = embedUrl(lesson.replayVideoUrl);
                  if (!lesson.replayVideoUrl) return null;
                  return (
                    <article className="learning-lesson-card" key={lesson.id}>
                      <h3>{lesson.title}</h3>
                      {lesson.summary ? <p>{lesson.summary}</p> : null}
                      {lessonEmbedUrl ? (
                        <div className="youtube-preview learning-replay-frame">
                          <iframe
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            loading="lazy"
                            src={lessonEmbedUrl}
                            title={`${lesson.title} 回放`}
                          />
                        </div>
                      ) : (
                        <a className="button button-outline" href={lesson.replayVideoUrl} rel="noreferrer" target="_blank">
                          開啟回放
                        </a>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <section className="result-card">
                <span className="result-mark">!</span>
                <h2>回放尚未上架</h2>
                <p>回放上架後，會在這裡依單元顯示。</p>
              </section>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
