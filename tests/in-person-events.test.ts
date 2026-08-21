import assert from "node:assert/strict";
import test from "node:test";
import { eventPrice, eventWindowState, initialRegistrationStatus } from "../lib/events/policy";
import { generateEventRegistrationNumber } from "../lib/events/registration-number";
import { createTicketToken, hashTicketToken } from "../lib/events/ticket";

const windowRule = {
  registrationOpenAt: new Date("2026-09-01T02:00:00Z"),
  publicRegistrationOpenAt: new Date("2026-09-08T02:00:00Z"),
  registrationCloseAt: new Date("2026-09-20T02:00:00Z"),
};

test("會員優先活動在一般訪客開放前只允許有效會員", () => {
  const now = new Date("2026-09-05T02:00:00Z");
  assert.equal(eventWindowState({ ...windowRule, audience: "MEMBER_PRIORITY" }, true, now), "OPEN");
  assert.equal(eventWindowState({ ...windowRule, audience: "MEMBER_PRIORITY" }, false, now), "MEMBER_PRIORITY");
  assert.equal(eventWindowState({ ...windowRule, audience: "MEMBER_PRIORITY" }, false, new Date("2026-09-09T02:00:00Z")), "OPEN");
});

test("會員限定活動不會因公開日期經過而開放給訪客", () => {
  assert.equal(eventWindowState({ ...windowRule, audience: "MEMBERS_ONLY" }, false, new Date("2026-09-10T02:00:00Z")), "MEMBER_PRIORITY");
  assert.equal(eventWindowState({ ...windowRule, audience: "MEMBERS_ONLY" }, true, new Date("2026-09-10T02:00:00Z")), "OPEN");
});

test("三種活動收費方式依會員資格正確計價", () => {
  assert.equal(eventPrice({ pricingMode: "FREE", publicPrice: 800, memberPrice: 200 }, false), 0);
  assert.equal(eventPrice({ pricingMode: "PAID", publicPrice: 800, memberPrice: 800 }, true), 800);
  assert.equal(eventPrice({ pricingMode: "MEMBER_FREE_PUBLIC_PAID", publicPrice: 800, memberPrice: 0 }, true), 0);
  assert.equal(eventPrice({ pricingMode: "MEMBER_FREE_PUBLIC_PAID", publicPrice: 800, memberPrice: 0 }, false), 800);
});

test("有名額時免費直接確認、付費待付款，額滿則候補", () => {
  assert.equal(initialRegistrationStatus({ hasSeat: true, amount: 0, waitlistEnabled: true }), "CONFIRMED");
  assert.equal(initialRegistrationStatus({ hasSeat: true, amount: 800, waitlistEnabled: true }), "PENDING_PAYMENT");
  assert.equal(initialRegistrationStatus({ hasSeat: false, amount: 800, waitlistEnabled: true }), "WAITLISTED");
  assert.equal(initialRegistrationStatus({ hasSeat: false, amount: 800, waitlistEnabled: false }), null);
});

test("票券權杖不含個資且資料庫只需保存雜湊", () => {
  process.env.MEMBER_AUTH_SECRET = "event-ticket-test-secret-at-least-32-characters";
  const token = createTicketToken("registration-123");
  assert.equal(token.includes("registration-123"), false);
  assert.match(token, /^[A-Za-z0-9_-]{40,}$/);
  assert.match(hashTicketToken(token), /^[a-f0-9]{64}$/);
  assert.equal(createTicketToken("registration-123"), token);
});

test("活動報名編號使用台北日期與六碼亂數", () => {
  const number = generateEventRegistrationNumber(new Date("2026-08-21T02:00:00Z"));
  assert.match(number, /^EV20260821\d{6}$/);
});
