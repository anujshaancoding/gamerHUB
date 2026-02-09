-- GamerHub LFG (Looking For Group/Teammates) System
-- Migration: 017_lfg.sql

-- ============================================
-- TABLES
-- ============================================

-- 1. Game Roles (CS2, Valorant, etc. specific roles)
CREATE TABLE public.game_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(50) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, name)
);

-- 2. LFG Posts (main table for looking-for-group posts)
CREATE TABLE public.lfg_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,

  -- Post details
  title VARCHAR(100) NOT NULL,
  description TEXT,

  -- Creator's role/rank for this session
  creator_role VARCHAR(50),
  creator_rating INTEGER,
  creator_is_unranked BOOLEAN DEFAULT false,

  -- Looking for criteria
  looking_for_roles TEXT[] DEFAULT '{}',
  min_rating INTEGER,
  max_rating INTEGER,
  accept_unranked BOOLEAN DEFAULT true,

  -- Game settings
  game_mode VARCHAR(50),
  region VARCHAR(50),
  language VARCHAR(10) DEFAULT 'en',
  voice_required BOOLEAN DEFAULT false,

  -- Party slots
  current_players INTEGER DEFAULT 1,
  max_players INTEGER DEFAULT 5,

  -- Visibility/timing
  duration_type VARCHAR(20) DEFAULT '2hr' CHECK (duration_type IN ('1hr', '2hr', '4hr', '8hr', 'until_full')),
  expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'full', 'expired', 'cancelled')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LFG Applications (users applying to join)
CREATE TABLE public.lfg_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.lfg_posts(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  applicant_role VARCHAR(50),
  applicant_rating INTEGER,
  applicant_is_unranked BOOLEAN DEFAULT false,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(post_id, applicant_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_game_roles_game ON public.game_roles(game_id);
CREATE INDEX idx_lfg_posts_creator ON public.lfg_posts(creator_id);
CREATE INDEX idx_lfg_posts_game ON public.lfg_posts(game_id);
CREATE INDEX idx_lfg_posts_status ON public.lfg_posts(status);
CREATE INDEX idx_lfg_posts_expires ON public.lfg_posts(expires_at);
CREATE INDEX idx_lfg_posts_region ON public.lfg_posts(region);
CREATE INDEX idx_lfg_posts_active ON public.lfg_posts(status, expires_at) WHERE status = 'active';
CREATE INDEX idx_lfg_applications_post ON public.lfg_applications(post_id);
CREATE INDEX idx_lfg_applications_applicant ON public.lfg_applications(applicant_id);
CREATE INDEX idx_lfg_applications_status ON public.lfg_applications(status);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.game_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lfg_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lfg_applications ENABLE ROW LEVEL SECURITY;

-- Game roles: Everyone can read
CREATE POLICY "Game roles are viewable by everyone"
  ON public.game_roles FOR SELECT
  USING (true);

-- LFG Posts: Active posts are viewable by everyone
CREATE POLICY "Active LFG posts are viewable by everyone"
  ON public.lfg_posts FOR SELECT
  USING (status = 'active' AND expires_at > NOW() OR creator_id = auth.uid());

-- LFG Posts: Users can create their own posts
CREATE POLICY "Users can create LFG posts"
  ON public.lfg_posts FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- LFG Posts: Users can update their own posts
CREATE POLICY "Users can update their own LFG posts"
  ON public.lfg_posts FOR UPDATE
  USING (auth.uid() = creator_id);

-- LFG Posts: Users can delete their own posts
CREATE POLICY "Users can delete their own LFG posts"
  ON public.lfg_posts FOR DELETE
  USING (auth.uid() = creator_id);

-- LFG Applications: Post creators can view applications
CREATE POLICY "Post creators can view applications"
  ON public.lfg_applications FOR SELECT
  USING (
    applicant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.lfg_posts
      WHERE id = post_id AND creator_id = auth.uid()
    )
  );

-- LFG Applications: Users can apply to posts
CREATE POLICY "Users can apply to LFG posts"
  ON public.lfg_applications FOR INSERT
  WITH CHECK (auth.uid() = applicant_id);

-- LFG Applications: Post creators can update application status
CREATE POLICY "Post creators can update applications"
  ON public.lfg_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.lfg_posts
      WHERE id = post_id AND creator_id = auth.uid()
    )
  );

