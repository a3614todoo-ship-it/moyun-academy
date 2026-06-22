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

function formatDateTime(value: Date | null) {
  if (!value) return "時間另行公告";
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
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

  const courseInfoItems = [
    {
      icon: "日",
      label: "開課時間",
      value: formatDateTime(course.courseStartAt),
    },
    {
      icon: "章",
      label: "課程時長",
      value: course.duration || `${course.lessons} 單元`,
    },
    {
      icon: "播",
      label: "上課方式",
      value: course.courseFormatText || "線上課程・可於網站內觀看",
    },
    {
      icon: "看",
      label: "觀看權限",
      value:
        course.viewingPolicyText ||
        (course.accessType === "PAID"
          ? "審核通過後可使用專屬連結觀看"
          : "依課程權限開放觀看"),
    },
  ];

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
              <strong>課程試看</strong>
              <small>可在後台設定 YouTube 試看片網址</small>
            </div>
          )}
        </div>
      </section>

      <section className="section course-info-section">
        <div className="container course-info-card">
          <h2>課程資訊</h2>
          <div className="course-info-grid">
            {courseInfoItems.map((item) => (
              <article className="course-info-item" key={item.label}>
                <span>{item.icon}</span>
                <div>
                  <small>{item.label}</small>
                  <strong>{item.value}</strong>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container detail-content">
          <article className="prose">
            <span className="eyebrow">課程介紹</span>
            <h2>從一堂課開始，慢慢讀進文字與生命裡</h2>
            <p>{course.description}</p>

            {canShowPublicFullVideo ? (
              <div className="course-access-panel">
                <span className="eyebrow">正式課程</span>
                <h2>此課程可直接觀看</h2>
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
                  <p>此課程已開放外部影片連結，可點擊下方按鈕前往觀看。</p>
                )}
                {!fullVideoEmbedUrl ? (
                  <p>
                    <a className="button button-gold" href={course.fullVideoUrl}>
                      前往正式課程影片
                    </a>
                  </p>
                ) : null}
              </div>
            ) : null}

            <h2>課程章節</h2>
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
                <p>這門課程目前開放免費觀看，適合想先認識我輩學堂閱讀方式的學員。</p>
                <Link className="button button-gold button-block" href="/courses">
                  瀏覽更多課程
                </Link>
              </>
            ) : null}
            {course.accessType === "MEMBER_INCLUDED" ? (
              <>
                <p>這門課程包含在會員方案中。完成會員申請與審核後，即可依會員權限觀看。</p>
                <Link className="button button-gold button-block" href="/membership">
                  加入學員
                </Link>
              </>
            ) : null}
            {course.accessType === "PAID" ? (
              <>
                <p>這門課程需單獨購買。送出報名後，請依匯款資訊付款並等待後台審核。</p>
                <ul>
                  <li>課程售價：{money(course.price)}</li>
                  <li>購買流程：報名、匯款、回報、審核</li>
                  <li>審核通過後會寄送專屬觀看連結</li>
                </ul>
                <Link
                  className="button button-gold button-block"
                  href={`/courses/${course.slug}/purchase`}
                >
                  購買這門課程
                </Link>
              </>
            ) : null}
            <small>正式課程影片與直播教室都會依照課程權限開放。</small>
          </aside>
        </div>
      </section>
    </main>
  );
}
