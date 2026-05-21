-- Wall post likes
-- Run on VPS: sudo -u postgres psql -d gamerhub -f /path/to/008_create_wall_post_likes.sql

-- ─── profile_wall_post_likes ─────────────────────────────────
CREATE TABLE IF NOT EXISTS profile_wall_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES profile_wall_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One like per user per post
  UNIQUE(post_id, user_id)
);

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wall_post_likes_post ON profile_wall_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_wall_post_likes_user ON profile_wall_post_likes(user_id);

-- ─── Ownership & permissions ─────────────────────────────────
ALTER TABLE profile_wall_post_likes OWNER TO gamerhub_app;
GRANT ALL ON profile_wall_post_likes TO gamerhub_app;

-- ─── RLS (allow all for now — tighten before team expansion) ─
ALTER TABLE profile_wall_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY allow_all_wall_post_likes ON profile_wall_post_likes FOR ALL USING (true) WITH CHECK (true);
