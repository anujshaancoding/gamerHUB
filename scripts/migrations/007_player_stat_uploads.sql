-- 007: Player stat uploads (BGMI / Free Fire screenshot + manual-entry tracker)
--
-- Lets logged-in users upload a screenshot of their in-game stats (BGMI/FF have
-- no public APIs in India), enter the visible numbers, and get the same
-- strength/weakness analysis as Valorant/CS2.
--
-- Apply via:
--   sudo -u postgres psql -d gamerhub -f /path/to/007_player_stat_uploads.sql

CREATE TABLE IF NOT EXISTS player_stat_uploads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game          TEXT NOT NULL CHECK (game IN ('bgmi', 'freefire', 'cs2', 'valorant')),
  screenshot_url TEXT,
  raw_stats     JSONB NOT NULL,        -- user-entered fields (varies by game)
  insights      JSONB NOT NULL,        -- analyzer output, snapshotted
  visibility    TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'friends', 'public')),
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_psu_user_id ON player_stat_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_psu_game_user ON player_stat_uploads(game, user_id);
CREATE INDEX IF NOT EXISTS idx_psu_uploaded_at ON player_stat_uploads(uploaded_at DESC);

-- Ownership for the app role
ALTER TABLE player_stat_uploads OWNER TO gamerhub_app;
GRANT ALL ON player_stat_uploads TO gamerhub_app;

-- updated_at trigger
CREATE OR REPLACE FUNCTION psu_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_psu_updated_at ON player_stat_uploads;
CREATE TRIGGER trg_psu_updated_at
  BEFORE UPDATE ON player_stat_uploads
  FOR EACH ROW EXECUTE FUNCTION psu_set_updated_at();
