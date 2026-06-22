import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "認識作家｜我輩學堂",
  description:
    "認識張曼娟與我輩學堂的閱讀方法，從古典文學走回今日生活，慢讀、細讀，形成自己的眼光。",
};

const roles = [
  {
    title: "作家",
    text: "以小說、散文與劇作書寫生命經驗，讓文字成為理解自己與他人的入口。",
  },
  {
    title: "古典文學研究者",
    text: "長年深耕古典文學，將詩詞、史傳與經典故事重新帶回當代讀者眼前。",
  },
  {
    title: "閱讀推廣人",
    text: "相信閱讀能安頓人心，也能讓我們在時代的波裡，找回身安頓自己的方法。",
  },
];

const readingMethods = [
  "慢讀經典：不追求速度，而是透過細讀、停頓與思考，讓經典真正進入生命。",
  "細讀文字：從一個字、一句話、一個典故開始，聽見古人藏在文字裡的心事。",
  "回到生活：把古人的智慧與情感帶回今日，重新理解自己、他人與世界。",
  "形成眼光：閱讀不是為了標準答案，而是在對話與反思中，養成獨立溫暖的觀點。",
];

export default function AuthorPage() {
  return (
    <main>
      <section className="author-detail-hero">
        <div className="container author-detail-grid">
          <div className="author-detail-copy">
            <Link className="back-link" href="/">
              回到首頁
            </Link>
            <span className="eyebrow">認識作家</span>
            <h1>張曼娟</h1>
            <p className="lead">
              她把古典文學帶到今日生活裡，也把今日的心事放回經典中照看。
              在我輩學堂，閱讀不是背誦答案，而是一場慢慢靠近自己的旅程。
            </p>
            <div className="button-row">
              <Link className="button button-forest" href="/courses">
                從課程開始
              </Link>
              <Link className="button button-outline" href="/membership">
                加入學堂
              </Link>
            </div>
          </div>

          <figure className="author-detail-photo-card">
            <img alt="張曼娟老師" src="/images/author-zhang-manjuan.jpg" />
            <figcaption>慢讀，不急著抵達</figcaption>
          </figure>
        </div>
      </section>

      <section className="section">
        <div className="container author-profile-layout">
          <article className="author-prose">
            <span className="eyebrow">作家的古典文學學堂</span>
            <h2>讓古典不只是古典，而是重新照見我們的生活</h2>
            <p>
              張曼娟長年以作家、學者與閱讀推廣者的身分，陪伴讀者走入古典文學。
              她關心的不是把經典放在高處供人仰望，而是讓那些詩詞、人物與故事，
              重新成為我們理解愛、離別、挫折、選擇與自我的方法。
            </p>
            <p>
              我輩學堂延續這樣的閱讀精神：不急著得到結論，也不把文學當成考題。
              我們在字句之間停下來，聽見古人的困惑，也看見自己的處境。
              讀古典，是為了在今日生活中多一點安定、多一點想像，也多一點自由。
            </p>
            <blockquote>
              閱讀不是逃離生活，而是讓我們帶著更柔軟、更清醒的心，重新回到生活。
            </blockquote>
          </article>

          <aside className="author-profile-card">
            <h2>三個身分</h2>
            {roles.map((item) => (
              <div key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </div>
            ))}
          </aside>
        </div>
      </section>

      <section className="section author-reading-section">
        <div className="container author-reading-grid">
          <div>
            <span className="eyebrow">閱讀方法</span>
            <h2>從一篇文章開始，練習自己的觀看方式</h2>
            <p>
              我輩學堂想保存的，不只是知識本身，而是一種閱讀的姿態。
              在張曼娟老師的引路下，古典文學不再只是遙遠的文本，
              而會變成一面鏡子，照見我們如何感受、如何選擇、如何成為自己。
            </p>
          </div>
          <ol className="author-method-list">
            {readingMethods.map((item, index) => (
              <li key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {item}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section author-cta-section">
        <div className="container author-cta-card">
          <span className="eyebrow">從這裡開始</span>
          <h2>讓經典成為日常裡可以親近的光</h2>
          <p>
            如果你想跟著張曼娟老師慢讀經典，可以先從課程開始；
            也可以加入學堂會員，保留一段固定回到文字與自己的時間。
          </p>
          <div className="button-row">
            <Link className="button button-gold" href="/courses">
              探索課程
            </Link>
            <Link className="button button-outline" href="/membership">
              查看會員方案
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
