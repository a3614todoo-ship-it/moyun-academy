import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "會員方案" };
export const dynamic = "force-dynamic";

function benefitsList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function durationLabel(days: number) {
  if (days >= 365 && days % 365 === 0) return `${days / 365} 年`;
  if (days >= 30 && days % 30 === 0) return `${days / 30} 個月`;
  return `${days} 天`;
}

export default async function MembershipPage() {
  const plans = await prisma.membershipPlan.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">深度閱讀，持續學習</span>
          <h1>我輩學堂會員方案</h1>
          <p>選擇適合自己的閱讀節奏，在會員期間觀看會員課程，並加入學習社群。</p>
        </div>
      </section>
      <section className="section">
        <div className="container plan-layout">
          <div className="membership-plan-grid">
            {plans.map((plan) => {
              const benefits = benefitsList(plan.benefits);
              return (
                <article className="plan-card" key={plan.id}>
                  <span className="plan-badge">{durationLabel(plan.durationDays)}</span>
                  <h2>{plan.name}</h2>
                  <div className="price">
                    <small>NT$</small> {plan.price.toLocaleString("zh-TW")} <span>/ {durationLabel(plan.durationDays)}</span>
                  </div>
                  <p>{plan.description || "適合希望保留固定閱讀時間的學員。"}</p>
                  {benefits.length ? (
                    <ul className="check-list">
                      {benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}
                    </ul>
                  ) : (
                    <ul className="check-list">
                      <li>會員期間觀看會員免費課程</li>
                      <li>加入 Facebook 私密學習社團</li>
                      <li>下載課程講義與延伸閱讀</li>
                    </ul>
                  )}
                  <Link className="button button-gold button-block" href={`/apply?plan=${encodeURIComponent(plan.code)}`}>
                    選擇此方案
                  </Link>
                </article>
              );
            })}
            {!plans.length ? (
              <article className="plan-card">
                <span className="plan-badge">整理中</span>
                <h2>會員方案暫停受理</h2>
                <p>學堂正在整理新的會員方案，請稍後再回來查看。</p>
              </article>
            ) : null}
          </div>
          <div className="process-panel">
            <span className="eyebrow">加入流程</span>
            <h2>簡單七步，開始學習</h2>
            {["選擇會員方案", "填寫會員報名表單", "收到報名成功與匯款資訊", "完成匯款", "填寫匯款回報", "工作人員人工對帳", "收到審核通過與會員資訊"].map((item, index) => (
              <div className="process-step" key={item}><span>{index + 1}</span><strong>{item}</strong></div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
