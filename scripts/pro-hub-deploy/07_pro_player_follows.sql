-- 07: Pro Hub — pro player follow system
--
-- Lets logged-in users follow specific Indian pros so they can see their
-- activity on the dashboard.

CREATE TABLE IF NOT EXISTS pro_player_follows (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player_id   UUID NOT NULL REFERENCES pro_players(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_ppf_user    ON pro_player_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_ppf_player  ON pro_player_follows(player_id);
CREATE INDEX IF NOT EXISTS idx_ppf_created ON pro_player_follows(created_at DESC);

ALTER TABLE pro_player_follows OWNER TO gamerhub_app;
GRANT ALL ON pro_player_follows TO gamerhub_app;
