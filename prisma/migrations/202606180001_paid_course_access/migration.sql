-- CreateEnum
CREATE TYPE "CourseAccessType" AS ENUM ('PUBLIC_FREE', 'MEMBER_INCLUDED', 'PAID');

-- CreateEnum
CREATE TYPE "CoursePurchaseStatus" AS ENUM ('PENDING_PAYMENT', 'PAYMENT_REPORTED', 'APPROVED', 'REJECTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN "accessType" "CourseAccessType" NOT NULL DEFAULT 'MEMBER_INCLUDED';
ALTER TABLE "Course" ADD COLUMN "fullVideoUrl" TEXT;
ALTER TABLE "Course" ADD COLUMN "price" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CoursePurchase" (
    "id" TEXT NOT NULL,
    "purchaseNo" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "bankLast5" TEXT,
    "payerName" TEXT,
    "paidAt" TIMESTAMP(3),
    "note" TEXT,
    "status" "CoursePurchaseStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "accessToken" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoursePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoursePurchase_purchaseNo_key" ON "CoursePurchase"("purchaseNo");

-- CreateIndex
CREATE UNIQUE INDEX "CoursePurchase_accessToken_key" ON "CoursePurchase"("accessToken");

-- CreateIndex
CREATE INDEX "CoursePurchase_courseId_status_idx" ON "CoursePurchase"("courseId", "status");

-- CreateIndex
CREATE INDEX "CoursePurchase_status_createdAt_idx" ON "CoursePurchase"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CoursePurchase_email_idx" ON "CoursePurchase"("email");

-- CreateIndex
CREATE INDEX "CoursePurchase_phone_idx" ON "CoursePurchase"("phone");

-- CreateIndex
CREATE INDEX "CoursePurchase_reviewedById_idx" ON "CoursePurchase"("reviewedById");

-- CreateIndex
CREATE INDEX "Course_accessType_idx" ON "Course"("accessType");

-- AddForeignKey
ALTER TABLE "CoursePurchase" ADD CONSTRAINT "CoursePurchase_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePurchase" ADD CONSTRAINT "CoursePurchase_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
