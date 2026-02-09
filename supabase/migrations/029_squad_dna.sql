-- Squad DNA Matching
-- Migration 029

-- ============================================
-- SQUAD DNA PROFILES
-- ============================================
CREATE TABLE public.squad_dna_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,

  -- Playstyle DNA (0-100 scale)
  aggression_rating INTEGER DEFAULT 50 CHECK (aggression_rating BETWEEN 0 AND 100),
  teamwork_rating INTEGER DEFAULT 50 CHECK (teamwork_rating BETWEEN 0 AND 100),
  communication_rating INTEGER DEFAULT 50 CHECK (communication_rating BETWEEN 0 AND 100),
  adaptability_rating INTEGER DEFAULT 50 CHECK (adaptability_rating BETWEEN 0 AND 100),
  consistency_rating INTEGER DEFAULT 50 CHECK (consistency_rating BETWEEN 0 AND 100),
  clutch_rating INTEGER DEFAULT 50 CHECK (clutch_rating BETWEEN 0 AND 100),
  leadership_rating INTEGER DEFAULT 50 CHECK (leadership_rating BETWEEN 0 AND 100),
  patience_rating INTEGER DEFAULT 50 CHECK (patience_rating BETWEEN 0 AND 100),

  -- Role Preferences
  preferred_roles TEXT[] DEFAULT '{}',
  role_flexibility INTEGER DEFAULT 50 CHECK (role_flexibility BETWEEN 0 AND 100),
  willing_to_igl BOOLEAN DEFAULT false,

  -- Timing Patterns
  peak_performance_hours JSONB DEFAULT '{}', -- {monday: ['20:00-23:00'], ...}
  session_duration_avg INTEGER, -- minutes
  preferred_session_length INTEGER, -- minutes

  -- Communication Style
  comm_style VARCHAR(30) CHECK (comm_style IN ('verbose', 'concise', 'callouts_only', 'silent', 'adaptive')),
  mic_quality VARCHAR(20) CHECK (mic_quality IN ('excellent', 'good', 'average', 'poor')),
  language_fluency JSONB DEFAULT '{}', -- {en: 'native', es: 'fluent'}

  -- Learning & Improvement
  accepts_criticism BOOLEAN DEFAULT true,
  gives_constructive_feedback BOOLEAN DEFAULT true,
  review_vods BOOLEAN DEFAULT false,

  -- AI-Generated Insights
  playstyle_summary TEXT, -- AI-generated description
  ideal_teammate_profile JSONB DEFAULT '{}', -- What type of player complements them
  strengths TEXT[] DEFAULT '{}',
  areas_to_improve TEXT[] DEFAULT '{}',

  -- Data Sources
  data_sources JSONB DEFAULT '{}', -- {matches_analyzed: 50, self_reported: true, peer_rated: true}
  last_analysis_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, game_id)
);

-- ============================================
-- SQUAD COMPATIBILITY ANALYSIS
-- ============================================
CREATE TABLE public.squad_compatibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,

  -- Squad Members
  squad_members UUID[] NOT NULL, -- Array of user_ids
  squad_size INTEGER NOT NULL,

  -- Compatibility Scores (0-100)
  overall_chemistry DECIMAL(5,2),
  role_coverage DECIMAL(5,2), -- How well roles are covered
  playstyle_synergy DECIMAL(5,2), -- How playstyles complement
  communication_match DECIMAL(5,2), -- Communication style compatibility
  schedule_overlap DECIMAL(5,2), -- Time availability overlap

  -- AI Insights
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  suggested_improvements TEXT[] DEFAULT '{}',
  missing_player_profile JSONB DEFAULT '{}', -- What player would complete the squad
  synergy_pairs JSONB DEFAULT '[]', -- [{user1, user2, synergy_type, score}]
  potential_conflicts JSONB DEFAULT '[]',

  -- Predictions
  predicted_win_rate DECIMAL(5,2),
  confidence_score DECIMAL(5,2),

  -- Tracking
  is_active_squad BOOLEAN DEFAULT false,
  matches_played_together INTEGER DEFAULT 0,
  actual_win_rate DECIMAL(5,2),

  -- Timestamps
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SQUAD MATCH REQUESTS
-- ============================================
CREATE TABLE public.squad_match_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,

  -- Current Squad
  existing_members UUID[] NOT NULL,
  slots_to_fill INTEGER NOT NULL,

  -- Requirements
  role_requirements JSONB DEFAULT '[]', -- [{role, importance: 'required'|'preferred', playstyle_prefs}]
  skill_range JSONB DEFAULT '{}', -- {min_rank, max_rank}
  schedule_requirements JSONB DEFAULT '{}',
  communication_requirements JSONB DEFAULT '{}',

  -- Results
  suggested_players JSONB DEFAULT '[]', -- [{user_id, compatibility_score, role_fit, reasoning}]
  processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- PEER RATINGS (for DNA data)
