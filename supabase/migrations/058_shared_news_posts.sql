-- Migration: 058_shared_news_posts.sql
-- Adds shared_news_id to friend_posts for sharing news articles to the feed

ALTER TABLE public.friend_posts
  ADD COLUMN shared_news_id UUID DEFAULT NULL
  REFERENCES public.news_articles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_friend_posts_shared_news
  ON public.friend_posts(shared_news_id)
  WHERE shared_news_id IS NOT NULL;
