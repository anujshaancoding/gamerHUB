-- Discord Integration
-- Migration 022

-- ============================================
-- DISCORD SETTINGS
-- ============================================
CREATE TABLE public.discord_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  -- Discord account info
  discord_user_id VARCHAR(30) NOT NULL UNIQUE,
  discord_username VARCHAR(100),
  discord_discriminator VARCHAR(10),
  discord_avatar_hash VARCHAR(100),
  discord_email VARCHAR(255),
  discord_access_token TEXT, -- Encrypted
  discord_refresh_token TEXT, -- Encrypted
  discord_token_expires_at TIMESTAMPTZ,
  -- Imported data
  guilds JSONB DEFAULT '[]', -- [{id, name, icon, owner}]
  -- Feature settings
  cross_post_lfg BOOLEAN DEFAULT false,
  cross_post_tournaments BOOLEAN DEFAULT false,
  cross_post_matches BOOLEAN DEFAULT false,
  rich_presence_enabled BOOLEAN DEFAULT false,
  show_discord_status BOOLEAN DEFAULT true,
  import_friends_enabled BOOLEAN DEFAULT false,
  share_activity BOOLEAN DEFAULT true,
  -- Webhook settings
  default_webhook_url TEXT,
  default_channel_id VARCHAR(30),
  default_guild_id VARCHAR(30),
  -- Timestamps
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DISCORD CROSSPOSTS
-- ============================================
CREATE TABLE public.discord_crossposts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Content reference
  content_type VARCHAR(30) NOT NULL, -- 'lfg_post', 'tournament', 'match', 'clan_recruitment'
  content_id UUID NOT NULL,
  -- Discord message info
  discord_message_id VARCHAR(30),
  discord_channel_id VARCHAR(30) NOT NULL,
  discord_guild_id VARCHAR(30),
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'posted', 'failed', 'deleted'
  error_message TEXT,
  -- Timestamps
  posted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(content_type, content_id, discord_channel_id)
);

-- ============================================
-- DISCORD FRIENDS (Imported)
-- ============================================
CREATE TABLE public.discord_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Discord friend info
  discord_friend_id VARCHAR(30) NOT NULL,
  discord_friend_username VARCHAR(100),
  discord_friend_discriminator VARCHAR(10),
  discord_friend_avatar VARCHAR(100),
  -- GamerHub mapping
  gamerhub_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_matched BOOLEAN DEFAULT false,
  -- Status
  invite_sent BOOLEAN DEFAULT false,
  invite_sent_at TIMESTAMPTZ,
  -- Timestamps
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, discord_friend_id)
);

-- ============================================
-- DISCORD WEBHOOKS (for servers)
-- ============================================
CREATE TABLE public.discord_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Webhook info
  webhook_url TEXT NOT NULL,
  webhook_id VARCHAR(30),
  webhook_token TEXT,
  -- Server info
  guild_id VARCHAR(30) NOT NULL,
  guild_name VARCHAR(100),
  channel_id VARCHAR(30) NOT NULL,
  channel_name VARCHAR(100),
  -- Settings
  is_active BOOLEAN DEFAULT true,
  post_lfg BOOLEAN DEFAULT true,
  post_tournaments BOOLEAN DEFAULT true,
  post_clan_recruitment BOOLEAN DEFAULT true,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, guild_id, channel_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_discord_settings_user ON discord_settings(user_id);
CREATE INDEX idx_discord_settings_discord_id ON discord_settings(discord_user_id);

CREATE INDEX idx_discord_crossposts_user ON discord_crossposts(user_id);
CREATE INDEX idx_discord_crossposts_content ON discord_crossposts(content_type, content_id);
CREATE INDEX idx_discord_crossposts_status ON discord_crossposts(status);

CREATE INDEX idx_discord_friends_user ON discord_friends(user_id);
CREATE INDEX idx_discord_friends_matched ON discord_friends(is_matched) WHERE is_matched = true;
CREATE INDEX idx_discord_friends_gamerhub ON discord_friends(gamerhub_user_id) WHERE gamerhub_user_id IS NOT NULL;

CREATE INDEX idx_discord_webhooks_user ON discord_webhooks(user_id);
CREATE INDEX idx_discord_webhooks_guild ON discord_webhooks(guild_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Discord Settings
ALTER TABLE discord_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Discord settings"
  ON discord_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own Discord settings"
  ON discord_settings FOR ALL
  USING (user_id = auth.uid());

-- Discord Crossposts
ALTER TABLE discord_crossposts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own crossposts"
  ON discord_crossposts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own crossposts"
  ON discord_crossposts FOR ALL
  USING (user_id = auth.uid());

-- Discord Friends
ALTER TABLE discord_friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Discord friends"
  ON discord_friends FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own Discord friends"
  ON discord_friends FOR ALL
  USING (user_id = auth.uid());

-- Discord Webhooks
ALTER TABLE discord_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own webhooks"
  ON discord_webhooks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own webhooks"
  ON discord_webhooks FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_discord_settings_updated_at
  BEFORE UPDATE ON discord_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discord_webhooks_updated_at
  BEFORE UPDATE ON discord_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to match Discord friends with GamerHub users
CREATE OR REPLACE FUNCTION match_discord_friends(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_matched_count INTEGER := 0;
BEGIN
  -- Update discord_friends where we can match discord_user_id
  UPDATE discord_friends df
  SET
    gamerhub_user_id = ds.user_id,
    is_matched = true
  FROM discord_settings ds
  WHERE df.user_id = p_user_id
    AND df.discord_friend_id = ds.discord_user_id
    AND df.gamerhub_user_id IS NULL;

  GET DIAGNOSTICS v_matched_count = ROW_COUNT;

  RETURN v_matched_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
