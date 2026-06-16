-- ============================================================================
-- ggLobby: Re-enable Row-Level Security with role-based policies
-- ============================================================================
-- After the Supabase → self-hosted migration we disabled RLS everywhere
-- (scripts/fix-rls-after-migration.sql). That left the database wide open
-- to anything holding the app's connection string. This migration:
--
--   1. Creates 3 PostgreSQL roles: app_readonly, app_writer, app_admin.
--   2. Re-enables RLS on user-facing tables.
--   3. Adds policies that match how the API actually reads/writes data.
--   4. Sets the per-request user context via `SET LOCAL app.user_id` so
--      RLS predicates can use `current_setting('app.user_id', true)`.
--
-- The application code (DatabaseClient) is responsible for issuing
--   SELECT set_config('app.user_id', '<authenticated user id>', true);
-- at the start of every request that runs under a user identity. Admin
-- routes connect with `app_admin` so they bypass user-scoped policies.
--
-- ROLLBACK: re-run scripts/fix-rls-after-migration.sql.
-- ============================================================================

BEGIN;

-- ─── 1. Roles ───────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_readonly') THEN
    CREATE ROLE app_readonly NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_writer') THEN
    CREATE ROLE app_writer NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_admin') THEN
    CREATE ROLE app_admin NOLOGIN BYPASSRLS;
  END IF;
END $$;

-- Sane default grants. The actual login role (e.g. gglobby_app) should be
-- GRANTed into app_writer for normal traffic and app_admin for admin/cron.
GRANT USAGE ON SCHEMA public TO app_readonly, app_writer, app_admin;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_readonly, app_writer, app_admin;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_writer, app_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_writer, app_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO app_readonly, app_writer, app_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT INSERT, UPDATE, DELETE ON TABLES TO app_writer, app_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_writer, app_admin;

-- ─── 2. Per-request user context helper ────────────────────────────────────
-- Returns the UUID of the authenticated user for the current transaction.
-- The API sets this via `SELECT set_config('app.user_id', '<id>', true)`.
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid
$$;

GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO app_readonly, app_writer, app_admin;

-- Convenience: is the current request running as admin? Mirrors the
-- profiles.is_admin column so policies can short-circuit.
CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE((
    SELECT is_admin FROM profiles WHERE id = public.current_app_user_id()
  ), false)
$$;

GRANT EXECUTE ON FUNCTION public.is_app_admin() TO app_readonly, app_writer, app_admin;

-- ─── 3. Policies ───────────────────────────────────────────────────────────
-- We turn RLS on AND force it (FORCE ROW LEVEL SECURITY) so even the table
-- owner is subject to it; only roles flagged BYPASSRLS (app_admin) skip.

-- 3a. profiles — anyone can read, but a user can only modify their own row.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_read_all       ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own     ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_write    ON public.profiles;
CREATE POLICY profiles_read_all    ON public.profiles FOR SELECT USING (true);
CREATE POLICY profiles_update_own  ON public.profiles FOR UPDATE
  USING (id = public.current_app_user_id())
  WITH CHECK (id = public.current_app_user_id());
CREATE POLICY profiles_admin_write ON public.profiles FOR ALL TO app_admin USING (true) WITH CHECK (true);

-- 3b. messages — only conversation participants can read/write.
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS messages_member_read   ON public.messages;
DROP POLICY IF EXISTS messages_member_insert ON public.messages;
DROP POLICY IF EXISTS messages_owner_update  ON public.messages;
DROP POLICY IF EXISTS messages_owner_delete  ON public.messages;
CREATE POLICY messages_member_read ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id = public.current_app_user_id()
    )
  );
CREATE POLICY messages_member_insert ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = public.current_app_user_id()
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id = public.current_app_user_id()
    )
  );
CREATE POLICY messages_owner_update ON public.messages FOR UPDATE
  USING (sender_id = public.current_app_user_id())
  WITH CHECK (sender_id = public.current_app_user_id());
CREATE POLICY messages_owner_delete ON public.messages FOR DELETE
  USING (sender_id = public.current_app_user_id());

