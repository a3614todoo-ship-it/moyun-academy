-- 實體活動、候補、電子票券、現場報到與多管理員角色。
CREATE TYPE "AdminRole" AS ENUM ('OWNER', 'ADMIN', 'CHECKIN_STAFF');
CREATE TYPE "EventPricingMode" AS ENUM ('FREE', 'PAID', 'MEMBER_FREE_PUBLIC_PAID');
CREATE TYPE "EventAudience" AS ENUM ('PUBLIC', 'MEMBERS_ONLY', 'MEMBER_PRIORITY');
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED');
CREATE TYPE "EventRegistrationStatus" AS ENUM ('PENDING_PAYMENT', 'PAYMENT_REPORTED', 'CONFIRMED', 'WAITLISTED', 'WAITLIST_OFFERED', 'REJECTED', 'CANCELLED');
CREATE TYPE "EventCheckInMethod" AS ENUM ('QR', 'MANUAL');

ALTER TYPE "EmailType" ADD VALUE IF NOT EXISTS 'EVENT_REGISTRATION_CREATED';
ALTER TYPE "EmailType" ADD VALUE IF NOT EXISTS 'EVENT_PAYMENT_REPORTED_USER';
ALTER TYPE "EmailType" ADD VALUE IF NOT EXISTS 'EVENT_PAYMENT_REPORTED_ADMIN';
ALTER TYPE "EmailType" ADD VALUE IF NOT EXISTS 'EVENT_REGISTRATION_CONFIRMED';
ALTER TYPE "EmailType" ADD VALUE IF NOT EXISTS 'EVENT_WAITLISTED';
ALTER TYPE "EmailType" ADD VALUE IF NOT EXISTS 'EVENT_WAITLIST_OFFERED';
ALTER TYPE "EmailType" ADD VALUE IF NOT EXISTS 'EVENT_UPDATED';
ALTER TYPE "EmailType" ADD VALUE IF NOT EXISTS 'EVENT_CANCELLED';
ALTER TYPE "EmailType" ADD VALUE IF NOT EXISTS 'EVENT_REMINDER';
ALTER TYPE "EmailType" ADD VALUE IF NOT EXISTS 'ADMIN_INVITATION';

ALTER TABLE "AdminUser" ADD COLUMN "role" "AdminRole" NOT NULL DEFAULT 'ADMIN';
UPDATE "AdminUser" SET "role" = 'OWNER'
WHERE "id" = (SELECT "id" FROM "AdminUser" ORDER BY "createdAt" ASC LIMIT 1);

CREATE TABLE "AdminInvitation" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" "AdminRole" NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "invitedById" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminInvitation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InPersonEvent" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "category" TEXT NOT NULL,
  "excerpt" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "coverImageUrl" TEXT,
  "venueName" TEXT NOT NULL,
  "venueAddress" TEXT NOT NULL,
  "mapUrl" TEXT,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "registrationOpenAt" TIMESTAMP(3) NOT NULL,
  "publicRegistrationOpenAt" TIMESTAMP(3),
  "registrationCloseAt" TIMESTAMP(3) NOT NULL,
  "capacity" INTEGER NOT NULL,
  "waitlistEnabled" BOOLEAN NOT NULL DEFAULT true,
  "waitlistPaymentHours" INTEGER NOT NULL DEFAULT 48,
  "pricingMode" "EventPricingMode" NOT NULL,
  "publicPrice" INTEGER NOT NULL DEFAULT 0,
  "memberPrice" INTEGER NOT NULL DEFAULT 0,
  "audience" "EventAudience" NOT NULL DEFAULT 'PUBLIC',
  "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "publishedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InPersonEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InPersonEvent_capacity_check" CHECK ("capacity" > 0),
  CONSTRAINT "InPersonEvent_waitlist_hours_check" CHECK ("waitlistPaymentHours" BETWEEN 1 AND 720),
  CONSTRAINT "InPersonEvent_prices_check" CHECK ("publicPrice" >= 0 AND "memberPrice" >= 0),
  CONSTRAINT "InPersonEvent_time_check" CHECK ("startsAt" < "endsAt"),
  CONSTRAINT "InPersonEvent_registration_time_check" CHECK ("registrationOpenAt" <= "registrationCloseAt")
);

CREATE TABLE "EventRegistration" (
  "id" TEXT NOT NULL,
  "registrationNo" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "memberUserId" TEXT,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "status" "EventRegistrationStatus" NOT NULL,
  "amount" INTEGER NOT NULL DEFAULT 0,
  "isMemberPrice" BOOLEAN NOT NULL DEFAULT false,
  "waitlistSequence" INTEGER,
  "offeredAt" TIMESTAMP(3),
  "offerExpiresAt" TIMESTAMP(3),
  "bankLast5" TEXT,
  "payerName" TEXT,
  "paidAt" TIMESTAMP(3),
  "paymentReportedAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "reviewedById" TEXT,
  "ticketTokenHash" TEXT,
  "agreedToPrivacyAt" TIMESTAMP(3) NOT NULL,
  "note" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EventRegistration_amount_check" CHECK ("amount" >= 0)
);

