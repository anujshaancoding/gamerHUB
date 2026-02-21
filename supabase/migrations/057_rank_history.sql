-- Rank history tracking for timeline visualization
-- Records rank changes over time for each game

CREATE TABLE IF NOT EXISTS rank_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  rank text NOT NULL,
  achieved_at timestamptz NOT NULL DEFAULT now(),
  season text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, game_id, rank)
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_rank_history_user_id ON rank_history(user_id);
CREATE INDEX IF NOT EXISTS idx_rank_history_user_game ON rank_history(user_id, game_id, achieved_at);

-- RLS policies
ALTER TABLE rank_history ENABLE ROW LEVEL SECURITY;

-- Anyone can read rank history
CREATE POLICY "rank_history_select" ON rank_history
  FOR SELECT USING (true);

-- Users can only insert their own rank history
CREATE POLICY "rank_history_insert" ON rank_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own rank history
CREATE POLICY "rank_history_update" ON rank_history
  FOR UPDATE USING (auth.uid() = user_id);
