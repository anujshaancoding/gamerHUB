-- Engagement System: Likes & Comments for News Articles and Community Listings
-- Replicates the proven blog engagement pattern from 018_blog.sql

-- ============================================
-- ALTER PARENT TABLES
-- ============================================

ALTER TABLE public.news_articles
  ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

ALTER TABLE public.community_listings
  ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- ============================================
-- NEWS ARTICLE ENGAGEMENT TABLES
-- ============================================

-- Likes
CREATE TABLE public.news_article_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.news_articles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, user_id)
);

-- Comments (with nested replies)
CREATE TABLE public.news_article_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.news_articles(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.news_article_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'visible' CHECK (status IN ('visible', 'hidden', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment likes
CREATE TABLE public.news_article_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES public.news_article_comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Bookmarks
CREATE TABLE public.news_article_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.news_articles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, user_id)
);

-- ============================================
-- COMMUNITY LISTING ENGAGEMENT TABLES
-- ============================================

-- Likes
CREATE TABLE public.community_listing_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.community_listings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, user_id)
);

-- Comments (with nested replies)
CREATE TABLE public.community_listing_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.community_listings(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.community_listing_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'visible' CHECK (status IN ('visible', 'hidden', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment likes
CREATE TABLE public.community_listing_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES public.community_listing_comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Note: community_listing_bookmarks already exists in 051_community_listings.sql

-- ============================================
-- INDEXES
-- ============================================

-- News article likes
CREATE INDEX idx_news_article_likes_article ON public.news_article_likes(article_id);
CREATE INDEX idx_news_article_likes_user ON public.news_article_likes(user_id);

-- News article comments
CREATE INDEX idx_news_article_comments_article ON public.news_article_comments(article_id);
CREATE INDEX idx_news_article_comments_author ON public.news_article_comments(author_id);
CREATE INDEX idx_news_article_comments_parent ON public.news_article_comments(parent_id);

-- News article comment likes
CREATE INDEX idx_news_article_comment_likes_comment ON public.news_article_comment_likes(comment_id);
CREATE INDEX idx_news_article_comment_likes_user ON public.news_article_comment_likes(user_id);

-- News article bookmarks
CREATE INDEX idx_news_article_bookmarks_article ON public.news_article_bookmarks(article_id);
CREATE INDEX idx_news_article_bookmarks_user ON public.news_article_bookmarks(user_id);

-- Community listing likes
CREATE INDEX idx_listing_likes_listing ON public.community_listing_likes(listing_id);
CREATE INDEX idx_listing_likes_user ON public.community_listing_likes(user_id);

-- Community listing comments
CREATE INDEX idx_listing_comments_listing ON public.community_listing_comments(listing_id);
CREATE INDEX idx_listing_comments_author ON public.community_listing_comments(author_id);
CREATE INDEX idx_listing_comments_parent ON public.community_listing_comments(parent_id);

-- Community listing comment likes
CREATE INDEX idx_listing_comment_likes_comment ON public.community_listing_comment_likes(comment_id);
CREATE INDEX idx_listing_comment_likes_user ON public.community_listing_comment_likes(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- News article likes
ALTER TABLE public.news_article_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own news likes"
  ON public.news_article_likes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can like news articles"
  ON public.news_article_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their news likes"
  ON public.news_article_likes FOR DELETE
  USING (auth.uid() = user_id);

-- News article comments
ALTER TABLE public.news_article_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visible news comments are viewable by everyone"
  ON public.news_article_comments FOR SELECT
  USING (status = 'visible' OR author_id = auth.uid());

CREATE POLICY "Authenticated users can comment on news"
  ON public.news_article_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their news comments"
  ON public.news_article_comments FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Authors can delete their news comments"
  ON public.news_article_comments FOR DELETE
  USING (author_id = auth.uid());

-- News article comment likes
ALTER TABLE public.news_article_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own news comment likes"
  ON public.news_article_comment_likes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can like news comments"
  ON public.news_article_comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their news comment likes"
  ON public.news_article_comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- News article bookmarks
ALTER TABLE public.news_article_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own news bookmarks"
  ON public.news_article_bookmarks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can bookmark news"
  ON public.news_article_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their news bookmarks"
  ON public.news_article_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Community listing likes
ALTER TABLE public.community_listing_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own listing likes"
  ON public.community_listing_likes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can like listings"
  ON public.community_listing_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their listing likes"
  ON public.community_listing_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Community listing comments
ALTER TABLE public.community_listing_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visible listing comments are viewable by everyone"
  ON public.community_listing_comments FOR SELECT
  USING (status = 'visible' OR author_id = auth.uid());

CREATE POLICY "Authenticated users can comment on listings"
  ON public.community_listing_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their listing comments"
  ON public.community_listing_comments FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Authors can delete their listing comments"
  ON public.community_listing_comments FOR DELETE
  USING (author_id = auth.uid());

-- Community listing comment likes
ALTER TABLE public.community_listing_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own listing comment likes"
  ON public.community_listing_comment_likes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can like listing comments"
  ON public.community_listing_comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their listing comment likes"
  ON public.community_listing_comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER FUNCTIONS
-- ============================================

-- News article likes count
CREATE OR REPLACE FUNCTION update_news_article_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.news_articles SET likes_count = likes_count + 1 WHERE id = NEW.article_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.news_articles SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.article_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_news_article_like_change
  AFTER INSERT OR DELETE ON public.news_article_likes
  FOR EACH ROW EXECUTE FUNCTION update_news_article_likes_count();

-- News article comments count
CREATE OR REPLACE FUNCTION update_news_article_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.news_articles SET comments_count = comments_count + 1 WHERE id = NEW.article_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.news_articles SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.article_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_news_article_comment_change
  AFTER INSERT OR DELETE ON public.news_article_comments
  FOR EACH ROW EXECUTE FUNCTION update_news_article_comments_count();

-- News article comment likes count
CREATE OR REPLACE FUNCTION update_news_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.news_article_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.news_article_comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_news_comment_like_change
  AFTER INSERT OR DELETE ON public.news_article_comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_news_comment_likes_count();

-- Listing likes count
CREATE OR REPLACE FUNCTION update_listing_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_listings SET likes_count = likes_count + 1 WHERE id = NEW.listing_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_listings SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.listing_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_listing_like_change
  AFTER INSERT OR DELETE ON public.community_listing_likes
  FOR EACH ROW EXECUTE FUNCTION update_listing_likes_count();

-- Listing comments count
CREATE OR REPLACE FUNCTION update_listing_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_listings SET comments_count = comments_count + 1 WHERE id = NEW.listing_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_listings SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.listing_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_listing_comment_change
  AFTER INSERT OR DELETE ON public.community_listing_comments
  FOR EACH ROW EXECUTE FUNCTION update_listing_comments_count();

-- Listing comment likes count
CREATE OR REPLACE FUNCTION update_listing_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_listing_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_listing_comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_listing_comment_like_change
  AFTER INSERT OR DELETE ON public.community_listing_comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_listing_comment_likes_count();

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

CREATE TRIGGER update_news_article_comments_updated_at
  BEFORE UPDATE ON public.news_article_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listing_comments_updated_at
  BEFORE UPDATE ON public.community_listing_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
