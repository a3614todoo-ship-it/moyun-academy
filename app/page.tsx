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
            <h1>
              <span className="hero-title-line">在古典文字裡，</span>
              <span className="hero-title-line">照見我們這一輩的生活</span>
            </h1>
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
              <svg
                aria-labelledby="author-photo-title"
                className="author-photo-svg"
                preserveAspectRatio="xMidYMid meet"
                role="img"
                viewBox="0 0 640 540"
              >
                <title id="author-photo-title">作家張曼娟</title>
                <defs>
                  <filter id="torn-edge-distortion" x="-12%" y="-12%" width="124%" height="124%">
                    <feTurbulence
                      baseFrequency="0.012 0.072"
                      numOctaves="4"
                      result="paperNoise"
                      seed="17"
                      type="fractalNoise"
                    />
                    <feDisplacementMap
                      in="SourceGraphic"
                      in2="paperNoise"
                      scale="24"
                      xChannelSelector="R"
                      yChannelSelector="B"
                    />
                  </filter>
                  <mask id="torn-paper-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="540">
                    <rect
                      fill="white"
                      filter="url(#torn-edge-distortion)"
                      height="492"
                      width="584"
                      x="28"
                      y="24"
                    />
                  </mask>
                </defs>
                <g mask="url(#torn-paper-mask)">
                  <rect fill="#eee8dc" height="540" width="640" />
                  <image
                    className="author-photo-image"
                    height="632"
                    href="/images/author-zhang-manjuan.webp"
                    preserveAspectRatio="xMidYMin slice"
                    width="640"
                    x="0"
                    y="-92"
                  />
                  <rect className="author-photo-wash" height="540" width="640" />
                </g>
                <g className="torn-fibers" fill="none" strokeLinecap="round">
                  <path d="M35 45c-9 4-15 1-22 8m17 26c-11-1-17 4-23 2m24 55c-10 5-18 4-25 10m28 67c-12-2-17 2-26 0m24 74c-8 4-16 3-23 7m28 77c-12 1-16 6-25 7m27 65c-9 6-15 4-23 11m31 37c-8 8-16 8-21 14" />
                  <path d="M604 42c11 3 17-1 25 5m-22 49c10 1 16 6 25 4m-29 64c12 5 18 2 27 8m-25 69c9-1 15 4 25 3m-26 76c11 5 18 4 27 10m-29 61c10 2 16 8 26 8m-28 61c11 7 16 5 24 13" />
                  <path d="M55 29c5-10 4-16 10-23m58 22c-2-9 3-15 2-23m72 22c5-11 3-17 9-24m69 24c0-10 6-17 4-24m75 25c4-10 3-17 10-24m68 25c-1-10 4-16 3-25m72 28c5-11 3-17 9-24" />
                  <path d="M66 508c1 10-4 17-2 25m67-26c-5 10-3 18-10 25m80-27c1 11-4 18-3 27m73-26c-5 10-3 17-9 25m80-25c0 10-5 17-3 25m72-27c-5 11-3 17-9 25m77-29c1 11-4 17-1 24" />
                </g>
              </svg>
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
