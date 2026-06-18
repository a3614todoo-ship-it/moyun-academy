import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getBankTransferSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "報名完成" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ application_no?: string }>;
};

function BankValue({
  value,
  fallback = "待管理員設定後另行通知",
}: {
  value?: string;
  fallback?: string;
}) {
  return <dd className={!value ? "pending-value" : ""}>{value || fallback}</dd>;
}

export default async function ApplySuccessPage({ searchParams }: Props) {
  const applicationNo = (await searchParams).application_no?.trim();
  const [application, bankSettings] = await Promise.all([
    applicationNo
      ? prisma.application.findUnique({
          where: { applicationNo },
          select: {
            applicationNo: true,
            status: true,
            createdAt: true,
            plan: { select: { name: true, price: true } },
          },
        })
      : null,
    getBankTransferSettings(),
  ]);

  if (!application) {
    return (
      <main className="result-page">
        <section className="container result-card">
          <span className="result-mark">!</span>
          <span className="eyebrow">找不到報名資料</span>
          <h1>請確認報名編號</h1>
          <p>此頁面沒有有效的報名編號，請重新填寫報名表單。</p>
          <Link className="button button-forest" href="/apply">返回會員報名</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="result-page">
      <section className="container result-card success-card">
        <span className="result-mark">✓</span>
        <span className="eyebrow">報名資料已建立</span>
        <h1>報名成功</h1>
        <p>請保存報名編號，並依下方資訊完成匯款。</p>

        <div className="application-number">
          <small>您的報名編號</small>
          <strong>{application.applicationNo}</strong>
        </div>

        <div className="payment-summary">
          <h2>匯款資訊</h2>
          <dl>
            <div><dt>申請方案</dt><dd>{application.plan.name}</dd></div>
            <div><dt>應繳金額</dt><dd>NT$ {application.plan.price.toLocaleString("zh-TW")}</dd></div>
            <div><dt>銀行名稱</dt><BankValue value={bankSettings.bankName} /></div>
            <div><dt>分行</dt><BankValue value={bankSettings.bankBranch} /></div>
            <div><dt>匯款戶名</dt><BankValue value={bankSettings.bankAccountName} /></div>
            <div><dt>匯款帳號</dt><BankValue value={bankSettings.bankAccountNumber} /></div>
          </dl>
        </div>

        <div className="result-notice">
          完成匯款後，請使用報名編號填寫匯款回報。工作人員完成對帳後，將另行寄出審核結果。
        </div>
        <div className="button-row result-actions">
          <Link
            className="button button-gold"
            href={`/payment-report?application_no=${application.applicationNo}`}
          >
            前往匯款回報
          </Link>
          <Link className="button button-outline" href="/">返回首頁</Link>
        </div>
      </section>
    </main>
  );
}
