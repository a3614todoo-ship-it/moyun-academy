-- AlterEnum
ALTER TYPE "EmailType" ADD VALUE 'COURSE_PURCHASE_CREATED';
ALTER TYPE "EmailType" ADD VALUE 'COURSE_PAYMENT_REPORTED_USER';
ALTER TYPE "EmailType" ADD VALUE 'COURSE_PAYMENT_REPORTED_ADMIN';
ALTER TYPE "EmailType" ADD VALUE 'COURSE_PURCHASE_APPROVED';

-- AlterTable
ALTER TABLE "EmailLog" ADD COLUMN "coursePurchaseId" TEXT;

-- CreateIndex
CREATE INDEX "EmailLog_coursePurchaseId_createdAt_idx" ON "EmailLog"("coursePurchaseId", "createdAt");

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_coursePurchaseId_fkey" FOREIGN KEY ("coursePurchaseId") REFERENCES "CoursePurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
