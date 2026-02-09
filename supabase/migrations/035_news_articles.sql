-- GamerHub News Articles System
-- Migration: 035_news_articles.sql
-- Automated gaming news pipeline with AI processing

-- ============================================
-- TABLES
-- ============================================

-- 1. News Sources - RSS/API feed configurations
CREATE TABLE IF NOT EXISTS public.news_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  source_type VARCHAR(30) NOT NULL CHECK (source_type IN ('rss', 'api', 'scraper')),
  url TEXT NOT NULL,
  game_slug VARCHAR(50) NOT NULL,
  region VARCHAR(30) DEFAULT 'global' CHECK (region IN ('india', 'asia', 'sea', 'global')),
  is_active BOOLEAN DEFAULT true,
  fetch_interval_minutes INTEGER DEFAULT 60,
  last_fetched_at TIMESTAMPTZ,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. News Articles - Main news content (AI-processed)
CREATE TABLE IF NOT EXISTS public.news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.news_sources(id) ON DELETE SET NULL,
  external_id VARCHAR(500),

  -- Original content from source
  original_title VARCHAR(500) NOT NULL,
  original_url TEXT NOT NULL,
  original_content TEXT,
  original_published_at TIMESTAMPTZ,

  -- AI-processed content
  title VARCHAR(300) NOT NULL,
  summary TEXT,
  excerpt VARCHAR(300),
  thumbnail_url TEXT,

  -- Classification
  game_slug VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general' CHECK (category IN ('patch', 'tournament', 'event', 'update', 'roster', 'meta', 'general')),
  region VARCHAR(30) DEFAULT 'global' CHECK (region IN ('india', 'asia', 'sea', 'global')),
  tags TEXT[] DEFAULT '{}',

  -- AI processing metadata
  ai_relevance_score FLOAT DEFAULT 0,
  ai_processed BOOLEAN DEFAULT false,
  ai_processing_error TEXT,

  -- Moderation
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published')),
  moderated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Engagement
  views_count INTEGER DEFAULT 0,

  -- Publishing
  published_at TIMESTAMPTZ,
  is_featured BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(source_id, external_id)
);

-- 3. News Fetch Logs - Audit trail for fetch jobs
CREATE TABLE IF NOT EXISTS public.news_fetch_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.news_sources(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  articles_found INTEGER DEFAULT 0,
  articles_new INTEGER DEFAULT 0,
  articles_processed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_news_sources_game ON public.news_sources(game_slug);
CREATE INDEX idx_news_sources_active ON public.news_sources(is_active) WHERE is_active = true;

CREATE INDEX idx_news_articles_game ON public.news_articles(game_slug);
CREATE INDEX idx_news_articles_category ON public.news_articles(category);
CREATE INDEX idx_news_articles_status ON public.news_articles(status);
CREATE INDEX idx_news_articles_region ON public.news_articles(region);
CREATE INDEX idx_news_articles_published ON public.news_articles(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_news_articles_pending ON public.news_articles(created_at DESC) WHERE status IN ('pending', 'approved');
CREATE INDEX idx_news_articles_source_ext ON public.news_articles(source_id, external_id);
CREATE INDEX idx_news_articles_tags ON public.news_articles USING GIN(tags);
CREATE INDEX idx_news_articles_original_url ON public.news_articles(original_url);

CREATE INDEX idx_news_fetch_logs_source ON public.news_fetch_logs(source_id);
CREATE INDEX idx_news_fetch_logs_status ON public.news_fetch_logs(status, started_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_fetch_logs ENABLE ROW LEVEL SECURITY;

-- News Sources: anyone can view active sources
CREATE POLICY "Anyone can view active news sources"
  ON public.news_sources FOR SELECT
  USING (is_active = true);

-- News Articles: published articles are viewable by everyone
CREATE POLICY "Anyone can view published news articles"
  ON public.news_articles FOR SELECT
  USING (status = 'published');

-- News Fetch Logs: not publicly accessible (service role only)

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to increment news article view count
CREATE OR REPLACE FUNCTION increment_news_view(article_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.news_articles
  SET views_count = views_count + 1
  WHERE id = article_id AND status = 'published';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEED DATA - RSS Feed Sources
-- ============================================

INSERT INTO public.news_sources (name, slug, source_type, url, game_slug, region, fetch_interval_minutes, config) VALUES
  ('VLR.gg', 'vlr-gg', 'rss', 'https://www.vlr.gg/news/rss', 'valorant', 'global', 30, '{}'),
  ('HLTV', 'hltv', 'rss', 'https://www.hltv.org/rss/news', 'cs2', 'global', 30, '{}'),
  ('AFK Gaming', 'afk-gaming', 'rss', 'https://afkgaming.com/feed', 'valorant', 'india', 60, '{"games": ["valorant", "cs2", "pubg-mobile", "freefire", "cod-mobile"]}'),
  ('TalkEsport', 'talkesport', 'rss', 'https://www.talkesport.com/feed/', 'valorant', 'india', 60, '{"games": ["valorant", "cs2", "pubg-mobile", "freefire", "cod-mobile"]}'),
  ('Sportskeeda Esports', 'sportskeeda-esports', 'rss', 'https://www.sportskeeda.com/esports/feed', 'valorant', 'india', 60, '{"games": ["valorant", "cs2", "freefire", "pubg-mobile"]}'),
  ('Clash of Clans Blog', 'coc-blog', 'rss', 'https://clashofclans.com/blog/rss', 'coc', 'global', 120, '{}'),
  ('Sportskeeda PUBG Mobile', 'sportskeeda-pubg', 'rss', 'https://www.sportskeeda.com/pubg-mobile/feed', 'pubg-mobile', 'india', 60, '{}'),
  ('Sportskeeda Free Fire', 'sportskeeda-freefire', 'rss', 'https://www.sportskeeda.com/free-fire/feed', 'freefire', 'india', 60, '{}')
ON CONFLICT (slug) DO NOTHING;
