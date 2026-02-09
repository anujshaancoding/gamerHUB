-- Streaming and Twitch Integration Migration

-- Enum for stream status
CREATE TYPE stream_status AS ENUM ('offline', 'live', 'hosting');

-- Streamer profiles (linked to Twitch)
CREATE TABLE streamer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  twitch_id TEXT UNIQUE NOT NULL,
  twitch_login TEXT NOT NULL,
  twitch_display_name TEXT,
  twitch_profile_image_url TEXT,
  twitch_broadcaster_type TEXT, -- '', 'affiliate', 'partner'
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[] DEFAULT '{}',

  -- Stream settings
  stream_title TEXT,
  stream_game_id TEXT,
  stream_game_name TEXT,
  stream_language TEXT DEFAULT 'en',

  -- Current status
  status stream_status DEFAULT 'offline',
  current_viewer_count INTEGER DEFAULT 0,
  last_stream_started_at TIMESTAMPTZ,
  last_stream_ended_at TIMESTAMPTZ,

  -- Settings
  is_featured BOOLEAN DEFAULT false, -- Show on homepage
  auto_notify_followers BOOLEAN DEFAULT true,
  embed_enabled BOOLEAN DEFAULT true,

  -- Stats
  total_stream_hours INTEGER DEFAULT 0,
  peak_viewer_count INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,

  connected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX idx_streamer_profiles_twitch ON streamer_profiles(twitch_id);
CREATE INDEX idx_streamer_profiles_status ON streamer_profiles(status) WHERE status = 'live';
CREATE INDEX idx_streamer_profiles_featured ON streamer_profiles(is_featured, status);

-- Stream schedules
CREATE TABLE stream_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID NOT NULL REFERENCES streamer_profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
  start_time TIME NOT NULL,
  end_time TIME,
  timezone TEXT DEFAULT 'UTC',
  title TEXT,
  game_name TEXT,
  is_recurring BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for schedule lookups
CREATE INDEX idx_stream_schedules_streamer ON stream_schedules(streamer_id);
CREATE INDEX idx_stream_schedules_day ON stream_schedules(day_of_week, start_time);

-- Stream history (past streams)
CREATE TABLE stream_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID NOT NULL REFERENCES streamer_profiles(id) ON DELETE CASCADE,
  twitch_stream_id TEXT,
  title TEXT,
  game_id TEXT,
  game_name TEXT,
  viewer_count INTEGER DEFAULT 0,
  peak_viewers INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  vod_url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for history lookups
CREATE INDEX idx_stream_history_streamer ON stream_history(streamer_id, started_at DESC);

-- Twitch EventSub subscriptions (for tracking active webhooks)
CREATE TABLE twitch_eventsub_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twitch_subscription_id TEXT UNIQUE NOT NULL,
  streamer_id UUID NOT NULL REFERENCES streamer_profiles(id) ON DELETE CASCADE,
  subscription_type TEXT NOT NULL, -- 'stream.online', 'stream.offline', etc.
  status TEXT DEFAULT 'enabled',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for eventsub lookups
CREATE INDEX idx_twitch_eventsub_streamer ON twitch_eventsub_subscriptions(streamer_id);

-- User follows for streamers (separate from user follows)
CREATE TABLE streamer_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  streamer_id UUID NOT NULL REFERENCES streamer_profiles(id) ON DELETE CASCADE,
  notify_live BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, streamer_id)
);

-- Index for follow lookups
CREATE INDEX idx_streamer_follows_user ON streamer_follows(user_id);
CREATE INDEX idx_streamer_follows_streamer ON streamer_follows(streamer_id);

-- Enable RLS
ALTER TABLE streamer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_eventsub_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE streamer_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for streamer_profiles
CREATE POLICY "Anyone can view streamer profiles"
  ON streamer_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own streamer profile"
  ON streamer_profiles FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for stream_schedules
CREATE POLICY "Anyone can view schedules"
  ON stream_schedules FOR SELECT
  USING (true);

CREATE POLICY "Streamers can manage their schedules"
  ON stream_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM streamer_profiles
      WHERE id = stream_schedules.streamer_id
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for stream_history
CREATE POLICY "Anyone can view stream history"
  ON stream_history FOR SELECT
  USING (true);

-- RLS Policies for twitch_eventsub_subscriptions (system only)
CREATE POLICY "System can manage eventsub"
  ON twitch_eventsub_subscriptions FOR ALL
  USING (true);

-- RLS Policies for streamer_follows
CREATE POLICY "Users can manage their follows"
  ON streamer_follows FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can see follow counts"
  ON streamer_follows FOR SELECT
  USING (true);

