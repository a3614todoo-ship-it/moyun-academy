"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EmailStatus, EmailType, EventAudience, EventPricingMode, EventRegistrationStatus, EventStatus } from "@/generated/prisma/enums";
import { sendEmailLogs } from "@/lib/email/mailer";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { recordAdminAudit } from "@/lib/security/admin-audit";
import { parseTaipeiDateTimeLocal } from "@/lib/taipei-time";

function text(data: FormData, name: string) { return String(data.get(name) || "").trim(); }
function integer(data: FormData, name: string) { return Number.parseInt(text(data, name), 10); }
function date(data: FormData, name: string) { return parseTaipeiDateTimeLocal(text(data, name)); }
function optionalDate(data: FormData, name: string) { const value = text(data, name); return value ? parseTaipeiDateTimeLocal(value) : null; }
function safeHttps(value: string) { if (!value) return true; try { return new URL(value).protocol === "https:"; } catch { return false; } }

export async function saveEvent(formData: FormData) {
  const session = await requireAdmin();
  const id = text(formData, "id");
  const slug = text(formData, "slug").toLowerCase();
  const title = text(formData, "title");
  const category = text(formData, "category");
  const excerpt = text(formData, "excerpt");
  const description = text(formData, "description");
  const venueName = text(formData, "venueName");
  const venueAddress = text(formData, "venueAddress");
  const pricingMode = text(formData, "pricingMode") as EventPricingMode;
  const audience = text(formData, "audience") as EventAudience;
  const startsAt = date(formData, "startsAt");
  const endsAt = date(formData, "endsAt");
  const registrationOpenAt = date(formData, "registrationOpenAt");
  const publicRegistrationOpenAt = optionalDate(formData, "publicRegistrationOpenAt");
  const registrationCloseAt = date(formData, "registrationCloseAt");
  const capacity = integer(formData, "capacity");
  const waitlistPaymentHours = integer(formData, "waitlistPaymentHours");
  const publicPrice = integer(formData, "publicPrice");
  const memberPrice = integer(formData, "memberPrice");
  const sortOrder = integer(formData, "sortOrder");
  const coverImageUrl = text(formData, "coverImageUrl");
  const mapUrl = text(formData, "mapUrl");
  const destination = `/admin/events/${id || "new"}`;

  const validEnums = Object.values(EventPricingMode).includes(pricingMode) && Object.values(EventAudience).includes(audience);
  const validNumbers = [capacity, waitlistPaymentHours, publicPrice, memberPrice, sortOrder].every(Number.isInteger);
  if (!title || !slug || !category || !excerpt || !description || !venueName || !venueAddress || !validEnums || !validNumbers || capacity < 1 || waitlistPaymentHours < 1 || waitlistPaymentHours > 720 || publicPrice < 0 || memberPrice < 0) redirect(`${destination}?error=required`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) redirect(`${destination}?error=slug`);
  if (!startsAt || !endsAt || !registrationOpenAt || !registrationCloseAt || startsAt >= endsAt || registrationOpenAt > registrationCloseAt) redirect(`${destination}?error=time`);
  if (audience === EventAudience.MEMBER_PRIORITY && (!publicRegistrationOpenAt || publicRegistrationOpenAt <= registrationOpenAt || publicRegistrationOpenAt >= registrationCloseAt)) redirect(`${destination}?error=priority_time`);
  if (pricingMode === EventPricingMode.PAID && publicPrice <= 0) redirect(`${destination}?error=price`);
  if (pricingMode === EventPricingMode.MEMBER_FREE_PUBLIC_PAID && (memberPrice !== 0 || publicPrice <= 0)) redirect(`${destination}?error=price`);
  if (!safeHttps(coverImageUrl) || !safeHttps(mapUrl)) redirect(`${destination}?error=url`);

  const [duplicate, existing] = await Promise.all([
    prisma.inPersonEvent.findFirst({ where: { slug, id: id ? { not: id } : undefined }, select: { id: true } }),
    id ? prisma.inPersonEvent.findUnique({
      where: { id },
      select: {
        status: true,
        publishedAt: true,
        publicPrice: true,
        memberPrice: true,
        startsAt: true,
        endsAt: true,
        venueName: true,
        venueAddress: true,
      },
    }) : null,
  ]);
  if (duplicate) redirect(`${destination}?error=duplicate_slug`);
  if (id && !existing) redirect("/admin/events");
  const requestedStatus = formData.get("isPublished") === "on" ? EventStatus.PUBLISHED : EventStatus.DRAFT;
  const status = existing?.status === EventStatus.CANCELLED ? EventStatus.CANCELLED : requestedStatus;
  const eventData = {
    slug, title, subtitle: text(formData, "subtitle") || null, category, excerpt, description,
    coverImageUrl: coverImageUrl || null, venueName, venueAddress, mapUrl: mapUrl || null,
    startsAt, endsAt, registrationOpenAt,
    publicRegistrationOpenAt: audience === EventAudience.MEMBER_PRIORITY ? publicRegistrationOpenAt : null,
    registrationCloseAt, capacity, waitlistEnabled: formData.get("waitlistEnabled") === "on",
    waitlistPaymentHours, pricingMode, publicPrice: pricingMode === EventPricingMode.FREE ? 0 : publicPrice,
    memberPrice: pricingMode === EventPricingMode.PAID ? publicPrice : memberPrice,
    audience, status, isFeatured: formData.get("isFeatured") === "on", sortOrder,
    publishedAt: status === EventStatus.PUBLISHED ? existing?.publishedAt || new Date() : null,
  };
  const event = id ? await prisma.inPersonEvent.update({ where: { id }, data: eventData }) : await prisma.inPersonEvent.create({ data: eventData });
  const scheduleOrVenueChanged = Boolean(existing && (
    existing.startsAt.getTime() !== event.startsAt.getTime()
    || existing.endsAt.getTime() !== event.endsAt.getTime()
    || existing.venueName !== event.venueName
    || existing.venueAddress !== event.venueAddress
  ));
  if (scheduleOrVenueChanged && event.status === EventStatus.PUBLISHED) {
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        eventId: event.id,
        status: { notIn: [EventRegistrationStatus.CANCELLED, EventRegistrationStatus.REJECTED] },
      },
      select: { id: true, email: true },
    });
    const logs = await Promise.all(registrations.map((registration) => prisma.emailLog.create({
      data: {
        eventRegistrationId: registration.id,
        type: EmailType.EVENT_UPDATED,
        recipient: registration.email,
        subject: `活動資訊更新：${event.title}`,
        status: EmailStatus.PENDING,
      },
    })));
    await sendEmailLogs(logs.map((log) => log.id));
  }
  await recordAdminAudit({ adminUserId: session.adminUser.id, action: id ? "EVENT_UPDATED" : "EVENT_CREATED", targetType: "InPersonEvent", targetId: event.id, metadata: { slug, status, pricingMode, oldPublicPrice: existing?.publicPrice ?? null, newPublicPrice: event.publicPrice } });
  revalidatePath("/events"); revalidatePath(`/events/${slug}`); revalidatePath("/admin/events");
  redirect(`/admin/events/${event.id}?saved=1`);
}

