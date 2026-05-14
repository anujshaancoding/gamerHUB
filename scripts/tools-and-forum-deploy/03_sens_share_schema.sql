-- 010: Community sensitivity-share — users publish their full BGMI/FF/PC sens
-- code with grip style, device, and notes. Other users can copy + upvote.

CREATE TABLE IF NOT EXISTS sens_shares (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game            TEXT NOT NULL CHECK (game IN ('valorant','cs2','bgmi','freefire','codm','apex')),
  platform        TEXT NOT NULL CHECK (platform IN ('pc','mobile')),
  title           TEXT NOT NULL,
  -- For mobile: scope-by-scope dial-in (Red Dot, 2x, 3x, 4x, 6x, 8x, Gyro).
  -- For PC:     general sens, optional ADS multiplier, DPI.
  sensitivities   JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Optional layout/HUD/in-game settings blob.
  ingame_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  device_model    TEXT,
  grip_style      TEXT,                                   -- thumb / claw / 4-finger / 6-finger
  rank            TEXT,                                   -- self-reported rank for credibility
  notes           TEXT,
  copy_count      INTEGER NOT NULL DEFAULT 0,
  vote_score      INTEGER NOT NULL DEFAULT 0,
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sens_shares_game     ON sens_shares(game) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_sens_shares_top      ON sens_shares(vote_score DESC) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_sens_shares_recent   ON sens_shares(created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_sens_shares_author   ON sens_shares(author_id);

CREATE TABLE IF NOT EXISTS sens_share_votes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  share_id        UUID NOT NULL REFERENCES sens_shares(id) ON DELETE CASCADE,
  vote_type       SMALLINT NOT NULL CHECK (vote_type IN (1,-1)),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, share_id)
);

DROP TRIGGER IF EXISTS trg_sens_shares_upd ON sens_shares;
CREATE TRIGGER trg_sens_shares_upd BEFORE UPDATE ON sens_shares FOR EACH ROW EXECUTE FUNCTION forum_set_updated_at();

CREATE OR REPLACE FUNCTION toggle_sens_share_vote(
  p_user_id   UUID,
  p_share_id  UUID,
  p_vote_type SMALLINT
) RETURNS TABLE (score INTEGER) AS $$
DECLARE
  v_existing  SMALLINT;
  v_delta     INTEGER := 0;
  v_new_score INTEGER;
BEGIN
  SELECT vote_type INTO v_existing FROM sens_share_votes WHERE user_id = p_user_id AND share_id = p_share_id;

  IF v_existing IS NULL THEN
    INSERT INTO sens_share_votes (user_id, share_id, vote_type) VALUES (p_user_id, p_share_id, p_vote_type);
    v_delta := p_vote_type;
  ELSIF v_existing = p_vote_type THEN
    DELETE FROM sens_share_votes WHERE user_id = p_user_id AND share_id = p_share_id;
    v_delta := -p_vote_type;
  ELSE
    UPDATE sens_share_votes SET vote_type = p_vote_type WHERE user_id = p_user_id AND share_id = p_share_id;
    v_delta := p_vote_type * 2;
  END IF;

  UPDATE sens_shares SET vote_score = vote_score + v_delta WHERE id = p_share_id RETURNING vote_score INTO v_new_score;
  RETURN QUERY SELECT v_new_score;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE sens_shares       OWNER TO gamerhub_app;
ALTER TABLE sens_share_votes  OWNER TO gamerhub_app;
GRANT ALL ON sens_shares       TO gamerhub_app;
GRANT ALL ON sens_share_votes  TO gamerhub_app;
ALTER FUNCTION toggle_sens_share_vote(UUID, UUID, SMALLINT) OWNER TO gamerhub_app;
