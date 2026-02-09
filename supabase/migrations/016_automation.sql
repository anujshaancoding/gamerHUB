-- Bot/Automation System Migration
-- Discord integration, notifications, and automation rules

-- Enum for notification channels
CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'discord', 'push');

-- Enum for notification types
CREATE TYPE notification_type AS ENUM (
  'match_reminder',
  'tournament_start',
  'clan_invite',
  'friend_request',
  'achievement_earned',
  'level_up',
  'battle_pass_reward',
  'stream_live',
  'forum_reply',
  'direct_message',
  'system_announcement'
);

-- Enum for automation trigger types
CREATE TYPE automation_trigger AS ENUM (
  'member_joined',
  'member_left',
  'match_scheduled',
  'match_completed',
  'tournament_created',
  'achievement_unlocked',
  'level_milestone',
  'weekly_summary'
);

-- Enum for automation action types
CREATE TYPE automation_action AS ENUM (
  'send_discord_message',
  'send_notification',
  'assign_role',
  'update_channel_topic',
  'create_event',
  'post_announcement'
);

-- Discord connections (user-level)
CREATE TABLE discord_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  discord_user_id TEXT NOT NULL,
  discord_username TEXT NOT NULL,
  discord_discriminator TEXT,
  discord_avatar TEXT,
  discord_email TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  guilds JSONB DEFAULT '[]', -- Cached list of mutual guilds
  is_active BOOLEAN DEFAULT true,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(discord_user_id)
);

-- Discord guild connections (clan-level)
CREATE TABLE discord_guild_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  guild_id TEXT NOT NULL,
  guild_name TEXT NOT NULL,
  guild_icon TEXT,
  connected_by UUID NOT NULL REFERENCES profiles(id),
  bot_permissions BIGINT DEFAULT 0,
  webhook_url TEXT,
  webhook_id TEXT,
  webhook_token TEXT,
  notification_channel_id TEXT,
  announcement_channel_id TEXT,
  log_channel_id TEXT,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clan_id),
  UNIQUE(guild_id)
);

-- Index for guild lookups
CREATE INDEX idx_discord_guild_connections_guild ON discord_guild_connections(guild_id);

-- User notification preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  channels notification_channel[] DEFAULT ARRAY['in_app']::notification_channel[],
  is_enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME, -- e.g., 22:00
  quiet_hours_end TIME,   -- e.g., 08:00
  frequency TEXT DEFAULT 'instant', -- 'instant', 'hourly_digest', 'daily_digest'
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, notification_type)
);

-- Notifications table (in-app notifications)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  icon TEXT,
  image_url TEXT,
  action_url TEXT,
  action_label TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, created_at DESC) WHERE is_read = false;

-- Scheduled notifications (for reminders, digests)
CREATE TABLE scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  clan_id UUID REFERENCES clans(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  channels notification_channel[] NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB DEFAULT '{}',
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  is_sent BOOLEAN DEFAULT false,
  is_cancelled BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT scheduled_notifications_target CHECK (user_id IS NOT NULL OR clan_id IS NOT NULL)
);

-- Index for scheduled notifications processing
CREATE INDEX idx_scheduled_notifications_pending ON scheduled_notifications(scheduled_for)
  WHERE is_sent = false AND is_cancelled = false;

-- Automation rules (clan-level)
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type automation_trigger NOT NULL,
  trigger_conditions JSONB DEFAULT '{}', -- Additional conditions for trigger
  action_type automation_action NOT NULL,
  action_config JSONB NOT NULL, -- Configuration for the action
  is_enabled BOOLEAN DEFAULT true,
  cooldown_minutes INTEGER DEFAULT 0, -- Prevent spam
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for automation rules
CREATE INDEX idx_automation_rules_clan ON automation_rules(clan_id, is_enabled);
CREATE INDEX idx_automation_rules_trigger ON automation_rules(trigger_type) WHERE is_enabled = true;

-- Automation execution log
CREATE TABLE automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  trigger_data JSONB NOT NULL,
  action_result JSONB,
  is_success BOOLEAN NOT NULL,
  error_message TEXT,
  execution_time_ms INTEGER,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for automation logs
CREATE INDEX idx_automation_logs_rule ON automation_logs(rule_id, executed_at DESC);
CREATE INDEX idx_automation_logs_clan ON automation_logs(clan_id, executed_at DESC);

