import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifyPublicReferenceSignature } from "@/lib/security/public-reference";

export const metadata: Metadata = { title: "課程匯款回報完成" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ purchase_no?: string; sig?: string }>;
};

export default async function CoursePaymentReportSuccessPage({ searchParams }: Props) {
  const query = await searchParams;
  const purchaseNo = query.purchase_no?.trim().toUpperCase();
  const validReference = Boolean(
    purchaseNo && verifyPublicReferenceSignature("purchase", purchaseNo, query.sig),
  );
  const purchase = validReference && purchaseNo
    ? await prisma.coursePurchase.findUnique({
        where: { purchaseNo },
        select: {
          purchaseNo: true,
          amount: true,
          bankLast5: true,
          course: { select: { title: true, slug: true } },
        },
      })
    : null;

  if (!purchase?.bankLast5) {
    return (
      <main className="result-page">
        <section className="container result-card">
          <span className="result-mark">!</span>
          <h1>找不到匯款回報資料</h1>
          <p>請確認課程購買編號是否正確，或重新填寫匯款回報。</p>
          <Link className="button button-forest" href="/course-payment-report">
            返回課程匯款回報
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="result-page">
      <section className="container result-card success-card">
        <span className="result-mark">✓</span>
        <span className="eyebrow">匯款回報完成</span>
        <h1>已收到您的課程匯款資料</h1>
        <p>我們會進行核對，審核通過後會寄出正式課程觀看連結。</p>
        <div className="application-number">
          <small>課程購買編號</small>
          <strong>{purchase.purchaseNo}</strong>
        </div>
        <div className="payment-summary">
          <dl>
            <div><dt>課程名稱</dt><dd>{purchase.course.title}</dd></div>
            <div><dt>回報金額</dt><dd>NT$ {purchase.amount.toLocaleString("zh-TW")}</dd></div>
            <div><dt>狀態</dt><dd>待管理員審核</dd></div>
          </dl>
        </div>
        <Link className="button button-forest" href={`/courses/${purchase.course.slug}`}>
          返回課程頁
        </Link>
      </section>
    </main>
  );
}