CREATE TABLE "EventStaffAssignment" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "adminUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventStaffAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventCheckIn" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "registrationId" TEXT NOT NULL,
  "method" "EventCheckInMethod" NOT NULL,
  "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "checkedInById" TEXT NOT NULL,
  "reversedAt" TIMESTAMP(3),
  "reversedById" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventCheckIn_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "EmailLog" ADD COLUMN "eventRegistrationId" TEXT;

CREATE UNIQUE INDEX "AdminInvitation_tokenHash_key" ON "AdminInvitation"("tokenHash");
CREATE INDEX "AdminInvitation_email_acceptedAt_idx" ON "AdminInvitation"("email", "acceptedAt");
CREATE INDEX "AdminInvitation_expiresAt_idx" ON "AdminInvitation"("expiresAt");
CREATE UNIQUE INDEX "InPersonEvent_slug_key" ON "InPersonEvent"("slug");
CREATE INDEX "InPersonEvent_status_startsAt_idx" ON "InPersonEvent"("status", "startsAt");
CREATE INDEX "InPersonEvent_registrationOpenAt_publicRegistrationOpenAt_registrationCloseAt_idx" ON "InPersonEvent"("registrationOpenAt", "publicRegistrationOpenAt", "registrationCloseAt");
CREATE INDEX "InPersonEvent_isFeatured_sortOrder_idx" ON "InPersonEvent"("isFeatured", "sortOrder");
CREATE UNIQUE INDEX "EventRegistration_registrationNo_key" ON "EventRegistration"("registrationNo");
CREATE UNIQUE INDEX "EventRegistration_ticketTokenHash_key" ON "EventRegistration"("ticketTokenHash");
CREATE INDEX "EventRegistration_eventId_status_createdAt_idx" ON "EventRegistration"("eventId", "status", "createdAt");
CREATE INDEX "EventRegistration_eventId_waitlistSequence_idx" ON "EventRegistration"("eventId", "waitlistSequence");
CREATE INDEX "EventRegistration_email_idx" ON "EventRegistration"("email");
CREATE INDEX "EventRegistration_phone_idx" ON "EventRegistration"("phone");
CREATE INDEX "EventRegistration_memberUserId_idx" ON "EventRegistration"("memberUserId");
CREATE INDEX "EventRegistration_offerExpiresAt_status_idx" ON "EventRegistration"("offerExpiresAt", "status");
CREATE UNIQUE INDEX "EventRegistration_eventId_active_email_key"
  ON "EventRegistration"("eventId", lower("email"))
  WHERE "status" NOT IN ('CANCELLED', 'REJECTED');
CREATE UNIQUE INDEX "EventStaffAssignment_eventId_adminUserId_key" ON "EventStaffAssignment"("eventId", "adminUserId");
CREATE INDEX "EventStaffAssignment_adminUserId_idx" ON "EventStaffAssignment"("adminUserId");
CREATE UNIQUE INDEX "EventCheckIn_registrationId_key" ON "EventCheckIn"("registrationId");
CREATE INDEX "EventCheckIn_eventId_reversedAt_checkedInAt_idx" ON "EventCheckIn"("eventId", "reversedAt", "checkedInAt");
CREATE INDEX "EventCheckIn_checkedInById_idx" ON "EventCheckIn"("checkedInById");
CREATE INDEX "EmailLog_eventRegistrationId_createdAt_idx" ON "EmailLog"("eventRegistrationId", "createdAt");

ALTER TABLE "AdminInvitation" ADD CONSTRAINT "AdminInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "InPersonEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_memberUserId_fkey" FOREIGN KEY ("memberUserId") REFERENCES "MemberUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EventStaffAssignment" ADD CONSTRAINT "EventStaffAssignment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "InPersonEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventStaffAssignment" ADD CONSTRAINT "EventStaffAssignment_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventCheckIn" ADD CONSTRAINT "EventCheckIn_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "InPersonEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventCheckIn" ADD CONSTRAINT "EventCheckIn_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventCheckIn" ADD CONSTRAINT "EventCheckIn_checkedInById_fkey" FOREIGN KEY ("checkedInById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EventCheckIn" ADD CONSTRAINT "EventCheckIn_reversedById_fkey" FOREIGN KEY ("reversedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_eventRegistrationId_fkey" FOREIGN KEY ("eventRegistrationId") REFERENCES "EventRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 所有新資料只允許網站後端角色操作，Data API 前端角色完全不開放。
DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['AdminInvitation', 'InPersonEvent', 'EventRegistration', 'EventStaffAssignment', 'EventCheckIn']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO academy_app', table_name);
    EXECUTE format('CREATE POLICY academy_app_backend_access ON public.%I FOR ALL TO academy_app USING (true) WITH CHECK (true)', table_name);
  END LOOP;
END $$;
