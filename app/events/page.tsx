import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EventStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "實體活動", description: "查看張曼娟大學堂的學員聚會、文化走讀與實體講座。" };
export const dynamic = "force-dynamic";

function formatDate(value: Date) { return new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", year: "numeric", month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(value); }
function priceLabel(mode: string, publicPrice: number) { if (mode === "FREE") return "免費參加"; if (mode === "MEMBER_FREE_PUBLIC_PAID") return `會員免費｜一般 NT$ ${publicPrice.toLocaleString("zh-TW")}`; return `NT$ ${publicPrice.toLocaleString("zh-TW")}`; }

export default async function EventsPage() {
  const events = await prisma.inPersonEvent.findMany({ where: { status: EventStatus.PUBLISHED, endsAt: { gte: new Date() } }, orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { startsAt: "asc" }], include: { registrations: { where: { status: { in: ["PENDING_PAYMENT", "PAYMENT_REPORTED", "CONFIRMED", "WAITLIST_OFFERED"] } }, select: { id: true } } } });
  return <main>
    <section className="page-hero event-page-hero"><div className="container"><span className="eyebrow">從線上共讀，走入真實相遇</span><h1>實體活動</h1><p>學員聚會、文化走讀與小型講座，讓閱讀在城市與生活裡繼續發生。</p></div></section>
    <section className="section"><div className="container"><div className="event-grid">
      {events.map((event) => { const full = event.registrations.length >= event.capacity; return <article className="event-card" key={event.id}>
        <div className="event-card-image">{event.coverImageUrl ? <Image alt={event.title} fill sizes="(max-width: 720px) 100vw, 50vw" src={event.coverImageUrl} /> : <span aria-hidden="true">集</span>}<em>{event.category}</em></div>
        <div className="event-card-body"><p>{formatDate(event.startsAt)}</p><h2>{event.title}</h2><span>{event.venueName} · {priceLabel(event.pricingMode, event.publicPrice)}</span><p>{event.excerpt}</p><div className="event-card-footer"><strong>{full ? event.waitlistEnabled ? "正取額滿，可候補" : "名額已滿" : `尚有 ${event.capacity - event.registrations.length} 名`}</strong><Link href={`/events/${event.slug}`}>查看活動 →</Link></div></div>
      </article>; })}
    </div>{!events.length ? <div className="event-empty"><span>候</span><h2>活動正在籌備中</h2><p>新活動上架後會在這裡公布。</p></div> : null}</div></section>
  </main>;
}