-- Discord slash command interactions log
CREATE TABLE discord_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id TEXT NOT NULL,
  interaction_type INTEGER NOT NULL,
  guild_id TEXT,
  channel_id TEXT,
  user_id TEXT NOT NULL,
  gamerhub_user_id UUID REFERENCES profiles(id),
  command_name TEXT,
  command_options JSONB DEFAULT '{}',
  response_type TEXT,
  response_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(interaction_id)
);

-- Index for interaction lookups
CREATE INDEX idx_discord_interactions_user ON discord_interactions(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE discord_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE discord_guild_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE discord_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discord_connections
CREATE POLICY "Users can view their own discord connection"
  ON discord_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own discord connection"
  ON discord_connections FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for discord_guild_connections
CREATE POLICY "Clan members can view guild connections"
  ON discord_guild_connections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clan_members cm
      WHERE cm.clan_id = discord_guild_connections.clan_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Clan admins can manage guild connections"
  ON discord_guild_connections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clan_members cm
      WHERE cm.clan_id = discord_guild_connections.clan_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own notification preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- RLS Policies for scheduled_notifications
CREATE POLICY "Users can view their scheduled notifications"
  ON scheduled_notifications FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can manage scheduled notifications"
  ON scheduled_notifications FOR ALL
  USING (true);

-- RLS Policies for automation_rules
CREATE POLICY "Clan members can view automation rules"
  ON automation_rules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clan_members cm
      WHERE cm.clan_id = automation_rules.clan_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Clan admins can manage automation rules"
  ON automation_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clan_members cm
      WHERE cm.clan_id = automation_rules.clan_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for automation_logs
CREATE POLICY "Clan admins can view automation logs"
  ON automation_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clan_members cm
      WHERE cm.clan_id = automation_logs.clan_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for discord_interactions
CREATE POLICY "Users can view their own interactions"
  ON discord_interactions FOR SELECT
  USING (auth.uid() = gamerhub_user_id);

-- Function to get user notifications with pagination
CREATE OR REPLACE FUNCTION get_user_notifications(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_unread_only BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  type notification_type,
  title TEXT,
  body TEXT,
  icon TEXT,
  image_url TEXT,
  action_url TEXT,
  action_label TEXT,
  metadata JSONB,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH unread AS (
    SELECT COUNT(*) as cnt FROM notifications n
    WHERE n.user_id = p_user_id AND n.is_read = false AND n.is_archived = false
  )
  SELECT
    n.id,
    n.type,
    n.title,
    n.body,
    n.icon,
    n.image_url,
    n.action_url,
    n.action_label,
    n.metadata,
    n.is_read,
    n.created_at,
    u.cnt as unread_count
  FROM notifications n, unread u
  WHERE n.user_id = p_user_id
    AND n.is_archived = false
    AND (NOT p_unread_only OR n.is_read = false)
  ORDER BY n.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(
  p_user_id UUID,
  p_notification_ids UUID[] DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF p_notification_ids IS NULL THEN
    -- Mark all as read
    UPDATE notifications
    SET is_read = true, read_at = NOW()
    WHERE user_id = p_user_id AND is_read = false;
  ELSE
    -- Mark specific notifications as read
    UPDATE notifications
    SET is_read = true, read_at = NOW()
    WHERE user_id = p_user_id
      AND id = ANY(p_notification_ids)
      AND is_read = false;
  END IF;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_icon TEXT DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_prefs RECORD;
BEGIN
  -- Check user preferences
  SELECT * INTO v_prefs
  FROM notification_preferences
  WHERE user_id = p_user_id AND notification_type = p_type;

  -- If disabled, don't create
  IF v_prefs IS NOT NULL AND NOT v_prefs.is_enabled THEN
    RETURN NULL;
  END IF;

  -- Check quiet hours
  IF v_prefs IS NOT NULL
     AND v_prefs.quiet_hours_start IS NOT NULL
     AND v_prefs.quiet_hours_end IS NOT NULL THEN
    IF CURRENT_TIME BETWEEN v_prefs.quiet_hours_start AND v_prefs.quiet_hours_end THEN
      -- Schedule for later instead of immediate
      INSERT INTO scheduled_notifications (
        user_id, type, channels, title, body, metadata, scheduled_for
      ) VALUES (
        p_user_id, p_type, v_prefs.channels, p_title, p_body, p_metadata,
        CURRENT_DATE + v_prefs.quiet_hours_end + INTERVAL '1 minute'
      );
      RETURN NULL;
    END IF;
  END IF;

  -- Create in-app notification
  INSERT INTO notifications (
    user_id, type, title, body, icon, action_url, action_label, metadata
  ) VALUES (
    p_user_id, p_type, p_title, p_body, p_icon, p_action_url, p_action_label, p_metadata
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to execute automation rule
CREATE OR REPLACE FUNCTION execute_automation_rule(
  p_rule_id UUID,
  p_trigger_data JSONB
) RETURNS UUID AS $$
DECLARE
  v_rule RECORD;
  v_log_id UUID;
  v_start_time TIMESTAMPTZ;
BEGIN
  v_start_time := clock_timestamp();

  -- Get rule
  SELECT * INTO v_rule FROM automation_rules WHERE id = p_rule_id AND is_enabled = true;

  IF v_rule IS NULL THEN
    RETURN NULL;
  END IF;

  -- Check cooldown
  IF v_rule.cooldown_minutes > 0
     AND v_rule.last_triggered_at IS NOT NULL
     AND v_rule.last_triggered_at + (v_rule.cooldown_minutes || ' minutes')::INTERVAL > NOW() THEN
    RETURN NULL;
  END IF;

  -- Log execution (actual action happens via Edge Function)
  INSERT INTO automation_logs (
    rule_id, clan_id, trigger_data, is_success, execution_time_ms
  ) VALUES (
    p_rule_id, v_rule.clan_id, p_trigger_data, true,
    EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time)::INTEGER
  ) RETURNING id INTO v_log_id;

  -- Update rule stats
  UPDATE automation_rules
  SET last_triggered_at = NOW(), trigger_count = trigger_count + 1
  WHERE id = p_rule_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get automation rules for a trigger
CREATE OR REPLACE FUNCTION get_rules_for_trigger(
  p_clan_id UUID,
  p_trigger_type automation_trigger
)
RETURNS TABLE (
  rule_id UUID,
  name TEXT,
  action_type automation_action,
  action_config JSONB,
  trigger_conditions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ar.id as rule_id,
    ar.name,
    ar.action_type,
    ar.action_config,
    ar.trigger_conditions
  FROM automation_rules ar
  WHERE ar.clan_id = p_clan_id
    AND ar.trigger_type = p_trigger_type
    AND ar.is_enabled = true
    AND (
      ar.cooldown_minutes = 0
      OR ar.last_triggered_at IS NULL
      OR ar.last_triggered_at + (ar.cooldown_minutes || ' minutes')::INTERVAL <= NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default notification preferences for new users (via trigger)
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id, notification_type, channels, is_enabled)
  VALUES
    (NEW.id, 'match_reminder', ARRAY['in_app', 'email']::notification_channel[], true),
    (NEW.id, 'tournament_start', ARRAY['in_app', 'email']::notification_channel[], true),
    (NEW.id, 'clan_invite', ARRAY['in_app']::notification_channel[], true),
    (NEW.id, 'friend_request', ARRAY['in_app']::notification_channel[], true),
    (NEW.id, 'achievement_earned', ARRAY['in_app']::notification_channel[], true),
    (NEW.id, 'level_up', ARRAY['in_app']::notification_channel[], true),
    (NEW.id, 'battle_pass_reward', ARRAY['in_app']::notification_channel[], true),
    (NEW.id, 'stream_live', ARRAY['in_app']::notification_channel[], false),
    (NEW.id, 'forum_reply', ARRAY['in_app', 'email']::notification_channel[], true),
    (NEW.id, 'direct_message', ARRAY['in_app']::notification_channel[], true),
    (NEW.id, 'system_announcement', ARRAY['in_app', 'email']::notification_channel[], true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_created_notification_prefs
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- Trigger to update timestamps
CREATE TRIGGER discord_connections_updated_at
  BEFORE UPDATE ON discord_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER discord_guild_connections_updated_at
  BEFORE UPDATE ON discord_guild_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER automation_rules_updated_at
  BEFORE UPDATE ON automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
