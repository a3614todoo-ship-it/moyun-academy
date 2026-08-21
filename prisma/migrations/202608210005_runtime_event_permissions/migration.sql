-- Supabase transaction pooler 以 academy_runtime 登入；此角色雖屬 academy_app，
-- 但 academy_app 設為 NOINHERIT，因此新表需直接授權給實際登入角色。
DO $$
DECLARE table_name TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'academy_runtime') THEN
    FOREACH table_name IN ARRAY ARRAY['AdminInvitation', 'InPersonEvent', 'EventRegistration', 'EventStaffAssignment', 'EventCheckIn']
    LOOP
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO academy_runtime', table_name);

      IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = table_name
          AND policyname = 'academy_runtime_backend_access'
      ) THEN
        EXECUTE format(
          'CREATE POLICY academy_runtime_backend_access ON public.%I FOR ALL TO academy_runtime USING (true) WITH CHECK (true)',
          table_name
        );
      END IF;
    END LOOP;

    GRANT USAGE ON TYPE "AdminRole", "EventPricingMode", "EventAudience", "EventStatus", "EventRegistrationStatus", "EventCheckInMethod" TO academy_runtime;
  END IF;
END $$;
