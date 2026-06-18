import type { Metadata } from "next";
import { PaymentReportForm } from "@/components/payment-report-form";

export const metadata: Metadata = { title: "匯款回報" };

type Props = {
  searchParams: Promise<{ application_no?: string }>;
};

export default async function PaymentReportPage({ searchParams }: Props) {
  const applicationNo = (await searchParams).application_no?.trim().toUpperCase();

  return (
    <main>
      <section className="page-hero compact-page-hero">
        <div className="container">
          <span className="eyebrow">人工對帳流程</span>
          <h1>匯款回報</h1>
          <p>送出後系統會更新為「已回報匯款，待審核」，工作人員將依序進行對帳。</p>
        </div>
      </section>
      <section className="section application-section">
        <div className="container narrow-form-container">
          <PaymentReportForm defaultApplicationNo={applicationNo} />
        </div>
      </section>
    </main>
  );
}
