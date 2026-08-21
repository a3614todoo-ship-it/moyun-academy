import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventRegistrationForm } from "@/components/event-registration-form";
import { EventStatus, MembershipSubscriptionStatus } from "@/generated/prisma/enums";
import { eventPrice, eventWindowState, seatHoldingStatuses } from "@/lib/events/policy";
import { getMemberSession } from "@/lib/member/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDateTime(value: Date) { return new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", year: "numeric", month: "long", day: "numeric", weekday: "long", hour: "2-digit", minute: "2-digit", hour12: false }).format(value); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const event = await prisma.inPersonEvent.findFirst({ where: { slug, status: EventStatus.PUBLISHED }, select: { title: true, excerpt: true } }); return event ? { title: event.title, description: event.excerpt } : { title: "找不到活動" }; }

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [event, memberSession] = await Promise.all([
    prisma.inPersonEvent.findFirst({ where: { slug, status: EventStatus.PUBLISHED } }),
    getMemberSession(),
  ]);
  if (!event) notFound();
  const [activeMembership, seatsTaken] = await Promise.all([
    memberSession ? prisma.membershipSubscription.findFirst({ where: { memberUserId: memberSession.memberUser.id, status: MembershipSubscriptionStatus.ACTIVE, startsAt: { lte: new Date() }, endsAt: { gte: new Date() } }, select: { id: true } }) : null,
    prisma.eventRegistration.count({ where: { eventId: event.id, status: { in: [...seatHoldingStatuses] } } }),
  ]);
  const isMember = Boolean(activeMembership);
  const window = eventWindowState(event, isMember);
  const price = eventPrice(event, isMember);
  const seatsRemaining = Math.max(0, event.capacity - seatsTaken);
  return <main>
    <section className="event-detail-hero"><div className="container event-detail-grid"><div><span className="eyebrow">{event.category}</span><h1>{event.title}</h1>{event.subtitle ? <p className="event-lead">{event.subtitle}</p> : null}<div className="event-facts"><div><small>時間</small><strong>{formatDateTime(event.startsAt)}</strong></div><div><small>地點</small><strong>{event.venueName}</strong><span>{event.venueAddress}</span></div><div><small>費用</small><strong>{price > 0 ? `NT$ ${price.toLocaleString("zh-TW")}` : isMember && event.pricingMode === "MEMBER_FREE_PUBLIC_PAID" ? "會員免費" : "免費"}</strong></div></div></div><div className="event-detail-image">{event.coverImageUrl ? <Image alt={event.title} fill priority sizes="(max-width: 900px) 100vw, 46vw" src={event.coverImageUrl} /> : <span aria-hidden="true">會</span>}</div></div></section>
    <section className="section"><div className="container event-content-grid"><article className="event-prose"><h2>活動內容</h2>{event.description.split(/\n+/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<h2>活動資訊</h2><dl><div><dt>活動時間</dt><dd>{formatDateTime(event.startsAt)}－{formatDateTime(event.endsAt)}</dd></div><div><dt>活動地點</dt><dd>{event.venueName}<br />{event.venueAddress}{event.mapUrl ? <><br /><Link href={event.mapUrl} target="_blank">開啟地圖</Link></> : null}</dd></div><div><dt>報名截止</dt><dd>{formatDateTime(event.registrationCloseAt)}</dd></div></dl></article><aside>
      {window === "OPEN" ? <EventRegistrationForm event={{ id: event.id, title: event.title, price, seatsRemaining, waitlistEnabled: event.waitlistEnabled }} memberDefaults={memberSession ? memberSession.memberUser : undefined} /> : <div className="application-form event-registration-closed"><span className="eyebrow">報名狀態</span><h2>{window === "MEMBER_PRIORITY" ? "目前限有效會員報名" : window === "CLOSED" ? "報名已截止" : "尚未開放報名"}</h2><p>{window === "MEMBER_PRIORITY" ? "登入有效會員帳號後即可依會員資格報名。" : "請留意學堂最新活動公告。"}</p>{window === "MEMBER_PRIORITY" ? <Link className="button button-forest button-block" href={`/login?next=/events/${event.slug}`}>會員登入</Link> : null}</div>}
    </aside></div></section>
  </main>;
}
