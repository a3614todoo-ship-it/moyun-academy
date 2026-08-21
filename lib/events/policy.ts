import type { EventAudience, EventPricingMode } from "@/generated/prisma/enums";

export type EventWindowState = "NOT_OPEN" | "MEMBER_PRIORITY" | "OPEN" | "CLOSED";

type EventPolicyInput = {
  audience: EventAudience;
  pricingMode: EventPricingMode;
  memberPrice: number;
  publicPrice: number;
  registrationOpenAt: Date;
  publicRegistrationOpenAt: Date | null;
  registrationCloseAt: Date;
};

export function eventWindowState(event: Pick<EventPolicyInput, "audience" | "registrationOpenAt" | "publicRegistrationOpenAt" | "registrationCloseAt">, isActiveMember: boolean, now = new Date()): EventWindowState {
  if (now > event.registrationCloseAt) return "CLOSED";
  if (now < event.registrationOpenAt) return "NOT_OPEN";
  if (event.audience === "MEMBERS_ONLY") return isActiveMember ? "OPEN" : "MEMBER_PRIORITY";
  if (event.audience === "MEMBER_PRIORITY" && event.publicRegistrationOpenAt && now < event.publicRegistrationOpenAt) {
    return isActiveMember ? "OPEN" : "MEMBER_PRIORITY";
  }
  return "OPEN";
}

export function eventPrice(event: Pick<EventPolicyInput, "pricingMode" | "memberPrice" | "publicPrice">, isActiveMember: boolean) {
  if (event.pricingMode === "FREE") return 0;
  if (event.pricingMode === "MEMBER_FREE_PUBLIC_PAID" && isActiveMember) return event.memberPrice;
  return event.publicPrice;
}

export function initialRegistrationStatus(input: { hasSeat: boolean; amount: number; waitlistEnabled: boolean }) {
  if (!input.hasSeat) return input.waitlistEnabled ? "WAITLISTED" as const : null;
  return input.amount > 0 ? "PENDING_PAYMENT" as const : "CONFIRMED" as const;
}

export const seatHoldingStatuses = ["PENDING_PAYMENT", "PAYMENT_REPORTED", "CONFIRMED", "WAITLIST_OFFERED"] as const;
