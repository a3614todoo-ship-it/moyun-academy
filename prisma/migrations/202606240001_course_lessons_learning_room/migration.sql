-- Add course lesson units, lesson materials, reflection prompts, and Q&A upvote tracking.

CREATE TABLE "CourseLesson" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "startsAt" TIMESTAMP(3),
    "durationText" TEXT,
    "originalText" TEXT,
    "translation" TEXT,
    "annotation" TEXT,
    "teacherNote" TEXT,
    "reflectionPrompt" TEXT,
    "handoutUrl" TEXT,
    "replayVideoUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseLesson_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LiveQuestionUpvote" (
    "id" TEXT NOT NULL,
    "liveQuestionId" TEXT NOT NULL,
    "coursePurchaseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveQuestionUpvote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CourseLesson_courseId_sortOrder_idx" ON "CourseLesson"("courseId", "sortOrder");
CREATE INDEX "CourseLesson_isPublished_startsAt_idx" ON "CourseLesson"("isPublished", "startsAt");
CREATE UNIQUE INDEX "LiveQuestionUpvote_liveQuestionId_coursePurchaseId_key" ON "LiveQuestionUpvote"("liveQuestionId", "coursePurchaseId");
CREATE INDEX "LiveQuestionUpvote_coursePurchaseId_createdAt_idx" ON "LiveQuestionUpvote"("coursePurchaseId", "createdAt");

ALTER TABLE "CourseLesson" ADD CONSTRAINT "CourseLesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LiveQuestionUpvote" ADD CONSTRAINT "LiveQuestionUpvote_liveQuestionId_fkey" FOREIGN KEY ("liveQuestionId") REFERENCES "LiveQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LiveQuestionUpvote" ADD CONSTRAINT "LiveQuestionUpvote_coursePurchaseId_fkey" FOREIGN KEY ("coursePurchaseId") REFERENCES "CoursePurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
