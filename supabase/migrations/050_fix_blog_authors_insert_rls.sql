-- Fix: Allow authenticated users to register as blog authors
-- The blog_authors table was missing an INSERT policy, causing RLS violations
-- when premium users tried to access the /write page (which auto-registers them as authors)

CREATE POLICY "Users can register as blog authors"
  ON public.blog_authors FOR INSERT
  WITH CHECK (auth.uid() = user_id);
