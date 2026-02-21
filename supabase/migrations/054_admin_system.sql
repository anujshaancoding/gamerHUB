-- Admin System Migration
-- Adds admin access control to profiles table

-- Add admin columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_role VARCHAR(30) DEFAULT NULL
  CHECK (admin_role IS NULL OR admin_role IN ('super_admin', 'editor', 'moderator'));

-- Index for quick admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;

-- Allow admins to view all news articles (not just published)
CREATE POLICY "Admins can view all news articles"
  ON public.news_articles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Allow admins to insert news articles
CREATE POLICY "Admins can insert news articles"
  ON public.news_articles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Allow admins to update news articles
CREATE POLICY "Admins can update news articles"
  ON public.news_articles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Allow admins to delete news articles
CREATE POLICY "Admins can delete news articles"
  ON public.news_articles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
