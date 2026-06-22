-- Add editable course information fields for frontend and admin display.
ALTER TABLE "Course" ADD COLUMN "courseStartAt" TIMESTAMP(3);
ALTER TABLE "Course" ADD COLUMN "courseFormatText" TEXT;
ALTER TABLE "Course" ADD COLUMN "viewingPolicyText" TEXT;
