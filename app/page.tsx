import Link from "next/link";
import { CourseCard } from "@/components/course-card";
import { getFeaturedCourses } from "@/lib/course-data";

const beliefs = [
  {
    icon: "讀",
    title: "慢讀經典",
    detail: "不追求速度，而是透過細讀、品味與思考，讓經典真正進入生命。",
  },
  {
    icon: "生",
    title: "回到生活",
    detail: "將古人的智慧與情感帶回今日，轉化為理解自己、陪伴他人、面對日常的勇氣與溫柔。",
  },
  {
    icon: "眼",
    title: "形成自己的眼光",
    detail: "閱讀是為了思辨與選擇，在對話與反思中，養成獨立而溫暖的觀點。",
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
              <Link className="button button-forest" href="/author">
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
                  src="/images/author-zhang-manjuan.webp"
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
              每一條路徑，都是一場與古人相遇的旅程。
              慢慢讀，慢慢懂。
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
            <h2>加入我輩學堂，持續走在閱讀路上</h2>
            <p>在課程、直播與社群陪伴中，慢慢累積自己的文學眼光。</p>
          </div>
          <div className="cta-benefits">
            <span><b>讀</b> 經典課程<small>持續累積</small></span>
            <span><b>問</b> 直播互動<small>與老師同行</small></span>
            <span><b>聚</b> 學員社群<small>一起慢讀</small></span>
            <span><b>藏</b> 課程紀錄<small>回看複習</small></span>
          </div>
          <Link className="button button-gold" href="/membership">加入學員</Link>
        </div>
      </section>
    </main>
  );
}
