-- Migration: 037_apply_missing_tables.sql
-- This migration ensures all required tables exist
-- Run this in Supabase SQL Editor if you're seeing "table not found" errors

-- ============================================
-- NEWS ARTICLES SYSTEM (from 035_news_articles.sql)
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

-- News Sources indexes
CREATE INDEX IF NOT EXISTS idx_news_sources_game ON public.news_sources(game_slug);
CREATE INDEX IF NOT EXISTS idx_news_sources_active ON public.news_sources(is_active) WHERE is_active = true;

-- News Articles indexes
CREATE INDEX IF NOT EXISTS idx_news_articles_game ON public.news_articles(game_slug);
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON public.news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_articles_status ON public.news_articles(status);
CREATE INDEX IF NOT EXISTS idx_news_articles_region ON public.news_articles(region);
CREATE INDEX IF NOT EXISTS idx_news_articles_published ON public.news_articles(published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_news_articles_pending ON public.news_articles(created_at DESC) WHERE status IN ('pending', 'approved');
CREATE INDEX IF NOT EXISTS idx_news_articles_source_ext ON public.news_articles(source_id, external_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_tags ON public.news_articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_news_articles_original_url ON public.news_articles(original_url);

CREATE INDEX IF NOT EXISTS idx_news_fetch_logs_source ON public.news_fetch_logs(source_id);
CREATE INDEX IF NOT EXISTS idx_news_fetch_logs_status ON public.news_fetch_logs(status, started_at DESC);

-- News RLS
ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_fetch_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create them
DROP POLICY IF EXISTS "Anyone can view active news sources" ON public.news_sources;
CREATE POLICY "Anyone can view active news sources"
  ON public.news_sources FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can view published news articles" ON public.news_articles;
CREATE POLICY "Anyone can view published news articles"
  ON public.news_articles FOR SELECT
  USING (status = 'published');

-- Function to increment news article view count
CREATE OR REPLACE FUNCTION increment_news_view(article_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.news_articles
  SET views_count = views_count + 1
  WHERE id = article_id AND status = 'published';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed news sources
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


-- ============================================
-- SUBSCRIPTION PLANS (from 008_payments.sql)
-- ============================================

-- Stripe Customer Mapping
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription Plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),
  price_monthly INT NOT NULL,
  price_yearly INT NOT NULL,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255),
  status VARCHAR(30) NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')),
  billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  stripe_customer_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_charge_id VARCHAR(255),
  amount INT NOT NULL,
  currency VARCHAR(10) DEFAULT 'usd',
  status VARCHAR(30) NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'canceled')),
  payment_type VARCHAR(30) NOT NULL CHECK (payment_type IN ('subscription', 'battle_pass', 'currency_pack', 'one_time')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stripe Webhook Events Log
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  processed BOOLEAN DEFAULT false,
  payload JSONB NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add premium flags to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_premium') THEN
    ALTER TABLE public.profiles ADD COLUMN is_premium BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'premium_until') THEN
    ALTER TABLE public.profiles ADD COLUMN premium_until TIMESTAMPTZ;
  END IF;
END $$;

-- Payment indexes
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_id ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe_intent ON payment_transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_type ON stripe_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed ON stripe_webhook_events(processed) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_profiles_premium ON profiles(is_premium) WHERE is_premium = true;

