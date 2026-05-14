-- 009c: Forum activity-feed fix
--
-- Brand-new threads were ranking below older threads with replies because
-- `last_reply_at` was NULL on insert and `ORDER BY last_reply_at DESC NULLS
-- LAST` pushed them to the bottom. This migration:
--   1. Backfills `last_reply_at = created_at` on every existing thread that
--      never received a reply.
--   2. Replaces `create_forum_post` so new threads start with
--      `last_reply_at = NOW()` — i.e. thread creation counts as activity.
--
-- Idempotent — re-runnable.

UPDATE forum_posts
   SET last_reply_at = created_at
 WHERE last_reply_at IS NULL;

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

  INSERT INTO forum_posts (category_id, author_id, title, slug, content, post_type, tags, last_reply_at)
  VALUES (p_category_id, p_author_id, p_title, v_slug, p_content, p_post_type, COALESCE(p_tags, '{}'), NOW())
  RETURNING id INTO v_post_id;

  UPDATE forum_categories SET post_count = post_count + 1 WHERE id = p_category_id;

  RETURN v_post_id;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION create_forum_post(UUID, UUID, TEXT, TEXT, TEXT, TEXT[]) OWNER TO gamerhub_app;
