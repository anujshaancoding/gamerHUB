-- GamerHub LFG Game-Specific Fields Migration
-- Migration: 019_lfg_game_specific.sql
-- Adds support for game-specific LFG fields (ranks, agents, maps, perspectives)

-- ============================================
-- ADD NEW COLUMNS TO LFG_POSTS
-- ============================================

-- Add rank columns for tier-based games (Valorant, PUBG Mobile, Free Fire, etc.)
ALTER TABLE public.lfg_posts
ADD COLUMN IF NOT EXISTS creator_rank VARCHAR(50),
ADD COLUMN IF NOT EXISTS min_rank VARCHAR(50),
ADD COLUMN IF NOT EXISTS max_rank VARCHAR(50);

-- Add agent/character column (for Valorant, Free Fire)
ALTER TABLE public.lfg_posts
ADD COLUMN IF NOT EXISTS creator_agent VARCHAR(50);

-- Add map preference (for BR games like PUBG Mobile, Free Fire)
ALTER TABLE public.lfg_posts
ADD COLUMN IF NOT EXISTS map_preference VARCHAR(50);

-- Add perspective (for PUBG Mobile - TPP/FPP)
ALTER TABLE public.lfg_posts
ADD COLUMN IF NOT EXISTS perspective VARCHAR(10);

-- ============================================
-- ADD NEW COLUMNS TO LFG_APPLICATIONS
-- ============================================

-- Add rank column for tier-based games
ALTER TABLE public.lfg_applications
ADD COLUMN IF NOT EXISTS applicant_rank VARCHAR(50);

-- Add agent/character column
ALTER TABLE public.lfg_applications
ADD COLUMN IF NOT EXISTS applicant_agent VARCHAR(50);

-- ============================================
-- CREATE INDEXES FOR NEW COLUMNS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_lfg_posts_creator_rank ON public.lfg_posts(creator_rank);
CREATE INDEX IF NOT EXISTS idx_lfg_posts_game_mode ON public.lfg_posts(game_mode);
CREATE INDEX IF NOT EXISTS idx_lfg_posts_map ON public.lfg_posts(map_preference);
CREATE INDEX IF NOT EXISTS idx_lfg_posts_perspective ON public.lfg_posts(perspective);

-- ============================================
-- ADD ADDITIONAL GAME ROLES
-- ============================================

-- PUBG Mobile Roles (if not exists)
INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'fragger', 'Fragger', 'Aggressive player focused on kills', 1
FROM public.games WHERE slug = 'pubg-mobile'
ON CONFLICT (game_id, name) DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'support', 'Support', 'Provides backup and cover fire', 2
FROM public.games WHERE slug = 'pubg-mobile'
ON CONFLICT (game_id, name) DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'scout', 'Scout', 'Scouts positions and gathers information', 3
FROM public.games WHERE slug = 'pubg-mobile'
ON CONFLICT (game_id, name) DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'igl', 'IGL', 'In-Game Leader, calls rotations and strategy', 4
FROM public.games WHERE slug = 'pubg-mobile'
ON CONFLICT (game_id, name) DO NOTHING;

-- Free Fire Roles (if not exists)
INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'rusher', 'Rusher', 'Aggressive front-line attacker', 1
FROM public.games WHERE slug = 'freefire'
ON CONFLICT (game_id, name) DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'support', 'Support', 'Heals and provides utility', 2
FROM public.games WHERE slug = 'freefire'
ON CONFLICT (game_id, name) DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'sniper', 'Sniper', 'Long-range damage dealer', 3
FROM public.games WHERE slug = 'freefire'
ON CONFLICT (game_id, name) DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'defuser', 'Defuser', 'Handles bomb defusal and objective plays', 4
FROM public.games WHERE slug = 'freefire'
ON CONFLICT (game_id, name) DO NOTHING;

-- Clash of Clans Roles (if not exists)
INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'war_specialist', 'War Specialist', 'Excels in clan war attacks', 1
FROM public.games WHERE slug = 'coc'
ON CONFLICT (game_id, name) DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'donator', 'Donator', 'Actively donates troops and resources', 2
FROM public.games WHERE slug = 'coc'
ON CONFLICT (game_id, name) DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'clan_leader', 'Clan Leader', 'Leads and organizes the clan', 3
FROM public.games WHERE slug = 'coc'
ON CONFLICT (game_id, name) DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'base_builder', 'Base Builder', 'Specializes in base layout design', 4
FROM public.games WHERE slug = 'coc'
ON CONFLICT (game_id, name) DO NOTHING;

-- COD Mobile Roles (if not exists)
INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'slayer', 'Slayer', 'Primary kill-focused player', 1
FROM public.games WHERE slug = 'cod-mobile'
ON CONFLICT (game_id, name) DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'obj', 'OBJ', 'Objective-focused player', 2
FROM public.games WHERE slug = 'cod-mobile'
ON CONFLICT (game_id, name) DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'anchor', 'Anchor', 'Holds spawns and map control', 3
FROM public.games WHERE slug = 'cod-mobile'
ON CONFLICT (game_id, name) DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'support', 'Support', 'Provides utility and team support', 4
FROM public.games WHERE slug = 'cod-mobile'
ON CONFLICT (game_id, name) DO NOTHING;

-- ============================================
-- COMMENT ON COLUMNS
-- ============================================

COMMENT ON COLUMN public.lfg_posts.creator_rank IS 'Tier-based rank for games like Valorant, PUBG Mobile, Free Fire (e.g., "gold1", "diamond3")';
COMMENT ON COLUMN public.lfg_posts.min_rank IS 'Minimum rank requirement for tier-based games';
COMMENT ON COLUMN public.lfg_posts.max_rank IS 'Maximum rank requirement for tier-based games';
COMMENT ON COLUMN public.lfg_posts.creator_agent IS 'Selected agent/character for games like Valorant, Free Fire';
COMMENT ON COLUMN public.lfg_posts.map_preference IS 'Preferred map for BR games like PUBG Mobile, Free Fire';
COMMENT ON COLUMN public.lfg_posts.perspective IS 'Camera perspective for PUBG Mobile (tpp/fpp)';
