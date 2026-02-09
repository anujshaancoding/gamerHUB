-- AI-Powered Matchmaking Migration
-- Uses OpenAI for intelligent teammate/opponent suggestions

-- Player skill profiles per game
CREATE TABLE player_skill_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL, -- valorant, lol, cs2, dota2, etc.

  -- Skill ratings (TrueSkill/Elo-style)
  skill_rating DECIMAL(10, 2) DEFAULT 1500,
  skill_uncertainty DECIMAL(10, 2) DEFAULT 350, -- Lower = more confident
  games_played INTEGER DEFAULT 0,

  -- Play style attributes (0-100 scale)
  aggression_score INTEGER DEFAULT 50,
  teamwork_score INTEGER DEFAULT 50,
  communication_score INTEGER DEFAULT 50,
  consistency_score INTEGER DEFAULT 50,
  adaptability_score INTEGER DEFAULT 50,

  -- Preferences
  preferred_roles TEXT[] DEFAULT '{}',
  preferred_agents TEXT[] DEFAULT '{}', -- Characters/champions
  playtime_preferences JSONB DEFAULT '{}', -- {weekdays: [], weekends: [], timezone: ''}
  language_preferences TEXT[] DEFAULT ARRAY['en'],

  -- Performance data
  avg_kda DECIMAL(5, 2),
  win_rate DECIMAL(5, 2),
  recent_form INTEGER DEFAULT 50, -- 0-100, based on last 10 games

  -- AI-generated insights (cached)
  ai_playstyle_summary TEXT,
  ai_strengths TEXT[],
  ai_weaknesses TEXT[],
  ai_embedding VECTOR(1536), -- OpenAI embedding for similarity search

  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint and indexes
CREATE UNIQUE INDEX idx_player_skill_profiles_user_game ON player_skill_profiles(user_id, game_id);
CREATE INDEX idx_player_skill_profiles_rating ON player_skill_profiles(game_id, skill_rating DESC);
CREATE INDEX idx_player_skill_profiles_embedding ON player_skill_profiles USING ivfflat (ai_embedding vector_cosine_ops);

-- Match suggestions (AI-generated)
CREATE TABLE match_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  suggestion_type TEXT NOT NULL, -- 'teammate', 'opponent', 'team_balance'

  -- Suggested player(s)
  suggested_user_ids UUID[] NOT NULL,

  -- AI reasoning
  compatibility_score DECIMAL(5, 2), -- 0-100
  ai_reasoning TEXT,
  match_factors JSONB DEFAULT '{}', -- Detailed breakdown

  -- Status
  status TEXT DEFAULT 'pending', -- pending, accepted, declined, expired
  user_feedback TEXT, -- positive, negative, neutral
  feedback_comment TEXT,

  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for suggestions
CREATE INDEX idx_match_suggestions_user ON match_suggestions(user_id, game_id, status);
CREATE INDEX idx_match_suggestions_expiry ON match_suggestions(expires_at) WHERE status = 'pending';

-- Match outcomes (for improving AI)
CREATE TABLE match_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id UUID REFERENCES match_suggestions(id) ON DELETE SET NULL,
  game_id TEXT NOT NULL,

  -- Participants
  player_ids UUID[] NOT NULL,
  team_a_ids UUID[],
  team_b_ids UUID[],

  -- Results
  winner TEXT, -- 'team_a', 'team_b', 'draw'
  team_a_score INTEGER,
  team_b_score INTEGER,

  -- Performance metrics
  player_stats JSONB DEFAULT '{}', -- {user_id: {kda, damage, etc}}

  -- Quality rating
  match_quality_score DECIMAL(5, 2), -- How balanced was the match
  was_enjoyable BOOLEAN,

  played_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for outcomes
CREATE INDEX idx_match_outcomes_players ON match_outcomes USING GIN(player_ids);
CREATE INDEX idx_match_outcomes_suggestion ON match_outcomes(suggestion_id);

-- Team composition requests
CREATE TABLE team_balance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,

  -- Players to balance
  player_ids UUID[] NOT NULL,

  -- AI-generated balanced teams
  team_a_ids UUID[],
  team_b_ids UUID[],
  balance_score DECIMAL(5, 2), -- How balanced
  ai_reasoning TEXT,

  -- Alternative compositions
  alternatives JSONB DEFAULT '[]', -- Array of {team_a, team_b, score, reasoning}

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for team balance
CREATE INDEX idx_team_balance_requests_requester ON team_balance_requests(requester_id, created_at DESC);

