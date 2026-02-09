-- GamerHub Leaderboards & Seasons System
-- Migration: 004_leaderboards.sql

-- ============================================
-- TABLES
-- ============================================

-- 1. SEASONS - Track seasonal periods
CREATE TABLE public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  season_number INT NOT NULL,

  -- Timing
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),

  -- Configuration
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  point_config JSONB DEFAULT '{
    "match_win_casual": 10,
    "match_win_competitive": 25,
    "match_win_tournament": 50,
    "challenge_base": 20,
    "rating_bonus": 5,
    "daily_first_match": 5,
    "streak_bonus_per_day": 10,
    "max_streak_days": 7
  }',

  -- Display
  banner_url TEXT,
  theme_config JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_season_dates CHECK (ends_at > starts_at)
);

-- 2. SEASON_POINTS - Track user points per season per game
CREATE TABLE public.season_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,

  -- Points breakdown
  total_points INT DEFAULT 0,
  match_points INT DEFAULT 0,
  challenge_points INT DEFAULT 0,
  rating_points INT DEFAULT 0,
  bonus_points INT DEFAULT 0,

  -- Stats
  matches_played INT DEFAULT 0,
  matches_won INT DEFAULT 0,
  current_win_streak INT DEFAULT 0,
  best_win_streak INT DEFAULT 0,
  challenges_completed INT DEFAULT 0,
  ratings_received INT DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,

  -- Streak tracking
  login_streak_days INT DEFAULT 0,
  last_login_date DATE,
  last_match_date DATE,

  -- Region snapshot
  region VARCHAR(50),

  -- Rank tracking
  current_rank INT,
  peak_rank INT,
  previous_rank INT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(season_id, user_id, game_id)
);

-- 3. POINT_TRANSACTIONS - Audit log for all point changes
CREATE TABLE public.point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_points_id UUID REFERENCES public.season_points(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE NOT NULL,

  -- Transaction details
  points INT NOT NULL,
  transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN (
    'match_win', 'match_loss', 'challenge_complete', 'rating_bonus',
    'daily_bonus', 'streak_bonus', 'admin_adjustment', 'decay', 'refund'
  )),

  -- Source reference
  source_type VARCHAR(30) CHECK (source_type IN ('match', 'challenge', 'rating', 'system', 'admin')),
  source_id UUID,

  description TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COMMUNITY_CHALLENGES - Weekly/monthly challenges
CREATE TABLE public.community_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  title VARCHAR(100) NOT NULL,
  description TEXT,
  rules TEXT,

  -- Categorization
  challenge_type VARCHAR(30) NOT NULL CHECK (challenge_type IN (
    'match_count', 'win_count', 'win_streak', 'rating_average',
    'game_specific', 'clan_participation', 'social', 'composite'
  )),
  difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'legendary')),

  -- Scoping
  season_id UUID REFERENCES public.seasons(id) ON DELETE SET NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,

  -- Timing
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'seasonal', 'event')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),

  -- Objectives (flexible JSONB structure)
  objectives JSONB NOT NULL DEFAULT '[]',

  -- Rewards
  points_reward INT DEFAULT 0,
  bonus_rewards JSONB DEFAULT '[]',

  -- Limits
  max_participants INT,

  -- Display
  icon_url TEXT,
  banner_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_challenge_dates CHECK (ends_at > starts_at)
);

-- 5. CHALLENGE_PROGRESS - Track user progress on challenges
CREATE TABLE public.challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES public.community_challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Progress tracking
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'expired')),

  -- Objective progress
  progress JSONB NOT NULL DEFAULT '[]',

  -- Completion
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  points_awarded INT DEFAULT 0,

  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(challenge_id, user_id)
);

-- 6. SEASON_REWARDS - Define rewards available per season
CREATE TABLE public.season_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE NOT NULL,

  -- Reward info
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Type and value
  reward_type VARCHAR(30) NOT NULL CHECK (reward_type IN (
    'badge', 'title', 'avatar_frame', 'banner', 'currency', 'exclusive_item', 'early_access'
  )),
  reward_value JSONB NOT NULL,

  -- Eligibility
  rank_requirement INT,
  points_requirement INT,
  percentile_requirement DECIMAL(5,2),

  -- Limits
  max_recipients INT,
  current_recipients INT DEFAULT 0,

  -- Settings
  auto_grant BOOLEAN DEFAULT true,
  claim_deadline TIMESTAMPTZ,

  -- Display
  icon_url TEXT,
  rarity VARCHAR(20) CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. USER_REWARDS - Track rewards earned by users
