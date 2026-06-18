import type { Metadata } from "next";
import { ApplicationForm } from "@/components/application-form";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "學員報名",
  description: "填寫我輩學堂學員報名資料，取得專屬報名編號與匯款資訊。",
};

export const dynamic = "force-dynamic";

export default async function ApplyPage() {
  const plan = await prisma.membershipPlan.findFirst({
    where: { code: "annual", isActive: true },
    select: {
      code: true,
      name: true,
      price: true,
      durationDays: true,
      description: true,
      benefits: true,
    },
  });

  if (!plan) {
    return (
      <main>
        <section className="page-hero">
          <div className="container">
            <span className="eyebrow">學員報名</span>
            <h1>目前暫停受理</h1>
            <p>學員方案正在整理中，請稍後再回來查看。</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="page-hero compact-page-hero">
        <div className="container">
          <span className="eyebrow">加入我輩學堂</span>
          <h1>學員報名</h1>
          <p>完成資料填寫後，系統將產生專屬報名編號與匯款說明。</p>
        </div>
      </section>
      <section className="section application-section">
        <div className="container application-layout">
          <ApplicationForm plan={plan} />
          <aside className="application-summary">
            <span className="eyebrow">本次申請方案</span>
            <h2>{plan.name}</h2>
            <div className="summary-price">
              <small>NT$</small> {plan.price.toLocaleString("zh-TW")}
            </div>
            <p>{plan.description}</p>
            <dl>
              <div><dt>學員效期</dt><dd>{plan.durationDays} 天</dd></div>
              <div><dt>付款方式</dt><dd>銀行匯款</dd></div>
              <div><dt>審核方式</dt><dd>人工對帳</dd></div>
            </dl>
            <div className="summary-notice">
              <strong>報名後請留意</strong>
              <p>報名尚未等同學員資格成立。完成匯款回報並經工作人員審核後，才會寄出 Facebook 私密社團加入資訊。</p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
