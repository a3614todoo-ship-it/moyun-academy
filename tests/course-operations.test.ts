import assert from "node:assert/strict";
import test from "node:test";
import { replayState } from "../lib/course-replay";
import { getVimeoEmbedUrl, isVimeoUrl, liveWindowState, maskEmail } from "../lib/live";
import { scheduledNotificationRanges } from "../lib/email/scheduled-notifications";

test("逐堂回看狀態會依啟用與開放期限判斷", () => {
  const now = new Date("2026-08-21T08:00:00.000Z");
  assert.equal(replayState({ replayEnabled: false, replayOpenAt: null, replayCloseAt: null }, now), "DISABLED");
  assert.equal(replayState({ replayEnabled: true, replayOpenAt: new Date("2026-08-22T00:00:00Z"), replayCloseAt: null }, now), "NOT_OPEN");
  assert.equal(replayState({ replayEnabled: true, replayOpenAt: new Date("2026-08-20T00:00:00Z"), replayCloseAt: new Date("2026-08-22T00:00:00Z") }, now), "OPEN");
  assert.equal(replayState({ replayEnabled: true, replayOpenAt: null, replayCloseAt: new Date("2026-08-21T07:59:59Z") }, now), "CLOSED");
});

test("Vimeo 直播活動與影片網址會轉成安全嵌入網址", () => {
  assert.equal(getVimeoEmbedUrl("https://vimeo.com/event/123456"), "https://vimeo.com/event/123456/embed");
  assert.equal(getVimeoEmbedUrl("https://vimeo.com/987654"), "https://player.vimeo.com/video/987654");
  assert.equal(isVimeoUrl("https://example.com/video/987654"), false);
});

test("直播入口開放區間會正確阻擋過早與過期存取", () => {
  const openAt = new Date("2026-08-21T07:00:00Z"); const closeAt = new Date("2026-08-21T09:00:00Z");
  assert.equal(liveWindowState({ now: new Date("2026-08-21T06:59:00Z"), openAt, closeAt }), "NOT_OPEN");
  assert.equal(liveWindowState({ now: new Date("2026-08-21T08:00:00Z"), openAt, closeAt }), "OPEN");
  assert.equal(liveWindowState({ now: new Date("2026-08-21T09:01:00Z"), openAt, closeAt }), "CLOSED");
});

test("通知排程以台北日期計算今日、明日及會員提前七天", () => {
  const ranges = scheduledNotificationRanges(new Date("2026-08-21T02:00:00Z"));
  assert.equal(ranges.today.start.toISOString(), "2026-08-20T16:00:00.000Z");
  assert.equal(ranges.tomorrow.start.toISOString(), "2026-08-21T16:00:00.000Z");
  assert.equal(ranges.memberPriorityPublicWindow.start.toISOString(), "2026-08-27T16:00:00.000Z");
});

test("學員 Email 浮水印不會完整顯示帳號", () => {
  assert.equal(maskEmail("student@example.com"), "st*****@example.com");
});
