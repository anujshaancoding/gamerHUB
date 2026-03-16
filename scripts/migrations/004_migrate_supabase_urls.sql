-- Migration 004: Rewrite old Supabase Storage URLs to self-hosted /uploads/ paths
-- Run on VPS: sudo -u postgres psql -d gamerhub -f /var/www/gglobby/scripts/migrations/004_migrate_supabase_urls.sql

BEGIN;

-- Profiles: avatar_url
UPDATE profiles
SET avatar_url = '/uploads/' || SUBSTRING(avatar_url FROM '/object/public/media/(.+)$')
WHERE avatar_url LIKE '%supabase.co/storage/v1/object/public/media/%';

-- Profiles: banner_url
UPDATE profiles
SET banner_url = '/uploads/' || SUBSTRING(banner_url FROM '/object/public/media/(.+)$')
WHERE banner_url LIKE '%supabase.co/storage/v1/object/public/media/%';

-- Clans: avatar_url
UPDATE clans
SET avatar_url = '/uploads/' || SUBSTRING(avatar_url FROM '/object/public/media/(.+)$')
WHERE avatar_url LIKE '%supabase.co/storage/v1/object/public/media/%';

-- Clans: banner_url
UPDATE clans
SET banner_url = '/uploads/' || SUBSTRING(banner_url FROM '/object/public/media/(.+)$')
WHERE banner_url LIKE '%supabase.co/storage/v1/object/public/media/%';

-- Blog posts: featured_image_url
UPDATE blog_posts
SET featured_image_url = '/uploads/' || SUBSTRING(featured_image_url FROM '/object/public/media/(.+)$')
WHERE featured_image_url LIKE '%supabase.co/storage/v1/object/public/media/%';

-- News articles: thumbnail_url (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_articles' AND column_name = 'thumbnail_url') THEN
    EXECUTE '
      UPDATE news_articles
      SET thumbnail_url = ''/uploads/'' || SUBSTRING(thumbnail_url FROM ''/object/public/media/(.+)$'')
      WHERE thumbnail_url LIKE ''%supabase.co/storage/v1/object/public/media/%''
    ';
  END IF;
END $$;

-- Catch-all: any other tables with image columns referencing supabase
-- Integrations: provider_avatar_url
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integrations' AND column_name = 'provider_avatar_url') THEN
    EXECUTE '
      UPDATE integrations
      SET provider_avatar_url = ''/uploads/'' || SUBSTRING(provider_avatar_url FROM ''/object/public/media/(.+)$'')
      WHERE provider_avatar_url LIKE ''%supabase.co/storage/v1/object/public/media/%''
    ';
  END IF;
END $$;

COMMIT;