-- 3c. conversation_participants — a user can see participant rows for
-- conversations they belong to. Inserts/deletes are admin-only at the SQL
-- layer; the API enforces friend-checks before calling.
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cp_member_read  ON public.conversation_participants;
DROP POLICY IF EXISTS cp_admin_write  ON public.conversation_participants;
CREATE POLICY cp_member_read ON public.conversation_participants FOR SELECT
  USING (
    user_id = public.current_app_user_id()
    OR EXISTS (
      SELECT 1 FROM public.conversation_participants cp2
      WHERE cp2.conversation_id = conversation_participants.conversation_id
        AND cp2.user_id = public.current_app_user_id()
    )
  );
CREATE POLICY cp_admin_write ON public.conversation_participants FOR ALL TO app_admin USING (true) WITH CHECK (true);

-- 3d. notifications — strictly per-user.
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notifications_owner_read   ON public.notifications;
DROP POLICY IF EXISTS notifications_owner_update ON public.notifications;
DROP POLICY IF EXISTS notifications_owner_delete ON public.notifications;
DROP POLICY IF EXISTS notifications_admin_write  ON public.notifications;
CREATE POLICY notifications_owner_read   ON public.notifications FOR SELECT
  USING (user_id = public.current_app_user_id());
CREATE POLICY notifications_owner_update ON public.notifications FOR UPDATE
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());
CREATE POLICY notifications_owner_delete ON public.notifications FOR DELETE
  USING (user_id = public.current_app_user_id());
CREATE POLICY notifications_admin_write  ON public.notifications FOR ALL TO app_admin USING (true) WITH CHECK (true);

-- 3e. news_articles — public reads published, admins can do anything.
-- Replaces the broad allow_all policy called out in CLAUDE.md.
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_all                ON public.news_articles;
DROP POLICY IF EXISTS news_public_read         ON public.news_articles;
DROP POLICY IF EXISTS news_admin_write         ON public.news_articles;
CREATE POLICY news_public_read ON public.news_articles FOR SELECT
  USING (COALESCE(published, true) = true);
CREATE POLICY news_admin_write ON public.news_articles FOR ALL TO app_admin USING (true) WITH CHECK (true);

-- 3f. user_subscriptions / payment_transactions — owner-only reads,
-- writes go through admin (webhook handler connects as app_admin).
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS subs_owner_read  ON public.user_subscriptions;
DROP POLICY IF EXISTS subs_admin_write ON public.user_subscriptions;
CREATE POLICY subs_owner_read  ON public.user_subscriptions FOR SELECT
  USING (user_id = public.current_app_user_id());
CREATE POLICY subs_admin_write ON public.user_subscriptions FOR ALL TO app_admin USING (true) WITH CHECK (true);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payments_owner_read  ON public.payment_transactions;
DROP POLICY IF EXISTS payments_admin_write ON public.payment_transactions;
CREATE POLICY payments_owner_read  ON public.payment_transactions FOR SELECT
  USING (user_id = public.current_app_user_id());
CREATE POLICY payments_admin_write ON public.payment_transactions FOR ALL TO app_admin USING (true) WITH CHECK (true);

-- 3g. email_verification_tokens (created in migration 012) — strictly
-- service-internal; only app_admin can touch them.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_verification_tokens') THEN
    EXECUTE 'ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.email_verification_tokens FORCE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS email_verif_admin_only ON public.email_verification_tokens';
    EXECUTE 'CREATE POLICY email_verif_admin_only ON public.email_verification_tokens FOR ALL TO app_admin USING (true) WITH CHECK (true)';
  END IF;
END $$;

COMMIT;

-- ─── Verify ────────────────────────────────────────────────────────────────
-- SELECT tablename, rowsecurity, forcerowsecurity
-- FROM pg_tables WHERE schemaname='public' AND rowsecurity=true ORDER BY tablename;
-- SELECT schemaname, tablename, policyname, roles, cmd FROM pg_policies
-- WHERE schemaname='public' ORDER BY tablename, policyname;