-- ============================================
CREATE TABLE public.squad_dna_peer_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rated_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,

  -- Ratings (1-5)
  aggression INTEGER CHECK (aggression BETWEEN 1 AND 5),
  teamwork INTEGER CHECK (teamwork BETWEEN 1 AND 5),
  communication INTEGER CHECK (communication BETWEEN 1 AND 5),
  adaptability INTEGER CHECK (adaptability BETWEEN 1 AND 5),
  consistency INTEGER CHECK (consistency BETWEEN 1 AND 5),
  clutch INTEGER CHECK (clutch BETWEEN 1 AND 5),
  leadership INTEGER CHECK (leadership BETWEEN 1 AND 5),

  -- Context
  matches_played_together INTEGER DEFAULT 1,
  relationship VARCHAR(30) CHECK (relationship IN ('random_matchmade', 'lfg', 'friend', 'clan_member', 'team')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(rater_id, rated_id, game_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_squad_dna_profiles_user ON squad_dna_profiles(user_id);
CREATE INDEX idx_squad_dna_profiles_game ON squad_dna_profiles(game_id);
CREATE INDEX idx_squad_dna_profiles_aggression ON squad_dna_profiles(aggression_rating);
CREATE INDEX idx_squad_dna_profiles_teamwork ON squad_dna_profiles(teamwork_rating);

CREATE INDEX idx_squad_compatibility_game ON squad_compatibility(game_id);
CREATE INDEX idx_squad_compatibility_members ON squad_compatibility USING GIN (squad_members);
CREATE INDEX idx_squad_compatibility_active ON squad_compatibility(is_active_squad) WHERE is_active_squad = true;

CREATE INDEX idx_squad_match_requests_requester ON squad_match_requests(requester_id);
CREATE INDEX idx_squad_match_requests_game ON squad_match_requests(game_id);
CREATE INDEX idx_squad_match_requests_status ON squad_match_requests(processing_status);

CREATE INDEX idx_squad_dna_peer_ratings_rated ON squad_dna_peer_ratings(rated_id);
CREATE INDEX idx_squad_dna_peer_ratings_game ON squad_dna_peer_ratings(game_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE squad_dna_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "DNA profiles are viewable by everyone"
  ON squad_dna_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own DNA profile"
  ON squad_dna_profiles FOR ALL
  USING (user_id = auth.uid());

ALTER TABLE squad_compatibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Squad members can view their compatibility"
  ON squad_compatibility FOR SELECT
  USING (auth.uid() = ANY(squad_members));

ALTER TABLE squad_match_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own match requests"
  ON squad_match_requests FOR SELECT
  USING (requester_id = auth.uid());

CREATE POLICY "Users can create match requests"
  ON squad_match_requests FOR INSERT
  WITH CHECK (requester_id = auth.uid());

ALTER TABLE squad_dna_peer_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ratings they gave or received"
  ON squad_dna_peer_ratings FOR SELECT
  USING (rater_id = auth.uid() OR rated_id = auth.uid());

CREATE POLICY "Users can create peer ratings"
  ON squad_dna_peer_ratings FOR INSERT
  WITH CHECK (rater_id = auth.uid() AND rater_id != rated_id);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_squad_dna_profiles_updated_at
  BEFORE UPDATE ON squad_dna_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_squad_compatibility_updated_at
  BEFORE UPDATE ON squad_compatibility
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update DNA profile based on peer ratings
CREATE OR REPLACE FUNCTION update_dna_from_peer_ratings()
RETURNS TRIGGER AS $$
DECLARE
  v_avg_aggression DECIMAL;
  v_avg_teamwork DECIMAL;
  v_avg_communication DECIMAL;
  v_avg_adaptability DECIMAL;
  v_avg_consistency DECIMAL;
  v_avg_clutch DECIMAL;
  v_avg_leadership DECIMAL;
BEGIN
  -- Calculate averages from peer ratings
  SELECT
    AVG(aggression) * 20,
    AVG(teamwork) * 20,
    AVG(communication) * 20,
    AVG(adaptability) * 20,
    AVG(consistency) * 20,
    AVG(clutch) * 20,
    AVG(leadership) * 20
  INTO
    v_avg_aggression,
    v_avg_teamwork,
    v_avg_communication,
    v_avg_adaptability,
    v_avg_consistency,
    v_avg_clutch,
    v_avg_leadership
  FROM squad_dna_peer_ratings
  WHERE rated_id = NEW.rated_id AND game_id = NEW.game_id;

  -- Blend with existing self-reported values (70% self, 30% peer)
  UPDATE squad_dna_profiles
  SET
    aggression_rating = COALESCE((aggression_rating * 0.7 + v_avg_aggression * 0.3)::INTEGER, aggression_rating),
    teamwork_rating = COALESCE((teamwork_rating * 0.7 + v_avg_teamwork * 0.3)::INTEGER, teamwork_rating),
    communication_rating = COALESCE((communication_rating * 0.7 + v_avg_communication * 0.3)::INTEGER, communication_rating),
    adaptability_rating = COALESCE((adaptability_rating * 0.7 + v_avg_adaptability * 0.3)::INTEGER, adaptability_rating),
    consistency_rating = COALESCE((consistency_rating * 0.7 + v_avg_consistency * 0.3)::INTEGER, consistency_rating),
    clutch_rating = COALESCE((clutch_rating * 0.7 + v_avg_clutch * 0.3)::INTEGER, clutch_rating),
    leadership_rating = COALESCE((leadership_rating * 0.7 + v_avg_leadership * 0.3)::INTEGER, leadership_rating),
    updated_at = NOW()
  WHERE user_id = NEW.rated_id AND game_id = NEW.game_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_peer_rating_insert
  AFTER INSERT ON squad_dna_peer_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_dna_from_peer_ratings();
