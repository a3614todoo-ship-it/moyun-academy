import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { EventRegistrationStatus } from "@/generated/prisma/enums";
import { createTicketToken, hashTicketToken, ticketTokenSuffix } from "@/lib/events/ticket";
import { prisma } from "@/lib/prisma";
import { verifyPublicReferenceSignature } from "@/lib/security/public-reference";

export const metadata: Metadata = { title: "活動電子票券" };
export const dynamic = "force-dynamic";
function format(value: Date) { return new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", year: "numeric", month: "long", day: "numeric", weekday: "long", hour: "2-digit", minute: "2-digit", hour12: false }).format(value); }

export default async function EventTicketPage({ searchParams }: { searchParams: Promise<{ registration_no?: string; sig?: string }> }) {
  const q = await searchParams; const no = q.registration_no?.trim().toUpperCase(); const valid = Boolean(no && verifyPublicReferenceSignature("event", no, q.sig));
  const registration = valid && no ? await prisma.eventRegistration.findUnique({ where: { registrationNo: no }, include: { event: true, checkIn: true } }) : null;
  if (!registration || registration.status !== EventRegistrationStatus.CONFIRMED || !registration.ticketTokenHash) return <main className="result-page"><section className="container result-card"><span className="result-mark">!</span><h1>票券尚未開放</h1><p>請確認報名已完成審核，或聯絡學堂協助。</p><Link className="button button-forest" href="/events">返回活動列表</Link></section></main>;
  const token = createTicketToken(registration.id); if (hashTicketToken(token) !== registration.ticketTokenHash) throw new Error("活動票券驗證資料不一致。");
  const qr = await QRCode.toDataURL(`WBEVT:${token}`, { width: 420, margin: 2, color: { dark: "#123c33", light: "#fffdf7" }, errorCorrectionLevel: "M" });
  const checkedIn = registration.checkIn && !registration.checkIn.reversedAt;
  return <main className="event-ticket-page"><section className="event-ticket"><div className="event-ticket-head"><span>張曼娟大學堂｜實體活動</span><strong>{checkedIn ? "已完成報到" : "請於入口出示"}</strong></div><div className="event-ticket-body"><span className="eyebrow">電子票券</span><h1>{registration.event.title}</h1><div className="event-ticket-qr"><Image alt="活動報到 QR Code" height={320} unoptimized src={qr} width={320} /></div><p className="event-ticket-code">票券末碼 {ticketTokenSuffix(registration.ticketTokenHash)}</p><dl><div><dt>參加人</dt><dd>{registration.name}</dd></div><div><dt>活動時間</dt><dd>{format(registration.event.startsAt)}</dd></div><div><dt>活動地點</dt><dd>{registration.event.venueName}<br />{registration.event.venueAddress}</dd></div><div><dt>報名編號</dt><dd>{registration.registrationNo}</dd></div></dl></div><div className="event-ticket-foot">請勿任意轉傳此票券；每張票券僅供一人報到。</div></section></main>;
}
