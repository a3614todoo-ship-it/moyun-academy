-- 管理員 Email 一次性驗證碼只保存伺服器秘密 HMAC 雜湊。
CREATE TABLE "AdminEmailOtp" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminEmailOtp_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AdminEmailOtp_attempts_check" CHECK ("attempts" >= 0 AND "attempts" <= 5)
);

CREATE INDEX "AdminEmailOtp_adminUserId_consumedAt_createdAt_idx"
ON "AdminEmailOtp"("adminUserId", "consumedAt", "createdAt");
CREATE INDEX "AdminEmailOtp_expiresAt_idx" ON "AdminEmailOtp"("expiresAt");

ALTER TABLE "AdminEmailOtp"
ADD CONSTRAINT "AdminEmailOtp_adminUserId_fkey"
FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdminEmailOtp" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE "AdminEmailOtp" FROM anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "AdminEmailOtp" TO academy_app;

CREATE POLICY academy_app_backend_access
ON "AdminEmailOtp"
FOR ALL
TO academy_app
USING (true)
WITH CHECK (true);

