-- Gaming Mood Matching
-- Migration 030

-- ============================================
-- USER MOOD
-- ============================================
CREATE TABLE public.user_mood (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Current Mood
  current_mood VARCHAR(30) NOT NULL CHECK (current_mood IN ('tryhard', 'chill', 'learning', 'tilted', 'social', 'grinding', 'casual', 'competitive')),
  mood_description TEXT, -- Custom description
  intensity INTEGER DEFAULT 50 CHECK (intensity BETWEEN 0 AND 100), -- 0=super chill, 100=maximum tryhard

  -- Preferences for current mood
  open_to_coaching BOOLEAN DEFAULT false,
  open_to_newbies BOOLEAN DEFAULT true,
  voice_chat_preference VARCHAR(20) DEFAULT 'optional' CHECK (voice_chat_preference IN ('required', 'preferred', 'optional', 'none')),
  toxicity_tolerance VARCHAR(20) DEFAULT 'low' CHECK (toxicity_tolerance IN ('none', 'low', 'medium', 'high')),

  -- Auto Detection
  auto_detect BOOLEAN DEFAULT false,
  recent_match_results JSONB DEFAULT '[]', -- For tilt detection
  detected_mood VARCHAR(30),
  detection_confidence DECIMAL(3,2),

  -- Timing
  mood_set_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Mood auto-resets after expiry
  auto_reset_hours INTEGER DEFAULT 4,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MOOD HISTORY
-- ============================================
CREATE TABLE public.mood_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Mood Info
  mood VARCHAR(30) NOT NULL,
  intensity INTEGER,
  mood_description TEXT,

  -- Context
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  trigger_event VARCHAR(50), -- 'manual', 'auto_detected', 'post_match', 'time_based'

  -- Session Outcome
  session_outcome VARCHAR(20) CHECK (session_outcome IN ('positive', 'negative', 'neutral', 'abandoned')),
  match_results JSONB DEFAULT '{}', -- {wins: 0, losses: 0, draws: 0}
  session_duration_minutes INTEGER,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- ============================================
-- MOOD COMPATIBILITY PREFERENCES
-- ============================================
CREATE TABLE public.mood_compatibility_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Preferred Partner Moods
  preferred_moods TEXT[] DEFAULT '{}', -- Moods they like playing with
  avoided_moods TEXT[] DEFAULT '{}', -- Moods they avoid
  strict_mood_matching BOOLEAN DEFAULT false, -- Only match with same mood

  -- Intensity Preferences
  intensity_range_min INTEGER DEFAULT 0,
  intensity_range_max INTEGER DEFAULT 100,
  prefer_similar_intensity BOOLEAN DEFAULT true,

  -- Special Preferences
  avoid_tilted_players BOOLEAN DEFAULT true,
  willing_to_untilt_others BOOLEAN DEFAULT false, -- Willing to help tilted players

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EXTEND LFG POSTS FOR MOOD
-- ============================================
ALTER TABLE public.lfg_posts
ADD COLUMN IF NOT EXISTS required_mood VARCHAR(30),
ADD COLUMN IF NOT EXISTS mood_intensity_min INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS mood_intensity_max INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS no_tilted_players BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mood_flexible BOOLEAN DEFAULT true;

-- ============================================
-- MOOD PRESETS
-- ============================================
CREATE TABLE public.mood_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Preset Info
  name VARCHAR(50) NOT NULL,
  description TEXT,

  -- Mood Settings
  mood VARCHAR(30) NOT NULL,
  intensity INTEGER DEFAULT 50,
  mood_description TEXT,

  -- Preferences
  open_to_coaching BOOLEAN DEFAULT false,
  open_to_newbies BOOLEAN DEFAULT true,
  voice_chat_preference VARCHAR(20) DEFAULT 'optional',

  -- Quick Access
  keyboard_shortcut VARCHAR(20),
  is_favorite BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, name)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_user_mood_user ON user_mood(user_id);
CREATE INDEX idx_user_mood_current ON user_mood(current_mood);
CREATE INDEX idx_user_mood_intensity ON user_mood(intensity);
CREATE INDEX idx_user_mood_expires ON user_mood(expires_at);

CREATE INDEX idx_mood_history_user ON mood_history(user_id);
CREATE INDEX idx_mood_history_mood ON mood_history(mood);
CREATE INDEX idx_mood_history_started ON mood_history(started_at DESC);
CREATE INDEX idx_mood_history_game ON mood_history(game_id);

CREATE INDEX idx_mood_compatibility_user ON mood_compatibility_preferences(user_id);

CREATE INDEX idx_mood_presets_user ON mood_presets(user_id);
CREATE INDEX idx_mood_presets_favorite ON mood_presets(is_favorite) WHERE is_favorite = true;

-- Index for LFG mood filtering
CREATE INDEX idx_lfg_posts_mood ON lfg_posts(required_mood) WHERE required_mood IS NOT NULL;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_mood ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User moods are viewable by everyone"
  ON user_mood FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own mood"
  ON user_mood FOR ALL
  USING (user_id = auth.uid());

ALTER TABLE mood_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mood history"
  ON mood_history FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their mood history"
  ON mood_history FOR ALL
  USING (user_id = auth.uid());

