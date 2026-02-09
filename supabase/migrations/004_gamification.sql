-- GamerHub Gamification & Progression System
-- Migration: 004_gamification.sql

-- ============================================
-- TABLES
-- ============================================

-- 1. Titles (unlockable display titles)
CREATE TABLE public.titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  unlock_type VARCHAR(20) NOT NULL CHECK (unlock_type IN ('level', 'badge', 'achievement', 'purchase', 'special')),
  unlock_value JSONB,
  rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  color VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profile Frames (avatar border decorations)
CREATE TABLE public.profile_frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  unlock_type VARCHAR(20) NOT NULL CHECK (unlock_type IN ('level', 'badge', 'achievement', 'purchase', 'special', 'default')),
  unlock_value JSONB,
  rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Profile Themes (profile color schemes)
CREATE TABLE public.profile_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  primary_color VARCHAR(20) NOT NULL,
  secondary_color VARCHAR(20),
  accent_color VARCHAR(20),
  background_gradient JSONB,
  unlock_type VARCHAR(20) NOT NULL CHECK (unlock_type IN ('level', 'badge', 'achievement', 'purchase', 'special', 'default')),
  unlock_value JSONB,
  rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Level Thresholds (XP requirements per level)
CREATE TABLE public.level_thresholds (
  level INT PRIMARY KEY,
  xp_required BIGINT NOT NULL,
  total_xp_required BIGINT NOT NULL,
  rewards JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. User Progression (core XP and level tracking)
CREATE TABLE public.user_progression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  total_xp BIGINT DEFAULT 0,
  level INT DEFAULT 1,
  current_level_xp INT DEFAULT 0,
  xp_to_next_level INT DEFAULT 100,
  prestige_level INT DEFAULT 0,
  active_title_id UUID REFERENCES public.titles(id) ON DELETE SET NULL,
  active_frame_id UUID REFERENCES public.profile_frames(id) ON DELETE SET NULL,
  active_theme_id UUID REFERENCES public.profile_themes(id) ON DELETE SET NULL,
  showcase_badges JSONB DEFAULT '[]',
  stats JSONB DEFAULT '{"matches_played": 0, "matches_won": 0, "challenges_completed": 0, "quests_completed": 0, "current_win_streak": 0, "best_win_streak": 0}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. User Game Progression (per-game XP tracking)
CREATE TABLE public.user_game_progression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  xp BIGINT DEFAULT 0,
  level INT DEFAULT 1,
  stats JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- 7. Badge Definitions (achievement/badge catalog)
CREATE TABLE public.badge_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  category VARCHAR(30) NOT NULL CHECK (category IN ('skill', 'social', 'milestone', 'seasonal', 'special')),
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  unlock_criteria JSONB NOT NULL,
  xp_reward INT DEFAULT 0,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  is_secret BOOLEAN DEFAULT false,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. User Badges (earned badges)
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badge_definitions(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  progress JSONB DEFAULT '{}',
  season VARCHAR(20),
  UNIQUE(user_id, badge_id)
);

-- 9. Quest Definitions (quest templates)
CREATE TABLE public.quest_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  quest_type VARCHAR(20) NOT NULL CHECK (quest_type IN ('daily', 'weekly', 'special')),
  requirements JSONB NOT NULL,
  xp_reward INT NOT NULL,
  bonus_rewards JSONB DEFAULT '{}',
  weight INT DEFAULT 100,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  min_level INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. User Quests (active/completed quests)
CREATE TABLE public.user_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  quest_id UUID REFERENCES public.quest_definitions(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'claimed')),
  progress JSONB DEFAULT '{}',
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  period_type VARCHAR(20) NOT NULL,
  period_key VARCHAR(20) NOT NULL,
  UNIQUE(user_id, quest_id, period_key)
);

-- 11. User Titles (unlocked titles)
CREATE TABLE public.user_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title_id UUID REFERENCES public.titles(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, title_id)
);

-- 12. User Frames (unlocked frames)
CREATE TABLE public.user_frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  frame_id UUID REFERENCES public.profile_frames(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, frame_id)
);

-- 13. User Themes (unlocked themes)
CREATE TABLE public.user_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  theme_id UUID REFERENCES public.profile_themes(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, theme_id)
);

