CREATE TYPE "MemberUserStatus" AS ENUM ('PENDING_PASSWORD', 'ACTIVE', 'DISABLED');

CREATE TYPE "MembershipSubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

CREATE TABLE "MemberUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "status" "MemberUserStatus" NOT NULL DEFAULT 'PENDING_PASSWORD',
    "passwordSetAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MemberSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "memberUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MembershipSubscription" (
    "id" TEXT NOT NULL,
    "memberUserId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "planPrice" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "MembershipSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipSubscription_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Application" ADD COLUMN "memberUserId" TEXT;

ALTER TABLE "CoursePurchase" ADD COLUMN "memberUserId" TEXT;

CREATE UNIQUE INDEX "MemberUser_email_key" ON "MemberUser"("email");

CREATE INDEX "MemberUser_status_createdAt_idx" ON "MemberUser"("status", "createdAt");

CREATE INDEX "MemberUser_phone_idx" ON "MemberUser"("phone");

CREATE UNIQUE INDEX "MemberSession_tokenHash_key" ON "MemberSession"("tokenHash");

CREATE INDEX "MemberSession_memberUserId_idx" ON "MemberSession"("memberUserId");

CREATE INDEX "MemberSession_expiresAt_idx" ON "MemberSession"("expiresAt");

CREATE UNIQUE INDEX "MembershipSubscription_applicationId_key" ON "MembershipSubscription"("applicationId");

CREATE INDEX "MembershipSubscription_memberUserId_status_idx" ON "MembershipSubscription"("memberUserId", "status");

CREATE INDEX "MembershipSubscription_endsAt_idx" ON "MembershipSubscription"("endsAt");

CREATE INDEX "Application_memberUserId_idx" ON "Application"("memberUserId");

CREATE INDEX "CoursePurchase_memberUserId_idx" ON "CoursePurchase"("memberUserId");

ALTER TABLE "Application" ADD CONSTRAINT "Application_memberUserId_fkey" FOREIGN KEY ("memberUserId") REFERENCES "MemberUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CoursePurchase" ADD CONSTRAINT "CoursePurchase_memberUserId_fkey" FOREIGN KEY ("memberUserId") REFERENCES "MemberUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MemberSession" ADD CONSTRAINT "MemberSession_memberUserId_fkey" FOREIGN KEY ("memberUserId") REFERENCES "MemberUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MembershipSubscription" ADD CONSTRAINT "MembershipSubscription_memberUserId_fkey" FOREIGN KEY ("memberUserId") REFERENCES "MemberUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MembershipSubscription" ADD CONSTRAINT "MembershipSubscription_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
