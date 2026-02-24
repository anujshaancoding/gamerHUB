-- Migration: 069_friend_post_comments_bookmarks.sql
-- Creates comments and bookmarks tables for friend posts

-- ============================================
-- FRIEND POST COMMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.friend_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.friend_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_friend_post_comments_post ON public.friend_post_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_friend_post_comments_user ON public.friend_post_comments(user_id);

-- Enable RLS
ALTER TABLE public.friend_post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view friend post comments"
  ON public.friend_post_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can comment on friend posts"
  ON public.friend_post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.friend_post_comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- FRIEND POST BOOKMARKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.friend_post_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.friend_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_friend_post_bookmarks_user ON public.friend_post_bookmarks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_friend_post_bookmarks_post ON public.friend_post_bookmarks(post_id);

-- Enable RLS
ALTER TABLE public.friend_post_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own bookmarks"
  ON public.friend_post_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can bookmark friend posts"
  ON public.friend_post_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own bookmarks"
  ON public.friend_post_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- ATOMIC TOGGLE BOOKMARK FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION toggle_friend_post_bookmark(p_post_id UUID, p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN;
  v_bookmarked BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.friend_post_bookmarks
    WHERE post_id = p_post_id AND user_id = p_user_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.friend_post_bookmarks
    WHERE post_id = p_post_id AND user_id = p_user_id;
    v_bookmarked := FALSE;
  ELSE
    INSERT INTO public.friend_post_bookmarks (post_id, user_id)
    VALUES (p_post_id, p_user_id);
    v_bookmarked := TRUE;
  END IF;

  RETURN json_build_object('bookmarked', v_bookmarked);
END;
$$;

-- ============================================
-- ADD COMMENT FUNCTION (with atomic count update)
-- ============================================

CREATE OR REPLACE FUNCTION add_friend_post_comment(p_post_id UUID, p_user_id UUID, p_content TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_comment_id UUID;
  v_new_count INTEGER;
BEGIN
  -- Insert the comment
  INSERT INTO public.friend_post_comments (post_id, user_id, content)
  VALUES (p_post_id, p_user_id, p_content)
  RETURNING id INTO v_comment_id;

  -- Update denormalized count
  UPDATE public.friend_posts
  SET comments_count = (
    SELECT COUNT(*) FROM public.friend_post_comments WHERE post_id = p_post_id
  )
  WHERE id = p_post_id
  RETURNING comments_count INTO v_new_count;

  RETURN json_build_object('comment_id', v_comment_id, 'comments_count', COALESCE(v_new_count, 0));
END;
$$;

-- ============================================
-- DELETE COMMENT FUNCTION (with atomic count update)
-- ============================================

CREATE OR REPLACE FUNCTION delete_friend_post_comment(p_comment_id UUID, p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_post_id UUID;
  v_new_count INTEGER;
BEGIN
  -- Get the post_id and verify ownership
  SELECT post_id INTO v_post_id
  FROM public.friend_post_comments
  WHERE id = p_comment_id AND user_id = p_user_id;

  IF v_post_id IS NULL THEN
    RETURN json_build_object('error', 'Comment not found or not authorized');
  END IF;

  -- Delete the comment
  DELETE FROM public.friend_post_comments WHERE id = p_comment_id;

  -- Update denormalized count
  UPDATE public.friend_posts
  SET comments_count = (
    SELECT COUNT(*) FROM public.friend_post_comments WHERE post_id = v_post_id
  )
  WHERE id = v_post_id
  RETURNING comments_count INTO v_new_count;

  RETURN json_build_object('deleted', true, 'comments_count', COALESCE(v_new_count, 0));
END;
$$;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_post_bookmarks;
