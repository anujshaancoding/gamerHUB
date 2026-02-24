-- Page views tracking for admin analytics dashboard
CREATE TABLE IF NOT EXISTS page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  path TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for efficient aggregation queries
CREATE INDEX idx_page_views_created_at ON page_views(created_at);
CREATE INDEX idx_page_views_path ON page_views(path);
CREATE INDEX idx_page_views_user_id ON page_views(user_id) WHERE user_id IS NOT NULL;

-- RLS
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert page views (tracks anonymous + authenticated visitors)
CREATE POLICY "Anyone can insert page views"
  ON page_views FOR INSERT
  WITH CHECK (true);

-- Only admins can read page views
CREATE POLICY "Admins can read page views"
  ON page_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Function: get daily page views aggregated by date
CREATE OR REPLACE FUNCTION get_daily_page_views(days_back INT DEFAULT 30)
RETURNS TABLE(date DATE, total_views BIGINT, unique_visitors BIGINT)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT
    created_at::date AS date,
    COUNT(*) AS total_views,
    COUNT(DISTINCT COALESCE(user_id::text, session_id)) AS unique_visitors
  FROM page_views
  WHERE created_at >= (NOW() - (days_back || ' days')::interval)
  GROUP BY created_at::date
  ORDER BY date ASC;
$$;

-- Function: get top pages by view count
CREATE OR REPLACE FUNCTION get_top_pages(days_back INT DEFAULT 30, page_limit INT DEFAULT 10)
RETURNS TABLE(path TEXT, view_count BIGINT, unique_count BIGINT)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT
    page_views.path,
    COUNT(*) AS view_count,
    COUNT(DISTINCT COALESCE(user_id::text, session_id)) AS unique_count
  FROM page_views
  WHERE created_at >= (NOW() - (days_back || ' days')::interval)
  GROUP BY page_views.path
  ORDER BY view_count DESC
  LIMIT page_limit;
$$;
