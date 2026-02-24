-- News Article Comments
-- Following the same pattern as blog_comments

CREATE TABLE IF NOT EXISTS public.news_article_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.news_article_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  status TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'hidden', 'deleted')),
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- News Article Comment Likes
CREATE TABLE IF NOT EXISTS public.news_article_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.news_article_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_news_article_comments_article_id ON public.news_article_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_news_article_comments_author_id ON public.news_article_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_news_article_comments_parent_id ON public.news_article_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_news_article_comments_status ON public.news_article_comments(status);
CREATE INDEX IF NOT EXISTS idx_news_article_comment_likes_comment_id ON public.news_article_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_news_article_comment_likes_user_id ON public.news_article_comment_likes(user_id);

-- RLS Policies
ALTER TABLE public.news_article_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_article_comment_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can view visible comments
CREATE POLICY "Anyone can view visible news comments"
  ON public.news_article_comments
  FOR SELECT
  USING (status = 'visible');

-- Authenticated users can insert comments
CREATE POLICY "Authenticated users can create news comments"
  ON public.news_article_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Authors can update their own comments
CREATE POLICY "Authors can update own news comments"
  ON public.news_article_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

-- Anyone can view comment likes
CREATE POLICY "Anyone can view news comment likes"
  ON public.news_article_comment_likes
  FOR SELECT
  USING (true);

-- Authenticated users can toggle likes
CREATE POLICY "Authenticated users can like news comments"
  ON public.news_article_comment_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike news comments"
  ON public.news_article_comment_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to toggle like on a news comment
CREATE OR REPLACE FUNCTION toggle_news_comment_like(p_comment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_exists BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.news_article_comment_likes
    WHERE comment_id = p_comment_id AND user_id = v_user_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.news_article_comment_likes
    WHERE comment_id = p_comment_id AND user_id = v_user_id;

    UPDATE public.news_article_comments
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = p_comment_id;

    RETURN FALSE;
  ELSE
    INSERT INTO public.news_article_comment_likes (comment_id, user_id)
    VALUES (p_comment_id, v_user_id);

    UPDATE public.news_article_comments
    SET likes_count = likes_count + 1
    WHERE id = p_comment_id;

    RETURN TRUE;
  END IF;
END;
$$;
