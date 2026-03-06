-- Create beta_feedback table for the feedback widget
CREATE TABLE IF NOT EXISTS beta_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  image_url TEXT,
  page_url TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_beta_feedback_created_at ON beta_feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_category ON beta_feedback (category);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_user_id ON beta_feedback (user_id);
