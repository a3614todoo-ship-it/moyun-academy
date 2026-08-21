import type { Metadata } from "next";
import Link from "next/link";
import { getBankTransferSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { publicReferenceQuery, verifyPublicReferenceSignature } from "@/lib/security/public-reference";

export const metadata: Metadata = { title: "活動報名完成" };
export const dynamic = "force-dynamic";

export default async function EventRegistrationSuccessPage({ searchParams }: { searchParams: Promise<{ registration_no?: string; sig?: string }> }) {
  const query = await searchParams; const registrationNo = query.registration_no?.trim().toUpperCase();
  const valid = Boolean(registrationNo && verifyPublicReferenceSignature("event", registrationNo, query.sig));
  const [registration, bank] = await Promise.all([valid && registrationNo ? prisma.eventRegistration.findUnique({ where: { registrationNo }, include: { event: { select: { title: true, slug: true, startsAt: true } } } }) : null, getBankTransferSettings()]);
  if (!registration) return <main className="result-page"><section className="container result-card"><span className="result-mark">!</span><h1>找不到活動報名資料</h1><Link className="button button-forest" href="/events">返回活動列表</Link></section></main>;
  const waiting = registration.status === "WAITLISTED"; const needsPayment = ["PENDING_PAYMENT", "WAITLIST_OFFERED"].includes(registration.status) && registration.amount > 0; const ticketQuery = publicReferenceQuery("event", registration.registrationNo);
  return <main className="result-page"><section className="container result-card success-card"><span className="result-mark">✓</span><span className="eyebrow">{waiting ? "候補登記完成" : "活動報名已建立"}</span><h1>{waiting ? "已加入候補名單" : needsPayment ? "請依資訊完成匯款" : "報名完成"}</h1><p>{waiting ? "有名額釋出時會依候補順序通知。" : needsPayment ? "完成匯款回報並經審核後，系統會寄出電子票券。" : "請保存報名編號，活動當天出示電子票券報到。"}</p><div className="application-number"><small>活動報名編號</small><strong>{registration.registrationNo}</strong></div><div className="payment-summary"><h2>活動資訊</h2><dl><div><dt>活動</dt><dd>{registration.event.title}</dd></div><div><dt>費用</dt><dd>{registration.amount > 0 ? `NT$ ${registration.amount.toLocaleString("zh-TW")}` : "免費"}</dd></div>{needsPayment ? <><div><dt>銀行名稱</dt><dd>{bank.bankName || "請聯絡學堂"}</dd></div><div><dt>戶名</dt><dd>{bank.bankAccountName || "請聯絡學堂"}</dd></div><div><dt>帳號</dt><dd>{bank.bankAccountNumber || "請聯絡學堂"}</dd></div></> : null}</dl></div><div className="button-row result-actions">{needsPayment ? <Link className="button button-gold" href={`/event-payment-report?registration_no=${registration.registrationNo}`}>回報活動匯款</Link> : !waiting ? <Link className="button button-forest" href={`/events/ticket?${ticketQuery}`}>查看電子票券</Link> : null}<Link className="button button-outline" href={`/events/${registration.event.slug}`}>返回活動頁</Link></div></section></main>;
}
