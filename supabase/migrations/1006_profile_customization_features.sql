-- Profile Customization Features Migration
-- Adds modular customization columns to profiles + gamer wall table

-- ========================================
-- 1. New profile customization columns
-- ========================================

-- Custom color theme (primary, secondary, accent hex colors)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_theme jsonb DEFAULT null;

-- Profile particle effect (snow, rain, fireflies, etc.)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_effect text DEFAULT null;

-- Animated background (cyberpunk_grid, starfield, etc.)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_background text DEFAULT null;

-- Profile music URL (YouTube embed)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_music_url text DEFAULT null;

-- Widget layout grid configuration
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS widget_layout jsonb DEFAULT null;

-- Profile skin/template
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_skin text DEFAULT null;

-- Easter egg configuration
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS easter_egg_config jsonb DEFAULT null;

-- Hover card configuration
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hover_card_config jsonb DEFAULT null;

-- Custom CSS (premium feature)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_css text DEFAULT null;

-- ========================================
-- 2. Gamer Wall / Guestbook
-- ========================================

CREATE TABLE IF NOT EXISTS profile_wall_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  reaction text CHECK (reaction IN ('gg', 'respect', 'carry', 'legend', 'wholesome')),
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wall_posts_profile ON profile_wall_posts(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wall_posts_author ON profile_wall_posts(author_id);

-- Auth is enforced at the API layer (getUser()), no RLS needed on VPS.
