-- Community & UGC Features
-- Migration 024

-- ============================================
-- GUIDES / TUTORIALS
-- ============================================
CREATE TABLE public.guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  -- Content
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  content_type VARCHAR(20) DEFAULT 'guide' CHECK (content_type IN ('guide', 'tutorial', 'tier_list', 'build', 'tips')),
  -- Media
  thumbnail_url TEXT,
  video_url TEXT,
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  estimated_read_time INTEGER, -- minutes
  -- Engagement
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  bookmark_count INTEGER DEFAULT 0,
  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'under_review')),
  is_featured BOOLEAN DEFAULT false,
  featured_at TIMESTAMPTZ,
  -- Timestamps
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.guide_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID REFERENCES public.guides(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(200),
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.guide_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID REFERENCES public.guides(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guide_id, user_id)
);

CREATE TABLE public.guide_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID REFERENCES public.guides(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guide_id, user_id)
);

-- ============================================
-- CLIPS / HIGHLIGHTS
-- ============================================
CREATE TABLE public.clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  -- Content
  title VARCHAR(200) NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  -- Video metadata
  duration_seconds INTEGER,
  width INTEGER,
  height INTEGER,
  -- Source
  source_platform VARCHAR(30), -- 'upload', 'twitch', 'youtube', 'medal'
  source_url TEXT,
  -- Engagement
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.clip_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id UUID REFERENCES public.clips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'fire', 'poggers', 'insane', 'gg', 'sad')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clip_id, user_id, reaction_type)
);

-- ============================================
-- COMMUNITY POLLS
-- ============================================
CREATE TABLE public.community_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  -- Content
  question TEXT NOT NULL,
  description TEXT,
  poll_type VARCHAR(20) DEFAULT 'single' CHECK (poll_type IN ('single', 'multiple')),
  options JSONB NOT NULL, -- [{id, text, vote_count}]
  -- Settings
  total_votes INTEGER DEFAULT 0,
  max_choices INTEGER DEFAULT 1, -- For multiple choice
  allow_add_options BOOLEAN DEFAULT false,
  is_anonymous BOOLEAN DEFAULT false,
  show_results_before_vote BOOLEAN DEFAULT false,
  -- Timing
  ends_at TIMESTAMPTZ,
  is_closed BOOLEAN DEFAULT false,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES public.community_polls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  option_ids TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- ============================================
-- COMMUNITY EVENTS
-- ============================================
CREATE TABLE public.community_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  -- Content
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('meetup', 'watch_party', 'community_night', 'ama', 'tournament_watch', 'game_night', 'other')),
  -- Media
  banner_url TEXT,
  thumbnail_url TEXT,
  -- Timing
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  timezone VARCHAR(50) DEFAULT 'UTC',
  -- Location
  location_type VARCHAR(20) DEFAULT 'online' CHECK (location_type IN ('online', 'in_person', 'hybrid')),
  location_details TEXT,
  online_link TEXT,
  -- Capacity
  max_attendees INTEGER,
  rsvp_count INTEGER DEFAULT 0,
  interested_count INTEGER DEFAULT 0,
  -- Settings
  is_public BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  allow_plus_one BOOLEAN DEFAULT false,
  -- Tags
  tags TEXT[] DEFAULT '{}',
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.community_events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(20) DEFAULT 'going' CHECK (status IN ('going', 'interested', 'not_going')),
  plus_one INTEGER DEFAULT 0,
  notes TEXT,
  approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- ============================================
-- MEME GALLERY
-- ============================================
CREATE TABLE public.memes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  -- Content
  title VARCHAR(200),
  image_url TEXT NOT NULL,
  source_url TEXT, -- Original source if shared
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  is_nsfw BOOLEAN DEFAULT false,
  -- Engagement
  like_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  -- Status
  is_public BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT true, -- For moderation
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.meme_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meme_id UUID REFERENCES public.memes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meme_id, user_id)
);

