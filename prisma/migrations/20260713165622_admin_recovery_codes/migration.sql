-- 管理員一次性救援碼只保存不可逆的 HMAC 雜湊。
CREATE TABLE "AdminRecoveryCode" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminRecoveryCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminRecoveryCode_codeHash_key" ON "AdminRecoveryCode"("codeHash");
CREATE INDEX "AdminRecoveryCode_adminUserId_usedAt_idx" ON "AdminRecoveryCode"("adminUserId", "usedAt");

ALTER TABLE "AdminRecoveryCode"
ADD CONSTRAINT "AdminRecoveryCode_adminUserId_fkey"
FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- public 結構中的敏感驗證資料不對 Data API 角色開放。
ALTER TABLE "AdminRecoveryCode" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE "AdminRecoveryCode" FROM anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "AdminRecoveryCode" TO academy_app;

CREATE POLICY academy_app_backend_access
ON "AdminRecoveryCode"
FOR ALL
TO academy_app
USING (true)
WITH CHECK (true);

