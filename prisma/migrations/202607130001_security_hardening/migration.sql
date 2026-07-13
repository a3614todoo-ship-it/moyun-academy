-- 舊版明文存取權杖已停止使用，欄位暫時保留以便安全切換。
ALTER TABLE "CoursePurchase" ALTER COLUMN "accessToken" DROP NOT NULL;

-- 建立跨執行個體共用的固定時間窗限流資料表。
CREATE TABLE "SecurityRateLimitBucket" (
    "id" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SecurityRateLimitBucket_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SecurityRateLimitBucket_expiresAt_idx" ON "SecurityRateLimitBucket"("expiresAt");

-- 建立管理員敏感操作稽核紀錄。
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" JSONB,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminAuditLog_adminUserId_createdAt_idx" ON "AdminAuditLog"("adminUserId", "createdAt");
CREATE INDEX "AdminAuditLog_action_createdAt_idx" ON "AdminAuditLog"("action", "createdAt");
CREATE INDEX "AdminAuditLog_targetType_targetId_idx" ON "AdminAuditLog"("targetType", "targetId");
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- public 是 Supabase 預設公開結構；新資料表仍啟用 RLS 作為縱深防禦。
ALTER TABLE "SecurityRateLimitBucket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminAuditLog" ENABLE ROW LEVEL SECURITY;

-- 本網站只透過 Prisma 後端存取資料庫，不開放 Data API 角色直接操作應用程式資料表。
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- 防止日後由 postgres 建立的新物件再次自動授權給 Data API 角色。
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;

-- 建立不含登入密碼的網站權限群組；實際登入帳號於部署環境個別建立。
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'academy_app') THEN
        CREATE ROLE academy_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
    END IF;
END
$$;

GRANT CONNECT ON DATABASE postgres TO academy_app;
GRANT USAGE ON SCHEMA public TO academy_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO academy_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO academy_app;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO academy_app;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO academy_app;

-- 應用程式本身負責會員與管理員授權；此 Policy 只允許網站專用資料庫角色存取。
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename <> '_prisma_migrations'
    LOOP
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', table_record.schemaname, table_record.tablename);

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = table_record.schemaname
              AND tablename = table_record.tablename
              AND policyname = 'academy_app_backend_access'
        ) THEN
            EXECUTE format(
                'CREATE POLICY academy_app_backend_access ON %I.%I FOR ALL TO academy_app USING (true) WITH CHECK (true)',
                table_record.schemaname,
                table_record.tablename
            );
        END IF;
    END LOOP;
END
$$;
