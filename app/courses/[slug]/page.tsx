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

export default async function CourseDetailPage({ params }: Props) {
  const course = await getPublishedCourse((await params).slug);
  if (!course) notFound();
  const previewEmbedUrl = getYouTubeEmbedUrl(course.previewVideoUrl);

  return (
    <main>
      <section className="course-detail-hero">
        <div className="container detail-grid">
          <div>
            <Link className="back-link" href="/courses">← 返回課程總覽</Link>
            <span className="eyebrow">{course.category}</span>
            <h1>{course.title}</h1>
            <p className="lead">{course.subtitle}</p>
            <div className="detail-meta">
              <span>{course.lessons} 個單元</span><span>{course.duration}</span><span>不限次數觀看</span>
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
              <small>管理員尚未設定 YouTube 試看片</small>
            </div>
          )}
        </div>
      </section>
      <section className="section">
        <div className="container detail-content">
          <article className="prose">
            <span className="eyebrow">課程介紹</span>
            <h2>在文字裡，走近真實的人生</h2>
            <p>{course.description}</p>
            <h2>課程大綱</h2>
            <ol className="outline-list">
              {course.outline.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span>{item}</li>)}
            </ol>
            <h2>這堂課適合誰</h2>
            <ul className="check-list">{course.audiences.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <aside className="join-card">
            <span className="eyebrow">會員限定</span>
            <h3>觀看完整課程</h3>
            <p>完整影片發布於會員限定 Facebook 私密社團。完成報名與人工審核後，即可觀看所有課程並參與討論。</p>
            <ul><li>所有完整課程</li><li>每月持續更新</li><li>專屬社群與講義</li></ul>
            <Link className="button button-gold button-block" href="/membership">加入會員</Link>
            <small>無自動續費，採人工匯款審核</small>
          </aside>
        </div>
      </section>
    </main>
  );
}