ALTER TABLE mood_compatibility_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mood preferences"
  ON mood_compatibility_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their mood preferences"
  ON mood_compatibility_preferences FOR ALL
  USING (user_id = auth.uid());

ALTER TABLE mood_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mood presets"
  ON mood_presets FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their mood presets"
  ON mood_presets FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_user_mood_updated_at
  BEFORE UPDATE ON user_mood
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mood_compatibility_preferences_updated_at
  BEFORE UPDATE ON mood_compatibility_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Log mood changes to history
CREATE OR REPLACE FUNCTION log_mood_change()
RETURNS TRIGGER AS $$
BEGIN
  -- End previous mood session
  UPDATE mood_history
  SET ended_at = NOW()
  WHERE user_id = NEW.user_id AND ended_at IS NULL;

  -- Start new mood session
  INSERT INTO mood_history (user_id, mood, intensity, mood_description, trigger_event)
  VALUES (NEW.user_id, NEW.current_mood, NEW.intensity, NEW.mood_description, 'manual');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_mood_change
  AFTER INSERT OR UPDATE OF current_mood ON user_mood
  FOR EACH ROW
  EXECUTE FUNCTION log_mood_change();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Calculate mood compatibility between two users
CREATE OR REPLACE FUNCTION calculate_mood_compatibility(
  p_user1_id UUID,
  p_user2_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_mood1 RECORD;
  v_mood2 RECORD;
  v_prefs1 RECORD;
  v_prefs2 RECORD;
  v_base_score INTEGER := 50;
  v_intensity_diff INTEGER;
BEGIN
  -- Get moods
  SELECT * INTO v_mood1 FROM user_mood WHERE user_id = p_user1_id;
  SELECT * INTO v_mood2 FROM user_mood WHERE user_id = p_user2_id;

  IF v_mood1 IS NULL OR v_mood2 IS NULL THEN
    RETURN 50; -- Default if no mood set
  END IF;

  -- Get preferences
  SELECT * INTO v_prefs1 FROM mood_compatibility_preferences WHERE user_id = p_user1_id;
  SELECT * INTO v_prefs2 FROM mood_compatibility_preferences WHERE user_id = p_user2_id;

  -- Same mood = high compatibility
  IF v_mood1.current_mood = v_mood2.current_mood THEN
    v_base_score := 80;
  -- Compatible mood pairs
  ELSIF (v_mood1.current_mood = 'chill' AND v_mood2.current_mood = 'social')
     OR (v_mood1.current_mood = 'social' AND v_mood2.current_mood = 'chill') THEN
    v_base_score := 70;
  ELSIF (v_mood1.current_mood = 'tryhard' AND v_mood2.current_mood = 'competitive')
     OR (v_mood1.current_mood = 'competitive' AND v_mood2.current_mood = 'tryhard') THEN
    v_base_score := 75;
  ELSIF (v_mood1.current_mood = 'learning' AND v_mood2.current_mood = 'chill')
     OR (v_mood1.current_mood = 'chill' AND v_mood2.current_mood = 'learning') THEN
    v_base_score := 65;
  -- Incompatible mood pairs
  ELSIF v_mood1.current_mood = 'tilted' OR v_mood2.current_mood = 'tilted' THEN
    v_base_score := 20;
  ELSIF (v_mood1.current_mood = 'tryhard' AND v_mood2.current_mood = 'chill')
     OR (v_mood1.current_mood = 'chill' AND v_mood2.current_mood = 'tryhard') THEN
    v_base_score := 30;
  END IF;

  -- Adjust for intensity difference
  v_intensity_diff := ABS(v_mood1.intensity - v_mood2.intensity);
  v_base_score := v_base_score - (v_intensity_diff / 5);

  -- Check avoided moods in preferences
  IF v_prefs1 IS NOT NULL AND v_mood2.current_mood = ANY(v_prefs1.avoided_moods) THEN
    v_base_score := v_base_score - 30;
  END IF;
  IF v_prefs2 IS NOT NULL AND v_mood1.current_mood = ANY(v_prefs2.avoided_moods) THEN
    v_base_score := v_base_score - 30;
  END IF;

  -- Ensure score is between 0 and 100
  RETURN GREATEST(0, LEAST(100, v_base_score));
END;
$$ LANGUAGE plpgsql STABLE;

-- Auto-detect tilt from recent match results
CREATE OR REPLACE FUNCTION detect_tilt(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_recent_results JSONB;
  v_loss_streak INTEGER := 0;
  v_result JSONB;
BEGIN
  SELECT recent_match_results INTO v_recent_results
  FROM user_mood WHERE user_id = p_user_id;

  IF v_recent_results IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Count consecutive losses
  FOR v_result IN SELECT * FROM jsonb_array_elements(v_recent_results) LOOP
    IF (v_result->>'result')::text = 'loss' THEN
      v_loss_streak := v_loss_streak + 1;
    ELSE
      v_loss_streak := 0;
    END IF;
  END LOOP;

  -- 3+ consecutive losses suggests tilt
  RETURN v_loss_streak >= 3;
END;
$$ LANGUAGE plpgsql STABLE;
