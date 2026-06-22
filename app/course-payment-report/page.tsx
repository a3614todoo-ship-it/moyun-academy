import type { Metadata } from "next";
import { CoursePaymentReportForm } from "@/components/course-payment-report-form";

export const metadata: Metadata = { title: "課程匯款回報" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ purchase_no?: string }>;
};

export default async function CoursePaymentReportPage({ searchParams }: Props) {
  const purchaseNo = (await searchParams).purchase_no?.trim().toUpperCase();

  return (
    <main className="section">
      <div className="container form-layout">
        <div className="form-intro">
          <span className="eyebrow">課程匯款回報</span>
          <h1>回填課程付款資訊</h1>
          <p>
            匯款完成後，請填寫購買編號與匯款資料。管理員核對後會寄出正式課程觀看連結。
          </p>
        </div>
        <CoursePaymentReportForm defaultPurchaseNo={purchaseNo} />
      </div>
    </main>
  );
}
