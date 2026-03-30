-- 005: Create automation tables for human-like community engagement
-- These tables power the admin-controlled automation system that posts
-- community content, LFG requests, and comments as configured personas.

-- Personas: linked to real profile accounts, used for posting
CREATE TABLE IF NOT EXISTS auto_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  persona_style TEXT NOT NULL DEFAULT 'casual',      -- casual, competitive, meme, chill, tryhard
  preferred_games TEXT[] NOT NULL DEFAULT '{}',       -- ['valorant', 'bgmi', 'freefire']
  posting_style TEXT NOT NULL DEFAULT 'mixed',        -- mixed, questions, hot_takes, lfg, reactions
  bio_note TEXT,                                      -- internal note for admin reference
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id)
);

-- Templates: content patterns used for automated posts/comments
CREATE TABLE IF NOT EXISTS auto_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'community_post',        -- community_post, comment, lfg_post, news_discussion
  category TEXT NOT NULL DEFAULT 'general',            -- hot_take, question, discussion, daily, reaction, lfg, hype, tip
  content TEXT NOT NULL,                               -- The template text (supports {game}, {agent}, {rank} placeholders)
  game_slug TEXT,                                      -- NULL = any game, or 'valorant'/'bgmi'/'freefire'
  mood TEXT NOT NULL DEFAULT 'neutral',                -- excited, frustrated, chill, curious, hyped
  is_active BOOLEAN NOT NULL DEFAULT true,
  use_count INTEGER NOT NULL DEFAULT 0,                -- track how often it's been used
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activity logs: track every automated action for admin review
CREATE TABLE IF NOT EXISTS auto_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID REFERENCES auto_personas(id) ON DELETE SET NULL,
  template_id UUID REFERENCES auto_templates(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,                           -- post, comment, lfg, like
  target_id TEXT,                                      -- ID of the created post/comment/lfg
  target_table TEXT,                                   -- friend_posts, friend_post_comments, lfg_posts
  content_used TEXT NOT NULL,                           -- actual content that was posted
  persona_username TEXT,                                -- snapshot of username at time of action
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_auto_personas_active ON auto_personas(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_auto_templates_type ON auto_templates(type, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_auto_templates_game ON auto_templates(game_slug) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_auto_logs_created ON auto_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auto_logs_type ON auto_logs(action_type, created_at DESC);

-- Auto-cleanup: remove logs older than 90 days (run periodically or via pg_cron)
-- DELETE FROM auto_logs WHERE created_at < now() - interval '90 days';
