-- Forums and Community Posts Migration

-- Enum for post types
CREATE TYPE forum_post_type AS ENUM ('discussion', 'question', 'guide', 'lfg', 'announcement');

-- Forum categories
CREATE TABLE forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Icon name or emoji
  color TEXT, -- Hex color for category
  game_id TEXT REFERENCES supported_games(id) ON DELETE SET NULL, -- Optional game association
  parent_id UUID REFERENCES forum_categories(id) ON DELETE CASCADE, -- For subcategories
  post_count INTEGER DEFAULT 0,
  is_locked BOOLEAN DEFAULT false, -- Only admins can post
  is_hidden BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for category lookups
CREATE INDEX idx_forum_categories_slug ON forum_categories(slug);
CREATE INDEX idx_forum_categories_game ON forum_categories(game_id) WHERE game_id IS NOT NULL;

-- Forum posts
CREATE TABLE forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL,
  content_html TEXT, -- Rendered HTML for display
  post_type forum_post_type DEFAULT 'discussion',
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false, -- No more replies allowed
  is_solved BOOLEAN DEFAULT false, -- For questions
  solved_reply_id UUID, -- The reply that solved the question
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  vote_score INTEGER DEFAULT 0,
  last_reply_at TIMESTAMPTZ,
  last_reply_by UUID REFERENCES profiles(id),
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

-- Indexes for post lookups
CREATE INDEX idx_forum_posts_category ON forum_posts(category_id, is_deleted, created_at DESC);
CREATE INDEX idx_forum_posts_author ON forum_posts(author_id, is_deleted);
CREATE INDEX idx_forum_posts_pinned ON forum_posts(category_id, is_pinned DESC, last_reply_at DESC);
CREATE INDEX idx_forum_posts_type ON forum_posts(post_type) WHERE NOT is_deleted;
CREATE INDEX idx_forum_posts_tags ON forum_posts USING GIN(tags) WHERE NOT is_deleted;

-- Forum replies
CREATE TABLE forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE, -- For nested replies
  content TEXT NOT NULL,
  content_html TEXT,
  vote_score INTEGER DEFAULT 0,
  is_solution BOOLEAN DEFAULT false, -- Marked as solution for questions
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for reply lookups
CREATE INDEX idx_forum_replies_post ON forum_replies(post_id, is_deleted, created_at);
CREATE INDEX idx_forum_replies_author ON forum_replies(author_id, is_deleted);
CREATE INDEX idx_forum_replies_parent ON forum_replies(parent_id) WHERE parent_id IS NOT NULL;

-- Forum votes (for posts and replies)
CREATE TABLE forum_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  vote_type SMALLINT NOT NULL CHECK (vote_type IN (-1, 1)), -- -1 downvote, 1 upvote
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, reply_id),
  CHECK ((post_id IS NOT NULL AND reply_id IS NULL) OR (post_id IS NULL AND reply_id IS NOT NULL))
);

-- Indexes for vote lookups
CREATE INDEX idx_forum_votes_post ON forum_votes(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX idx_forum_votes_reply ON forum_votes(reply_id) WHERE reply_id IS NOT NULL;

-- Forum subscriptions (follow posts/categories)
CREATE TABLE forum_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES forum_categories(id) ON DELETE CASCADE,
  notify_replies BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, category_id),
  CHECK ((post_id IS NOT NULL AND category_id IS NULL) OR (post_id IS NULL AND category_id IS NOT NULL))
);

-- Index for subscription lookups
CREATE INDEX idx_forum_subscriptions_user ON forum_subscriptions(user_id);
CREATE INDEX idx_forum_subscriptions_post ON forum_subscriptions(post_id) WHERE post_id IS NOT NULL;

-- Enable RLS
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forum_categories (public read)
CREATE POLICY "Anyone can view categories"
  ON forum_categories FOR SELECT
  USING (NOT is_hidden);

-- RLS Policies for forum_posts
CREATE POLICY "Anyone can view non-deleted posts"
  ON forum_posts FOR SELECT
  USING (NOT is_deleted);

CREATE POLICY "Authenticated users can create posts"
  ON forum_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their posts"
  ON forum_posts FOR UPDATE
  USING (auth.uid() = author_id AND NOT is_deleted);

CREATE POLICY "Authors can soft delete their posts"
  ON forum_posts FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (is_deleted = true);

-- RLS Policies for forum_replies
CREATE POLICY "Anyone can view non-deleted replies"
  ON forum_replies FOR SELECT
  USING (NOT is_deleted);

