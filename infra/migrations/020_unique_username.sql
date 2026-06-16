-- ============================================================================
-- ggLobby: enforce case-insensitive username uniqueness  (audit finding H6)
-- ============================================================================
-- profiles.username was neither UNIQUE nor reliably non-null, allowing username
-- squatting and duplicate accounts. This adds a unique index on lower(username)
-- for non-null usernames.
--
-- SAFE TO AUTO-APPLY: this migration is defensive. If duplicate (case-insensitive)
-- usernames already exist it does NOT fail the deploy — it logs a WARNING listing
-- the count and skips, so an operator can dedupe and re-run. It only enforces the
-- constraint once the data is clean.
-- ============================================================================

DO $$
DECLARE
  dup_groups int;
BEGIN
  SELECT count(*) INTO dup_groups FROM (
    SELECT lower(username)
    FROM public.profiles
    WHERE username IS NOT NULL AND username <> ''
    GROUP BY lower(username)
    HAVING count(*) > 1
  ) d;

  IF dup_groups > 0 THEN
    RAISE WARNING
      '[020] Skipping unique username index: % case-insensitive duplicate username group(s) exist. Dedupe profiles.username then re-run this migration.',
      dup_groups;
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_uniq
      ON public.profiles (lower(username))
      WHERE username IS NOT NULL;
    RAISE NOTICE '[020] Created unique index profiles_username_lower_uniq.';
  END IF;
END $$;