-- ============================================
-- COMMUNITY ACHIEVEMENTS
-- ============================================
CREATE TABLE public.community_achievement_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  category VARCHAR(30) NOT NULL CHECK (category IN ('content_creator', 'helper', 'social', 'engagement', 'special')),
  -- Unlock criteria
  unlock_criteria JSONB NOT NULL, -- {type: 'guides_published', count: 5}
  -- Rewards
  points INTEGER DEFAULT 10,
  xp_reward INTEGER DEFAULT 0,
  badge_id UUID, -- Link to badge system
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_secret BOOLEAN DEFAULT false,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_community_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES public.community_achievement_definitions(id) ON DELETE CASCADE NOT NULL,
  progress JSONB DEFAULT '{}', -- Track progress toward achievement
  earned_at TIMESTAMPTZ,
  is_earned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ============================================
-- COMMENTS (Shared across content types)
-- ============================================
CREATE TABLE public.content_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Polymorphic reference
  content_type VARCHAR(30) NOT NULL, -- 'guide', 'clip', 'meme', 'event'
  content_id UUID NOT NULL,
  -- Content
  body TEXT NOT NULL,
  -- Threading
  parent_id UUID REFERENCES public.content_comments(id) ON DELETE CASCADE,
  reply_count INTEGER DEFAULT 0,
  -- Engagement
  like_count INTEGER DEFAULT 0,
  -- Status
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES public.content_comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_guides_author ON guides(author_id);
CREATE INDEX idx_guides_game ON guides(game_id);
CREATE INDEX idx_guides_status ON guides(status);
CREATE INDEX idx_guides_featured ON guides(is_featured) WHERE is_featured = true;
CREATE INDEX idx_guides_slug ON guides(slug);
CREATE INDEX idx_guides_created ON guides(created_at DESC);

CREATE INDEX idx_guide_sections_guide ON guide_sections(guide_id);
CREATE INDEX idx_guide_likes_guide ON guide_likes(guide_id);
CREATE INDEX idx_guide_likes_user ON guide_likes(user_id);

CREATE INDEX idx_clips_creator ON clips(creator_id);
CREATE INDEX idx_clips_game ON clips(game_id);
CREATE INDEX idx_clips_public ON clips(is_public) WHERE is_public = true;
CREATE INDEX idx_clips_created ON clips(created_at DESC);

CREATE INDEX idx_clip_reactions_clip ON clip_reactions(clip_id);
CREATE INDEX idx_clip_reactions_user ON clip_reactions(user_id);

CREATE INDEX idx_polls_creator ON community_polls(creator_id);
CREATE INDEX idx_polls_game ON community_polls(game_id);
CREATE INDEX idx_polls_active ON community_polls(is_closed) WHERE is_closed = false;

CREATE INDEX idx_poll_votes_poll ON poll_votes(poll_id);
CREATE INDEX idx_poll_votes_user ON poll_votes(user_id);

CREATE INDEX idx_events_creator ON community_events(creator_id);
CREATE INDEX idx_events_game ON community_events(game_id);
CREATE INDEX idx_events_starts ON community_events(starts_at);
CREATE INDEX idx_events_public ON community_events(is_public) WHERE is_public = true;

CREATE INDEX idx_event_rsvps_event ON event_rsvps(event_id);
CREATE INDEX idx_event_rsvps_user ON event_rsvps(user_id);

CREATE INDEX idx_memes_creator ON memes(creator_id);
CREATE INDEX idx_memes_game ON memes(game_id);
CREATE INDEX idx_memes_public ON memes(is_public) WHERE is_public = true;
CREATE INDEX idx_memes_created ON memes(created_at DESC);

CREATE INDEX idx_community_achievements_slug ON community_achievement_definitions(slug);
CREATE INDEX idx_user_community_achievements_user ON user_community_achievements(user_id);
CREATE INDEX idx_user_community_achievements_earned ON user_community_achievements(is_earned) WHERE is_earned = true;