CREATE POLICY "Authenticated users can create replies"
  ON forum_replies FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their replies"
  ON forum_replies FOR UPDATE
  USING (auth.uid() = author_id AND NOT is_deleted);

-- RLS Policies for forum_votes
CREATE POLICY "Users can view their own votes"
  ON forum_votes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their votes"
  ON forum_votes FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for forum_subscriptions
CREATE POLICY "Users can manage their subscriptions"
  ON forum_subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_post_slug(p_title TEXT, p_category_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_base_slug TEXT;
  v_slug TEXT;
  v_counter INTEGER := 0;
BEGIN
  -- Generate base slug from title
  v_base_slug := lower(regexp_replace(p_title, '[^a-zA-Z0-9]+', '-', 'g'));
  v_base_slug := trim(both '-' from v_base_slug);
  v_base_slug := substring(v_base_slug from 1 for 100);

  v_slug := v_base_slug;

  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM forum_posts WHERE category_id = p_category_id AND slug = v_slug) LOOP
    v_counter := v_counter + 1;
    v_slug := v_base_slug || '-' || v_counter;
  END LOOP;

  RETURN v_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new post
CREATE OR REPLACE FUNCTION create_forum_post(
  p_category_id UUID,
  p_author_id UUID,
  p_title TEXT,
  p_content TEXT,
  p_post_type forum_post_type DEFAULT 'discussion',
  p_tags TEXT[] DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_slug TEXT;
  v_post_id UUID;
BEGIN
  -- Generate slug
  v_slug := generate_post_slug(p_title, p_category_id);

  -- Create post
  INSERT INTO forum_posts (category_id, author_id, title, slug, content, post_type, tags)
  VALUES (p_category_id, p_author_id, p_title, v_slug, p_content, p_post_type, p_tags)
  RETURNING id INTO v_post_id;

  -- Update category post count
  UPDATE forum_categories
  SET post_count = post_count + 1, updated_at = NOW()
  WHERE id = p_category_id;

  -- Auto-subscribe author to their post
  INSERT INTO forum_subscriptions (user_id, post_id)
  VALUES (p_author_id, v_post_id)
  ON CONFLICT DO NOTHING;

  RETURN v_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a reply
CREATE OR REPLACE FUNCTION create_forum_reply(
  p_post_id UUID,
  p_author_id UUID,
  p_content TEXT,
  p_parent_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_reply_id UUID;
BEGIN
  -- Create reply
  INSERT INTO forum_replies (post_id, author_id, content, parent_id)
  VALUES (p_post_id, p_author_id, p_content, p_parent_id)
  RETURNING id INTO v_reply_id;

  -- Update post reply count and last reply info
  UPDATE forum_posts
  SET
    reply_count = reply_count + 1,
    last_reply_at = NOW(),
    last_reply_by = p_author_id,
    updated_at = NOW()
  WHERE id = p_post_id;

  -- Auto-subscribe author to the post
  INSERT INTO forum_subscriptions (user_id, post_id)
  VALUES (p_author_id, p_post_id)
  ON CONFLICT DO NOTHING;

  RETURN v_reply_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to vote on a post or reply
CREATE OR REPLACE FUNCTION toggle_forum_vote(
  p_user_id UUID,
  p_vote_type SMALLINT,
  p_post_id UUID DEFAULT NULL,
  p_reply_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_existing_vote SMALLINT;
  v_new_score INTEGER;
BEGIN
  IF p_post_id IS NOT NULL THEN
    -- Check existing vote on post
    SELECT vote_type INTO v_existing_vote
    FROM forum_votes
    WHERE user_id = p_user_id AND post_id = p_post_id;

    IF v_existing_vote IS NOT NULL THEN
      IF v_existing_vote = p_vote_type THEN
        -- Remove vote
        DELETE FROM forum_votes WHERE user_id = p_user_id AND post_id = p_post_id;
        UPDATE forum_posts SET vote_score = vote_score - v_existing_vote WHERE id = p_post_id;
      ELSE
        -- Change vote
        UPDATE forum_votes SET vote_type = p_vote_type WHERE user_id = p_user_id AND post_id = p_post_id;
        UPDATE forum_posts SET vote_score = vote_score - v_existing_vote + p_vote_type WHERE id = p_post_id;
      END IF;
    ELSE
      -- New vote
      INSERT INTO forum_votes (user_id, post_id, vote_type) VALUES (p_user_id, p_post_id, p_vote_type);
      UPDATE forum_posts SET vote_score = vote_score + p_vote_type WHERE id = p_post_id;
    END IF;

    SELECT vote_score INTO v_new_score FROM forum_posts WHERE id = p_post_id;

  ELSIF p_reply_id IS NOT NULL THEN
    -- Check existing vote on reply
    SELECT vote_type INTO v_existing_vote
    FROM forum_votes
    WHERE user_id = p_user_id AND reply_id = p_reply_id;

    IF v_existing_vote IS NOT NULL THEN
      IF v_existing_vote = p_vote_type THEN
        DELETE FROM forum_votes WHERE user_id = p_user_id AND reply_id = p_reply_id;
        UPDATE forum_replies SET vote_score = vote_score - v_existing_vote WHERE id = p_reply_id;
      ELSE
        UPDATE forum_votes SET vote_type = p_vote_type WHERE user_id = p_user_id AND reply_id = p_reply_id;
        UPDATE forum_replies SET vote_score = vote_score - v_existing_vote + p_vote_type WHERE id = p_reply_id;
      END IF;
    ELSE
      INSERT INTO forum_votes (user_id, reply_id, vote_type) VALUES (p_user_id, p_reply_id, p_vote_type);
      UPDATE forum_replies SET vote_score = vote_score + p_vote_type WHERE id = p_reply_id;
    END IF;

    SELECT vote_score INTO v_new_score FROM forum_replies WHERE id = p_reply_id;
  END IF;

  RETURN jsonb_build_object('score', v_new_score);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark reply as solution
CREATE OR REPLACE FUNCTION mark_reply_as_solution(
  p_post_id UUID,
  p_reply_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_post_author UUID;
BEGIN
  -- Check if user is the post author
  SELECT author_id INTO v_post_author FROM forum_posts WHERE id = p_post_id;

  IF v_post_author != p_user_id THEN
    RETURN false;
  END IF;

  -- Unmark any existing solution
  UPDATE forum_replies SET is_solution = false WHERE post_id = p_post_id AND is_solution = true;

  -- Mark new solution
  UPDATE forum_replies SET is_solution = true WHERE id = p_reply_id;

  -- Update post
  UPDATE forum_posts
  SET is_solved = true, solved_reply_id = p_reply_id, updated_at = NOW()
  WHERE id = p_post_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to increment view count (called from API)
CREATE OR REPLACE FUNCTION increment_post_views(p_post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE forum_posts SET view_count = view_count + 1 WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default categories
INSERT INTO forum_categories (slug, name, description, icon, color, display_order) VALUES
('general', 'General Discussion', 'Talk about anything gaming related', '💬', '#6366f1', 1),
('announcements', 'Announcements', 'Official news and updates', '📢', '#f59e0b', 2),
('introductions', 'Introductions', 'Introduce yourself to the community', '👋', '#10b981', 3),
('help', 'Help & Support', 'Get help with technical issues', '❓', '#ef4444', 4),
('feedback', 'Feedback & Suggestions', 'Share your ideas to improve GamerHub', '💡', '#8b5cf6', 5);

-- Insert game-specific categories
INSERT INTO forum_categories (slug, name, description, icon, color, game_id, display_order) VALUES
('valorant', 'VALORANT', 'Discuss all things Valorant', '🎯', '#ff4654', 'valorant', 10),
('cs2', 'Counter-Strike 2', 'CS2 tactics and community', '💥', '#de9b35', 'cs2', 11),
('pubg-mobile', 'PUBG Mobile', 'PUBG Mobile / BGMI strategies, loot paths, and squad tactics', '🎮', '#f2a900', 'pubg-mobile', 12),
('freefire', 'Free Fire', 'Free Fire character combos, Clash Squad, and ranked tips', '🔥', '#ff5722', 'freefire', 13),
('coc', 'Clash of Clans', 'COC war strategies, base designs, and clan management', '⚔️', '#f5c518', 'coc', 14),
('cod-mobile', 'COD Mobile', 'COD Mobile MP ranked, BR strategies, and loadout tips', '💥', '#ff6f00', 'cod-mobile', 15),
('other-games', 'Other Games', 'Discuss any other games not listed above', '🎲', '#9e9e9e', NULL, 16);

-- Trigger to update timestamps
CREATE TRIGGER forum_posts_updated_at
  BEFORE UPDATE ON forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_game_connections_timestamp();

CREATE TRIGGER forum_replies_updated_at
  BEFORE UPDATE ON forum_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_game_connections_timestamp();

CREATE TRIGGER forum_categories_updated_at
  BEFORE UPDATE ON forum_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_game_connections_timestamp();
