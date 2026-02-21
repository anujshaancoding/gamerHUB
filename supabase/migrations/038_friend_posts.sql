-- Migration: 038_friend_posts.sql
-- Creates the friend_posts table for social posting feature

-- ============================================
-- FRIEND POSTS TABLE
-- ============================================

-- Create friend_posts table
CREATE TABLE IF NOT EXISTS public.friend_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_friend_posts_user ON public.friend_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_posts_created ON public.friend_posts(created_at DESC);

-- Enable RLS
ALTER TABLE public.friend_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can view friend posts" ON public.friend_posts;
CREATE POLICY "Anyone can view friend posts"
  ON public.friend_posts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create friend posts" ON public.friend_posts;
CREATE POLICY "Authenticated users can create friend posts"
  ON public.friend_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own friend posts" ON public.friend_posts;
CREATE POLICY "Users can update their own friend posts"
  ON public.friend_posts FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own friend posts" ON public.friend_posts;
CREATE POLICY "Users can delete their own friend posts"
  ON public.friend_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_friend_posts_updated_at
  BEFORE UPDATE ON public.friend_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_posts;
