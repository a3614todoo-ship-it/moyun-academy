import Link from "next/link";
import { CourseCard } from "@/components/course-card";
import { getFeaturedCourses } from "@/lib/course-data";

const beliefs = [
  {
    icon: "書",
    title: "慢讀經典",
    detail: "不追求速度，而是透過細讀、品味與思考，讓經典真正走進生命。",
  },
  {
    icon: "茶",
    title: "回到生活",
    detail: "將古人的智慧與情感帶回今日，陪伴他人面對日常的勇氣與溫柔。",
  },
  {
    icon: "筆",
    title: "形成自己的眼光",
    detail: "閱讀不是為了標準答案，而是在對話與思索中養成獨立而溫潤的觀點。",
  },
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const courses = await getFeaturedCourses();

  return (
    <main>
      <section className="home-hero" id="author">
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <span className="eyebrow">作家的古典文學學堂</span>
            <h1>在古典文字裡，<br />照見我們這一輩的生活</h1>
            <p>
              跟著張曼娟慢讀經典，把古人的生命經驗帶回今日，
              重新理解自己、他人與世界。
            </p>
            <div className="button-row">
              <Link className="button button-forest" href="#author-story">
                認識作家
                <span>→</span>
              </Link>
              <Link className="button button-outline" href="/courses">
                開始閱讀
                <span>→</span>
              </Link>
            </div>
          </div>

          <div className="author-feature">
            <div className="author-photo-column">
              <div className="author-photo-wrap">
                <img
                  alt="作家張曼娟"
                  className="author-photo"
                  src="/images/author-zhang-manjuan.jpg"
                />
              </div>
            </div>
            <div className="author-side">
              <div className="paper-note">
                <span>慢讀，<br />不急著抵達</span>
              </div>
              <article className="author-card" id="author-story">
                <h2>張曼娟</h2>
                <p>作家・古典文學研究者・閱讀推廣人</p>
                <small>
                  相信文學的力量，也相信閱讀能讓我們在時代的波裡，
                  找到回身安頓自己的方法。
                </small>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="belief-section" id="beliefs">
        <div className="container">
          <div className="section-title-center">
            <span></span>
            <h2>學堂相信的三件事</h2>
            <span></span>
          </div>
          <div className="belief-grid">
            {beliefs.map((item) => (
              <article className="belief-card" key={item.title}>
                <span>{item.icon}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section course-entry-section" id="path">
        <div className="container course-entry-grid">
          <div className="course-entry-copy">
            <span className="eyebrow">閱讀路徑</span>
            <h2>從這些篇章開始</h2>
            <p>
              每一條路徑，都是一次與古人相遇的旅程。
              慢慢讀，慢慢懂，讓文字在今日重新發光。
            </p>
            <Link className="text-link" href="/courses">
              探索所有課程 →
            </Link>
          </div>
          <div className="course-grid course-grid-three">
            {courses.slice(0, 3).map((course) => (
              <CourseCard course={course} key={course.slug} />
            ))}
          </div>
        </div>
      </section>

      <section className="membership-cta" id="events">
        <div className="container cta-inner">
          <div className="cta-copy">
            <h2>加入我輩學堂，開啟你的閱讀之旅</h2>
            <p>在張曼娟的帶領下，持續閱讀經典，也閱讀自己的生活。</p>
          </div>
          <div className="cta-benefits">
            <span><b>書</b> 無限次觀看<small>所有完整課程</small></span>
            <span><b>眾</b> 專屬學習社群<small>與同好交流</small></span>
            <span><b>箋</b> 課程更新通知<small>掌握最新內容</small></span>
            <span><b>禮</b> 學員專屬優惠<small>活動與講座</small></span>
          </div>
          <Link className="button button-gold" href="/membership">加入學員</Link>
        </div>
      </section>
    </main>
  );
}