CREATE INDEX idx_content_comments_content ON content_comments(content_type, content_id);
CREATE INDEX idx_content_comments_user ON content_comments(user_id);
CREATE INDEX idx_content_comments_parent ON content_comments(parent_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Guides
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published guides are viewable by everyone"
  ON guides FOR SELECT
  USING (status = 'published' OR author_id = auth.uid());

CREATE POLICY "Users can create guides"
  ON guides FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their guides"
  ON guides FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Authors can delete their guides"
  ON guides FOR DELETE
  USING (author_id = auth.uid());

-- Guide Sections
ALTER TABLE guide_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guide sections follow guide visibility"
  ON guide_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM guides g
      WHERE g.id = guide_sections.guide_id
      AND (g.status = 'published' OR g.author_id = auth.uid())
    )
  );

CREATE POLICY "Authors can manage guide sections"
  ON guide_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM guides g
      WHERE g.id = guide_sections.guide_id
      AND g.author_id = auth.uid()
    )
  );

-- Clips
ALTER TABLE clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public clips are viewable by everyone"
  ON clips FOR SELECT
  USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Users can create clips"
  ON clips FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their clips"
  ON clips FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "Creators can delete their clips"
  ON clips FOR DELETE
  USING (creator_id = auth.uid());

-- Polls
ALTER TABLE community_polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Polls are viewable by everyone"
  ON community_polls FOR SELECT
  USING (true);

CREATE POLICY "Users can create polls"
  ON community_polls FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their polls"
  ON community_polls FOR UPDATE
  USING (creator_id = auth.uid());

-- Events
ALTER TABLE community_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public events are viewable by everyone"
  ON community_events FOR SELECT
  USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Users can create events"
  ON community_events FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their events"
  ON community_events FOR UPDATE
  USING (creator_id = auth.uid());

-- Memes
ALTER TABLE memes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved public memes are viewable"
  ON memes FOR SELECT
  USING ((is_public = true AND is_approved = true) OR creator_id = auth.uid());

CREATE POLICY "Users can create memes"
  ON memes FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can manage their memes"
  ON memes FOR ALL
  USING (creator_id = auth.uid());

-- Comments
ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Non-deleted comments are viewable"
  ON content_comments FOR SELECT
  USING (is_deleted = false);

CREATE POLICY "Users can create comments"
  ON content_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their comments"
  ON content_comments FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_guides_updated_at
  BEFORE UPDATE ON guides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_events_updated_at
  BEFORE UPDATE ON community_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_rsvps_updated_at
  BEFORE UPDATE ON event_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_comments_updated_at
  BEFORE UPDATE ON content_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: Community Achievements
-- ============================================
INSERT INTO community_achievement_definitions (slug, name, description, category, unlock_criteria, points, xp_reward) VALUES
  ('first_guide', 'Tutorial Titan', 'Publish your first guide', 'content_creator', '{"type": "guides_published", "count": 1}', 50, 200),
  ('guide_master', 'Guide Guru', 'Publish 10 guides', 'content_creator', '{"type": "guides_published", "count": 10}', 200, 1000),
  ('first_clip', 'Clip Creator', 'Upload your first clip', 'content_creator', '{"type": "clips_uploaded", "count": 1}', 25, 100),
  ('viral_clip', 'Going Viral', 'Get 1000 views on a clip', 'engagement', '{"type": "clip_views", "count": 1000}', 100, 500),
  ('helpful_commenter', 'Helpful Hand', 'Leave 50 comments', 'helper', '{"type": "comments_made", "count": 50}', 75, 300),
  ('event_organizer', 'Event Planner', 'Host 5 community events', 'social', '{"type": "events_hosted", "count": 5}', 150, 750),
  ('poll_master', 'Voice of the People', 'Create 10 community polls', 'social', '{"type": "polls_created", "count": 10}', 100, 400),
  ('meme_lord', 'Meme Lord', 'Get 500 likes on memes', 'engagement', '{"type": "meme_likes", "count": 500}', 150, 600);
