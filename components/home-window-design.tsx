import Image from "next/image";
import Link from "next/link";
import type { CourseView } from "@/lib/course-data";

const learningValues = [
  { title: "系統化課程", detail: "由淺入深，走出一條能長久閱讀的路。" },
  { title: "作家親自授課", detail: "跟隨張曼娟老師，讀懂文字裡的感受與提問。" },
  { title: "學習社群", detail: "與同好交換閱讀的發現，讓思考持續發生。" },
];

const fallbackCourseTitles = ["古典文學的心靈旅程", "張曼娟的寫作課", "經典選讀與深度對話"];

export function HomeWindowDesign({ courses }: { courses: CourseView[] }) {
  const courseRows = courses.length > 0
    ? courses.slice(0, 3).map((course) => ({
        category: course.category,
        duration: course.duration,
        href: `/courses/${course.slug}`,
        lessons: `${course.lessons} 單元`,
        title: course.title,
      }))
    : fallbackCourseTitles.map((title) => ({
        category: "文學選讀",
        duration: "前往總覽查看",
        href: "/courses",
        lessons: "課程內容",
        title,
      }));

  return (
    <main className="window-home">
      <section className="window-home-hero" aria-labelledby="window-home-title">
        <div className="window-home-container window-home-hero-grid">
          <div className="window-home-hero-copy">
            <p className="window-home-kicker">張曼娟老師・線上文學學習平台</p>
            <h1 id="window-home-title">讓文學，<br />成為理解自己的<br />一種方式</h1>
            <p className="window-home-intro">從閱讀經典到書寫生活，跟著張曼娟老師，在文字裡看見自己，也在理解中安頓心靈。</p>
            <div className="window-home-actions">
              <Link className="window-home-primary" href="/courses">探索課程</Link>
              <Link className="window-home-secondary" href="/author">認識張曼娟 <span aria-hidden="true">→</span></Link>
            </div>
          </div>

          <div className="window-home-photo-stage">
            <div className="window-home-index" aria-hidden="true"><span>READ</span><span>WRITE</span><span>LIVE</span></div>
            <figure className="window-home-photo">
              <Image
                alt="張曼娟老師站在窗邊"
                fill
                priority
                sizes="(max-width: 900px) 100vw, 54vw"
                src="/images/author-zhang-manjuan.webp"
              />
            </figure>
            <blockquote className="window-home-quote">文字是生命的地圖，<br />也是回家的路。<cite>張曼娟</cite></blockquote>
          </div>
        </div>
        <div className="window-home-hero-rule" aria-hidden="true" />
      </section>

      <section className="window-home-values" aria-label="學習特色">
        <div className="window-home-container window-home-values-grid">
          {learningValues.map((value, index) => (
            <article className="window-home-value" key={value.title}>
              <span className="window-home-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <div><h2>{value.title}</h2><p>{value.detail}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="window-home-courses" id="path" aria-labelledby="window-courses-title">
        <div className="window-home-container window-home-courses-grid">
          <div className="window-home-section-copy">
            <p className="window-home-kicker">精選課程</p>
            <h2 id="window-courses-title">此刻，從哪一門課開始？</h2>
            <p>從詩詞、古文到生命閱讀，選擇適合自己的入口，慢慢建立一條可以長久前行的學習路徑。</p>
            <Link className="window-home-text-link" href="/courses">查看全部課程 <span aria-hidden="true">→</span></Link>
          </div>

          <div className="window-home-course-list">
            {courseRows.map((course, index) => (
              <Link className="window-home-course" href={course.href} key={`${course.href}-${course.title}`}>
                <span className="window-home-course-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="window-home-course-title"><small>{course.category}</small><strong>{course.title}</strong></span>
                <span className="window-home-course-meta">{course.lessons}<br />{course.duration}</span>
                <span className="window-home-course-arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="window-home-membership" id="membership" aria-labelledby="window-membership-title">
        <div className="window-home-container window-home-membership-grid">
          <div>
            <p className="window-home-kicker">會員專區</p>
            <h2 id="window-membership-title">加入會員，讓學習成為<br />生活裡持續發亮的事</h2>
            <p>享有會員課程、專屬學習資源與最新活動通知。</p>
          </div>
          <ul aria-label="會員權益"><li>所有付費課程</li><li>專屬學習社群</li><li>活動與課程通知</li></ul>
          <Link className="window-home-member-cta" href="/membership">立即加入會員</Link>
        </div>
      </section>
    </main>
  );
}
