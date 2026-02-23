-- Migration: 068_friend_post_likes.sql
-- Creates a proper like tracking table for friend posts
-- Fixes: race condition (non-atomic increment), no toggle logic, spam likes

-- ============================================
-- FRIEND POST LIKES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.friend_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.friend_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_friend_post_likes_post ON public.friend_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_friend_post_likes_user ON public.friend_post_likes(user_id);

-- Enable RLS
ALTER TABLE public.friend_post_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view friend post likes"
  ON public.friend_post_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like friend posts"
  ON public.friend_post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
  ON public.friend_post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- ATOMIC TOGGLE FUNCTION
-- ============================================
-- Atomically likes or unlikes a friend post.
-- Returns the new liked state and the updated likes_count.

CREATE OR REPLACE FUNCTION toggle_friend_post_like(p_post_id UUID, p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN;
  v_new_count INTEGER;
  v_liked BOOLEAN;
BEGIN
  -- Check if like exists
  SELECT EXISTS(
    SELECT 1 FROM public.friend_post_likes
    WHERE post_id = p_post_id AND user_id = p_user_id
  ) INTO v_exists;

  IF v_exists THEN
    -- Unlike: remove the like
    DELETE FROM public.friend_post_likes
    WHERE post_id = p_post_id AND user_id = p_user_id;
    v_liked := FALSE;
  ELSE
    -- Like: insert the like
    INSERT INTO public.friend_post_likes (post_id, user_id)
    VALUES (p_post_id, p_user_id);
    v_liked := TRUE;
  END IF;

  -- Update the denormalized count atomically
  UPDATE public.friend_posts
  SET likes_count = (
    SELECT COUNT(*) FROM public.friend_post_likes WHERE post_id = p_post_id
  )
  WHERE id = p_post_id
  RETURNING likes_count INTO v_new_count;

  RETURN json_build_object('liked', v_liked, 'likes_count', COALESCE(v_new_count, 0));
END;
$$;

-- Allow the RLS update policy to work for the atomic count update
-- The function runs as SECURITY DEFINER so it can update any post's likes_count

-- Enable realtime for the likes table
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_post_likes;
