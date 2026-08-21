import { createHash, createHmac } from "node:crypto";

function ticketSecret() {
  const value = process.env.EVENT_TICKET_SECRET || process.env.MEMBER_AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("EVENT_TICKET_SECRET 或 MEMBER_AUTH_SECRET 至少需要 32 個字元。");
  return value;
}

export function createTicketToken(registrationId: string) {
  return createHmac("sha256", ticketSecret()).update(`event-ticket:${registrationId}`).digest("base64url");
}

export function hashTicketToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function ticketTokenSuffix(tokenHash: string | null) {
  return tokenHash ? tokenHash.slice(-6).toUpperCase() : "------";
}
