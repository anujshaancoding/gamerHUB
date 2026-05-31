-- Profile Showcase media: likes + flat comments
-- Run on VPS: sudo -u postgres psql -d gamerhub -f /path/to/013_create_media_social.sql

-- ─── profile_media_likes ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS profile_media_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One like per user per media item
  UNIQUE(media_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_media_likes_media ON profile_media_likes(media_id);
CREATE INDEX IF NOT EXISTS idx_media_likes_user ON profile_media_likes(user_id);

-- ─── profile_media_comments (flat, single level) ─────────────
CREATE TABLE IF NOT EXISTS profile_media_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments are always listed per media item, oldest first
CREATE INDEX IF NOT EXISTS idx_media_comments_media ON profile_media_comments(media_id, created_at);

-- ─── Ownership & permissions ─────────────────────────────────
ALTER TABLE profile_media_likes OWNER TO gamerhub_app;
GRANT ALL ON profile_media_likes TO gamerhub_app;
ALTER TABLE profile_media_comments OWNER TO gamerhub_app;
GRANT ALL ON profile_media_comments TO gamerhub_app;

-- ─── RLS (allow all for now — tighten before team expansion) ─
ALTER TABLE profile_media_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_all_media_likes ON profile_media_likes;
CREATE POLICY allow_all_media_likes ON profile_media_likes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE profile_media_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_all_media_comments ON profile_media_comments;
CREATE POLICY allow_all_media_comments ON profile_media_comments FOR ALL USING (true) WITH CHECK (true);
