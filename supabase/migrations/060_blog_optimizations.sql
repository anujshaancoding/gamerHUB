-- 060: Blog Optimizations
-- - Add content_json JSONB column for TipTap AST storage
-- - Add tsvector full-text search with GIN index
-- - Add index for cursor-based pagination
-- - Drop demo seed data tables

-- 1. Add content_json column for storing TipTap JSON AST
-- This preserves semantic structure for portability (RSS, mobile, email)
-- while keeping HTML for backward compatibility during transition
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS content_json JSONB;

-- 2. Add full-text search vector column
-- Weighted: title (A) is ranked higher than excerpt (B)
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(excerpt, '')), 'B')
) STORED;

-- GIN index for fast full-text search queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_search_vector
  ON blog_posts USING GIN(search_vector);

-- 3. Composite index for cursor-based pagination
-- Supports ORDER BY is_pinned DESC, published_at DESC with WHERE status = 'published'
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_cursor
  ON blog_posts(status, is_pinned DESC, published_at DESC)
  WHERE status = 'published';

-- 4. Drop demo/seed data tables (these are not used by any code)
DROP TABLE IF EXISTS demo_user_badges CASCADE;
DROP TABLE IF EXISTS demo_user_games CASCADE;
DROP TABLE IF EXISTS demo_profiles CASCADE;
DROP TABLE IF EXISTS demo_community_posts CASCADE;
