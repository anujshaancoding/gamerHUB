-- Migration: 059_beta_feedback.sql
-- Beta feedback system — collect user feedback with optional screenshot

CREATE TABLE IF NOT EXISTS public.beta_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  image_url TEXT,
  page_url TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone logged in can insert feedback
CREATE POLICY "Users can submit feedback"
  ON public.beta_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Only admins (or service role) can read all feedback
CREATE POLICY "Admins can read all feedback"
  ON public.beta_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Allow anonymous feedback (no user_id)
CREATE POLICY "Anonymous users can submit feedback"
  ON public.beta_feedback FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Index for admin review
CREATE INDEX IF NOT EXISTS idx_beta_feedback_created
  ON public.beta_feedback(created_at DESC);
