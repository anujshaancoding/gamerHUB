-- GamerHub Focus Migration: Gaming Resume & Profile System
-- This migration removes unused features and focuses on the core profile system
-- Target: India's first platform for amateur gaming talent

-- ============================================
-- STEP 1: DROP UNUSED TABLES (in dependency order)
-- ============================================

-- Squad DNA & Mood Matching
DROP TABLE IF EXISTS public.squad_play_sessions CASCADE;
DROP TABLE IF EXISTS public.squad_dna_profiles CASCADE;
DROP TABLE IF EXISTS public.mood_play_sessions CASCADE;
DROP TABLE IF EXISTS public.mood_statuses CASCADE;

-- Creator Tools
DROP TABLE IF EXISTS public.overlay_alerts CASCADE;
DROP TABLE IF EXISTS public.stream_overlays CASCADE;
DROP TABLE IF EXISTS public.creator_analytics CASCADE;
DROP TABLE IF EXISTS public.creator_profiles CASCADE;

-- Community UGC
DROP TABLE IF EXISTS public.guide_comments CASCADE;
DROP TABLE IF EXISTS public.user_guides CASCADE;
DROP TABLE IF EXISTS public.clip_reactions CASCADE;
DROP TABLE IF EXISTS public.game_clips CASCADE;
DROP TABLE IF EXISTS public.map_callouts CASCADE;

-- Console Platforms
DROP TABLE IF EXISTS public.platform_accounts CASCADE;
DROP TABLE IF EXISTS public.gaming_platforms CASCADE;

-- Discord Integration
DROP TABLE IF EXISTS public.discord_linked_accounts CASCADE;
DROP TABLE IF EXISTS public.discord_server_links CASCADE;

-- LFG System
DROP TABLE IF EXISTS public.lfg_applications CASCADE;
DROP TABLE IF EXISTS public.lfg_posts CASCADE;
DROP TABLE IF EXISTS public.game_roles CASCADE;

-- Blog
DROP TABLE IF EXISTS public.article_comments CASCADE;
DROP TABLE IF EXISTS public.articles CASCADE;

-- Automation
DROP TABLE IF EXISTS public.automation_logs CASCADE;
DROP TABLE IF EXISTS public.automation_rules CASCADE;

-- AI Matchmaking
DROP TABLE IF EXISTS public.matchmaking_feedback CASCADE;
DROP TABLE IF EXISTS public.matchmaking_queue CASCADE;

-- Streaming
DROP TABLE IF EXISTS public.stream_chat_messages CASCADE;
DROP TABLE IF EXISTS public.stream_viewers CASCADE;
DROP TABLE IF EXISTS public.live_streams CASCADE;
DROP TABLE IF EXISTS public.streamer_profiles CASCADE;

-- Forums
DROP TABLE IF EXISTS public.forum_post_reactions CASCADE;
DROP TABLE IF EXISTS public.forum_replies CASCADE;
DROP TABLE IF EXISTS public.forum_posts CASCADE;
DROP TABLE IF EXISTS public.forum_categories CASCADE;

-- Activity Feed
DROP TABLE IF EXISTS public.activity_reactions CASCADE;
DROP TABLE IF EXISTS public.activities CASCADE;

-- Virtual Currency
DROP TABLE IF EXISTS public.currency_transactions CASCADE;
DROP TABLE IF EXISTS public.user_wallets CASCADE;

-- Battle Pass
DROP TABLE IF EXISTS public.user_battle_pass CASCADE;
DROP TABLE IF EXISTS public.battle_pass_rewards CASCADE;
DROP TABLE IF EXISTS public.battle_passes CASCADE;

-- Complex Payments (keep simple premium)
DROP TABLE IF EXISTS public.payment_methods CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.payment_history CASCADE;

-- Social Suggestions
DROP TABLE IF EXISTS public.user_suggestions CASCADE;
DROP TABLE IF EXISTS public.suggestion_dismissals CASCADE;

