-- User Activity Tracking: daily presence aggregation
-- Records one row per user per day, incremented by the presence heartbeat

CREATE TABLE IF NOT EXISTS public.user_activity_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  minutes_online REAL NOT NULL DEFAULT 0,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, activity_date)
);

-- Index for fetching a user's activity history
CREATE INDEX IF NOT EXISTS idx_activity_days_user_date
  ON public.user_activity_days(user_id, activity_date DESC);

-- RLS
ALTER TABLE public.user_activity_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view activity days"
  ON public.user_activity_days FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own activity"
  ON public.user_activity_days FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity"
  ON public.user_activity_days FOR UPDATE
  USING (auth.uid() = user_id);

-- RPC function called by the 30-second presence heartbeat.
-- Atomic UPSERT: inserts a new row for today or increments minutes_online.
-- Deduplication: skips the increment if last_seen_at was <20s ago
-- (prevents double-counting from multiple open tabs).
CREATE OR REPLACE FUNCTION public.record_heartbeat_activity(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_activity_days (user_id, activity_date, minutes_online, first_seen_at, last_seen_at)
  VALUES (p_user_id, CURRENT_DATE, 0.5, NOW(), NOW())
  ON CONFLICT (user_id, activity_date)
  DO UPDATE SET
    minutes_online = CASE
      WHEN NOW() - user_activity_days.last_seen_at > INTERVAL '20 seconds'
      THEN user_activity_days.minutes_online + 0.5
      ELSE user_activity_days.minutes_online
    END,
    last_seen_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.user_activity_days IS
  'Daily presence aggregation: one row per user per day, incremented by heartbeat';
COMMENT ON COLUMN public.user_activity_days.minutes_online IS
  'Total minutes online for this day (incremented 0.5 per 30-second heartbeat)';
