import Image from "next/image";
import Link from "next/link";
import { getFeaturedCourses } from "@/lib/course-data";

const learningValues = [
  {
    icon: "書",
    title: "系統化課程",
    detail: "由淺入深，走出一條能長久閱讀的路。",
  },
  {
    icon: "筆",
    title: "作家親自授課",
    detail: "跟隨張曼娟老師，讀懂文字裡的感受與提問。",
  },
  {
    icon: "人",
    title: "學習社群",
    detail: "與同好交換閱讀的發現，讓思考持續發生。",
  },
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // 資料庫暫時不可用時，首頁仍保留可前往課程總覽的入口。
  const courses = await getFeaturedCourses().catch(() => []);
  const fallbackCourseTitles = ["古典文學的心靈旅程", "張曼娟的寫作課", "經典選讀與深度對話"];

  return (
    <main className="redesigned-homepage">
      <section className="academy-hero" aria-labelledby="home-title">
        <div className="academy-hero-wash" aria-hidden="true" />
        <div className="container academy-hero-grid">
          <div className="academy-hero-copy">
            <p className="academy-kicker">張曼娟老師・線上文學學習平台</p>
            <h1 id="home-title">
              讓文學，<br />
              成為理解自己的<span>一種方式</span>
            </h1>
            <p className="academy-intro">
              從閱讀經典到書寫生活，跟著張曼娟老師，
              <br className="desktop-only" />
              在文字裡看見自己，也在理解中安頓心靈。
            </p>
            <div className="academy-action-row">
              <Link className="academy-button academy-button-primary" href="/courses">探索課程</Link>
              <Link className="academy-button academy-button-secondary" href="/author">認識張曼娟</Link>
            </div>
          </div>

          <div className="academy-portrait-stage">
            <div className="academy-portrait-paper" aria-hidden="true" />
            <figure className="academy-portrait">
              <Image
                alt="張曼娟老師"
                height={1200}
                priority
                src="/images/author-zhang-manjuan.webp"
                width={800}
              />
            </figure>
            <p className="academy-vertical-note" aria-hidden="true">
              文字是生命的地圖，<br />也是回家的路。
            </p>
            <p className="academy-signature">張曼娟</p>
          </div>
        </div>
      </section>

      <section className="academy-values" aria-label="學習特色">
        <div className="container academy-value-grid">
          {learningValues.map((value) => (
            <article className="academy-value" key={value.title}>
              <span aria-hidden="true" className="academy-value-icon">{value.icon}</span>
              <div>
                <h2>{value.title}</h2>
                <p>{value.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="academy-course-section" id="path" aria-labelledby="courses-title">
        <div className="container">
          <div className="academy-section-heading">
            <div>
              <p className="academy-kicker">精選課程</p>
              <h2 id="courses-title">此刻，從哪一門課開始？</h2>
            </div>
            <Link className="academy-all-courses" href="/courses">查看全部課程 <span aria-hidden="true">→</span></Link>
          </div>

          <div className="academy-course-grid">
            {courses.slice(0, 3).map((course, index) => (
              <article className={`academy-course-card course-tone-${index + 1}`} key={course.slug}>
                <Link className="academy-course-image" href={`/courses/${course.slug}`}>
                  {course.coverImageUrl ? (
                    <Image alt="" fill sizes="(max-width: 760px) 100vw, 33vw" src={course.coverImageUrl} />
                  ) : <span className="academy-course-ink" aria-hidden="true" />}
                </Link>
                <div className="academy-course-body">
                  <p>{course.category}</p>
                  <h3><Link href={`/courses/${course.slug}`}>{course.title}</Link></h3>
                  <span className="academy-course-meta">{course.lessons} 單元 {course.duration ? `・${course.duration}` : ""}</span>
                  <Link className="academy-course-link" href={`/courses/${course.slug}`}>了解更多 <span aria-hidden="true">→</span></Link>
                </div>
              </article>
            ))}
            {courses.length === 0 && fallbackCourseTitles.map((title, index) => (
              <article className={`academy-course-card course-tone-${index + 1}`} key={title}>
                <Link className="academy-course-image" href="/courses"><span className="academy-course-ink" aria-hidden="true" /></Link>
                <div className="academy-course-body">
                  <p>文學選讀</p>
                  <h3><Link href="/courses">{title}</Link></h3>
                  <span className="academy-course-meta">請前往課程總覽查看內容</span>
                  <Link className="academy-course-link" href="/courses">查看課程 <span aria-hidden="true">→</span></Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="academy-membership" id="membership" aria-labelledby="membership-title">
        <div className="container academy-membership-inner">
          <div>
            <p className="academy-kicker">會員專區</p>
            <h2 id="membership-title">加入會員，讓學習成為<br className="desktop-only" />生活裡持續發亮的事</h2>
            <p>享有會員課程、專屬學習資源與最新活動通知。</p>
          </div>
          <ul className="academy-membership-points" aria-label="會員權益">
            <li>所有付費課程</li>
            <li>專屬學習社群</li>
            <li>活動與課程通知</li>
          </ul>
          <Link className="academy-button academy-button-gold" href="/membership">立即加入會員</Link>
        </div>
      </section>
    </main>
  );
}
