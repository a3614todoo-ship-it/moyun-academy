-- 先保存既有申請當時的方案資料，再調整新制會員價格。
ALTER TABLE "Application"
  ADD COLUMN "planName" TEXT,
  ADD COLUMN "planPrice" INTEGER,
  ADD COLUMN "planDurationDays" INTEGER;

UPDATE "Application" AS application
SET
  "planName" = plan."name",
  "planPrice" = plan."price",
  "planDurationDays" = plan."durationDays"
FROM "MembershipPlan" AS plan
WHERE application."planId" = plan."id";

ALTER TABLE "Application"
  ALTER COLUMN "planName" SET NOT NULL,
  ALTER COLUMN "planPrice" SET NOT NULL,
  ALTER COLUMN "planDurationDays" SET NOT NULL;

-- 新制僅保留年度會員方案；快照建立後不再改寫歷史申請金額。
UPDATE "MembershipPlan"
SET "isActive" = false
WHERE "code" <> 'annual';

UPDATE "MembershipPlan"
SET
  "name" = '年度會員',
  "price" = 2500,
  "durationDays" = 365,
  "isActive" = true,
  "sortOrder" = 1
WHERE "code" = 'annual';

ALTER TABLE "Course"
  ADD COLUMN "publicRegistrationOpenAt" TIMESTAMP(3),
  ADD COLUMN "registrationCloseAt" TIMESTAMP(3),
  ADD COLUMN "replayEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "replayOpenAt" TIMESTAMP(3),
  ADD COLUMN "replayCloseAt" TIMESTAMP(3);

ALTER TABLE "CourseLesson"
  ADD COLUMN "replayAudioUrl" TEXT;

ALTER TYPE "LivePlatform" ADD VALUE IF NOT EXISTS 'FACEBOOK_GROUP';

CREATE INDEX "Course_publicRegistrationOpenAt_registrationCloseAt_idx"
  ON "Course"("publicRegistrationOpenAt", "registrationCloseAt");

CREATE INDEX "Course_replayEnabled_replayOpenAt_replayCloseAt_idx"
  ON "Course"("replayEnabled", "replayOpenAt", "replayCloseAt");