export async function toggleEventPublished(formData: FormData) {
  const session = await requireAdmin();
  const id = text(formData, "id");
  const event = await prisma.inPersonEvent.findUnique({ where: { id }, select: { slug: true, status: true } });
  if (!event || event.status === EventStatus.CANCELLED) redirect("/admin/events");
  const status = event.status === EventStatus.PUBLISHED ? EventStatus.DRAFT : EventStatus.PUBLISHED;
  await prisma.inPersonEvent.update({ where: { id }, data: { status, publishedAt: status === EventStatus.PUBLISHED ? new Date() : null } });
  await recordAdminAudit({ adminUserId: session.adminUser.id, action: status === EventStatus.PUBLISHED ? "EVENT_PUBLISHED" : "EVENT_UNPUBLISHED", targetType: "InPersonEvent", targetId: id });
  revalidatePath("/events"); revalidatePath(`/events/${event.slug}`); revalidatePath("/admin/events");
  redirect("/admin/events?updated=1");
}

export async function cancelEvent(formData: FormData) {
  const session = await requireAdmin(); const id = text(formData, "id"); const confirmTitle = text(formData, "confirmTitle");
  const event = await prisma.inPersonEvent.findUnique({ where: { id }, include: { registrations: { where: { status: { notIn: [EventRegistrationStatus.CANCELLED, EventRegistrationStatus.REJECTED] } }, select: { id: true, email: true } } } });
  if (!event) redirect("/admin/events"); if (event.title !== confirmTitle) redirect(`/admin/events/${id}?error=cancel_confirm`);
  const emailIds = await prisma.$transaction(async (transaction) => {
    await transaction.inPersonEvent.update({ where: { id }, data: { status: EventStatus.CANCELLED, cancelledAt: new Date(), publishedAt: null } });
    const logs = await Promise.all(event.registrations.map((registration) => transaction.emailLog.create({ data: { eventRegistrationId: registration.id, type: EmailType.EVENT_CANCELLED, recipient: registration.email, subject: `活動取消通知：${event.title}`, status: EmailStatus.PENDING } })));
    return logs.map((log) => log.id);
  });
  await sendEmailLogs(emailIds); await recordAdminAudit({ adminUserId: session.adminUser.id, action: "EVENT_CANCELLED", targetType: "InPersonEvent", targetId: id, metadata: { notified: emailIds.length } });
  revalidatePath("/events"); revalidatePath(`/events/${event.slug}`); revalidatePath("/admin/events"); redirect(`/admin/events/${id}?cancelled=1`);
}
