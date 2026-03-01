-- ============================================================================
-- GamerHub: Disable Supabase RLS after migration to self-hosted PostgreSQL
-- ============================================================================
-- After migrating from Supabase, the RLS policies reference auth.uid() which
-- no longer exists. Since auth is now handled at the application level
-- (Auth.js + API route checks), we disable RLS on all tables.
--
-- Run this on the production database as a superuser or table owner:
--   psql -U postgres -d gamerhub -f fix-rls-after-migration.sql
-- ============================================================================

-- Drop the auth schema functions if they still exist (cleanup)
DROP FUNCTION IF EXISTS auth.uid() CASCADE;
DROP FUNCTION IF EXISTS auth.role() CASCADE;
DROP FUNCTION IF EXISTS auth.email() CASCADE;

-- ─── Disable RLS on ALL tables ──────────────────────────────────────────────
-- This is safe because authorization is enforced at the application layer
-- (API routes check getUser() / session before allowing operations).

DO $$
DECLARE
  tbl RECORD;
  policy_rec RECORD;
BEGIN
  -- Loop through all tables in the public schema that have RLS enabled
  FOR tbl IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    -- Drop all RLS policies on this table
    FOR policy_rec IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl.tablename
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_rec.policyname, tbl.tablename);
      RAISE NOTICE 'Dropped policy: % on %', policy_rec.policyname, tbl.tablename;
    END LOOP;

    -- Disable RLS on the table
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', tbl.tablename);
    RAISE NOTICE 'Disabled RLS on: %', tbl.tablename;
  END LOOP;
END $$;

-- ─── Grant table ownership to app user (if needed) ─────────────────────────
-- Uncomment if your app connects as gamerhub_app and tables are owned by
-- a different role (e.g., postgres or supabase_admin):
--
-- DO $$
-- DECLARE
--   tbl RECORD;
-- BEGIN
--   FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
--     EXECUTE format('ALTER TABLE public.%I OWNER TO gamerhub_app', tbl.tablename);
--   END LOOP;
-- END $$;

-- ─── Verify ─────────────────────────────────────────────────────────────────
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
