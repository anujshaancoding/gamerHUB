-- 019_pro_vlr_stats.sql
-- Pro Scene rebuild: enrich the pro tables so we can store vlr.gg-grade player
-- stats (Rating, KAST, KPR, APR, FKPR, FDPR, clutch%) and drive World / India
-- rankings + a head-to-head compare from real data.
--
-- Data is ingested nightly from a self-hosted vlrggapi instance into our own
-- Postgres (see infra/ingest/vlr-ingest.mjs). Rows sourced from the scraper are
-- marked data_source = 'vlr'; hand-curated rows stay 'manual' and are never
-- clobbered by the ingest.
--
-- Idempotent: safe to re-run.

-- ─── pro_player_stats: add the vlr.gg leaderboard columns ────────────────────
-- (k_d_ratio, adr, hs_pct, acs already exist from 01_schema.sql)
ALTER TABLE pro_player_stats
  ADD COLUMN IF NOT EXISTS rating          NUMERIC(5, 2),   -- VLR Rating composite (1.00 ≈ avg)
  ADD COLUMN IF NOT EXISTS kast_pct        NUMERIC(5, 2),   -- % rounds with Kill/Assist/Survive/Trade
  ADD COLUMN IF NOT EXISTS kpr             NUMERIC(5, 2),   -- kills per round
  ADD COLUMN IF NOT EXISTS apr             NUMERIC(5, 2),   -- assists per round
  ADD COLUMN IF NOT EXISTS fkpr            NUMERIC(5, 2),   -- first kills per round
  ADD COLUMN IF NOT EXISTS fdpr            NUMERIC(5, 2),   -- first deaths per round
  ADD COLUMN IF NOT EXISTS clutch_pct      NUMERIC(5, 2),   -- clutch success %
  ADD COLUMN IF NOT EXISTS clutch_attempts INTEGER,
  ADD COLUMN IF NOT EXISTS rounds_played   INTEGER;

-- Rank by rating within the current stat window.
CREATE INDEX IF NOT EXISTS idx_pps_rating
  ON pro_player_stats(rating DESC) WHERE is_current = TRUE;

-- ─── pro_players: external linkage + cached ranks + provenance ───────────────
ALTER TABLE pro_players
  ADD COLUMN IF NOT EXISTS vlr_id         TEXT,            -- vlr.gg player id (when known)
  ADD COLUMN IF NOT EXISTS vlr_url        TEXT,
  ADD COLUMN IF NOT EXISTS world_rank     INTEGER,         -- cached global rank by rating
  ADD COLUMN IF NOT EXISTS main_agents    TEXT[],          -- most-played agents (vlr "agents")
  ADD COLUMN IF NOT EXISTS data_source    TEXT NOT NULL DEFAULT 'manual',  -- 'manual' | 'vlr'
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- One vlr player ↔ one row (NULLs allowed/duplicated-free via partial unique).
CREATE UNIQUE INDEX IF NOT EXISTS uq_pro_players_vlr_id
  ON pro_players(vlr_id) WHERE vlr_id IS NOT NULL;

-- World ranking (global, top 20) and India ranking (country filter) lookups.
CREATE INDEX IF NOT EXISTS idx_pro_players_world_rank
  ON pro_players(world_rank) WHERE world_rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pro_players_country
  ON pro_players(country);

-- ─── pro_ingest_runs: observability for the nightly job ──────────────────────
CREATE TABLE IF NOT EXISTS pro_ingest_runs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source           TEXT NOT NULL DEFAULT 'vlrggapi',
  scope            TEXT,                                   -- 'world' | 'india' | 'all'
  timespan         TEXT,                                   -- 'all' | '90' (days)
  players_upserted INTEGER NOT NULL DEFAULT 0,
  stats_upserted   INTEGER NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'running',        -- 'running' | 'ok' | 'error'
  error            TEXT,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pro_ingest_runs_started ON pro_ingest_runs(started_at DESC);
