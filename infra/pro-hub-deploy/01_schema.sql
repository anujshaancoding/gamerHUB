-- 008: Pro Hub — Indian pro players, teams, stats, and gear
--
-- Powers the new /pro section: India-focused pro player rankings, detailed
-- stats, and gear/setup info for Valorant, BGMI, and Free Fire. Schema is
-- multi-game from day one so adding BGMI/Free Fire in Phase 2 is a data-only
-- change.
--
-- Apply via:
--   sudo -u postgres psql -d gamerhub -f /path/to/008_pro_hub_indian_players.sql

-- ─── pro_teams ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pro_teams (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  short_name      TEXT,                       -- 'GE', 'VLT', 'S8UL' etc.
  game            TEXT NOT NULL CHECK (game IN ('valorant', 'bgmi', 'freefire')),
  logo_url        TEXT,
  region          TEXT NOT NULL DEFAULT 'India',
  founded_year    INTEGER,
  socials         JSONB NOT NULL DEFAULT '{}'::jsonb,   -- { twitter, instagram, youtube, ... }
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pro_teams_game ON pro_teams(game);
CREATE INDEX IF NOT EXISTS idx_pro_teams_slug ON pro_teams(slug);

-- ─── pro_players ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pro_players (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,                  -- 'jonathan-amaral'
  game            TEXT NOT NULL CHECK (game IN ('valorant', 'bgmi', 'freefire')),
  ign             TEXT NOT NULL,                          -- in-game name, e.g. 'Jonathan'
  real_name       TEXT,                                   -- 'Jonathan Amaral'
  team_id         UUID REFERENCES pro_teams(id) ON DELETE SET NULL,
  role            TEXT,                                   -- Duelist / IGL / Assaulter / Rusher / etc.
  country         TEXT NOT NULL DEFAULT 'IN',
  region          TEXT,                                   -- 'Mumbai', 'Delhi NCR', 'Bangalore'
  photo_url       TEXT,
  bio             TEXT,
  age             INTEGER,
  date_of_birth   DATE,
  total_earnings  NUMERIC(12, 2),                         -- USD or local currency, stored as decimal
  earnings_currency TEXT NOT NULL DEFAULT 'INR',
  peak_rank       TEXT,                                   -- 'Radiant', 'Conqueror', 'Grandmaster'
  current_rank    TEXT,
  national_rank   INTEGER,                                -- 1, 2, 3 ... (within game, within India)
  socials         JSONB NOT NULL DEFAULT '{}'::jsonb,     -- { twitter, instagram, youtube, twitch, discord }
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pro_players_game ON pro_players(game);
CREATE INDEX IF NOT EXISTS idx_pro_players_slug ON pro_players(slug);
CREATE INDEX IF NOT EXISTS idx_pro_players_team ON pro_players(team_id);
CREATE INDEX IF NOT EXISTS idx_pro_players_rank ON pro_players(game, national_rank) WHERE national_rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pro_players_active ON pro_players(game, is_active) WHERE is_active = TRUE;

-- ─── pro_player_stats ───────────────────────────────────────────────────────
-- Per-season stat snapshot. JSONB on game_stats keeps the schema flexible per game.
CREATE TABLE IF NOT EXISTS pro_player_stats (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       UUID NOT NULL REFERENCES pro_players(id) ON DELETE CASCADE,
  season          TEXT NOT NULL,                          -- '2026-S1', 'VCT-2026-Stage-1', 'BMPS-S3'
  is_current      BOOLEAN NOT NULL DEFAULT FALSE,         -- only one season per player should be current
  matches_played  INTEGER,
  wins            INTEGER,
  losses          INTEGER,
  -- Common headline stats (NULL where not applicable per game)
  k_d_ratio       NUMERIC(5, 2),
  adr             NUMERIC(6, 2),                          -- Avg Damage per Round (Valorant) or per Match (mobile)
  hs_pct          NUMERIC(5, 2),                          -- headshot %
  acs             NUMERIC(6, 2),                          -- Valorant
  -- game-specific blob: agents pool, weapon stats, modes, etc.
  game_stats      JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_url      TEXT,                                   -- where the data was pulled/verified from
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (player_id, season)
);

CREATE INDEX IF NOT EXISTS idx_pps_player ON pro_player_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_pps_current ON pro_player_stats(player_id) WHERE is_current = TRUE;

-- ─── pro_player_gear ────────────────────────────────────────────────────────
-- One row per player (latest setup). History lives in pro_player_gear_history if/when we need it.
CREATE TABLE IF NOT EXISTS pro_player_gear (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id         UUID NOT NULL UNIQUE REFERENCES pro_players(id) ON DELETE CASCADE,
  -- Device (one of: pc / mobile)
  platform          TEXT NOT NULL CHECK (platform IN ('pc', 'mobile')),
  device_model      TEXT,                                  -- 'iQOO 12', 'iPhone 15 Pro', 'Custom PC'
  -- PC-specific
  cpu               TEXT,
  gpu               TEXT,
  ram               TEXT,
  monitor           TEXT,                                  -- 'BenQ Zowie XL2546K 240Hz'
  monitor_hz        INTEGER,
  mouse             TEXT,
  keyboard          TEXT,
  headphones        TEXT,
  mousepad          TEXT,
  -- Mobile-specific
  grip_style        TEXT,                                  -- 'thumb', 'claw', '4-finger', '6-finger'
  controllers       TEXT,                                  -- 'GameSir F4 Falcon triggers'
  -- Sensitivities + in-game settings (game-shape)
  sensitivities     JSONB NOT NULL DEFAULT '{}'::jsonb,    -- general, ADS per scope, weapon-specific
  ingame_settings   JSONB NOT NULL DEFAULT '{}'::jsonb,    -- crosshair code, graphics, FPS cap, HUD layout
  layout_image_url  TEXT,                                  -- screenshot of button layout (mobile)
  notes             TEXT,                                  -- free-form admin notes ("uses 6-finger only on TDM")
  source_url        TEXT,                                  -- where setup was confirmed
  last_verified_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ppg_player ON pro_player_gear(player_id);

-- ─── Ownership / privileges ─────────────────────────────────────────────────
ALTER TABLE pro_teams         OWNER TO gamerhub_app;
ALTER TABLE pro_players       OWNER TO gamerhub_app;
ALTER TABLE pro_player_stats  OWNER TO gamerhub_app;
ALTER TABLE pro_player_gear   OWNER TO gamerhub_app;

GRANT ALL ON pro_teams        TO gamerhub_app;
GRANT ALL ON pro_players      TO gamerhub_app;
GRANT ALL ON pro_player_stats TO gamerhub_app;
GRANT ALL ON pro_player_gear  TO gamerhub_app;

-- ─── updated_at triggers ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION pro_hub_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pro_teams_updated_at ON pro_teams;
CREATE TRIGGER trg_pro_teams_updated_at
  BEFORE UPDATE ON pro_teams
  FOR EACH ROW EXECUTE FUNCTION pro_hub_set_updated_at();

DROP TRIGGER IF EXISTS trg_pro_players_updated_at ON pro_players;
CREATE TRIGGER trg_pro_players_updated_at
  BEFORE UPDATE ON pro_players
  FOR EACH ROW EXECUTE FUNCTION pro_hub_set_updated_at();

DROP TRIGGER IF EXISTS trg_pps_updated_at ON pro_player_stats;
CREATE TRIGGER trg_pps_updated_at
  BEFORE UPDATE ON pro_player_stats
  FOR EACH ROW EXECUTE FUNCTION pro_hub_set_updated_at();

DROP TRIGGER IF EXISTS trg_ppg_updated_at ON pro_player_gear;
CREATE TRIGGER trg_ppg_updated_at
  BEFORE UPDATE ON pro_player_gear
  FOR EACH ROW EXECUTE FUNCTION pro_hub_set_updated_at();