CREATE TABLE public.user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  season_reward_id UUID REFERENCES public.season_rewards(id) ON DELETE SET NULL,

  -- Reward snapshot
  reward_name VARCHAR(100) NOT NULL,
  reward_type VARCHAR(30) NOT NULL,
  reward_value JSONB NOT NULL,

  -- Context
  season_id UUID REFERENCES public.seasons(id) ON DELETE SET NULL,
  earned_rank INT,
  earned_points INT,

  -- Claim status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired', 'revoked')),
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Equipped state
  is_equipped BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, season_reward_id)
);

-- 8. LEADERBOARD_SNAPSHOTS - Historical leaderboard data
CREATE TABLE public.leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  region VARCHAR(50),

  -- Snapshot timing
  snapshot_type VARCHAR(20) NOT NULL CHECK (snapshot_type IN ('hourly', 'daily', 'weekly', 'final')),
  snapshot_date TIMESTAMPTZ NOT NULL,

  -- Rankings data
  rankings JSONB NOT NULL,

  -- Aggregate stats
  total_participants INT DEFAULT 0,
  average_points DECIMAL(10,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VIEWS
-- ============================================

-- Real-time global leaderboard view
CREATE OR REPLACE VIEW public.leaderboard_global AS
SELECT
  sp.id,
  sp.season_id,
  sp.user_id,
  sp.game_id,
  sp.total_points,
  sp.matches_played,
  sp.matches_won,
  sp.challenges_completed,
  sp.average_rating,
  sp.current_rank,
  sp.peak_rank,
  sp.region,
  p.username,
  p.display_name,
  p.avatar_url,
  g.name as game_name,
  g.slug as game_slug,
  s.name as season_name,
  s.status as season_status,
  RANK() OVER (
    PARTITION BY sp.season_id, sp.game_id
    ORDER BY sp.total_points DESC, sp.matches_won DESC, sp.average_rating DESC
  ) as computed_rank
FROM season_points sp
JOIN profiles p ON sp.user_id = p.id
JOIN seasons s ON sp.season_id = s.id
LEFT JOIN games g ON sp.game_id = g.id
WHERE s.status IN ('active', 'completed');

-- Regional leaderboard view
CREATE OR REPLACE VIEW public.leaderboard_regional AS
SELECT
  sp.*,
  p.username,
  p.display_name,
  p.avatar_url,
  g.name as game_name,
  RANK() OVER (
    PARTITION BY sp.season_id, sp.game_id, sp.region
    ORDER BY sp.total_points DESC
  ) as regional_rank
FROM season_points sp
JOIN profiles p ON sp.user_id = p.id
JOIN seasons s ON sp.season_id = s.id
LEFT JOIN games g ON sp.game_id = g.id
WHERE s.status IN ('active', 'completed')
  AND sp.region IS NOT NULL;

-- Active challenges view
CREATE OR REPLACE VIEW public.active_challenges AS
SELECT
  cc.*,
  g.name as game_name,
  g.slug as game_slug,
  s.name as season_name,
  (SELECT COUNT(*) FROM challenge_progress cp WHERE cp.challenge_id = cc.id) as participant_count,
  (SELECT COUNT(*) FROM challenge_progress cp WHERE cp.challenge_id = cc.id AND cp.status = 'completed') as completion_count
FROM community_challenges cc
LEFT JOIN games g ON cc.game_id = g.id
LEFT JOIN seasons s ON cc.season_id = s.id
WHERE cc.status = 'active'
  AND cc.starts_at <= NOW()
  AND cc.ends_at > NOW();

-- ============================================
-- INDEXES
-- ============================================

-- Seasons indexes
CREATE INDEX idx_seasons_status ON seasons(status);
CREATE INDEX idx_seasons_game ON seasons(game_id);
CREATE INDEX idx_seasons_dates ON seasons(starts_at, ends_at);
CREATE INDEX idx_seasons_slug ON seasons(slug);
CREATE INDEX idx_seasons_active ON seasons(status) WHERE status = 'active';

-- Season points indexes (critical for leaderboard performance)
CREATE INDEX idx_season_points_season ON season_points(season_id);
CREATE INDEX idx_season_points_user ON season_points(user_id);
CREATE INDEX idx_season_points_game ON season_points(game_id);
CREATE INDEX idx_season_points_region ON season_points(region);
CREATE INDEX idx_season_points_ranking ON season_points(season_id, game_id, total_points DESC);
CREATE INDEX idx_season_points_regional_ranking ON season_points(season_id, game_id, region, total_points DESC);

-- Point transactions indexes
CREATE INDEX idx_point_transactions_season_points ON point_transactions(season_points_id);
CREATE INDEX idx_point_transactions_user ON point_transactions(user_id);
CREATE INDEX idx_point_transactions_season ON point_transactions(season_id);
CREATE INDEX idx_point_transactions_created ON point_transactions(created_at DESC);
CREATE INDEX idx_point_transactions_type ON point_transactions(transaction_type);

-- Community challenges indexes
CREATE INDEX idx_community_challenges_season ON community_challenges(season_id);
CREATE INDEX idx_community_challenges_game ON community_challenges(game_id);
CREATE INDEX idx_community_challenges_status ON community_challenges(status);
CREATE INDEX idx_community_challenges_dates ON community_challenges(starts_at, ends_at);
CREATE INDEX idx_community_challenges_period ON community_challenges(period_type);
CREATE INDEX idx_community_challenges_active ON community_challenges(status) WHERE status = 'active';

-- Challenge progress indexes
CREATE INDEX idx_challenge_progress_challenge ON challenge_progress(challenge_id);
CREATE INDEX idx_challenge_progress_user ON challenge_progress(user_id);
CREATE INDEX idx_challenge_progress_status ON challenge_progress(status);
CREATE INDEX idx_challenge_progress_user_active ON challenge_progress(user_id, status) WHERE status = 'in_progress';

-- Season rewards indexes
CREATE INDEX idx_season_rewards_season ON season_rewards(season_id);
CREATE INDEX idx_season_rewards_type ON season_rewards(reward_type);

-- User rewards indexes
CREATE INDEX idx_user_rewards_user ON user_rewards(user_id);
CREATE INDEX idx_user_rewards_season ON user_rewards(season_id);
CREATE INDEX idx_user_rewards_status ON user_rewards(status);
CREATE INDEX idx_user_rewards_equipped ON user_rewards(user_id, is_equipped) WHERE is_equipped = true;

-- Leaderboard snapshots indexes
CREATE INDEX idx_leaderboard_snapshots_season ON leaderboard_snapshots(season_id);
CREATE INDEX idx_leaderboard_snapshots_date ON leaderboard_snapshots(snapshot_date DESC);
CREATE INDEX idx_leaderboard_snapshots_type ON leaderboard_snapshots(snapshot_type);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

-- SEASONS POLICIES
CREATE POLICY "Seasons are viewable by everyone"
  ON seasons FOR SELECT
  USING (true);

-- SEASON_POINTS POLICIES
CREATE POLICY "Season points are viewable by everyone"
  ON season_points FOR SELECT
  USING (true);

CREATE POLICY "System can insert season points"
  ON season_points FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System can update season points"
  ON season_points FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- POINT_TRANSACTIONS POLICIES
CREATE POLICY "Users can view their own transactions"
  ON point_transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert transactions"
  ON point_transactions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- COMMUNITY_CHALLENGES POLICIES
CREATE POLICY "Challenges are viewable by everyone"
  ON community_challenges FOR SELECT
  USING (true);

-- CHALLENGE_PROGRESS POLICIES
CREATE POLICY "Users can view their own progress"
  ON challenge_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Completed progress is public for leaderboards"
  ON challenge_progress FOR SELECT
  USING (status = 'completed');

CREATE POLICY "Users can start challenges"
  ON challenge_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own progress"
  ON challenge_progress FOR UPDATE
  USING (user_id = auth.uid());

-- SEASON_REWARDS POLICIES
CREATE POLICY "Season rewards are viewable by everyone"
  ON season_rewards FOR SELECT
  USING (true);

-- USER_REWARDS POLICIES
CREATE POLICY "Users can view their own rewards"
  ON user_rewards FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Equipped rewards are publicly visible"
  ON user_rewards FOR SELECT
  USING (is_equipped = true);

CREATE POLICY "Users can update their rewards"
  ON user_rewards FOR UPDATE
  USING (user_id = auth.uid());

-- LEADERBOARD_SNAPSHOTS POLICIES
CREATE POLICY "Leaderboard snapshots are viewable by everyone"
  ON leaderboard_snapshots FOR SELECT
  USING (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_seasons_updated_at
  BEFORE UPDATE ON seasons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_season_points_updated_at
  BEFORE UPDATE ON season_points
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_challenges_updated_at
  BEFORE UPDATE ON community_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenge_progress_updated_at
  BEFORE UPDATE ON challenge_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to initialize season points for a user
CREATE OR REPLACE FUNCTION initialize_season_points(
  p_user_id UUID,
  p_season_id UUID,
  p_game_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_season_points_id UUID;
  v_user_region VARCHAR(50);
BEGIN
  -- Get user's region
  SELECT region INTO v_user_region FROM profiles WHERE id = p_user_id;

  -- Create season_points entry if not exists
  INSERT INTO season_points (season_id, user_id, game_id, region)
  VALUES (p_season_id, p_user_id, p_game_id, v_user_region)
  ON CONFLICT (season_id, user_id, game_id) DO NOTHING
  RETURNING id INTO v_season_points_id;

  -- If already exists, get the ID
  IF v_season_points_id IS NULL THEN
    SELECT id INTO v_season_points_id
    FROM season_points
    WHERE season_id = p_season_id AND user_id = p_user_id AND game_id IS NOT DISTINCT FROM p_game_id;
  END IF;

  RETURN v_season_points_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award points
CREATE OR REPLACE FUNCTION award_points(
  p_user_id UUID,
  p_season_id UUID,
  p_game_id UUID,
  p_points INT,
  p_transaction_type VARCHAR(30),
  p_source_type VARCHAR(30),
  p_source_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_season_points_id UUID;
  v_point_category VARCHAR(20);
BEGIN
  -- Initialize season points if needed
  v_season_points_id := initialize_season_points(p_user_id, p_season_id, p_game_id);

  -- Determine point category
  v_point_category := CASE
    WHEN p_transaction_type IN ('match_win', 'match_loss') THEN 'match'
    WHEN p_transaction_type = 'challenge_complete' THEN 'challenge'
    WHEN p_transaction_type = 'rating_bonus' THEN 'rating'
    ELSE 'bonus'
  END;

  -- Insert transaction
  INSERT INTO point_transactions (
    season_points_id, user_id, season_id, points,
    transaction_type, source_type, source_id, description
  ) VALUES (
    v_season_points_id, p_user_id, p_season_id, p_points,
    p_transaction_type, p_source_type, p_source_id, p_description
  );

  -- Update season_points totals
  UPDATE season_points
  SET
    total_points = total_points + p_points,
    match_points = match_points + CASE WHEN v_point_category = 'match' THEN p_points ELSE 0 END,
    challenge_points = challenge_points + CASE WHEN v_point_category = 'challenge' THEN p_points ELSE 0 END,
    rating_points = rating_points + CASE WHEN v_point_category = 'rating' THEN p_points ELSE 0 END,
    bonus_points = bonus_points + CASE WHEN v_point_category = 'bonus' THEN p_points ELSE 0 END,
    matches_won = matches_won + CASE WHEN p_transaction_type = 'match_win' THEN 1 ELSE 0 END,
    matches_played = matches_played + CASE WHEN p_transaction_type IN ('match_win', 'match_loss') THEN 1 ELSE 0 END,
    challenges_completed = challenges_completed + CASE WHEN p_transaction_type = 'challenge_complete' THEN 1 ELSE 0 END
  WHERE id = v_season_points_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update challenge progress
CREATE OR REPLACE FUNCTION update_challenge_progress(
  p_user_id UUID,
  p_challenge_id UUID,
  p_objective_index INT,
  p_increment INT DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_progress RECORD;
  v_challenge RECORD;
  v_current_progress JSONB;
  v_objective JSONB;
  v_new_current INT;
  v_target INT;
  v_all_complete BOOLEAN;
  i INT;
BEGIN
  -- Get challenge and progress
  SELECT * INTO v_challenge FROM community_challenges WHERE id = p_challenge_id;
  SELECT * INTO v_progress FROM challenge_progress WHERE challenge_id = p_challenge_id AND user_id = p_user_id;

  IF v_challenge IS NULL OR v_challenge.status != 'active' THEN
    RETURN FALSE;
  END IF;

  -- Initialize progress if not exists
  IF v_progress IS NULL THEN
    v_current_progress := '[]'::JSONB;
    FOR i IN 0..jsonb_array_length(v_challenge.objectives) - 1 LOOP
      v_objective := v_challenge.objectives->i;
      v_current_progress := v_current_progress || jsonb_build_object(
        'objective_index', i,
        'current', 0,
        'target', (v_objective->>'target')::INT,
        'completed', false
      );
    END LOOP;

    INSERT INTO challenge_progress (challenge_id, user_id, progress)
    VALUES (p_challenge_id, p_user_id, v_current_progress);

    SELECT * INTO v_progress FROM challenge_progress WHERE challenge_id = p_challenge_id AND user_id = p_user_id;
  END IF;

  -- Update specific objective progress
  v_current_progress := v_progress.progress;
  v_objective := v_current_progress->p_objective_index;
  v_new_current := LEAST((v_objective->>'current')::INT + p_increment, (v_objective->>'target')::INT);
  v_target := (v_objective->>'target')::INT;

  v_current_progress := jsonb_set(
    v_current_progress,
    ARRAY[p_objective_index::TEXT],
    jsonb_build_object(
      'objective_index', p_objective_index,
      'current', v_new_current,
      'target', v_target,
      'completed', v_new_current >= v_target
    )
  );

  -- Check if all objectives complete
  v_all_complete := TRUE;
  FOR i IN 0..jsonb_array_length(v_current_progress) - 1 LOOP
    IF NOT (v_current_progress->i->>'completed')::BOOLEAN THEN
      v_all_complete := FALSE;
      EXIT;
    END IF;
  END LOOP;

  -- Update progress
  UPDATE challenge_progress
  SET
    progress = v_current_progress,
    status = CASE WHEN v_all_complete THEN 'completed' ELSE status END,
    completed_at = CASE WHEN v_all_complete THEN NOW() ELSE completed_at END,
    points_awarded = CASE WHEN v_all_complete THEN v_challenge.points_reward ELSE 0 END
  WHERE id = v_progress.id;

  -- Award points if completed
  IF v_all_complete AND v_challenge.points_reward > 0 THEN
    PERFORM award_points(
      p_user_id,
      v_challenge.season_id,
      v_challenge.game_id,
      v_challenge.points_reward,
      'challenge_complete',
      'challenge',
      p_challenge_id,
      'Completed challenge: ' || v_challenge.title
    );
  END IF;

  RETURN v_all_complete;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh leaderboard rankings
CREATE OR REPLACE FUNCTION refresh_leaderboard_rankings(p_season_id UUID)
RETURNS VOID AS $$
BEGIN
  WITH ranked AS (
    SELECT
      id,
      RANK() OVER (
        PARTITION BY game_id
        ORDER BY total_points DESC, matches_won DESC, average_rating DESC
      ) as new_rank
    FROM season_points
    WHERE season_id = p_season_id
  )
  UPDATE season_points sp
  SET
    previous_rank = current_rank,
    current_rank = r.new_rank,
    peak_rank = LEAST(COALESCE(peak_rank, r.new_rank), r.new_rank)
  FROM ranked r
  WHERE sp.id = r.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to grant season rewards
CREATE OR REPLACE FUNCTION grant_season_rewards(p_season_id UUID)
RETURNS INT AS $$
DECLARE
  v_reward RECORD;
  v_user RECORD;
  v_granted_count INT := 0;
  v_total_participants INT;
BEGIN
  -- Get total participants
  SELECT COUNT(*) INTO v_total_participants FROM season_points WHERE season_id = p_season_id;

  -- Process each reward definition
  FOR v_reward IN
    SELECT * FROM season_rewards
    WHERE season_id = p_season_id AND auto_grant = true
  LOOP
    -- Find eligible users
    FOR v_user IN
      SELECT sp.user_id, sp.current_rank, sp.total_points
      FROM season_points sp
      WHERE sp.season_id = p_season_id
        AND (v_reward.rank_requirement IS NULL OR sp.current_rank <= v_reward.rank_requirement)
        AND (v_reward.points_requirement IS NULL OR sp.total_points >= v_reward.points_requirement)
        AND (v_reward.percentile_requirement IS NULL OR
             (sp.current_rank::DECIMAL / NULLIF(v_total_participants, 0) * 100) <= v_reward.percentile_requirement)
        AND (v_reward.max_recipients IS NULL OR v_reward.current_recipients < v_reward.max_recipients)
        AND NOT EXISTS (
          SELECT 1 FROM user_rewards ur
          WHERE ur.user_id = sp.user_id AND ur.season_reward_id = v_reward.id
        )
      ORDER BY sp.current_rank
      LIMIT COALESCE(v_reward.max_recipients - v_reward.current_recipients, 1000000)
    LOOP
      -- Grant reward
      INSERT INTO user_rewards (
        user_id, season_reward_id, reward_name, reward_type, reward_value,
        season_id, earned_rank, earned_points, status
      ) VALUES (
        v_user.user_id, v_reward.id, v_reward.name, v_reward.reward_type, v_reward.reward_value,
        p_season_id, v_user.current_rank, v_user.total_points,
        CASE WHEN v_reward.auto_grant THEN 'claimed' ELSE 'pending' END
      );

      v_granted_count := v_granted_count + 1;

      UPDATE season_rewards
      SET current_recipients = current_recipients + 1
      WHERE id = v_reward.id;
    END LOOP;
  END LOOP;

  RETURN v_granted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE season_points;
ALTER PUBLICATION supabase_realtime ADD TABLE challenge_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE user_rewards;

-- ============================================
-- SEED DATA
-- ============================================

-- Create first season
INSERT INTO seasons (name, slug, description, season_number, starts_at, ends_at, status) VALUES
('Season 1: Origins', 'season-1-origins', 'The inaugural GamerHub competitive season. Prove your worth and climb the ranks!', 1,
 NOW(), NOW() + INTERVAL '3 months', 'active');

-- Create sample weekly challenge
INSERT INTO community_challenges (
  title, description, challenge_type, difficulty, season_id,
  period_type, starts_at, ends_at, status, objectives, points_reward
)
SELECT
  'Weekly Warrior',
  'Win 10 matches this week in any game mode',
  'win_count',
  'medium',
  s.id,
  'weekly',
  NOW(),
  NOW() + INTERVAL '7 days',
  'active',
  '[{"type": "win_count", "target": 10}]'::JSONB,
  100
FROM seasons s WHERE s.slug = 'season-1-origins';

-- Create sample monthly challenge
INSERT INTO community_challenges (
  title, description, challenge_type, difficulty, season_id,
  period_type, starts_at, ends_at, status, objectives, points_reward
)
SELECT
  'Community Champion',
  'Rate 5 players after matches and maintain a 4.0+ average rating',
  'composite',
  'hard',
  s.id,
  'monthly',
  NOW(),
  NOW() + INTERVAL '30 days',
  'active',
  '[{"type": "social", "action": "rate_players", "target": 5}, {"type": "rating_average", "target": 4.0, "min_ratings": 3}]'::JSONB,
  150
FROM seasons s WHERE s.slug = 'season-1-origins';

-- Create legendary challenge
INSERT INTO community_challenges (
  title, description, challenge_type, difficulty, season_id,
  period_type, starts_at, ends_at, status, objectives, points_reward
)
SELECT
  'Winning Streak',
  'Achieve a 5-game winning streak in competitive matches',
  'win_streak',
  'legendary',
  s.id,
  'seasonal',
  NOW(),
  NOW() + INTERVAL '3 months',
  'active',
  '[{"type": "win_streak", "target": 5, "match_type": "competitive"}]'::JSONB,
  500
FROM seasons s WHERE s.slug = 'season-1-origins';

-- Create season rewards
INSERT INTO season_rewards (season_id, name, description, reward_type, reward_value, rank_requirement, rarity, icon_url)
SELECT
  s.id,
  'Season 1 Champion',
  'Awarded to the #1 ranked player of Season 1',
  'title',
  '{"title_text": "Season 1 Champion", "color": "#FFD700"}'::JSONB,
  1,
  'legendary',
  '/images/rewards/champion-crown.png'
FROM seasons s WHERE s.slug = 'season-1-origins';

INSERT INTO season_rewards (season_id, name, description, reward_type, reward_value, percentile_requirement, rarity, icon_url)
SELECT
  s.id,
  'Top 10% Badge',
  'Finished in the top 10% of Season 1',
  'badge',
  '{"badge_url": "/images/badges/season1-top10.png", "badge_id": "s1-top10"}'::JSONB,
  10.00,
  'epic',
  '/images/rewards/top10-badge.png'
FROM seasons s WHERE s.slug = 'season-1-origins';

INSERT INTO season_rewards (season_id, name, description, reward_type, reward_value, points_requirement, rarity, icon_url)
SELECT
  s.id,
  'Season 1 Participant',
  'Participated in Season 1 with at least 100 points',
  'badge',
  '{"badge_url": "/images/badges/season1-participant.png", "badge_id": "s1-participant"}'::JSONB,
  100,
  'common',
  '/images/rewards/participant-badge.png'
FROM seasons s WHERE s.slug = 'season-1-origins';