-- Function to get live streamers
CREATE OR REPLACE FUNCTION get_live_streamers(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  twitch_login TEXT,
  twitch_display_name TEXT,
  twitch_profile_image_url TEXT,
  stream_title TEXT,
  stream_game_name TEXT,
  current_viewer_count INTEGER,
  last_stream_started_at TIMESTAMPTZ,
  is_featured BOOLEAN,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.user_id,
    sp.twitch_login,
    sp.twitch_display_name,
    sp.twitch_profile_image_url,
    sp.stream_title,
    sp.stream_game_name,
    sp.current_viewer_count,
    sp.last_stream_started_at,
    sp.is_featured,
    p.username,
    p.display_name,
    p.avatar_url
  FROM streamer_profiles sp
  JOIN profiles p ON p.id = sp.user_id
  WHERE sp.status = 'live'
  ORDER BY sp.is_featured DESC, sp.current_viewer_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update stream status (called by webhook)
CREATE OR REPLACE FUNCTION update_stream_status(
  p_twitch_id TEXT,
  p_status stream_status,
  p_title TEXT DEFAULT NULL,
  p_game_name TEXT DEFAULT NULL,
  p_viewer_count INTEGER DEFAULT 0
) RETURNS VOID AS $$
DECLARE
  v_streamer_id UUID;
  v_was_live BOOLEAN;
BEGIN
  -- Get streamer and check previous status
  SELECT id, (status = 'live') INTO v_streamer_id, v_was_live
  FROM streamer_profiles
  WHERE twitch_id = p_twitch_id;

  IF v_streamer_id IS NULL THEN
    RETURN;
  END IF;

  -- Update streamer profile
  UPDATE streamer_profiles
  SET
    status = p_status,
    stream_title = COALESCE(p_title, stream_title),
    stream_game_name = COALESCE(p_game_name, stream_game_name),
    current_viewer_count = p_viewer_count,
    last_stream_started_at = CASE WHEN p_status = 'live' AND NOT v_was_live THEN NOW() ELSE last_stream_started_at END,
    last_stream_ended_at = CASE WHEN p_status = 'offline' AND v_was_live THEN NOW() ELSE last_stream_ended_at END,
    peak_viewer_count = GREATEST(peak_viewer_count, p_viewer_count),
    updated_at = NOW()
  WHERE id = v_streamer_id;

  -- If stream ended, create history entry
  IF p_status = 'offline' AND v_was_live THEN
    INSERT INTO stream_history (streamer_id, title, game_name, peak_viewers, started_at, ended_at)
    SELECT
      v_streamer_id,
      stream_title,
      stream_game_name,
      peak_viewer_count,
      last_stream_started_at,
      NOW()
    FROM streamer_profiles
    WHERE id = v_streamer_id;

    -- Calculate and update duration
    UPDATE stream_history
    SET duration_minutes = EXTRACT(EPOCH FROM (ended_at - started_at)) / 60
    WHERE streamer_id = v_streamer_id
    AND ended_at IS NOT NULL
    AND duration_minutes IS NULL;

    -- Update total stream hours
    UPDATE streamer_profiles
    SET total_stream_hours = total_stream_hours +
      (SELECT COALESCE(SUM(duration_minutes), 0) / 60
       FROM stream_history
       WHERE streamer_id = v_streamer_id AND duration_minutes IS NOT NULL)
    WHERE id = v_streamer_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle streamer follow
CREATE OR REPLACE FUNCTION toggle_streamer_follow(
  p_user_id UUID,
  p_streamer_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM streamer_follows
    WHERE user_id = p_user_id AND streamer_id = p_streamer_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM streamer_follows
    WHERE user_id = p_user_id AND streamer_id = p_streamer_id;

    UPDATE streamer_profiles
    SET follower_count = follower_count - 1
    WHERE id = p_streamer_id;

    RETURN jsonb_build_object('following', false);
  ELSE
    INSERT INTO streamer_follows (user_id, streamer_id)
    VALUES (p_user_id, p_streamer_id);

    UPDATE streamer_profiles
    SET follower_count = follower_count + 1
    WHERE id = p_streamer_id;

    RETURN jsonb_build_object('following', true);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for timestamps
CREATE TRIGGER streamer_profiles_updated_at
  BEFORE UPDATE ON streamer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_game_connections_timestamp();

CREATE TRIGGER stream_schedules_updated_at
  BEFORE UPDATE ON stream_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_game_connections_timestamp();