-- 14. XP Transactions (audit log)
CREATE TABLE public.xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount INT NOT NULL,
  source_type VARCHAR(30) NOT NULL CHECK (source_type IN ('match', 'challenge', 'quest', 'badge', 'clan_activity', 'rating', 'bonus', 'admin')),
  source_id UUID,
  description TEXT,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Titles indexes
CREATE INDEX idx_titles_unlock_type ON titles(unlock_type);
CREATE INDEX idx_titles_active ON titles(is_active) WHERE is_active = true;
CREATE INDEX idx_titles_rarity ON titles(rarity);

-- Profile frames indexes
CREATE INDEX idx_profile_frames_active ON profile_frames(is_active) WHERE is_active = true;
CREATE INDEX idx_profile_frames_unlock_type ON profile_frames(unlock_type);

-- Profile themes indexes
CREATE INDEX idx_profile_themes_active ON profile_themes(is_active) WHERE is_active = true;
CREATE INDEX idx_profile_themes_unlock_type ON profile_themes(unlock_type);

-- User progression indexes
CREATE INDEX idx_user_progression_user ON user_progression(user_id);
CREATE INDEX idx_user_progression_level ON user_progression(level DESC);
CREATE INDEX idx_user_progression_xp ON user_progression(total_xp DESC);

-- User game progression indexes
CREATE INDEX idx_user_game_progression_user ON user_game_progression(user_id);
CREATE INDEX idx_user_game_progression_game ON user_game_progression(game_id);
CREATE INDEX idx_user_game_progression_level ON user_game_progression(level DESC);
CREATE INDEX idx_user_game_progression_xp ON user_game_progression(xp DESC);

-- Badge definitions indexes
CREATE INDEX idx_badge_definitions_category ON badge_definitions(category);
CREATE INDEX idx_badge_definitions_rarity ON badge_definitions(rarity);
CREATE INDEX idx_badge_definitions_game ON badge_definitions(game_id);
CREATE INDEX idx_badge_definitions_active ON badge_definitions(is_active) WHERE is_active = true;

-- User badges indexes
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX idx_user_badges_earned ON user_badges(earned_at DESC);

-- Quest definitions indexes
CREATE INDEX idx_quest_definitions_type ON quest_definitions(quest_type);
CREATE INDEX idx_quest_definitions_active ON quest_definitions(is_active) WHERE is_active = true;
CREATE INDEX idx_quest_definitions_game ON quest_definitions(game_id);

-- User quests indexes
CREATE INDEX idx_user_quests_user ON user_quests(user_id);
CREATE INDEX idx_user_quests_status ON user_quests(status);
CREATE INDEX idx_user_quests_period ON user_quests(period_type, period_key);
CREATE INDEX idx_user_quests_expires ON user_quests(expires_at) WHERE status = 'active';

-- User titles indexes
CREATE INDEX idx_user_titles_user ON user_titles(user_id);
CREATE INDEX idx_user_titles_title ON user_titles(title_id);

-- User frames indexes
CREATE INDEX idx_user_frames_user ON user_frames(user_id);
CREATE INDEX idx_user_frames_frame ON user_frames(frame_id);

-- User themes indexes
CREATE INDEX idx_user_themes_user ON user_themes(user_id);
CREATE INDEX idx_user_themes_theme ON user_themes(theme_id);

