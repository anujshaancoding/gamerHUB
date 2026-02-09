-- Migration: 011_activity_feed.sql
-- Activity feed system with social activities, news posts, and reactions

-- ============================================
-- ACTIVITY FEED ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
    'match_completed', 'match_created', 'tournament_joined', 'tournament_won',
    'challenge_completed', 'badge_earned', 'level_up', 'title_unlocked',
    'clan_joined', 'clan_created', 'friend_added', 'achievement_unlocked',
    'battle_pass_tier', 'season_rank', 'media_uploaded', 'profile_updated'
  )),
  target_type VARCHAR(50), -- 'match', 'tournament', 'clan', 'user', 'badge', etc
  target_id UUID,
  metadata JSONB DEFAULT '{}', -- activity-specific data
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'friends', 'private')),
  is_highlighted BOOLEAN DEFAULT false,
  reaction_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NEWS/ANNOUNCEMENTS FROM ADMINS
-- ============================================
CREATE TABLE IF NOT EXISTS public.news_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  banner_url TEXT,
  post_type VARCHAR(30) DEFAULT 'news' CHECK (post_type IN ('news', 'update', 'event', 'maintenance', 'feature')),
  is_pinned BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  tags JSONB DEFAULT '[]',
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FEED REACTIONS (LIKES, ETC)
-- ============================================
CREATE TABLE IF NOT EXISTS public.activity_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_id UUID REFERENCES public.activity_feed(id) ON DELETE CASCADE NOT NULL,
  reaction_type VARCHAR(20) DEFAULT 'like' CHECK (reaction_type IN ('like', 'celebrate', 'fire', 'gg')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, activity_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON activity_feed(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_visibility ON activity_feed(visibility);
CREATE INDEX IF NOT EXISTS idx_activity_feed_highlighted ON activity_feed(is_highlighted) WHERE is_highlighted = true;
CREATE INDEX IF NOT EXISTS idx_news_posts_published ON news_posts(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_posts_pinned ON news_posts(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_activity_reactions_activity ON activity_reactions(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_reactions_user ON activity_reactions(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Activity Feed RLS
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public activities" ON public.activity_feed
  FOR SELECT USING (
    visibility = 'public'
    OR user_id = auth.uid()
    OR (visibility = 'friends' AND EXISTS (
      SELECT 1 FROM public.follows
      WHERE follower_id = auth.uid() AND following_id = activity_feed.user_id
    ))
  );

CREATE POLICY "Users can create own activities" ON public.activity_feed
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage activities" ON public.activity_feed
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- News Posts RLS
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published news" ON public.news_posts
  FOR SELECT USING (is_published = true);

CREATE POLICY "Service role can manage news" ON public.news_posts
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Activity Reactions RLS
ALTER TABLE public.activity_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions" ON public.activity_reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own reactions" ON public.activity_reactions
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to create activity feed item
CREATE OR REPLACE FUNCTION create_activity(
  p_user_id UUID,
  p_activity_type VARCHAR(50),
  p_target_type VARCHAR(50) DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_visibility VARCHAR(20) DEFAULT 'public'
) RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO public.activity_feed (
    user_id, activity_type, target_type, target_id, metadata, visibility
  ) VALUES (
    p_user_id, p_activity_type, p_target_type, p_target_id, p_metadata, p_visibility
  )
  RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle reaction
CREATE OR REPLACE FUNCTION toggle_activity_reaction(
  p_user_id UUID,
  p_activity_id UUID,
  p_reaction_type VARCHAR(20) DEFAULT 'like'
) RETURNS JSONB AS $$
DECLARE
  v_existing RECORD;
BEGIN
  -- Check if reaction exists
  SELECT * INTO v_existing
  FROM public.activity_reactions
  WHERE user_id = p_user_id AND activity_id = p_activity_id;

  IF FOUND THEN
    -- Remove reaction
    DELETE FROM public.activity_reactions
    WHERE user_id = p_user_id AND activity_id = p_activity_id;

    -- Update count
    UPDATE public.activity_feed
    SET reaction_count = GREATEST(0, reaction_count - 1)
    WHERE id = p_activity_id;

    RETURN jsonb_build_object('action', 'removed', 'reaction_type', v_existing.reaction_type);
  ELSE
    -- Add reaction
    INSERT INTO public.activity_reactions (user_id, activity_id, reaction_type)
    VALUES (p_user_id, p_activity_id, p_reaction_type);

    -- Update count
    UPDATE public.activity_feed
    SET reaction_count = reaction_count + 1
    WHERE id = p_activity_id;

    RETURN jsonb_build_object('action', 'added', 'reaction_type', p_reaction_type);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create activities on various events
-- Example: Badge earned
CREATE OR REPLACE FUNCTION create_badge_earned_activity()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_activity(
    NEW.user_id,
    'badge_earned',
    'badge',
    NEW.badge_id,
    jsonb_build_object('badge_id', NEW.badge_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if user_badges table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_badges') THEN
    DROP TRIGGER IF EXISTS trigger_badge_earned_activity ON public.user_badges;
    CREATE TRIGGER trigger_badge_earned_activity
      AFTER INSERT ON public.user_badges
      FOR EACH ROW
      EXECUTE FUNCTION create_badge_earned_activity();
  END IF;
END $$;

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_reactions;

-- ============================================
-- SEED DATA: Sample News Posts
-- ============================================
INSERT INTO public.news_posts (
  title, content, excerpt, post_type, is_pinned, is_published, published_at
)
VALUES
  (
    'Welcome to GamerHub!',
    'We''re excited to launch GamerHub, your new home for competitive gaming. Connect with players, join clans, compete in tournaments, and climb the leaderboards!\n\n## What''s New\n- **Matchmaking**: Find players who match your skill level\n- **Clans**: Create or join a clan and compete together\n- **Tournaments**: Participate in organized competitions\n- **Battle Pass**: Earn exclusive rewards as you play\n\nStart exploring and let us know what you think!',
    'Your new home for competitive gaming is here.',
    'news',
    true,
    true,
    NOW()
  ),
  (
    'Season 1 Battle Pass Now Available!',
    'Rise of Champions is here! The first-ever GamerHub Battle Pass brings you 100 levels of exclusive rewards.\n\n## Premium Rewards Include:\n- Exclusive titles and frames\n- Premium themes\n- Bonus coins and gems\n- Legendary cosmetics at level 100\n\nPurchase the Battle Pass now to start earning!',
    'Earn exclusive rewards with the Season 1 Battle Pass.',
    'feature',
    false,
    true,
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT DO NOTHING;
