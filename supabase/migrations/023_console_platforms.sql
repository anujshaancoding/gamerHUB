-- Console Platform Integration (PlayStation, Xbox, Nintendo)
-- Migration 023

-- ============================================
-- CONSOLE CONNECTIONS
-- ============================================
CREATE TABLE public.console_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Platform info
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('playstation', 'xbox', 'nintendo')),
  platform_user_id VARCHAR(100) NOT NULL,
  platform_username VARCHAR(100),
  platform_avatar_url TEXT,
  -- Platform-specific identifiers
  online_id VARCHAR(100), -- PSN Online ID, Xbox Gamertag, Nintendo Friend Code
  account_id VARCHAR(100), -- Internal platform account ID
  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verification_method VARCHAR(30), -- 'oauth', 'manual', 'code'
  verified_at TIMESTAMPTZ,
  -- Status
  last_online_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  -- Games data
  games_owned TEXT[] DEFAULT '{}', -- List of owned game titles
  recent_games JSONB DEFAULT '[]', -- [{title, last_played, hours}]
  -- Timestamps
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform),
  UNIQUE(platform, platform_user_id)
);

-- ============================================
-- CROSSPLAY PARTIES
-- ============================================
CREATE TABLE public.crossplay_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  -- Party settings
  title VARCHAR(100),
  description TEXT,
  platforms_allowed TEXT[] DEFAULT ARRAY['pc', 'playstation', 'xbox', 'switch'],
  voice_platform VARCHAR(20) DEFAULT 'gamerhub', -- 'discord', 'game_native', 'gamerhub'
  voice_channel_link TEXT,
  -- Invite
  invite_code VARCHAR(20) UNIQUE NOT NULL,
  max_members INTEGER DEFAULT 4,
  -- Status
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'full', 'in_game', 'closed')),
  current_members INTEGER DEFAULT 1,
  -- Activity
  game_started_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '4 hours'
);

-- ============================================
-- CROSSPLAY PARTY MEMBERS
-- ============================================
CREATE TABLE public.crossplay_party_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID REFERENCES public.crossplay_parties(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Platform info
  platform VARCHAR(20) NOT NULL, -- 'pc', 'playstation', 'xbox', 'switch'
  platform_username VARCHAR(100),
  -- Role
  is_leader BOOLEAN DEFAULT false,
  can_invite BOOLEAN DEFAULT false,
  -- Status
  status VARCHAR(20) DEFAULT 'joined' CHECK (status IN ('joined', 'ready', 'in_game', 'away')),
  -- Timestamps
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE(party_id, user_id)
);

-- ============================================
-- PLATFORM FRIENDS
-- ============================================
CREATE TABLE public.platform_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Platform info
  platform VARCHAR(20) NOT NULL,
  platform_friend_id VARCHAR(100) NOT NULL,
  platform_friend_username VARCHAR(100),
  platform_friend_avatar TEXT,
  -- GamerHub mapping
  gamerhub_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_matched BOOLEAN DEFAULT false,
  -- Timestamps
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform, platform_friend_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_console_connections_user ON console_connections(user_id);
CREATE INDEX idx_console_connections_platform ON console_connections(platform);
CREATE INDEX idx_console_connections_online_id ON console_connections(online_id);
CREATE INDEX idx_console_connections_verified ON console_connections(is_verified) WHERE is_verified = true;

CREATE INDEX idx_crossplay_parties_creator ON crossplay_parties(creator_id);
CREATE INDEX idx_crossplay_parties_game ON crossplay_parties(game_id);
CREATE INDEX idx_crossplay_parties_status ON crossplay_parties(status);
CREATE INDEX idx_crossplay_parties_code ON crossplay_parties(invite_code);
CREATE INDEX idx_crossplay_parties_expires ON crossplay_parties(expires_at);

CREATE INDEX idx_crossplay_party_members_party ON crossplay_party_members(party_id);
CREATE INDEX idx_crossplay_party_members_user ON crossplay_party_members(user_id);

CREATE INDEX idx_platform_friends_user ON platform_friends(user_id);
CREATE INDEX idx_platform_friends_platform ON platform_friends(platform);
CREATE INDEX idx_platform_friends_matched ON platform_friends(is_matched) WHERE is_matched = true;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Console Connections
ALTER TABLE console_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own console connections"
  ON console_connections FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Public can view verified console connections"
  ON console_connections FOR SELECT
  USING (is_verified = true);

CREATE POLICY "Users can manage their own console connections"
  ON console_connections FOR ALL
  USING (user_id = auth.uid());

-- Crossplay Parties
ALTER TABLE crossplay_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view open parties"
  ON crossplay_parties FOR SELECT
  USING (status IN ('open', 'full') OR creator_id = auth.uid());

CREATE POLICY "Authenticated users can create parties"
  ON crossplay_parties FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their parties"
  ON crossplay_parties FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "Creators can delete their parties"
  ON crossplay_parties FOR DELETE
  USING (creator_id = auth.uid());

-- Crossplay Party Members
ALTER TABLE crossplay_party_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Party members can view members"
  ON crossplay_party_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crossplay_party_members cpm
      WHERE cpm.party_id = crossplay_party_members.party_id
      AND cpm.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM crossplay_parties cp
      WHERE cp.id = crossplay_party_members.party_id
      AND cp.status IN ('open', 'full')
    )
  );

CREATE POLICY "Users can join parties"
  ON crossplay_party_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their membership"
  ON crossplay_party_members FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can leave parties"
  ON crossplay_party_members FOR DELETE
  USING (user_id = auth.uid());

-- Platform Friends
ALTER TABLE platform_friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own platform friends"
  ON platform_friends FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own platform friends"
  ON platform_friends FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_console_connections_updated_at
  BEFORE UPDATE ON console_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update party member count
CREATE OR REPLACE FUNCTION update_party_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE crossplay_parties
    SET current_members = current_members + 1,
        status = CASE WHEN current_members + 1 >= max_members THEN 'full' ELSE status END
    WHERE id = NEW.party_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE crossplay_parties
    SET current_members = GREATEST(1, current_members - 1),
        status = CASE WHEN status = 'full' THEN 'open' ELSE status END
    WHERE id = OLD.party_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_party_member_change
  AFTER INSERT OR DELETE ON crossplay_party_members
  FOR EACH ROW
  EXECUTE FUNCTION update_party_member_count();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Generate unique invite code
CREATE OR REPLACE FUNCTION generate_party_invite_code()
RETURNS VARCHAR(20) AS $$
DECLARE
  v_code VARCHAR(20);
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8 character alphanumeric code
    v_code := upper(substr(md5(random()::text), 1, 8));

    -- Check if it exists
    SELECT EXISTS(SELECT 1 FROM crossplay_parties WHERE invite_code = v_code) INTO v_exists;

    IF NOT v_exists THEN
      RETURN v_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Auto-expire old parties
CREATE OR REPLACE FUNCTION cleanup_expired_parties()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM crossplay_parties
  WHERE expires_at < NOW()
    AND status IN ('open', 'full');

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
