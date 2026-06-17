-- 022_lineups_loyalty_tables.sql
-- Move the `lineups` and `loyalty` stores off the local upload-volume JSON files
-- and into Postgres.
--
-- WHY: both features previously persisted to JSON on disk (uploads/data/*.json).
-- That works on the always-on VPS but SILENTLY LOSES EVERY WRITE on serverless
-- (Netlify functions have an ephemeral filesystem). This migration is the first
-- step of the serverless migration: give them real tables so writes survive.
--
-- Backfill of the existing JSON files is a one-off, run AFTER this migration:
--   node infra/backfill-022-lineups-loyalty.mjs --apply
--
-- Idempotent: safe to re-run.

-- ─── valorant_lineups: admin-managed lineup content ──────────────────────────
-- Mirrors the `Lineup` type in src/lib/data/lineup-types.ts. Column names are
-- snake_case in the DB; the API route maps them to/from the camelCase type.
CREATE TABLE IF NOT EXISTS valorant_lineups (
  id           TEXT PRIMARY KEY,                 -- nanoid(10), matches old store ids
  map          TEXT NOT NULL,
  agent        TEXT NOT NULL,
  ability      TEXT NOT NULL,
  side         TEXT NOT NULL,                    -- 'Attack' | 'Defense'
  site         TEXT NOT NULL,                    -- 'A' | 'B' | 'C' | 'Mid'
  from_callout TEXT NOT NULL DEFAULT '',
  to_callout   TEXT NOT NULL DEFAULT '',
  title        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  difficulty   SMALLINT NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  video_url    TEXT,                             -- uploaded clip (R2/uploads URL)
  youtube_id   TEXT,                             -- alternative to an uploaded clip
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Public GET filters by map/agent/side and orders newest-first.
CREATE INDEX IF NOT EXISTS idx_valorant_lineups_map_agent ON valorant_lineups(map, agent);
CREATE INDEX IF NOT EXISTS idx_valorant_lineups_created   ON valorant_lineups(created_at DESC);

-- ─── loyalty_records: one row per user (points + referral) ───────────────────
-- Mirrors `LoyaltyRecord` (src/lib/features/loyalty/constants.ts) minus events,
-- which live in their own table below.
CREATE TABLE IF NOT EXISTS loyalty_records (
  user_id       TEXT PRIMARY KEY,
  name          TEXT NOT NULL DEFAULT '',
  image         TEXT,
  points        INTEGER NOT NULL DEFAULT 0,
  referral_code TEXT NOT NULL,
  referred_by   TEXT,                            -- user_id of the referrer (nullable)
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leaderboard (ORDER BY points DESC) and referral-code lookups.
CREATE INDEX IF NOT EXISTS idx_loyalty_records_points   ON loyalty_records(points DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_records_referral ON loyalty_records(referral_code);

-- ─── loyalty_events: append-only point grants, idempotent by key ─────────────
-- The UNIQUE (user_id, key) constraint IS the idempotency guarantee that the old
-- code did in memory (signup once, daily_login once/day, refer once/referee,
-- share_rank_card once). Awards become `INSERT ... ON CONFLICT DO NOTHING`.
CREATE TABLE IF NOT EXISTS loyalty_events (
  id      BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES loyalty_records(user_id) ON DELETE CASCADE,
  action  TEXT NOT NULL,                         -- LoyaltyAction
  points  INTEGER NOT NULL,
  at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  key     TEXT NOT NULL,                         -- idempotency key
  UNIQUE (user_id, key)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_events_user ON loyalty_events(user_id, at);
