-- LFG (Looking For Group) tables
-- Run on VPS: sudo -u postgres psql -d gamerhub -f /path/to/003_create_lfg_tables.sql

-- ─── lfg_posts ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lfg_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 100),
  description TEXT,

  -- Creator info
  creator_role TEXT,
  creator_rating INTEGER,
  creator_rank TEXT,
  creator_is_unranked BOOLEAN NOT NULL DEFAULT false,
  creator_agent TEXT,

  -- Requirements
  looking_for_roles TEXT[] NOT NULL DEFAULT '{}',
  min_rating INTEGER,
  max_rating INTEGER,
  min_rank TEXT,
  max_rank TEXT,
  accept_unranked BOOLEAN NOT NULL DEFAULT true,

  -- Session details
  game_mode TEXT,
  map_preference TEXT,
  perspective TEXT,
  region TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  voice_required BOOLEAN NOT NULL DEFAULT false,

  -- Team
  current_players INTEGER NOT NULL DEFAULT 1,
  max_players INTEGER NOT NULL DEFAULT 5,

  -- Duration & status
  duration_type TEXT NOT NULL DEFAULT '2hr' CHECK (duration_type IN ('1hr', '2hr', '4hr', '8hr', 'until_full')),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'full', 'expired', 'cancelled')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── lfg_applications ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lfg_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES lfg_posts(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  applicant_role TEXT,
  applicant_rating INTEGER,
  applicant_rank TEXT,
  applicant_is_unranked BOOLEAN NOT NULL DEFAULT false,
  applicant_agent TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,

  -- One application per user per post
  UNIQUE(post_id, applicant_id)
);

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_lfg_posts_status ON lfg_posts(status);
CREATE INDEX IF NOT EXISTS idx_lfg_posts_creator ON lfg_posts(creator_id);
CREATE INDEX IF NOT EXISTS idx_lfg_posts_game ON lfg_posts(game_id);
CREATE INDEX IF NOT EXISTS idx_lfg_posts_expires ON lfg_posts(expires_at);
CREATE INDEX IF NOT EXISTS idx_lfg_posts_active ON lfg_posts(status, expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_lfg_applications_post ON lfg_applications(post_id);
CREATE INDEX IF NOT EXISTS idx_lfg_applications_applicant ON lfg_applications(applicant_id);

-- ─── Ownership & permissions ─────────────────────────────────
ALTER TABLE lfg_posts OWNER TO gamerhub_app;
ALTER TABLE lfg_applications OWNER TO gamerhub_app;
GRANT ALL ON lfg_posts TO gamerhub_app;
GRANT ALL ON lfg_applications TO gamerhub_app;

-- ─── RLS (allow all for now — tighten before team expansion) ─
ALTER TABLE lfg_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lfg_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY allow_all_lfg_posts ON lfg_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_lfg_applications ON lfg_applications FOR ALL USING (true) WITH CHECK (true);