-- Complex Friends System (keep follows only)
DROP TABLE IF EXISTS public.friend_requests CASCADE;
DROP TABLE IF EXISTS public.friendships CASCADE;
DROP TABLE IF EXISTS public.blocked_users CASCADE;

-- Calls
DROP TABLE IF EXISTS public.call_participants CASCADE;
DROP TABLE IF EXISTS public.calls CASCADE;

-- Clans
DROP TABLE IF EXISTS public.clan_events CASCADE;
DROP TABLE IF EXISTS public.clan_invites CASCADE;
DROP TABLE IF EXISTS public.clan_members CASCADE;
DROP TABLE IF EXISTS public.clans CASCADE;

-- Tournaments
DROP TABLE IF EXISTS public.tournament_matches CASCADE;
DROP TABLE IF EXISTS public.tournament_teams CASCADE;
DROP TABLE IF EXISTS public.tournament_registrations CASCADE;
DROP TABLE IF EXISTS public.tournaments CASCADE;

-- Leaderboards (remove complex ones)
DROP TABLE IF EXISTS public.leaderboard_entries CASCADE;
DROP TABLE IF EXISTS public.leaderboards CASCADE;

-- Complex Gamification (simplify)
DROP TABLE IF EXISTS public.user_badge_showcase CASCADE;
DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.badges CASCADE;
DROP TABLE IF EXISTS public.user_titles CASCADE;
DROP TABLE IF EXISTS public.titles CASCADE;
DROP TABLE IF EXISTS public.user_progression CASCADE;
DROP TABLE IF EXISTS public.xp_transactions CASCADE;
DROP TABLE IF EXISTS public.daily_challenges CASCADE;
DROP TABLE IF EXISTS public.user_daily_challenges CASCADE;

-- Messages (remove for now - focus on profile)
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversation_participants CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;

-- Challenges & Matches (remove for now)
DROP TABLE IF EXISTS public.match_participants CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.challenges CASCADE;

-- ============================================
-- STEP 2: ENHANCE CORE TABLES
-- ============================================

-- Add premium status to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS premium_since TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS premium_tier VARCHAR(20) DEFAULT NULL CHECK (premium_tier IN ('basic', 'pro', 'elite')),
ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_matches_played INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reputation_score DECIMAL(3,2) DEFAULT 0.00;

-- ============================================
-- STEP 3: SIMPLIFIED BADGE SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS public.profile_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  category VARCHAR(30) NOT NULL CHECK (category IN ('achievement', 'trust', 'premium', 'skill', 'community', 'special')),
  rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  points INTEGER DEFAULT 0,
  requirement_type VARCHAR(30), -- 'matches_played', 'rating_received', 'games_linked', etc.
  requirement_value INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_profile_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.profile_badges(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  is_featured BOOLEAN DEFAULT false, -- Show on profile
  UNIQUE(user_id, badge_id)
);

-- ============================================
-- STEP 4: ENHANCED PEER RATING SYSTEM
-- ============================================

-- Drop old ratings and create enhanced version
DROP TABLE IF EXISTS public.ratings CASCADE;

CREATE TABLE public.peer_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rated_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Positive-only ratings (1-5 scale, tick marks)
  teamwork INTEGER CHECK (teamwork BETWEEN 1 AND 5),
  communication INTEGER CHECK (communication BETWEEN 1 AND 5),
  skill_level INTEGER CHECK (skill_level BETWEEN 1 AND 5),
  reliability INTEGER CHECK (reliability BETWEEN 1 AND 5),
  sportsmanship INTEGER CHECK (sportsmanship BETWEEN 1 AND 5),

  -- Context
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  played_as VARCHAR(20) CHECK (played_as IN ('teammate', 'opponent')),

  -- Optional positive comment only
  positive_note TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One rating per rater-rated pair per month
  UNIQUE(rater_id, rated_id)
);

