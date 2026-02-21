-- ============================================
-- Exclusive Titles & Frames for Premium Members
-- ============================================
-- Recreates the titles table (dropped by 999_cleanup)
-- and adds special titles and frames for early adopters,
-- beta testers, and achievement-based rewards.

-- Recreate titles table (was dropped by 999_cleanup_and_focus.sql)
CREATE TABLE IF NOT EXISTS public.titles (
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

-- Recreate user_titles table (was dropped by 999_cleanup_and_focus.sql)
CREATE TABLE IF NOT EXISTS public.user_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title_id UUID REFERENCES public.titles(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, title_id)
);

-- Enable RLS
ALTER TABLE public.titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_titles ENABLE ROW LEVEL SECURITY;

-- Titles are readable by everyone
CREATE POLICY "titles_select" ON public.titles FOR SELECT USING (true);

-- User titles: users can read their own, system inserts
CREATE POLICY "user_titles_select" ON public.user_titles FOR SELECT USING (true);
CREATE POLICY "user_titles_insert" ON public.user_titles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seed base titles (from original 004 migration)
INSERT INTO public.titles (slug, name, description, unlock_type, unlock_value, rarity, color, sort_order) VALUES
('newcomer', 'Newcomer', 'Welcome to GamerHub!', 'level', '{"level": 5}', 'common', NULL, 1),
('rising_star', 'Rising Star', 'Making progress!', 'level', '{"level": 10}', 'common', '#FFD700', 2),
('veteran', 'Veteran', 'A seasoned player', 'level', '{"level": 20}', 'rare', '#4169E1', 3),
('elite', 'Elite', 'Among the best', 'level', '{"level": 30}', 'rare', '#9400D3', 4),
('champion', 'Champion', 'A true champion', 'level', '{"level": 40}', 'epic', '#FF4500', 5),
('legend', 'Legend', 'Legendary status achieved', 'level', '{"level": 50}', 'epic', '#FF1493', 6),
('mythic', 'Mythic', 'Mythical prowess', 'level', '{"level": 75}', 'legendary', '#00CED1', 7),
('immortal', 'Immortal', 'Beyond mortal limits', 'level', '{"level": 100}', 'legendary', '#DC143C', 8),
('social_butterfly', 'Social Butterfly', 'Made 50 friends', 'achievement', '{"type": "follows", "count": 50}', 'rare', '#FF69B4', 10),
('streak_master', 'Streak Master', 'Win 10 matches in a row', 'achievement', '{"type": "win_streak", "count": 10}', 'epic', '#FF8C00', 11)
ON CONFLICT (slug) DO NOTHING;

-- Exclusive Titles for early adopters and special achievements (Premium-only)
INSERT INTO public.titles (slug, name, description, unlock_type, unlock_value, rarity, color, sort_order) VALUES
('pioneer', 'Pioneer', 'Among the first to join GamerHub', 'special', '{"type": "early_registration"}', 'legendary', '#FFD700', 20),
('founding_member', 'Founding Member', 'Joined during the beta phase', 'special', '{"type": "beta_user"}', 'epic', '#C0C0C0', 21),
('early_bird', 'Early Bird', 'Registered in the early days', 'special', '{"type": "early_registration"}', 'rare', '#00CED1', 22),
('trailblazer', 'Trailblazer', 'Paving the way for the community', 'special', '{"type": "community_pioneer"}', 'epic', '#FF6347', 23),
('og_gamer', 'OG Gamer', 'An original GamerHub member', 'special', '{"type": "original_member"}', 'legendary', '#E040FB', 24),
('first_blood', 'First Blood', 'Won their very first match', 'special', '{"type": "first_win"}', 'rare', '#DC143C', 25),
('clan_founder', 'Clan Founder', 'Founded a clan on GamerHub', 'special', '{"type": "clan_creation"}', 'rare', '#4169E1', 26),
('content_creator', 'Content Creator', 'Published 10+ blog posts', 'special', '{"type": "blog_posts", "count": 10}', 'epic', '#FF8C00', 27)
ON CONFLICT (slug) DO NOTHING;

-- Exclusive Frames (profile_frames table still exists, just adding new rows)
INSERT INTO public.profile_frames (slug, name, description, image_url, unlock_type, unlock_value, rarity, sort_order) VALUES
('pioneer_frame', 'Pioneer Frame', 'Exclusive golden frame for early adopters', '/images/frames/pioneer.png', 'special', '{"type": "early_registration"}', 'legendary', 10),
('beta_frame', 'Beta Tester Frame', 'Awarded to beta testers who helped shape GamerHub', '/images/frames/beta.png', 'special', '{"type": "beta_user"}', 'epic', 11),
('fire_frame', 'Flame Frame', 'A fiery border for hot gamers with win streaks', '/images/frames/fire.png', 'special', '{"type": "win_streak", "count": 5}', 'rare', 12),
('neon_frame', 'Neon Glow Frame', 'Vibrant neon border that lights up your profile', '/images/frames/neon.png', 'special', '{"type": "level", "level": 25}', 'epic', 13),
('cosmic_frame', 'Cosmic Frame', 'Stars and galaxies surround your avatar', '/images/frames/cosmic.png', 'special', '{"type": "level", "level": 50}', 'legendary', 14)
ON CONFLICT (slug) DO NOTHING;
