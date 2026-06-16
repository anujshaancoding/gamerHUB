-- ============================================================================
-- ggLobby: integrity constraints for game_connections + user_credentials
--          (audit finding M8)   ***DEFERRED — verify against live schema first***
-- ============================================================================
-- This migration is in deploy.sh's MANUAL_MIGRATIONS list and is SKIPPED by a
-- routine deploy. Apply it only after verifying column names/types on the live
-- VPS, with:  APPLY_MANUAL=1 bash deploy.sh
--
-- WHY DEFERRED: infra/sql/00_local_baseline.sql is a non-authoritative local
-- reconstruction (FKs omitted), and the audit flagged a possible uuid/puuid type
-- mismatch on game_connections. A foreign key cannot be added across mismatched
-- types, so confirm with `\d game_connections` and `\d user_credentials` first.
--
-- Each block is defensive: orphan rows / duplicates / type mismatches downgrade
-- to a WARNING and skip that constraint rather than aborting the transaction.
-- Read the deploy output: a WARNING means the constraint was NOT applied.
-- ============================================================================

-- ─── user_credentials: one row per user, FK to users, user_id NOT NULL ──────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                 WHERE table_schema='public' AND table_name='user_credentials') THEN
    RAISE NOTICE '[021] user_credentials table absent — skipping.';
    RETURN;
  END IF;

  -- Orphans block the FK; report and bail on this table if any exist.
  IF EXISTS (SELECT 1 FROM public.user_credentials uc
             LEFT JOIN public.users u ON u.id = uc.user_id
             WHERE uc.user_id IS NULL OR u.id IS NULL) THEN
    RAISE WARNING '[021] user_credentials has NULL/orphan user_id rows — fix them, then re-run. Skipping its constraints.';
    RETURN;
  END IF;

  BEGIN
    ALTER TABLE public.user_credentials ALTER COLUMN user_id SET NOT NULL;
  EXCEPTION WHEN others THEN RAISE WARNING '[021] user_credentials.user_id SET NOT NULL skipped: %', SQLERRM;
  END;

  IF EXISTS (SELECT 1 FROM (SELECT user_id FROM public.user_credentials
                            GROUP BY user_id HAVING count(*) > 1) d) THEN
    RAISE WARNING '[021] Duplicate user_credentials.user_id rows exist — unique constraint skipped.';
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS user_credentials_user_uniq
      ON public.user_credentials (user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='user_credentials_user_fk') THEN
    BEGIN
      ALTER TABLE public.user_credentials
        ADD CONSTRAINT user_credentials_user_fk
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN RAISE WARNING '[021] user_credentials FK skipped (type mismatch?): %', SQLERRM;
    END;
  END IF;
END $$;

-- ─── game_connections: FK to users (watch for uuid/puuid type mismatch) ─────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                 WHERE table_schema='public' AND table_name='game_connections') THEN
    RAISE NOTICE '[021] game_connections table absent — skipping.';
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM public.game_connections gc
             LEFT JOIN public.users u ON u.id = gc.user_id
             WHERE gc.user_id IS NULL OR u.id IS NULL) THEN
    RAISE WARNING '[021] game_connections has NULL/orphan user_id rows — fix them, then re-run. Skipping FK.';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='game_connections_user_fk') THEN
    BEGIN
      ALTER TABLE public.game_connections
        ADD CONSTRAINT game_connections_user_fk
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN RAISE WARNING '[021] game_connections FK skipped (likely uuid/puuid type mismatch — see `\d game_connections`): %', SQLERRM;
    END;
  END IF;
END $$;