-- XP transactions indexes
CREATE INDEX idx_xp_transactions_user ON xp_transactions(user_id);
CREATE INDEX idx_xp_transactions_created ON xp_transactions(created_at DESC);
CREATE INDEX idx_xp_transactions_source ON xp_transactions(source_type);
CREATE INDEX idx_xp_transactions_game ON xp_transactions(game_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_game_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

-- TITLES POLICIES
CREATE POLICY "Titles are viewable by everyone"
  ON titles FOR SELECT USING (is_active = true);

-- PROFILE_FRAMES POLICIES
CREATE POLICY "Profile frames are viewable by everyone"
  ON profile_frames FOR SELECT USING (is_active = true);

-- PROFILE_THEMES POLICIES
CREATE POLICY "Profile themes are viewable by everyone"
  ON profile_themes FOR SELECT USING (is_active = true);

-- LEVEL_THRESHOLDS POLICIES
CREATE POLICY "Level thresholds are viewable by everyone"
  ON level_thresholds FOR SELECT USING (true);

-- USER_PROGRESSION POLICIES
CREATE POLICY "User progression is viewable by everyone"
  ON user_progression FOR SELECT USING (true);

CREATE POLICY "Users can insert their own progression"
  ON user_progression FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progression"
  ON user_progression FOR UPDATE
  USING (auth.uid() = user_id);

-- USER_GAME_PROGRESSION POLICIES
CREATE POLICY "Game progression is viewable by everyone"
  ON user_game_progression FOR SELECT USING (true);

CREATE POLICY "Users can manage their own game progression"
  ON user_game_progression FOR ALL
  USING (auth.uid() = user_id);

-- BADGE_DEFINITIONS POLICIES
CREATE POLICY "Active badges are viewable by everyone"
  ON badge_definitions FOR SELECT
  USING (is_active = true AND (is_secret = false OR EXISTS (
    SELECT 1 FROM user_badges WHERE badge_id = badge_definitions.id AND user_id = auth.uid()
  )));

-- USER_BADGES POLICIES
CREATE POLICY "User badges are viewable by everyone"
  ON user_badges FOR SELECT USING (true);

CREATE POLICY "System can award badges"
  ON user_badges FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- QUEST_DEFINITIONS POLICIES
CREATE POLICY "Quest definitions are viewable by everyone"
  ON quest_definitions FOR SELECT USING (is_active = true);

-- USER_QUESTS POLICIES
CREATE POLICY "Users can view their own quests"
  ON user_quests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own quests"
  ON user_quests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own quests"
  ON user_quests FOR UPDATE
  USING (user_id = auth.uid());

-- USER_TITLES POLICIES
CREATE POLICY "User titles are viewable by everyone"
  ON user_titles FOR SELECT USING (true);

CREATE POLICY "System can grant titles"
  ON user_titles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- USER_FRAMES POLICIES
CREATE POLICY "User frames are viewable by everyone"
  ON user_frames FOR SELECT USING (true);

CREATE POLICY "System can grant frames"
  ON user_frames FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- USER_THEMES POLICIES
CREATE POLICY "User themes are viewable by everyone"
  ON user_themes FOR SELECT USING (true);

CREATE POLICY "System can grant themes"
  ON user_themes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- XP_TRANSACTIONS POLICIES
CREATE POLICY "Users can view their own XP transactions"
  ON xp_transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can create XP transactions"
  ON xp_transactions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to calculate XP required for a level
CREATE OR REPLACE FUNCTION calculate_xp_for_level(p_level INT)
RETURNS BIGINT AS $$
BEGIN
  RETURN FLOOR(100 * POWER(p_level, 1.5));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to award XP and handle level ups
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_amount INT,
  p_source_type VARCHAR(30),
  p_source_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_game_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_progression user_progression%ROWTYPE;
  v_new_level INT;
  v_level_ups INT := 0;
  v_rewards JSONB := '[]'::jsonb;
  v_threshold level_thresholds%ROWTYPE;
  v_xp_for_next INT;
BEGIN
  -- Get or create user progression
  INSERT INTO user_progression (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_progression FROM user_progression WHERE user_id = p_user_id FOR UPDATE;

  -- Record XP transaction
  INSERT INTO xp_transactions (user_id, amount, source_type, source_id, description, game_id)
  VALUES (p_user_id, p_amount, p_source_type, p_source_id, p_description, p_game_id);

  -- Update total XP and current level XP
  v_progression.total_xp := v_progression.total_xp + p_amount;
  v_progression.current_level_xp := v_progression.current_level_xp + p_amount;

  -- Check for level ups
  WHILE v_progression.current_level_xp >= v_progression.xp_to_next_level LOOP
    v_progression.current_level_xp := v_progression.current_level_xp - v_progression.xp_to_next_level;
    v_progression.level := v_progression.level + 1;
    v_level_ups := v_level_ups + 1;

    -- Get next level threshold
    SELECT * INTO v_threshold FROM level_thresholds WHERE level = v_progression.level + 1;
    IF FOUND THEN
      v_progression.xp_to_next_level := v_threshold.xp_required;
    ELSE
      -- Default formula if no threshold defined
      v_progression.xp_to_next_level := calculate_xp_for_level(v_progression.level + 1);
    END IF;

    -- Collect level rewards
    SELECT rewards INTO v_threshold FROM level_thresholds WHERE level = v_progression.level;
    IF v_threshold.rewards IS NOT NULL AND v_threshold.rewards != '{}'::jsonb THEN
      v_rewards := v_rewards || jsonb_build_object('level', v_progression.level, 'rewards', v_threshold.rewards);
    END IF;
  END LOOP;

  -- Update progression
  UPDATE user_progression
  SET total_xp = v_progression.total_xp,
      level = v_progression.level,
      current_level_xp = v_progression.current_level_xp,
      xp_to_next_level = v_progression.xp_to_next_level,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Also update game-specific progression if game_id provided
  IF p_game_id IS NOT NULL THEN
    INSERT INTO user_game_progression (user_id, game_id, xp)
    VALUES (p_user_id, p_game_id, p_amount)
    ON CONFLICT (user_id, game_id)
    DO UPDATE SET
      xp = user_game_progression.xp + p_amount,
      level = GREATEST(1, FLOOR(POWER(user_game_progression.xp + p_amount, 0.4))::INT),
      updated_at = NOW();
  END IF;

  RETURN jsonb_build_object(
    'xp_awarded', p_amount,
    'new_total_xp', v_progression.total_xp,
    'new_level', v_progression.level,
    'current_level_xp', v_progression.current_level_xp,
    'xp_to_next_level', v_progression.xp_to_next_level,
    'level_ups', v_level_ups,
    'rewards', v_rewards
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign daily/weekly quests
CREATE OR REPLACE FUNCTION assign_quests(p_user_id UUID, p_quest_type VARCHAR(20))
RETURNS JSONB AS $$
DECLARE
  v_period_key VARCHAR(20);
  v_expires_at TIMESTAMPTZ;
  v_quest_count INT;
  v_target_count INT;
  v_quest quest_definitions%ROWTYPE;
  v_assigned_quests JSONB := '[]'::jsonb;
  v_user_level INT;
BEGIN
  -- Get user level
  SELECT level INTO v_user_level FROM user_progression WHERE user_id = p_user_id;
  v_user_level := COALESCE(v_user_level, 1);

  -- Calculate period key and expiration
  IF p_quest_type = 'daily' THEN
    v_period_key := TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD');
    v_expires_at := DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC') + INTERVAL '1 day';
    v_target_count := 3;
  ELSIF p_quest_type = 'weekly' THEN
    v_period_key := TO_CHAR(CURRENT_DATE, 'IYYY-"W"IW');
    v_expires_at := DATE_TRUNC('week', NOW() AT TIME ZONE 'UTC') + INTERVAL '1 week';
    v_target_count := 3;
  ELSE
    RETURN '[]'::jsonb;
  END IF;

  -- Count existing quests for this period
  SELECT COUNT(*) INTO v_quest_count
  FROM user_quests
  WHERE user_id = p_user_id
  AND period_type = p_quest_type
  AND period_key = v_period_key;

  -- Assign missing quests
  IF v_quest_count < v_target_count THEN
    FOR v_quest IN
      SELECT * FROM quest_definitions
      WHERE quest_type = p_quest_type
      AND is_active = true
      AND min_level <= v_user_level
      AND id NOT IN (
        SELECT quest_id FROM user_quests
        WHERE user_id = p_user_id
        AND period_type = p_quest_type
        AND period_key = v_period_key
      )
      ORDER BY RANDOM()
      LIMIT (v_target_count - v_quest_count)
    LOOP
      INSERT INTO user_quests (user_id, quest_id, status, progress, expires_at, period_type, period_key)
      VALUES (p_user_id, v_quest.id, 'active',
              jsonb_build_object('current', 0, 'target', COALESCE((v_quest.requirements->>'count')::INT, 1)),
              v_expires_at, p_quest_type, v_period_key);

      v_assigned_quests := v_assigned_quests || jsonb_build_object(
        'quest_id', v_quest.id,
        'name', v_quest.name,
        'xp_reward', v_quest.xp_reward
      );
    END LOOP;
  END IF;

  RETURN v_assigned_quests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update quest progress
CREATE OR REPLACE FUNCTION update_quest_progress(
  p_user_id UUID,
  p_event_type VARCHAR(50),
  p_event_data JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  v_quest RECORD;
  v_new_progress INT;
  v_target INT;
  v_completed_quests JSONB := '[]'::jsonb;
BEGIN
  -- Find active quests that match this event type
  FOR v_quest IN
    SELECT uq.*, qd.requirements, qd.xp_reward, qd.name as quest_name
    FROM user_quests uq
    JOIN quest_definitions qd ON uq.quest_id = qd.id
    WHERE uq.user_id = p_user_id
    AND uq.status = 'active'
    AND uq.expires_at > NOW()
    AND qd.requirements->>'type' = p_event_type
  LOOP
    -- Check if event matches quest requirements (game filter, etc.)
    IF v_quest.requirements ? 'game_id' AND
       v_quest.requirements->>'game_id' IS NOT NULL AND
       v_quest.requirements->>'game_id' != COALESCE(p_event_data->>'game_id', '') THEN
      CONTINUE;
    END IF;

    -- Update progress
    v_target := COALESCE((v_quest.progress->>'target')::INT, 1);
    v_new_progress := COALESCE((v_quest.progress->>'current')::INT, 0) + 1;

    IF v_new_progress >= v_target THEN
      -- Quest completed
      UPDATE user_quests
      SET progress = jsonb_set(progress, '{current}', to_jsonb(v_target)),
          status = 'completed',
          completed_at = NOW()
      WHERE id = v_quest.id;

      v_completed_quests := v_completed_quests || jsonb_build_object(
        'quest_id', v_quest.quest_id,
        'name', v_quest.quest_name,
        'xp_reward', v_quest.xp_reward
      );
    ELSE
      -- Update progress
      UPDATE user_quests
      SET progress = jsonb_set(progress, '{current}', to_jsonb(v_new_progress))
      WHERE id = v_quest.id;
    END IF;
  END LOOP;

  RETURN v_completed_quests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create user_progression on profile creation
CREATE OR REPLACE FUNCTION handle_new_profile_gamification()
RETURNS TRIGGER AS $$
DECLARE
  v_default_theme_id UUID;
  v_default_frame_id UUID;
BEGIN
  -- Get default theme and frame
  SELECT id INTO v_default_theme_id FROM profile_themes WHERE slug = 'default' LIMIT 1;
  SELECT id INTO v_default_frame_id FROM profile_frames WHERE slug = 'default' LIMIT 1;

  -- Create progression record
  INSERT INTO user_progression (user_id, active_theme_id, active_frame_id)
  VALUES (NEW.id, v_default_theme_id, v_default_frame_id);

  -- Unlock default theme and frame
  IF v_default_theme_id IS NOT NULL THEN
    INSERT INTO user_themes (user_id, theme_id) VALUES (NEW.id, v_default_theme_id);
  END IF;
  IF v_default_frame_id IS NOT NULL THEN
    INSERT INTO user_frames (user_id, frame_id) VALUES (NEW.id, v_default_frame_id);
  END IF;

  -- Assign initial quests
  PERFORM assign_quests(NEW.id, 'daily');
  PERFORM assign_quests(NEW.id, 'weekly');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_gamification
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_profile_gamification();

-- Trigger: Award XP on match completion
CREATE OR REPLACE FUNCTION handle_match_completion_xp()
RETURNS TRIGGER AS $$
DECLARE
  v_participant RECORD;
  v_xp_amount INT;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Award XP to all participants
    FOR v_participant IN
      SELECT user_id FROM match_participants
      WHERE match_id = NEW.id AND status = 'accepted'
    LOOP
      -- Base XP: 50 for casual, 75 for competitive, 100 for tournament
      v_xp_amount := CASE NEW.match_type
        WHEN 'casual' THEN 50
        WHEN 'competitive' THEN 75
        WHEN 'tournament' THEN 100
        ELSE 50
      END;

      PERFORM award_xp(v_participant.user_id, v_xp_amount, 'match', NEW.id,
                       'Completed ' || NEW.match_type || ' match', NEW.game_id);

      -- Update quest progress
      PERFORM update_quest_progress(v_participant.user_id, 'play_match',
                                    jsonb_build_object('match_id', NEW.id, 'match_type', NEW.match_type, 'game_id', NEW.game_id));
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_match_completed_xp
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION handle_match_completion_xp();

-- Trigger: Award XP on challenge completion
CREATE OR REPLACE FUNCTION handle_challenge_completion_xp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Award XP to creator
    PERFORM award_xp(NEW.creator_id, 100, 'challenge', NEW.id, 'Challenge completed', NEW.game_id);
    PERFORM update_quest_progress(NEW.creator_id, 'challenge_complete', jsonb_build_object('challenge_id', NEW.id));

    -- Award XP to acceptor
    IF NEW.accepted_by IS NOT NULL THEN
      PERFORM award_xp(NEW.accepted_by, 100, 'challenge', NEW.id, 'Challenge completed', NEW.game_id);
      PERFORM update_quest_progress(NEW.accepted_by, 'challenge_complete', jsonb_build_object('challenge_id', NEW.id));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_challenge_completed_xp
  AFTER UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION handle_challenge_completion_xp();

-- Updated_at triggers
CREATE TRIGGER update_user_progression_updated_at
  BEFORE UPDATE ON user_progression
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_game_progression_updated_at
  BEFORE UPDATE ON user_game_progression
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE user_progression;
ALTER PUBLICATION supabase_realtime ADD TABLE user_badges;
ALTER PUBLICATION supabase_realtime ADD TABLE user_quests;
ALTER PUBLICATION supabase_realtime ADD TABLE xp_transactions;

-- ============================================
-- SEED DATA
-- ============================================

-- Level thresholds (1-100)
INSERT INTO level_thresholds (level, xp_required, total_xp_required, rewards) VALUES
(1, 0, 0, '{}'),
(2, 100, 100, '{}'),
(3, 150, 250, '{}'),
(4, 200, 450, '{}'),
(5, 250, 700, '{"title": "newcomer"}'),
(6, 300, 1000, '{}'),
(7, 350, 1350, '{}'),
(8, 400, 1750, '{}'),
(9, 450, 2200, '{}'),
(10, 500, 2700, '{"title": "rising_star", "frame": "bronze"}'),
(15, 800, 6200, '{}'),
(20, 1100, 11500, '{"title": "veteran", "frame": "silver"}'),
(25, 1400, 18700, '{}'),
(30, 1700, 28000, '{"title": "elite", "frame": "gold"}'),
(40, 2400, 52000, '{"title": "champion"}'),
(50, 3100, 83000, '{"title": "legend", "frame": "platinum"}'),
(75, 5500, 180000, '{"title": "mythic", "theme": "mythic"}'),
(100, 8000, 320000, '{"title": "immortal", "frame": "diamond", "theme": "immortal"}');

-- Titles
INSERT INTO titles (slug, name, description, unlock_type, unlock_value, rarity, color, sort_order) VALUES
('newcomer', 'Newcomer', 'Welcome to GamerHub!', 'level', '{"level": 5}', 'common', NULL, 1),
('rising_star', 'Rising Star', 'Making progress!', 'level', '{"level": 10}', 'common', '#FFD700', 2),
('veteran', 'Veteran', 'A seasoned player', 'level', '{"level": 20}', 'rare', '#4169E1', 3),
('elite', 'Elite', 'Among the best', 'level', '{"level": 30}', 'rare', '#9400D3', 4),
('champion', 'Champion', 'A true champion', 'level', '{"level": 40}', 'epic', '#FF4500', 5),
('legend', 'Legend', 'Legendary status achieved', 'level', '{"level": 50}', 'epic', '#FF1493', 6),
('mythic', 'Mythic', 'Mythical prowess', 'level', '{"level": 75}', 'legendary', '#00CED1', 7),
('immortal', 'Immortal', 'Beyond mortal limits', 'level', '{"level": 100}', 'legendary', '#DC143C', 8),
('social_butterfly', 'Social Butterfly', 'Made 50 friends', 'achievement', '{"type": "follows", "count": 50}', 'rare', '#FF69B4', 10),
('streak_master', 'Streak Master', 'Win 10 matches in a row', 'achievement', '{"type": "win_streak", "count": 10}', 'epic', '#FF8C00', 11);

-- Profile Frames
INSERT INTO profile_frames (slug, name, description, image_url, unlock_type, unlock_value, rarity, sort_order) VALUES
('default', 'Default', 'Standard profile frame', '/images/frames/default.png', 'default', '{}', 'common', 0),
('bronze', 'Bronze Frame', 'A bronze border for your avatar', '/images/frames/bronze.png', 'level', '{"level": 10}', 'common', 1),
('silver', 'Silver Frame', 'A silver border for your avatar', '/images/frames/silver.png', 'level', '{"level": 20}', 'rare', 2),
('gold', 'Gold Frame', 'A golden border for your avatar', '/images/frames/gold.png', 'level', '{"level": 30}', 'rare', 3),
('platinum', 'Platinum Frame', 'A platinum border for your avatar', '/images/frames/platinum.png', 'level', '{"level": 50}', 'epic', 4),
('diamond', 'Diamond Frame', 'A diamond border for your avatar', '/images/frames/diamond.png', 'level', '{"level": 100}', 'legendary', 5);

-- Profile Themes
INSERT INTO profile_themes (slug, name, description, primary_color, secondary_color, accent_color, background_gradient, unlock_type, unlock_value, rarity, sort_order) VALUES
('default', 'Default', 'Standard dark theme', '#1a1a2e', '#16213e', '#0f3460', NULL, 'default', '{}', 'common', 0),
('ocean', 'Ocean', 'Deep blue ocean vibes', '#0077b6', '#00b4d8', '#90e0ef', '{"from": "#023e8a", "to": "#0077b6"}', 'level', '{"level": 15}', 'common', 1),
('sunset', 'Sunset', 'Warm sunset colors', '#ff6b6b', '#feca57', '#ff9ff3', '{"from": "#ff6b6b", "to": "#feca57"}', 'level', '{"level": 25}', 'rare', 2),
('forest', 'Forest', 'Nature-inspired greens', '#2d6a4f', '#40916c', '#95d5b2', '{"from": "#1b4332", "to": "#40916c"}', 'level', '{"level": 35}', 'rare', 3),
('mythic', 'Mythic', 'Ethereal cosmic theme', '#7400b8', '#6930c3', '#5390d9', '{"from": "#240046", "to": "#7400b8"}', 'level', '{"level": 75}', 'epic', 4),
('immortal', 'Immortal', 'Legendary crimson aura', '#9d0208', '#dc2f02', '#f48c06', '{"from": "#370617", "to": "#9d0208"}', 'level', '{"level": 100}', 'legendary', 5);

-- Badge Definitions
INSERT INTO badge_definitions (slug, name, description, category, rarity, unlock_criteria, xp_reward, sort_order) VALUES
-- Milestone badges
('first_match', 'First Blood', 'Complete your first match', 'milestone', 'common', '{"type": "matches_completed", "count": 1}', 25, 1),
('matches_10', 'Getting Started', 'Complete 10 matches', 'milestone', 'common', '{"type": "matches_completed", "count": 10}', 50, 2),
('matches_50', 'Regular Player', 'Complete 50 matches', 'milestone', 'rare', '{"type": "matches_completed", "count": 50}', 100, 3),
('matches_100', 'Dedicated Gamer', 'Complete 100 matches', 'milestone', 'rare', '{"type": "matches_completed", "count": 100}', 200, 4),
('matches_500', 'Veteran Player', 'Complete 500 matches', 'milestone', 'epic', '{"type": "matches_completed", "count": 500}', 500, 5),
('matches_1000', 'Legendary Grinder', 'Complete 1000 matches', 'milestone', 'legendary', '{"type": "matches_completed", "count": 1000}', 1000, 6),
-- Skill badges
('first_win', 'Victor', 'Win your first match', 'skill', 'common', '{"type": "matches_won", "count": 1}', 25, 10),
('wins_10', 'Rising Competitor', 'Win 10 matches', 'skill', 'common', '{"type": "matches_won", "count": 10}', 75, 11),
('wins_50', 'Skilled Player', 'Win 50 matches', 'skill', 'rare', '{"type": "matches_won", "count": 50}', 150, 12),
('wins_100', 'Master Competitor', 'Win 100 matches', 'skill', 'epic', '{"type": "matches_won", "count": 100}', 300, 13),
('streak_3', 'On a Roll', 'Win 3 matches in a row', 'skill', 'common', '{"type": "win_streak", "count": 3}', 50, 20),
('streak_5', 'Hot Streak', 'Win 5 matches in a row', 'skill', 'rare', '{"type": "win_streak", "count": 5}', 100, 21),
('streak_10', 'Unstoppable', 'Win 10 matches in a row', 'skill', 'epic', '{"type": "win_streak", "count": 10}', 250, 22),
-- Social badges
('first_friend', 'Friendly', 'Follow your first player', 'social', 'common', '{"type": "follows_given", "count": 1}', 10, 30),
('friends_10', 'Networker', 'Follow 10 players', 'social', 'common', '{"type": "follows_given", "count": 10}', 25, 31),
('friends_50', 'Popular', 'Follow 50 players', 'social', 'rare', '{"type": "follows_given", "count": 50}', 75, 32),
('followers_10', 'Rising Star', 'Get 10 followers', 'social', 'common', '{"type": "followers", "count": 10}', 50, 33),
('followers_100', 'Influencer', 'Get 100 followers', 'social', 'epic', '{"type": "followers", "count": 100}', 200, 34),
('clan_joined', 'Team Player', 'Join a clan', 'social', 'common', '{"type": "clan_joined", "count": 1}', 50, 35),
-- Challenge badges
('first_challenge', 'Challenger', 'Complete your first challenge', 'milestone', 'common', '{"type": "challenges_completed", "count": 1}', 50, 40),
('challenges_10', 'Serial Challenger', 'Complete 10 challenges', 'milestone', 'rare', '{"type": "challenges_completed", "count": 10}', 150, 41),
('challenges_50', 'Challenge Master', 'Complete 50 challenges', 'milestone', 'epic', '{"type": "challenges_completed", "count": 50}', 400, 42);

-- Quest Definitions
INSERT INTO quest_definitions (slug, name, description, quest_type, requirements, xp_reward, weight) VALUES
-- Daily quests
('daily_play_1', 'Play a Match', 'Participate in any match', 'daily', '{"type": "play_match", "count": 1}', 25, 100),
('daily_play_2', 'Double Feature', 'Participate in 2 matches', 'daily', '{"type": "play_match", "count": 2}', 40, 80),
('daily_play_3', 'Active Player', 'Participate in 3 matches', 'daily', '{"type": "play_match", "count": 3}', 60, 60),
('daily_win_1', 'Daily Victor', 'Win a match', 'daily', '{"type": "win_match", "count": 1}', 35, 90),
('daily_challenge', 'Daily Challenger', 'Complete a challenge', 'daily', '{"type": "challenge_complete", "count": 1}', 50, 50),
('daily_social', 'Social Hour', 'Send 5 messages', 'daily', '{"type": "send_message", "count": 5}', 20, 70),
-- Weekly quests
('weekly_play_10', 'Weekly Warrior', 'Complete 10 matches this week', 'weekly', '{"type": "play_match", "count": 10}', 150, 100),
('weekly_play_20', 'Dedicated Grinder', 'Complete 20 matches this week', 'weekly', '{"type": "play_match", "count": 20}', 250, 60),
('weekly_win_5', 'Weekly Winner', 'Win 5 matches this week', 'weekly', '{"type": "win_match", "count": 5}', 125, 80),
('weekly_win_10', 'Dominator', 'Win 10 matches this week', 'weekly', '{"type": "win_match", "count": 10}', 200, 50),
('weekly_challenge_3', 'Challenge Seeker', 'Complete 3 challenges this week', 'weekly', '{"type": "challenge_complete", "count": 3}', 175, 70),
('weekly_social', 'Community Member', 'Be active in chat (20 messages)', 'weekly', '{"type": "send_message", "count": 20}', 75, 60);
