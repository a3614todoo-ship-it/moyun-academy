import Link from "next/link";
import { CourseCard } from "@/components/course-card";
import { getFeaturedCourses } from "@/lib/course-data";

const beliefs = [
  {
    mark: "竹",
    title: "慢讀經典",
    detail: "不趕進度，細讀原典，在字裡行間與古人相遇，讓經典真正進入生命。",
  },
  {
    mark: "茶",
    title: "回到生活",
    detail: "將古人的智慧與情感，轉化為理解自己、陪伴他人與面對日常的力量。",
  },
  {
    mark: "筆",
    title: "形成自己的眼光",
    detail: "閱讀是為了思辨與選擇，在對話與反思中養成獨立而溫暖的觀點。",
  },
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const courses = await getFeaturedCourses();

  return (
    <main className="homepage">
      <section className="home-hero" id="author">
        <div className="home-hero-bamboo" aria-hidden="true" />
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <span className="eyebrow">張曼娟的古典文學學堂</span>
            <h1>在古典文字裡，<br />照見我們這一輩的生活</h1>
            <p>
              跟著張曼娟慢讀經典，<br />
              把古人的生命經驗帶回今日，<br />
              重新理解自己、他人與世界。
            </p>
            <div className="button-row">
              <Link className="button button-forest" href="/author">認識張曼娟 <span>→</span></Link>
              <Link className="button button-outline" href="/courses">開始閱讀 <span>→</span></Link>
            </div>
          </div>

          <div className="author-feature">
            <div className="hero-paper hero-paper-back" aria-hidden="true" />
            <div className="hero-paper hero-paper-script" aria-hidden="true">讀書破萬卷，下筆如有神</div>
            <div className="author-photo-wrap">
              <img alt="作家張曼娟" className="author-photo" src="/images/author-zhang-manjuan.webp" />
            </div>
            <div className="paper-note"><span>慢讀，<br />不急著抵達</span></div>
            <p className="author-signature">作家｜張曼娟</p>
          </div>
        </div>
      </section>

      <section className="belief-section" id="beliefs">
        <div className="container belief-layout">
          <div className="belief-heading">
            <h2>學堂相信的三件事</h2>
            <span aria-hidden="true" />
          </div>
          <div className="belief-grid">
            {beliefs.map((item) => (
              <article className="belief-card" key={item.title}>
                <span className="belief-illustration" aria-hidden="true">{item.mark}</span>
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
            <span className="heading-rule" aria-hidden="true" />
            <p>每一門課，都是一段閱讀旅程，陪你在經典裡看見更寬闊的世界，也看見更好的自己。</p>
            <Link className="text-link" href="/courses">瀏覽所有課程　→</Link>
          </div>
          <div className="course-grid course-grid-three">
            {courses.slice(0, 3).map((course) => <CourseCard course={course} key={course.slug} />)}
          </div>
        </div>
      </section>

      <section className="membership-cta" id="events">
        <div className="container cta-inner">
          <div className="cta-copy">
            <span className="eyebrow">與閱讀同行</span>
            <h2>加入我輩學堂，持續走在閱讀路上</h2>
            <p>在課程、直播與社群陪伴中，慢慢累積自己的文學眼光。</p>
          </div>
          <Link className="button button-forest" href="/membership">認識會員方案　→</Link>
        </div>
      </section>
    </main>
  );
}
