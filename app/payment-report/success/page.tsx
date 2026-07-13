import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifyPublicReferenceSignature } from "@/lib/security/public-reference";

export const metadata: Metadata = { title: "匯款回報完成" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ application_no?: string; sig?: string }>;
};

export default async function PaymentReportSuccessPage({ searchParams }: Props) {
  const query = await searchParams;
  const applicationNo = query.application_no?.trim();
  const validReference = Boolean(
    applicationNo && verifyPublicReferenceSignature("application", applicationNo, query.sig),
  );
  const application = validReference && applicationNo
    ? await prisma.application.findUnique({
        where: { applicationNo },
        select: {
          applicationNo: true,
          status: true,
          paymentReports: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { amount: true, createdAt: true },
          },
        },
      })
    : null;

  if (!application?.paymentReports.length) {
    return (
      <main className="result-page">
        <section className="container result-card">
          <span className="result-mark">!</span>
          <h1>找不到回報資料</h1>
          <p>請重新確認報名編號並填寫匯款回報。</p>
          <Link className="button button-forest" href="/payment-report">返回匯款回報</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="result-page">
      <section className="container result-card success-card">
        <span className="result-mark">✓</span>
        <span className="eyebrow">資料已送達</span>
        <h1>匯款回報完成</h1>
        <p>工作人員將進行人工對帳，審核完成後會再寄出通知。</p>
        <div className="application-number">
          <small>報名編號</small>
          <strong>{application.applicationNo}</strong>
        </div>
        <div className="payment-summary">
          <dl>
            <div><dt>回報金額</dt><dd>NT$ {application.paymentReports[0].amount.toLocaleString("zh-TW")}</dd></div>
            <div><dt>目前狀態</dt><dd>已回報匯款，待審核</dd></div>
          </dl>
        </div>
        <Link className="button button-forest" href="/">返回首頁</Link>
      </section>
    </main>
  );
}