-- ============================================
-- STEP 5: SIMPLE PREMIUM SUBSCRIPTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.premium_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('basic', 'pro', 'elite')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),

  -- Payment info (Razorpay for India)
  payment_provider VARCHAR(20) DEFAULT 'razorpay',
  external_subscription_id VARCHAR(200),

  -- Dates
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 6: PROFILE VIEW TRACKING (for premium analytics)
-- ============================================

CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  source VARCHAR(30) CHECK (source IN ('search', 'direct', 'share', 'recommendation')),
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 7: INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profile_badges_category ON profile_badges(category);
CREATE INDEX IF NOT EXISTS idx_user_profile_badges_user ON user_profile_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_badges_featured ON user_profile_badges(user_id) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_peer_ratings_rated ON peer_ratings(rated_id);
CREATE INDEX IF NOT EXISTS idx_peer_ratings_rater ON peer_ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_peer_ratings_game ON peer_ratings(game_id);

CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_user ON premium_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_status ON premium_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_profile_views_profile ON profile_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_date ON profile_views(viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_premium ON profiles(is_premium) WHERE is_premium = true;
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_profiles_reputation ON profiles(reputation_score DESC);

-- ============================================
-- STEP 8: ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profile_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Profile badges: Everyone can read
CREATE POLICY "Profile badges are viewable by everyone"
  ON profile_badges FOR SELECT USING (true);

-- User profile badges: Everyone can read
CREATE POLICY "User badges are viewable by everyone"
  ON user_profile_badges FOR SELECT USING (true);

-- Peer ratings: Everyone can read
CREATE POLICY "Peer ratings are viewable by everyone"
  ON peer_ratings FOR SELECT USING (true);

-- Peer ratings: Users can rate others
CREATE POLICY "Users can rate others"
  ON peer_ratings FOR INSERT
  WITH CHECK (auth.uid() = rater_id AND auth.uid() != rated_id);

-- Peer ratings: Users can update their own ratings
CREATE POLICY "Users can update their ratings"
  ON peer_ratings FOR UPDATE
  USING (auth.uid() = rater_id);

-- Premium subscriptions: Users can view their own
CREATE POLICY "Users can view their subscription"
  ON premium_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Profile views: Users can view their own analytics
CREATE POLICY "Users can view their profile analytics"
  ON profile_views FOR SELECT
  USING (auth.uid() = profile_id);

-- Profile views: Anyone can log a view
CREATE POLICY "Anyone can log profile views"
  ON profile_views FOR INSERT
  WITH CHECK (true);

-- ============================================
-- STEP 9: FUNCTIONS & TRIGGERS
-- ============================================

-- Update reputation score based on ratings
CREATE OR REPLACE FUNCTION update_reputation_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET reputation_score = (
    SELECT ROUND(AVG(
      (COALESCE(teamwork, 0) + COALESCE(communication, 0) +
       COALESCE(skill_level, 0) + COALESCE(reliability, 0) +
       COALESCE(sportsmanship, 0)) / 5.0
    )::numeric, 2)
    FROM peer_ratings
    WHERE rated_id = NEW.rated_id
  )
  WHERE id = NEW.rated_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_peer_rating_change
  AFTER INSERT OR UPDATE ON peer_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_reputation_score();

-- Increment profile views
CREATE OR REPLACE FUNCTION increment_profile_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET profile_views = profile_views + 1
  WHERE id = NEW.profile_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_view
  AFTER INSERT ON profile_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_profile_views();

-- Auto-award badges based on achievements
CREATE OR REPLACE FUNCTION check_badge_eligibility()
RETURNS TRIGGER AS $$
DECLARE
  v_badge RECORD;
BEGIN
  -- Check each badge requirement
  FOR v_badge IN
    SELECT * FROM profile_badges
    WHERE requirement_type IS NOT NULL AND is_active = true
  LOOP
    -- Check if user already has this badge
    IF NOT EXISTS (
      SELECT 1 FROM user_profile_badges
      WHERE user_id = NEW.id AND badge_id = v_badge.id
    ) THEN
      -- Check specific requirements
      IF v_badge.requirement_type = 'games_linked' THEN
        IF (SELECT COUNT(*) FROM user_games WHERE user_id = NEW.id) >= v_badge.requirement_value THEN
          INSERT INTO user_profile_badges (user_id, badge_id) VALUES (NEW.id, v_badge.id);
        END IF;
      ELSIF v_badge.requirement_type = 'profile_views' THEN
        IF NEW.profile_views >= v_badge.requirement_value THEN
          INSERT INTO user_profile_badges (user_id, badge_id) VALUES (NEW.id, v_badge.id);
        END IF;
      ELSIF v_badge.requirement_type = 'reputation_score' THEN
        IF NEW.reputation_score >= v_badge.requirement_value THEN
          INSERT INTO user_profile_badges (user_id, badge_id) VALUES (NEW.id, v_badge.id);
        END IF;
      END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_update_check_badges
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_badge_eligibility();

-- ============================================
-- STEP 10: SEED BADGES
-- ============================================

INSERT INTO profile_badges (name, display_name, description, category, rarity, points, requirement_type, requirement_value) VALUES
-- Trust Badges
('verified_player', 'Verified Player', 'Account verified with valid ID', 'trust', 'rare', 100, NULL, NULL),
('premium_member', 'Premium Member', 'Supporting GamerHub with premium subscription', 'premium', 'epic', 150, NULL, NULL),
('elite_member', 'Elite Member', 'Elite tier premium subscriber', 'premium', 'legendary', 300, NULL, NULL),

-- Achievement Badges
('first_game', 'First Link', 'Linked your first game account', 'achievement', 'common', 10, 'games_linked', 1),
('multi_gamer', 'Multi-Gamer', 'Linked 3 game accounts', 'achievement', 'uncommon', 25, 'games_linked', 3),
('gaming_arsenal', 'Gaming Arsenal', 'Linked 5+ game accounts', 'achievement', 'rare', 50, 'games_linked', 5),
('rising_star', 'Rising Star', 'Profile viewed 100+ times', 'achievement', 'uncommon', 30, 'profile_views', 100),
('spotlight', 'In The Spotlight', 'Profile viewed 500+ times', 'achievement', 'rare', 75, 'profile_views', 500),
('celebrity', 'Gaming Celebrity', 'Profile viewed 1000+ times', 'achievement', 'epic', 150, 'profile_views', 1000),

-- Skill Badges
('trusted_player', 'Trusted Player', 'Reputation score above 4.0', 'skill', 'rare', 100, 'reputation_score', 4),
('exemplary', 'Exemplary Gamer', 'Reputation score of 4.5+', 'skill', 'epic', 200, 'reputation_score', 4.5),

-- Community Badges
('early_adopter', 'Early Adopter', 'Joined during beta phase', 'special', 'legendary', 250, NULL, NULL),
('pioneer', 'Indian Gaming Pioneer', 'Among first 1000 users', 'special', 'legendary', 300, NULL, NULL)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- STEP 11: UPDATE GAMES FOR INDIAN MARKET
-- ============================================

-- Add BGMI (popular in India)
INSERT INTO games (slug, name, icon_url, has_api, ranks, roles) VALUES
  ('bgmi', 'Battlegrounds Mobile India', '/images/games/bgmi.png', false,
   '["Bronze","Silver","Gold","Platinum","Diamond","Crown","Ace","Ace Master","Ace Dominator","Conqueror"]',
   '["Fragger","Support","Driver","Scout","IGL"]')
ON CONFLICT (slug) DO NOTHING;

-- Add Free Fire (huge in India)
UPDATE games SET
  ranks = '["Bronze I","Bronze II","Bronze III","Silver I","Silver II","Silver III","Gold I","Gold II","Gold III","Gold IV","Platinum I","Platinum II","Platinum III","Platinum IV","Diamond I","Diamond II","Diamond III","Diamond IV","Heroic","Grandmaster"]'
WHERE slug = 'freefire';
