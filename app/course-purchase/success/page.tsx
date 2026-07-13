import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getBankTransferSettings } from "@/lib/settings";
import { verifyPublicReferenceSignature } from "@/lib/security/public-reference";

export const metadata: Metadata = { title: "課程購買申請完成" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ purchase_no?: string; sig?: string }>;
};

function BankValue({
  value,
  fallback = "尚未設定，請聯絡學堂管理員。",
}: {
  value?: string;
  fallback?: string;
}) {
  return <dd className={!value ? "pending-value" : ""}>{value || fallback}</dd>;
}

export default async function CoursePurchaseSuccessPage({ searchParams }: Props) {
  const query = await searchParams;
  const purchaseNo = query.purchase_no?.trim().toUpperCase();
  const validReference = Boolean(
    purchaseNo && verifyPublicReferenceSignature("purchase", purchaseNo, query.sig),
  );
  const [purchase, bankSettings] = await Promise.all([
    validReference && purchaseNo
      ? prisma.coursePurchase.findUnique({
          where: { purchaseNo },
          select: {
            purchaseNo: true,
            amount: true,
            status: true,
            course: { select: { title: true, slug: true } },
          },
        })
      : null,
    getBankTransferSettings(),
  ]);

  if (!purchase) {
    return (
      <main className="result-page">
        <section className="container result-card">
          <span className="result-mark">!</span>
          <span className="eyebrow">找不到購買資料</span>
          <h1>請確認課程購買編號</h1>
          <p>目前查不到這筆課程購買申請，請回到課程頁重新操作。</p>
          <Link className="button button-forest" href="/courses">返回課程總覽</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="result-page">
      <section className="container result-card success-card">
        <span className="result-mark">✓</span>
        <span className="eyebrow">課程購買申請完成</span>
        <h1>請依下方資訊匯款</h1>
        <p>匯款完成後，請回填匯款資料，管理員審核通過後會寄出正式課程觀看連結。</p>

        <div className="application-number">
          <small>課程購買編號</small>
          <strong>{purchase.purchaseNo}</strong>
        </div>

        <div className="payment-summary">
          <h2>匯款資訊</h2>
          <dl>
            <div><dt>課程名稱</dt><dd>{purchase.course.title}</dd></div>
            <div><dt>應匯款金額</dt><dd>NT$ {purchase.amount.toLocaleString("zh-TW")}</dd></div>
            <div><dt>銀行名稱</dt><BankValue value={bankSettings.bankName} /></div>
            <div><dt>分行</dt><BankValue value={bankSettings.bankBranch} /></div>
            <div><dt>戶名</dt><BankValue value={bankSettings.bankAccountName} /></div>
            <div><dt>帳號</dt><BankValue value={bankSettings.bankAccountNumber} /></div>
          </dl>
        </div>

        <div className="result-notice">
          請保留此購買編號，匯款回報與後續查核都會使用它。
        </div>
        <div className="button-row result-actions">
          <Link
            className="button button-gold"
            href={`/course-payment-report?purchase_no=${purchase.purchaseNo}`}
          >
            回報課程匯款
          </Link>
          <Link className="button button-outline" href={`/courses/${purchase.course.slug}`}>
            返回課程頁
          </Link>
        </div>
      </section>
    </main>
  );
}
