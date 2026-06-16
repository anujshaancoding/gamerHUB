-- 05: Pro Hub — tournament calendar table
--
-- Powers /pro/events: lists upcoming and recent Indian esports tournaments
-- across Valorant, BGMI and Free Fire.

CREATE TABLE IF NOT EXISTS pro_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,
  game          TEXT NOT NULL CHECK (game IN ('valorant', 'bgmi', 'freefire')),
  name          TEXT NOT NULL,                          -- 'BMPS 2026 Season 2'
  short_name    TEXT,                                   -- 'BMPS S2'
  region        TEXT NOT NULL DEFAULT 'India',
  status        TEXT NOT NULL DEFAULT 'upcoming'
                  CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
  starts_at     TIMESTAMPTZ NOT NULL,
  ends_at       TIMESTAMPTZ,
  venue         TEXT,                                   -- 'KDJW Stadium, Mumbai' or 'Online'
  prize_pool    NUMERIC(12, 2),
  prize_currency TEXT NOT NULL DEFAULT 'INR',
  description   TEXT,
  banner_url    TEXT,
  official_url  TEXT,                                   -- link to bracket/registration
  stream_url    TEXT,                                   -- main broadcast URL
  is_featured   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pro_events_game ON pro_events(game);
CREATE INDEX IF NOT EXISTS idx_pro_events_status ON pro_events(status);
CREATE INDEX IF NOT EXISTS idx_pro_events_starts ON pro_events(starts_at);

ALTER TABLE pro_events OWNER TO gamerhub_app;
GRANT ALL ON pro_events TO gamerhub_app;

-- Reuse the updated_at trigger function from 01_schema.sql.
DROP TRIGGER IF EXISTS trg_pro_events_updated_at ON pro_events;
CREATE TRIGGER trg_pro_events_updated_at
  BEFORE UPDATE ON pro_events
  FOR EACH ROW EXECUTE FUNCTION pro_hub_set_updated_at();
