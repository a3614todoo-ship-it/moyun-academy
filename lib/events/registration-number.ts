import { randomInt } from "node:crypto";

export function generateEventRegistrationNumber(now = new Date()) {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now).replaceAll("-", "");
  return `EV${date}${randomInt(0, 1_000_000).toString().padStart(6, "0")}`;
}
