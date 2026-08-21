-- 課程營運後台 2.0：動態單元、多場直播、單元回看、私人講義與 Q&A 管理。
ALTER TYPE "EmailType" ADD VALUE IF NOT EXISTS 'REPLAY_OPENED';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReplayProductionStatus') THEN
    CREATE TYPE "ReplayProductionStatus" AS ENUM ('SCHEDULED', 'PROCESSING', 'READY');
  END IF;
END $$;

DROP INDEX IF EXISTS "LiveSession_courseId_key";

ALTER TABLE "LiveSession"
  ADD COLUMN IF NOT EXISTS "lessonId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "LiveSession_lessonId_key" ON "LiveSession"("lessonId");
CREATE INDEX IF NOT EXISTS "LiveSession_courseId_startsAt_idx" ON "LiveSession"("courseId", "startsAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'LiveSession_lessonId_fkey'
      AND conrelid = '"LiveSession"'::regclass
  ) THEN
    ALTER TABLE "LiveSession"
      ADD CONSTRAINT "LiveSession_lessonId_fkey"
      FOREIGN KEY ("lessonId") REFERENCES "CourseLesson"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "CourseLesson"
  ADD COLUMN IF NOT EXISTS "handoutStoragePath" TEXT,
  ADD COLUMN IF NOT EXISTS "handoutFileName" TEXT,
  ADD COLUMN IF NOT EXISTS "handoutContentType" TEXT,
  ADD COLUMN IF NOT EXISTS "handoutSizeBytes" INTEGER,
  ADD COLUMN IF NOT EXISTS "replayEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "replayOpenAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "replayCloseAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "replayProductionStatus" "ReplayProductionStatus" NOT NULL DEFAULT 'SCHEDULED';

ALTER TABLE "LiveQuestion"
  ADD COLUMN IF NOT EXISTS "isPinned" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "CourseLesson_replayEnabled_replayOpenAt_replayCloseAt_idx"
  ON "CourseLesson"("replayEnabled", "replayOpenAt", "replayCloseAt");
CREATE INDEX IF NOT EXISTS "LiveQuestion_liveSessionId_isPinned_status_createdAt_idx"
  ON "LiveQuestion"("liveSessionId", "isPinned", "status", "createdAt");

-- 將既有回看網址轉為已可上架，並沿用課程層級的回看時間。
UPDATE "CourseLesson" AS lesson
SET
  "replayEnabled" = course."replayEnabled",
  "replayOpenAt" = course."replayOpenAt",
  "replayCloseAt" = course."replayCloseAt",
  "replayProductionStatus" = CASE
    WHEN lesson."replayVideoUrl" IS NOT NULL OR lesson."replayAudioUrl" IS NOT NULL
      THEN 'READY'::"ReplayProductionStatus"
    ELSE 'SCHEDULED'::"ReplayProductionStatus"
  END
FROM "Course" AS course
WHERE lesson."courseId" = course."id";

-- 私人講義 bucket；只有伺服器端憑證可簽發上傳與下載網址。
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('course-handouts', 'course-handouts', false, 26214400, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
