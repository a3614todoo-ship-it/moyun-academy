import type { Metadata } from "next";
import { EventPaymentReportForm } from "@/components/event-payment-report-form";

export const metadata: Metadata = { title: "活動匯款回報" };
export default async function EventPaymentReportPage({ searchParams }: { searchParams: Promise<{ registration_no?: string }> }) { const query = await searchParams; return <main className="form-page"><section className="container form-page-grid"><div className="form-page-intro"><span className="eyebrow">實體活動</span><h1>回報活動匯款</h1><p>請依報名完成頁的金額匯款後，再填寫資料供學堂核對。</p></div><EventPaymentReportForm defaultRegistrationNo={query.registration_no} /></section></main>; }
