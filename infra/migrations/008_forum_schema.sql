-- 008_forum_schema: Forum — categories, threads, replies, votes
--
-- Folded into the numbered migration set (audit finding H8). This was previously
-- the out-of-band infra/tools-and-forum-deploy/01_forum_schema.sql, which meant a
-- clean-DB deploy would FAIL because 009_forum_valorant_only / 010_forum_*_seed
-- reference these tables. It now runs (idempotently) before 009 via deploy.sh.
-- The out-of-band copy is kept for the legacy manual apply.sh path; this file is
-- the source of truth for fresh deploys.
--
-- Powers /forum: section-first discussion board. V2 is Valorant-only, so the
-- seed ships a single Valorant section + pinned Announcements. Threads have
-- nested 1-level replies + upvote / downvote, mirroring the existing
-- /api/forums/* routes which were already shipped against this schema.

-- ─── forum_categories ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  description     TEXT,
  icon            TEXT,                                  -- lucide icon name
  color           TEXT,                                  -- tailwind/hex token
  game_id         TEXT,                                  -- 'valorant' / 'bgmi' / 'freefire' / NULL
  parent_id       UUID REFERENCES forum_categories(id) ON DELETE SET NULL,
  post_count      INTEGER NOT NULL DEFAULT 0,
  is_locked       BOOLEAN NOT NULL DEFAULT FALSE,
  is_hidden       BOOLEAN NOT NULL DEFAULT FALSE,
  display_order   INTEGER NOT NULL DEFAULT 100,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_cat_slug      ON forum_categories(slug);
CREATE INDEX IF NOT EXISTS idx_forum_cat_visible   ON forum_categories(display_order) WHERE is_hidden = FALSE;

-- ─── forum_posts ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  author_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL,
  content         TEXT NOT NULL,
  post_type       TEXT NOT NULL DEFAULT 'discussion'
                    CHECK (post_type IN ('discussion','question','guide','lfg','announcement')),
  tags            TEXT[] NOT NULL DEFAULT '{}',
  is_pinned       BOOLEAN NOT NULL DEFAULT FALSE,
  is_locked       BOOLEAN NOT NULL DEFAULT FALSE,
  is_solved       BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
  solved_reply_id UUID,
  view_count      INTEGER NOT NULL DEFAULT 0,
  reply_count     INTEGER NOT NULL DEFAULT 0,
  vote_score      INTEGER NOT NULL DEFAULT 0,
  last_reply_at   TIMESTAMPTZ,
  last_reply_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_cat      ON forum_posts(category_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_forum_posts_author   ON forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_recent   ON forum_posts(last_reply_at DESC NULLS LAST, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_forum_posts_top      ON forum_posts(vote_score DESC) WHERE is_deleted = FALSE;

-- ─── forum_replies ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_replies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id       UUID REFERENCES forum_replies(id) ON DELETE SET NULL,
  content         TEXT NOT NULL,
  vote_score      INTEGER NOT NULL DEFAULT 0,
  is_solution     BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_replies_post     ON forum_replies(post_id, created_at) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_forum_replies_author   ON forum_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_parent   ON forum_replies(parent_id) WHERE parent_id IS NOT NULL;

-- ─── forum_votes ─────────────────────────────────────────────────────────────
-- One row per user per (post xor reply). vote_type ∈ (1, -1).
CREATE TABLE IF NOT EXISTS forum_votes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id         UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  reply_id        UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  vote_type       SMALLINT NOT NULL CHECK (vote_type IN (1, -1)),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((post_id IS NOT NULL AND reply_id IS NULL) OR (post_id IS NULL AND reply_id IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_forum_votes_user_post  ON forum_votes(user_id, post_id) WHERE post_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_forum_votes_user_reply ON forum_votes(user_id, reply_id) WHERE reply_id IS NOT NULL;

-- ─── helpers ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION forum_slugify(input TEXT) RETURNS TEXT AS $$
  SELECT trim(both '-' from
           regexp_replace(
             regexp_replace(lower(input), '[^a-z0-9]+', '-', 'g'),
             '-{2,}', '-', 'g'
           )
         );
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION forum_set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_forum_cat_upd     ON forum_categories;
CREATE TRIGGER trg_forum_cat_upd     BEFORE UPDATE ON forum_categories FOR EACH ROW EXECUTE FUNCTION forum_set_updated_at();

DROP TRIGGER IF EXISTS trg_forum_post_upd    ON forum_posts;
CREATE TRIGGER trg_forum_post_upd    BEFORE UPDATE ON forum_posts FOR EACH ROW EXECUTE FUNCTION forum_set_updated_at();

DROP TRIGGER IF EXISTS trg_forum_reply_upd   ON forum_replies;
CREATE TRIGGER trg_forum_reply_upd   BEFORE UPDATE ON forum_replies FOR EACH ROW EXECUTE FUNCTION forum_set_updated_at();

-- ─── RPC: create_forum_post ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_forum_post(
  p_category_id UUID,
  p_author_id   UUID,
  p_title       TEXT,
  p_content     TEXT,
  p_post_type   TEXT DEFAULT 'discussion',
  p_tags        TEXT[] DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_slug      TEXT;
  v_base_slug TEXT;
  v_attempt   INTEGER := 0;
  v_post_id   UUID;
BEGIN
  v_base_slug := forum_slugify(p_title);
  IF v_base_slug = '' OR v_base_slug IS NULL THEN
    v_base_slug := 'thread';
  END IF;
  v_slug := substring(v_base_slug for 80);

  LOOP
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM forum_posts WHERE category_id = p_category_id AND slug = v_slug
    );
    v_attempt := v_attempt + 1;
    v_slug := substring(v_base_slug for 76) || '-' || v_attempt::TEXT;
    EXIT WHEN v_attempt > 50;
  END LOOP;

  -- Seed last_reply_at with creation time so brand-new threads sort into the
  -- activity feed alongside threads that already have replies.
  INSERT INTO forum_posts (category_id, author_id, title, slug, content, post_type, tags, last_reply_at)
  VALUES (p_category_id, p_author_id, p_title, v_slug, p_content, p_post_type, COALESCE(p_tags, '{}'), NOW())
  RETURNING id INTO v_post_id;

  UPDATE forum_categories SET post_count = post_count + 1 WHERE id = p_category_id;

  RETURN v_post_id;
END;
$$ LANGUAGE plpgsql;

-- ─── RPC: create_forum_reply ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_forum_reply(
  p_post_id   UUID,
  p_author_id UUID,
  p_content   TEXT,
  p_parent_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE v_reply_id UUID;
BEGIN
  INSERT INTO forum_replies (post_id, author_id, parent_id, content)
  VALUES (p_post_id, p_author_id, p_parent_id, p_content)
  RETURNING id INTO v_reply_id;

  UPDATE forum_posts
     SET reply_count   = reply_count + 1,
         last_reply_at = NOW(),
         last_reply_by = p_author_id
   WHERE id = p_post_id;

  RETURN v_reply_id;
END;
$$ LANGUAGE plpgsql;

-- ─── RPC: increment_post_views ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_post_views(p_post_id UUID) RETURNS VOID AS $$
BEGIN
  UPDATE forum_posts SET view_count = view_count + 1 WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql;

-- ─── RPC: toggle_forum_vote ──────────────────────────────────────────────────
-- Atomically applies, switches or removes a user's vote and returns the new
-- target score. Use p_post_id XOR p_reply_id; the other should be NULL.
CREATE OR REPLACE FUNCTION toggle_forum_vote(
  p_user_id   UUID,
  p_vote_type SMALLINT,
  p_post_id   UUID DEFAULT NULL,
  p_reply_id  UUID DEFAULT NULL
) RETURNS TABLE (score INTEGER) AS $$
DECLARE
  v_existing  SMALLINT;
  v_delta     INTEGER := 0;
  v_new_score INTEGER;
BEGIN
  IF p_post_id IS NOT NULL THEN
    SELECT vote_type INTO v_existing
      FROM forum_votes
     WHERE user_id = p_user_id AND post_id = p_post_id;

    IF v_existing IS NULL THEN
      INSERT INTO forum_votes (user_id, post_id, vote_type) VALUES (p_user_id, p_post_id, p_vote_type);
      v_delta := p_vote_type;
    ELSIF v_existing = p_vote_type THEN
      DELETE FROM forum_votes WHERE user_id = p_user_id AND post_id = p_post_id;
      v_delta := -p_vote_type;
    ELSE
      UPDATE forum_votes SET vote_type = p_vote_type WHERE user_id = p_user_id AND post_id = p_post_id;
      v_delta := p_vote_type * 2;
    END IF;

    UPDATE forum_posts SET vote_score = vote_score + v_delta
     WHERE id = p_post_id
     RETURNING vote_score INTO v_new_score;
  ELSE
    SELECT vote_type INTO v_existing
      FROM forum_votes
     WHERE user_id = p_user_id AND reply_id = p_reply_id;

    IF v_existing IS NULL THEN
      INSERT INTO forum_votes (user_id, reply_id, vote_type) VALUES (p_user_id, p_reply_id, p_vote_type);
      v_delta := p_vote_type;
    ELSIF v_existing = p_vote_type THEN
      DELETE FROM forum_votes WHERE user_id = p_user_id AND reply_id = p_reply_id;
      v_delta := -p_vote_type;
    ELSE
      UPDATE forum_votes SET vote_type = p_vote_type WHERE user_id = p_user_id AND reply_id = p_reply_id;
      v_delta := p_vote_type * 2;
    END IF;

    UPDATE forum_replies SET vote_score = vote_score + v_delta
     WHERE id = p_reply_id
     RETURNING vote_score INTO v_new_score;
  END IF;

  RETURN QUERY SELECT v_new_score;
END;
$$ LANGUAGE plpgsql;

-- ─── Ownership / privileges ──────────────────────────────────────────────────
ALTER TABLE forum_categories OWNER TO gamerhub_app;
ALTER TABLE forum_posts      OWNER TO gamerhub_app;
ALTER TABLE forum_replies    OWNER TO gamerhub_app;
ALTER TABLE forum_votes      OWNER TO gamerhub_app;

GRANT ALL ON forum_categories TO gamerhub_app;
GRANT ALL ON forum_posts      TO gamerhub_app;
GRANT ALL ON forum_replies    TO gamerhub_app;
GRANT ALL ON forum_votes      TO gamerhub_app;

ALTER FUNCTION create_forum_post(UUID, UUID, TEXT, TEXT, TEXT, TEXT[]) OWNER TO gamerhub_app;
ALTER FUNCTION create_forum_reply(UUID, UUID, TEXT, UUID)              OWNER TO gamerhub_app;
ALTER FUNCTION toggle_forum_vote(UUID, SMALLINT, UUID, UUID)           OWNER TO gamerhub_app;
ALTER FUNCTION increment_post_views(UUID)                              OWNER TO gamerhub_app;