-- Enable RLS
ALTER TABLE player_skill_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_balance_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all skill profiles"
  ON player_skill_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own skill profiles"
  ON player_skill_profiles FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their suggestions"
  ON match_suggestions FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = ANY(suggested_user_ids));

CREATE POLICY "Users can manage their suggestions"
  ON match_suggestions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view outcomes they participated in"
  ON match_outcomes FOR SELECT
  USING (auth.uid() = ANY(player_ids));

CREATE POLICY "Users can insert outcomes"
  ON match_outcomes FOR INSERT
  WITH CHECK (auth.uid() = ANY(player_ids));

CREATE POLICY "Users can view their balance requests"
  ON team_balance_requests FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = ANY(player_ids));

CREATE POLICY "Users can create balance requests"
  ON team_balance_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Function to get or create skill profile
CREATE OR REPLACE FUNCTION get_or_create_skill_profile(
  p_user_id UUID,
  p_game_id TEXT
) RETURNS UUID AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  SELECT id INTO v_profile_id
  FROM player_skill_profiles
  WHERE user_id = p_user_id AND game_id = p_game_id;

  IF v_profile_id IS NULL THEN
    INSERT INTO player_skill_profiles (user_id, game_id)
    VALUES (p_user_id, p_game_id)
    RETURNING id INTO v_profile_id;
  END IF;

  RETURN v_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update skill rating after a match (simplified TrueSkill)
CREATE OR REPLACE FUNCTION update_skill_rating(
  p_user_id UUID,
  p_game_id TEXT,
  p_won BOOLEAN,
  p_opponent_rating DECIMAL DEFAULT 1500
) RETURNS VOID AS $$
DECLARE
  v_current_rating DECIMAL;
  v_uncertainty DECIMAL;
  v_k_factor DECIMAL;
  v_expected DECIMAL;
  v_rating_change DECIMAL;
BEGIN
  -- Get current rating
  SELECT skill_rating, skill_uncertainty
  INTO v_current_rating, v_uncertainty
  FROM player_skill_profiles
  WHERE user_id = p_user_id AND game_id = p_game_id;

  IF v_current_rating IS NULL THEN
    PERFORM get_or_create_skill_profile(p_user_id, p_game_id);
    v_current_rating := 1500;
    v_uncertainty := 350;
  END IF;

  -- K-factor based on uncertainty
  v_k_factor := LEAST(40, GREATEST(10, v_uncertainty / 10));

  -- Expected outcome (Elo formula)
  v_expected := 1 / (1 + POWER(10, (p_opponent_rating - v_current_rating) / 400));

  -- Rating change
  IF p_won THEN
    v_rating_change := v_k_factor * (1 - v_expected);
  ELSE
    v_rating_change := v_k_factor * (0 - v_expected);
  END IF;

  -- Update rating
  UPDATE player_skill_profiles
  SET
    skill_rating = v_current_rating + v_rating_change,
    skill_uncertainty = GREATEST(50, v_uncertainty * 0.98), -- Reduce uncertainty over time
    games_played = games_played + 1,
    last_updated_at = NOW()
  WHERE user_id = p_user_id AND game_id = p_game_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find similar players by embedding
CREATE OR REPLACE FUNCTION find_similar_players(
  p_user_id UUID,
  p_game_id TEXT,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  skill_rating DECIMAL,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    psp.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    psp.skill_rating,
    1 - (psp.ai_embedding <=> (
      SELECT ai_embedding FROM player_skill_profiles
      WHERE user_id = p_user_id AND game_id = p_game_id
    )) as similarity_score
  FROM player_skill_profiles psp
  JOIN profiles p ON p.id = psp.user_id
  WHERE psp.game_id = p_game_id
    AND psp.user_id != p_user_id
    AND psp.ai_embedding IS NOT NULL
  ORDER BY similarity_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to respond to a suggestion
CREATE OR REPLACE FUNCTION respond_to_suggestion(
  p_suggestion_id UUID,
  p_user_id UUID,
  p_response TEXT, -- 'accepted', 'declined'
  p_feedback TEXT DEFAULT NULL,
  p_comment TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE match_suggestions
  SET
    status = p_response,
    user_feedback = p_feedback,
    feedback_comment = p_comment
  WHERE id = p_suggestion_id
    AND user_id = p_user_id
    AND status = 'pending';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update last_updated_at
CREATE TRIGGER player_skill_profiles_updated_at
  BEFORE UPDATE ON player_skill_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_game_connections_timestamp();
