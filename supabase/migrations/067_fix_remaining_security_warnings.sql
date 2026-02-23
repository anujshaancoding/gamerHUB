-- Migration 067: Fix remaining Supabase Security Advisor warnings
--
-- Fixes:
--   1. CRITICAL: active_challenges view SECURITY DEFINER → SECURITY INVOKER
--   2. CRITICAL: trust_badges view SECURITY DEFINER → SECURITY INVOKER
--   3. WARNING: account_trust RLS auth.uid() re-evaluation (resolved by broadening policy)
--   4. WARNING: achievements RLS auth.uid() → (select auth.uid())
--
-- Approach for views:
--   Setting security_invoker = true makes the view respect the CALLER's RLS.
--   This requires broadening SELECT policies on underlying tables so the view
--   still returns correct results for all callers.


-- ============================================================
-- 1. Fix active_challenges view (SECURITY DEFINER → INVOKER)
-- ============================================================

-- The view's COUNT(*) subqueries need to read all challenge_progress rows.
-- Existing RLS only allows own rows + completed rows, which would make
-- participant_count inaccurate. Add a public SELECT policy so counts work.
-- Challenge participation data (who joined which challenge) is not sensitive.

CREATE POLICY "Challenge progress is publicly viewable"
  ON challenge_progress FOR SELECT
  USING (true);

ALTER VIEW public.active_challenges SET (security_invoker = true);


-- ============================================================
-- 2. Fix trust_badges view (SECURITY DEFINER → INVOKER)
-- ============================================================

-- trust_badges reads account_trust for all users to derive boolean badge flags.
-- The old SELECT policy restricted reads to own row only.
-- Replace it with a public SELECT policy so the view works with security_invoker.
-- Trust scores are algorithmic metrics derived from public activity, not PII.

DROP POLICY IF EXISTS "Users can view only their own trust" ON account_trust;

CREATE POLICY "Trust scores are viewable"
  ON account_trust FOR SELECT
  USING (true);

ALTER VIEW public.trust_badges SET (security_invoker = true);


-- ============================================================
-- 3. Fix achievements RLS policies (auth.uid() → subquery)
-- ============================================================

-- Wrapping auth.uid() in (select auth.uid()) causes PostgreSQL to evaluate
-- it once per query instead of once per row, improving performance at scale.

DROP POLICY IF EXISTS "Public achievements are viewable" ON achievements;

CREATE POLICY "Public achievements are viewable"
  ON achievements FOR SELECT
  USING (is_public = true OR user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can manage their own achievements" ON achievements;

CREATE POLICY "Users can manage their own achievements"
  ON achievements FOR ALL
  USING (user_id = (select auth.uid()));