-- LFG Applications: Applicants can delete their own applications
CREATE POLICY "Applicants can delete their applications"
  ON public.lfg_applications FOR DELETE
  USING (applicant_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to auto-expire LFG posts
CREATE OR REPLACE FUNCTION expire_lfg_posts()
RETURNS void AS $$
BEGIN
  UPDATE public.lfg_posts
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active' AND expires_at <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update current_players count
CREATE OR REPLACE FUNCTION update_lfg_player_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'accepted' THEN
    UPDATE public.lfg_posts
    SET current_players = current_players + 1,
        status = CASE
          WHEN current_players + 1 >= max_players THEN 'full'
          ELSE status
        END,
        updated_at = NOW()
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
    UPDATE public.lfg_posts
    SET current_players = current_players + 1,
        status = CASE
          WHEN current_players + 1 >= max_players THEN 'full'
          ELSE status
        END,
        updated_at = NOW()
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'accepted' AND NEW.status != 'accepted' THEN
    UPDATE public.lfg_posts
    SET current_players = GREATEST(1, current_players - 1),
        status = CASE
          WHEN status = 'full' THEN 'active'
          ELSE status
        END,
        updated_at = NOW()
    WHERE id = NEW.post_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for player count updates
CREATE TRIGGER on_lfg_application_change
  AFTER INSERT OR UPDATE ON public.lfg_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_lfg_player_count();

-- ============================================
-- SEED DATA: Game Roles
-- ============================================

-- CS2 Roles
INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'entry_fragger', 'Entry Fragger', 'First into sites, creates openings for the team', 1
FROM public.games WHERE slug = 'cs2'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'awper', 'AWPer', 'Sniper specialist, controls long-range angles', 2
FROM public.games WHERE slug = 'cs2'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'igl', 'IGL', 'In-Game Leader, calls strategies and coordinates team', 3
FROM public.games WHERE slug = 'cs2'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'support', 'Support', 'Provides utility and flash support for teammates', 4
FROM public.games WHERE slug = 'cs2'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'lurker', 'Lurker', 'Flanks and picks off rotations, gathers information', 5
FROM public.games WHERE slug = 'cs2'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'clutcher', 'Clutcher', 'Specializes in winning 1vX situations under pressure', 6
FROM public.games WHERE slug = 'cs2'
ON CONFLICT DO NOTHING;

-- Valorant Roles
INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'duelist', 'Duelist', 'Entry fraggers who create space for the team', 1
FROM public.games WHERE slug = 'valorant'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'initiator', 'Initiator', 'Gathers info and sets up team executes', 2
FROM public.games WHERE slug = 'valorant'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'controller', 'Controller', 'Controls areas with smokes and utility', 3
FROM public.games WHERE slug = 'valorant'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'sentinel', 'Sentinel', 'Defensive anchor, watches flanks and heals', 4
FROM public.games WHERE slug = 'valorant'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'igl', 'IGL', 'In-Game Leader, calls strategies', 5
FROM public.games WHERE slug = 'valorant'
ON CONFLICT DO NOTHING;

-- PUBG Mobile Roles
INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'fragger', 'Fragger', 'Aggressive player focused on kills', 1
FROM public.games WHERE slug = 'pubg-mobile'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'support', 'Support', 'Provides backup and cover fire', 2
FROM public.games WHERE slug = 'pubg-mobile'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'scout', 'Scout', 'Scouts positions and gathers information', 3
FROM public.games WHERE slug = 'pubg-mobile'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'igl', 'IGL', 'In-Game Leader, calls rotations and strategy', 4
FROM public.games WHERE slug = 'pubg-mobile'
ON CONFLICT DO NOTHING;

-- Free Fire Roles
INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'rusher', 'Rusher', 'Aggressive front-line attacker', 1
FROM public.games WHERE slug = 'freefire'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'support', 'Support', 'Heals and provides utility', 2
FROM public.games WHERE slug = 'freefire'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'sniper', 'Sniper', 'Long-range damage dealer', 3
FROM public.games WHERE slug = 'freefire'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'defuser', 'Defuser', 'Handles bomb defusal and objective plays', 4
FROM public.games WHERE slug = 'freefire'
ON CONFLICT DO NOTHING;

-- Clash of Clans Roles
INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'war_specialist', 'War Specialist', 'Excels in clan war attacks', 1
FROM public.games WHERE slug = 'coc'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'donator', 'Donator', 'Actively donates troops and resources', 2
FROM public.games WHERE slug = 'coc'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'clan_leader', 'Clan Leader', 'Leads and organizes the clan', 3
FROM public.games WHERE slug = 'coc'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'base_builder', 'Base Builder', 'Specializes in base layout design', 4
FROM public.games WHERE slug = 'coc'
ON CONFLICT DO NOTHING;

-- COD Mobile Roles
INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'slayer', 'Slayer', 'Primary kill-focused player', 1
FROM public.games WHERE slug = 'cod-mobile'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'obj', 'OBJ', 'Objective-focused player', 2
FROM public.games WHERE slug = 'cod-mobile'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'anchor', 'Anchor', 'Holds spawns and map control', 3
FROM public.games WHERE slug = 'cod-mobile'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'support', 'Support', 'Provides utility and team support', 4
FROM public.games WHERE slug = 'cod-mobile'
ON CONFLICT DO NOTHING;