-- Payment RLS
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Stripe Customers policies
DROP POLICY IF EXISTS "Users can view own stripe customer" ON public.stripe_customers;
CREATE POLICY "Users can view own stripe customer" ON public.stripe_customers
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage stripe customers" ON public.stripe_customers;
CREATE POLICY "Service role can manage stripe customers" ON public.stripe_customers
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Subscription Plans policies
DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view active subscription plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Service role can manage subscription plans" ON public.subscription_plans;
CREATE POLICY "Service role can manage subscription plans" ON public.subscription_plans
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- User Subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.user_subscriptions;
CREATE POLICY "Service role can manage subscriptions" ON public.user_subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Payment Transactions policies
DROP POLICY IF EXISTS "Users can view own transactions" ON public.payment_transactions;
CREATE POLICY "Users can view own transactions" ON public.payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage transactions" ON public.payment_transactions;
CREATE POLICY "Service role can manage transactions" ON public.payment_transactions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Stripe Webhook Events policies
DROP POLICY IF EXISTS "Service role can manage webhook events" ON public.stripe_webhook_events;
CREATE POLICY "Service role can manage webhook events" ON public.stripe_webhook_events
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to update user premium status
CREATE OR REPLACE FUNCTION update_user_premium_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE public.profiles
    SET is_premium = true, premium_until = NEW.current_period_end
    WHERE id = NEW.user_id;
  ELSIF NEW.status IN ('canceled', 'unpaid', 'paused') THEN
    UPDATE public.profiles
    SET is_premium = false, premium_until = NULL
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for premium status sync
DROP TRIGGER IF EXISTS sync_premium_status ON public.user_subscriptions;
CREATE TRIGGER sync_premium_status
  AFTER INSERT OR UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_premium_status();

-- Function to check if user is premium
CREATE OR REPLACE FUNCTION is_user_premium(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_premium BOOLEAN;
BEGIN
  SELECT
    CASE
      WHEN is_premium = true AND (premium_until IS NULL OR premium_until > NOW()) THEN true
      ELSE false
    END INTO v_is_premium
  FROM public.profiles
  WHERE id = p_user_id;

  RETURN COALESCE(v_is_premium, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed default subscription plan
INSERT INTO public.subscription_plans (slug, name, description, price_monthly, price_yearly, features, sort_order)
VALUES
  ('premium', 'GamerHub Premium', 'Unlock exclusive features and stand out from the crowd', 999, 9999,
   '["Exclusive titles, frames, and themes", "Priority matchmaking queue", "100MB media uploads (vs 20MB)", "Advanced stats dashboard", "See who viewed your profile", "Unlimited follows", "Early access to new features", "Premium badge on profile"]'::jsonb,
   1)
ON CONFLICT (slug) DO NOTHING;


-- ============================================
-- FIX PRO PLAYERS AMBIGUOUS COLUMN (from 036)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_pro_players_by_games(
  p_user_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  follower_count INT,
  common_games JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH user_game_ids AS (
    SELECT ug_user.game_id
    FROM public.user_games ug_user
    WHERE ug_user.user_id = p_user_id
  ),
  pro_player_followers AS (
    SELECT
      p.id AS pro_user_id,
      (SELECT COUNT(*)::INT FROM public.follows f WHERE f.following_id = p.id) AS pro_follower_count
    FROM public.profiles p
    WHERE p.gaming_style = 'pro'
      AND p.id != p_user_id
      AND NOT EXISTS (
        SELECT 1 FROM public.blocked_users bu
        WHERE (bu.blocker_id = p_user_id AND bu.blocked_id = p.id)
           OR (bu.blocker_id = p.id AND bu.blocked_id = p_user_id)
      )
  )
  SELECT
    ppf.pro_user_id AS user_id,
    ppf.pro_follower_count AS follower_count,
    jsonb_agg(
      jsonb_build_object(
        'game_id', ug.game_id,
        'game_name', g.name,
        'rank', ug.rank
      )
    ) AS common_games
  FROM pro_player_followers ppf
  JOIN public.user_games ug ON ug.user_id = ppf.pro_user_id
  JOIN public.games g ON g.id = ug.game_id
  WHERE ug.game_id IN (SELECT ugi.game_id FROM user_game_ids ugi)
  GROUP BY ppf.pro_user_id, ppf.pro_follower_count
  ORDER BY ppf.pro_follower_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_pro_players_by_games TO authenticated;

-- Done! All missing tables and fixes have been applied.
