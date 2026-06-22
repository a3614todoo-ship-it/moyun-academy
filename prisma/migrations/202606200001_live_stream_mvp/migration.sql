-- CreateEnum
CREATE TYPE "LivePlatform" AS ENUM ('YOUTUBE_LIVE', 'VIMEO_LIVE', 'ZOOM_WEBINAR', 'ZOOM_MEETING', 'EXTERNAL_URL');

-- CreateEnum
CREATE TYPE "LiveQuestionStatus" AS ENUM ('OPEN', 'ANSWERED', 'PINNED', 'HIDDEN');

-- CreateTable
CREATE TABLE "LiveSession" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "platform" "LivePlatform" NOT NULL DEFAULT 'YOUTUBE_LIVE',
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "playerOpenAt" TIMESTAMP(3),
    "playerCloseAt" TIMESTAMP(3),
    "youtubeVideoId" TEXT,
    "youtubeChatEmbedUrl" TEXT,
    "enableYoutubeChat" BOOLEAN NOT NULL DEFAULT false,
    "enableQuestions" BOOLEAN NOT NULL DEFAULT true,
    "showWatermark" BOOLEAN NOT NULL DEFAULT true,
    "externalUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveQuestion" (
    "id" TEXT NOT NULL,
    "liveSessionId" TEXT NOT NULL,
    "coursePurchaseId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "emailMasked" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "LiveQuestionStatus" NOT NULL DEFAULT 'OPEN',
    "upvoteCount" INTEGER NOT NULL DEFAULT 0,
    "answeredAt" TIMESTAMP(3),
    "answer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LiveSession_courseId_key" ON "LiveSession"("courseId");

-- CreateIndex
CREATE INDEX "LiveSession_isEnabled_playerOpenAt_playerCloseAt_idx" ON "LiveSession"("isEnabled", "playerOpenAt", "playerCloseAt");

-- CreateIndex
CREATE INDEX "LiveSession_platform_idx" ON "LiveSession"("platform");

-- CreateIndex
CREATE INDEX "LiveQuestion_liveSessionId_status_createdAt_idx" ON "LiveQuestion"("liveSessionId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "LiveQuestion_coursePurchaseId_createdAt_idx" ON "LiveQuestion"("coursePurchaseId", "createdAt");

-- AddForeignKey
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveQuestion" ADD CONSTRAINT "LiveQuestion_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveQuestion" ADD CONSTRAINT "LiveQuestion_coursePurchaseId_fkey" FOREIGN KEY ("coursePurchaseId") REFERENCES "CoursePurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
