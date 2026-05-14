-- 011: Tournament pick'em — users predict the winner of each match in a
-- bracket attached to a pro_event. Score = sum of correct picks (1 pt each)
-- plus a 3 pt bonus for the final-winner pick.

CREATE TABLE IF NOT EXISTS pickem_matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES pro_events(id) ON DELETE CASCADE,
  stage           TEXT NOT NULL,                          -- 'group','ro16','qf','sf','final', etc.
  match_label     TEXT NOT NULL,                          -- 'GE vs S8UL', 'SF1' etc.
  team_a          TEXT NOT NULL,
  team_b          TEXT NOT NULL,
  team_a_logo     TEXT,
  team_b_logo     TEXT,
  starts_at       TIMESTAMPTZ,
  is_final        BOOLEAN NOT NULL DEFAULT FALSE,
  winner          TEXT,                                   -- 'a' / 'b' once decided, NULL = pending
  locks_at        TIMESTAMPTZ,                            -- pick lock-in cut-off (default: starts_at)
  display_order   INTEGER NOT NULL DEFAULT 100,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pickem_match_event   ON pickem_matches(event_id, display_order);

CREATE TABLE IF NOT EXISTS pickem_predictions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id        UUID NOT NULL REFERENCES pickem_matches(id) ON DELETE CASCADE,
  pick            TEXT NOT NULL CHECK (pick IN ('a','b')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_pickem_pred_user     ON pickem_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_pickem_pred_match    ON pickem_predictions(match_id);

DROP TRIGGER IF EXISTS trg_pickem_match_upd ON pickem_matches;
CREATE TRIGGER trg_pickem_match_upd BEFORE UPDATE ON pickem_matches FOR EACH ROW EXECUTE FUNCTION forum_set_updated_at();

DROP TRIGGER IF EXISTS trg_pickem_pred_upd ON pickem_predictions;
CREATE TRIGGER trg_pickem_pred_upd BEFORE UPDATE ON pickem_predictions FOR EACH ROW EXECUTE FUNCTION forum_set_updated_at();

-- Leaderboard view: per-user per-event score = correct picks (1 pt) +
-- 3 pt bonus when correct on a match flagged is_final.
CREATE OR REPLACE VIEW pickem_leaderboard AS
SELECT
  m.event_id,
  p.user_id,
  COUNT(*) FILTER (WHERE p.pick = m.winner) AS correct_picks,
  SUM(CASE
        WHEN p.pick = m.winner AND m.is_final THEN 3
        WHEN p.pick = m.winner THEN 1
        ELSE 0
      END)::INTEGER AS points
FROM pickem_predictions p
JOIN pickem_matches m ON m.id = p.match_id
WHERE m.winner IS NOT NULL
GROUP BY m.event_id, p.user_id;

ALTER TABLE pickem_matches       OWNER TO gamerhub_app;
ALTER TABLE pickem_predictions   OWNER TO gamerhub_app;
ALTER VIEW  pickem_leaderboard   OWNER TO gamerhub_app;
GRANT ALL ON pickem_matches      TO gamerhub_app;
GRANT ALL ON pickem_predictions  TO gamerhub_app;
GRANT SELECT ON pickem_leaderboard TO gamerhub_app;
