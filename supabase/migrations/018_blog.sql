-- GamerHub Blog/News System (HLTV-style)
-- Migration: 018_blog.sql

-- ============================================
-- TABLES
-- ============================================

-- 1. Blog Authors (users with publishing permissions)
CREATE TABLE public.blog_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role VARCHAR(30) DEFAULT 'contributor' CHECK (role IN ('contributor', 'journalist', 'editor', 'admin')),
  bio TEXT,
  can_publish_directly BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  articles_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Blog Posts
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Content
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(220) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,

  -- Categorization
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('news', 'interview', 'analysis', 'match_report', 'opinion', 'transfer', 'guide', 'announcement')),
  tags TEXT[] DEFAULT '{}',

  -- Publishing
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,

  -- Engagement
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,

  -- SEO
  meta_title VARCHAR(70),
  meta_description VARCHAR(160),

  -- Flags
  is_featured BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  allow_comments BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Blog Comments
CREATE TABLE public.blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'visible' CHECK (status IN ('visible', 'hidden', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Blog Likes (posts)
CREATE TABLE public.blog_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 5. Blog Comment Likes
CREATE TABLE public.blog_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES public.blog_comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- 6. Blog Bookmarks (saved posts)
CREATE TABLE public.blog_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_blog_authors_user ON public.blog_authors(user_id);
CREATE INDEX idx_blog_authors_role ON public.blog_authors(role);

CREATE INDEX idx_blog_posts_author ON public.blog_posts(author_id);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_game ON public.blog_posts(game_id);
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category);
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_published ON public.blog_posts(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_blog_posts_featured ON public.blog_posts(is_featured, published_at DESC) WHERE status = 'published';
CREATE INDEX idx_blog_posts_tags ON public.blog_posts USING GIN(tags);

CREATE INDEX idx_blog_comments_post ON public.blog_comments(post_id);
CREATE INDEX idx_blog_comments_author ON public.blog_comments(author_id);
CREATE INDEX idx_blog_comments_parent ON public.blog_comments(parent_id);

CREATE INDEX idx_blog_likes_post ON public.blog_likes(post_id);
CREATE INDEX idx_blog_likes_user ON public.blog_likes(user_id);

CREATE INDEX idx_blog_bookmarks_user ON public.blog_bookmarks(user_id);
CREATE INDEX idx_blog_bookmarks_post ON public.blog_bookmarks(post_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.blog_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_bookmarks ENABLE ROW LEVEL SECURITY;

-- Blog Authors: Everyone can view authors
CREATE POLICY "Blog authors are viewable by everyone"
  ON public.blog_authors FOR SELECT
  USING (true);

-- Blog Authors: Only admins can manage authors (simplified - use service role)
CREATE POLICY "Authors can update their own bio"
  ON public.blog_authors FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Blog Posts: Published posts are viewable by everyone
CREATE POLICY "Published blog posts are viewable by everyone"
  ON public.blog_posts FOR SELECT
  USING (status = 'published' OR author_id = auth.uid());

-- Blog Posts: Authors can create posts
CREATE POLICY "Authors can create blog posts"
  ON public.blog_posts FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (SELECT 1 FROM public.blog_authors WHERE user_id = auth.uid())
  );

-- Blog Posts: Authors can update their own posts
CREATE POLICY "Authors can update their own posts"
  ON public.blog_posts FOR UPDATE
  USING (auth.uid() = author_id);

-- Blog Posts: Authors can delete their own drafts
CREATE POLICY "Authors can delete their own drafts"
  ON public.blog_posts FOR DELETE
  USING (auth.uid() = author_id AND status = 'draft');

-- Blog Comments: Visible comments are viewable by everyone
CREATE POLICY "Visible comments are viewable by everyone"
  ON public.blog_comments FOR SELECT
  USING (status = 'visible' OR author_id = auth.uid());

-- Blog Comments: Authenticated users can comment
CREATE POLICY "Authenticated users can comment"
  ON public.blog_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Blog Comments: Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON public.blog_comments FOR UPDATE
  USING (auth.uid() = author_id);

-- Blog Comments: Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON public.blog_comments FOR DELETE
  USING (auth.uid() = author_id);

-- Blog Likes: Everyone can view like counts (via aggregate)
CREATE POLICY "Users can view their own likes"
  ON public.blog_likes FOR SELECT
  USING (user_id = auth.uid());

-- Blog Likes: Authenticated users can like
CREATE POLICY "Authenticated users can like posts"
  ON public.blog_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Blog Likes: Users can remove their likes
CREATE POLICY "Users can remove their likes"
  ON public.blog_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Comment Likes: Same policies
CREATE POLICY "Users can view their comment likes"
  ON public.blog_comment_likes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can like comments"
  ON public.blog_comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their comment likes"
  ON public.blog_comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Bookmarks: Users manage their own bookmarks
CREATE POLICY "Users can view their bookmarks"
  ON public.blog_bookmarks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create bookmarks"
  ON public.blog_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove bookmarks"
  ON public.blog_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_blog_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generate base slug from title
  base_slug := LOWER(REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := TRIM(BOTH '-' FROM base_slug);
  base_slug := SUBSTRING(base_slug FROM 1 FOR 200);

  new_slug := base_slug;

  -- Check for uniqueness and append counter if needed
  WHILE EXISTS (SELECT 1 FROM public.blog_posts WHERE slug = new_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := new_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_slug_before_insert
  BEFORE INSERT ON public.blog_posts
  FOR EACH ROW
  WHEN (NEW.slug IS NULL OR NEW.slug = '')
  EXECUTE FUNCTION generate_blog_slug();

-- Function to update likes count
CREATE OR REPLACE FUNCTION update_blog_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.blog_posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.blog_posts
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_blog_like_change
  AFTER INSERT OR DELETE ON public.blog_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_likes_count();

-- Function to update comments count
CREATE OR REPLACE FUNCTION update_blog_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.blog_posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.blog_posts
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_blog_comment_change
  AFTER INSERT OR DELETE ON public.blog_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_comments_count();

-- Function to update author article count
CREATE OR REPLACE FUNCTION update_blog_author_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
    UPDATE public.blog_authors
    SET articles_count = articles_count + 1
    WHERE user_id = NEW.author_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'published' AND NEW.status = 'published' THEN
    UPDATE public.blog_authors
    SET articles_count = articles_count + 1
    WHERE user_id = NEW.author_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'published' AND NEW.status != 'published' THEN
    UPDATE public.blog_authors
    SET articles_count = GREATEST(0, articles_count - 1)
    WHERE user_id = NEW.author_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'published' THEN
    UPDATE public.blog_authors
    SET articles_count = GREATEST(0, articles_count - 1)
    WHERE user_id = OLD.author_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_blog_post_publish
  AFTER INSERT OR UPDATE OR DELETE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_author_count();

-- Function to update comment likes count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.blog_comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.blog_comments
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_like_change
  AFTER INSERT OR DELETE ON public.blog_comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_likes_count();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_blog_view(post_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.blog_posts
  SET views_count = views_count + 1
  WHERE slug = post_slug AND status = 'published';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
