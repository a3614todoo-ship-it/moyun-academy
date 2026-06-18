import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "會員方案" };

export default function MembershipPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container"><span className="eyebrow">深度閱讀，持續學習</span><h1>我輩學堂會員方案</h1><p>一個方案即可觀看所有完整課程，並加入會員限定的 Facebook 學習社群。</p></div>
      </section>
      <section className="section">
        <div className="container plan-layout">
          <div className="plan-card">
            <span className="plan-badge">創始會員方案</span>
            <h2>年度學習會員</h2>
            <div className="price"><small>NT$</small> 3,600 <span>/ 年</span></div>
            <p>適合希望有系統、持續閱讀古典文學的學習者。</p>
            <ul className="check-list"><li>會員期間觀看所有完整課程</li><li>每月新增課程與學習資源</li><li>加入 Facebook 私密學習社團</li><li>下載課程講義與延伸閱讀</li><li>會員限定活動與講座資訊</li></ul>
            <Link className="button button-gold button-block" href="/apply">立即報名</Link>
          </div>
          <div className="process-panel">
            <span className="eyebrow">加入流程</span><h2>簡單七步，開始學習</h2>
            {["填寫會員報名表單", "收到報名成功與匯款資訊", "完成匯款", "填寫匯款回報", "工作人員人工對帳", "收到審核通過與社團資訊", "加入社團觀看完整課程"].map((item, index) => (
              <div className="process-step" key={item}><span>{index + 1}</span><strong>{item}</strong></div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
