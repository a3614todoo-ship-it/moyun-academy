import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedCourse } from "@/lib/course-data";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getPublishedCourse((await params).slug);
  return course ? { title: course.title, description: course.excerpt } : {};
}

function money(value: number) {
  return `NT$ ${value.toLocaleString("zh-TW")}`;
}

function accessTitle(accessType: string) {
  if (accessType === "PUBLIC_FREE") return "免費公開課程";
  if (accessType === "PAID") return "單獨付費課程";
  return "會員免費課程";
}

export default async function CourseDetailPage({ params }: Props) {
  const course = await getPublishedCourse((await params).slug);
  if (!course) notFound();

  const previewEmbedUrl = getYouTubeEmbedUrl(course.previewVideoUrl);
  const fullVideoEmbedUrl =
    course.accessType === "PUBLIC_FREE"
      ? getYouTubeEmbedUrl(course.fullVideoUrl)
      : "";
  const canShowPublicFullVideo =
    course.accessType === "PUBLIC_FREE" && Boolean(course.fullVideoUrl);

  return (
    <main>
      <section className="course-detail-hero">
        <div className="container detail-grid">
          <div>
            <Link className="back-link" href="/courses">返回課程總覽</Link>
            <span className="eyebrow">{course.category}</span>
            <h1>{course.title}</h1>
            <p className="lead">{course.subtitle}</p>
            <div className="detail-meta">
              <span>{course.lessons} 單元</span>
              {course.duration ? <span>{course.duration}</span> : null}
              <span>{course.accessLabel}</span>
            </div>
          </div>
          {previewEmbedUrl ? (
            <div className="youtube-preview">
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                src={previewEmbedUrl}
                title={`${course.title} 試看片`}
              />
            </div>
          ) : (
            <div className={`preview-player cover-${course.accent}`}>
              <span className="preview-placeholder-play">▶</span>
              <strong>課程試看片</strong>
              <small>後台尚未設定 YouTube 試看片。</small>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container detail-content">
          <article className="prose">
            <span className="eyebrow">課程介紹</span>
            <h2>從作品進入生命，也從生命重新理解作品</h2>
            <p>{course.description}</p>

            {canShowPublicFullVideo ? (
              <div className="course-access-panel">
                <span className="eyebrow">正式課程</span>
                <h2>立即觀看完整課程</h2>
                {fullVideoEmbedUrl ? (
                  <div className="youtube-preview">
                    <iframe
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      loading="lazy"
                      src={fullVideoEmbedUrl}
                      title={`${course.title} 正式課程`}
                    />
                  </div>
                ) : (
                  <p>
                    這門課已設定為免費公開課程，可透過下方連結前往觀看。
                  </p>
                )}
                {!fullVideoEmbedUrl ? (
                  <p>
                    <a className="button button-gold" href={course.fullVideoUrl}>
                      開啟正式課程影片
                    </a>
                  </p>
                ) : null}
              </div>
            ) : null}

            <h2>課程大綱</h2>
            <ol className="outline-list">
              {course.outline.map((item, index) => (
                <li key={item}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {item}
                </li>
              ))}
            </ol>
            <h2>適合對象</h2>
            <ul className="check-list">
              {course.audiences.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>

          <aside className="join-card">
            <span className="eyebrow">{accessTitle(course.accessType)}</span>
            <h3>{course.title}</h3>
            {course.accessType === "PUBLIC_FREE" ? (
              <>
                <p>
                  這門課目前設定為免費公開觀看。若後台已填正式影片網址，會直接顯示在課程介紹中。
                </p>
                <Link className="button button-gold button-block" href="/courses">
                  繼續探索課程
                </Link>
              </>
            ) : null}
            {course.accessType === "MEMBER_INCLUDED" ? (
              <>
                <p>
                  這門課加入學員後即可免費觀看。等學員登入功能完成後，系統會依會員資格開放正式影片。
                </p>
                <Link className="button button-gold button-block" href="/membership">
                  了解會員方案
                </Link>
              </>
            ) : null}
            {course.accessType === "PAID" ? (
              <>
                <p>
                  這門課需要單獨報名與匯款審核，審核通過後才會開放正式影片。
                </p>
                <ul>
                  <li>課程售價：{money(course.price)}</li>
                  <li>付款方式：銀行匯款</li>
                  <li>狀態流程：報名、回報匯款、後台審核</li>
                </ul>
                <Link
                  className="button button-gold button-block"
                  href={`/courses/${course.slug}`}
                >
                  報名購買功能建置中
                </Link>
              </>
            ) : null}
            <small>正式影片網址不會在未取得權限前公開顯示。</small>
          </aside>
        </div>
      </section>
    </main>
  );
}
