-- Game API Integrations Migration
-- Supports Riot Games (Valorant) and Steam (CS2), plus mobile games (PUBG Mobile, Free Fire, CoC, COD Mobile)

-- Enum for integration providers
CREATE TYPE integration_provider AS ENUM ('riot', 'steam');

-- Enum for sync status
CREATE TYPE sync_status AS ENUM ('pending', 'syncing', 'completed', 'failed');

-- Game OAuth tokens and connections
CREATE TABLE game_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider integration_provider NOT NULL,
  provider_user_id TEXT NOT NULL,
  provider_username TEXT,
  provider_avatar_url TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  metadata JSONB DEFAULT '{}',
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Index for quick provider lookups
CREATE INDEX idx_game_connections_provider ON game_connections(provider, provider_user_id);
CREATE INDEX idx_game_connections_user ON game_connections(user_id);

-- Game-specific stats storage
CREATE TABLE game_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES game_connections(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL, -- e.g., 'valorant', 'cs2', 'pubg-mobile', 'freefire', 'coc', 'cod-mobile'
  game_mode TEXT, -- e.g., 'competitive', 'unrated', 'ranked'
  season TEXT, -- e.g., 'Episode 8 Act 1', 'Season 2024 Split 1'
  stats JSONB NOT NULL DEFAULT '{}',
  rank_info JSONB DEFAULT '{}', -- Current rank, LP, tier, etc.
  last_match_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id, game_mode, season)
);

-- Index for stats lookups
CREATE INDEX idx_game_stats_user_game ON game_stats(user_id, game_id);
CREATE INDEX idx_game_stats_connection ON game_stats(connection_id);

-- Match history from external games
CREATE TABLE game_match_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES game_connections(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  external_match_id TEXT NOT NULL, -- Match ID from the provider
  game_mode TEXT,
  map_name TEXT,
  agent_or_champion TEXT, -- Character played
  result TEXT, -- 'win', 'loss', 'draw'
  score JSONB, -- Team scores, rounds, etc.
  stats JSONB NOT NULL DEFAULT '{}', -- KDA, damage, etc.
  duration_seconds INTEGER,
  played_at TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(connection_id, external_match_id)
);

-- Index for match history lookups
CREATE INDEX idx_game_match_history_user ON game_match_history(user_id, game_id, played_at DESC);
CREATE INDEX idx_game_match_history_connection ON game_match_history(connection_id, played_at DESC);

-- Sync jobs for tracking background syncs
CREATE TABLE game_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES game_connections(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL DEFAULT 'full', -- 'full', 'incremental', 'match_history'
  status sync_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  stats_synced INTEGER DEFAULT 0,
  matches_synced INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for sync job lookups
CREATE INDEX idx_game_sync_jobs_connection ON game_sync_jobs(connection_id, created_at DESC);
CREATE INDEX idx_game_sync_jobs_status ON game_sync_jobs(status) WHERE status IN ('pending', 'syncing');

-- Supported games configuration
CREATE TABLE supported_games (
  id TEXT PRIMARY KEY, -- e.g., 'valorant', 'cs2', 'pubg-mobile', 'freefire', 'coc', 'cod-mobile'
  name TEXT NOT NULL,
  provider integration_provider NOT NULL,
  icon_url TEXT,
  banner_url TEXT,
  description TEXT,
  stat_fields JSONB DEFAULT '[]', -- Defines what stats to display
  rank_system JSONB DEFAULT '{}', -- Rank tiers and icons
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert supported games
INSERT INTO supported_games (id, name, provider, description, stat_fields, rank_system, display_order) VALUES
('valorant', 'VALORANT', 'riot', 'Tactical 5v5 character-based shooter',
  '[{"key": "kills", "label": "Kills"}, {"key": "deaths", "label": "Deaths"}, {"key": "assists", "label": "Assists"}, {"key": "headshot_pct", "label": "HS%"}, {"key": "adr", "label": "ADR"}, {"key": "win_rate", "label": "Win Rate"}]',
  '{"tiers": ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ascendant", "Immortal", "Radiant"]}',
  1),
('cs2', 'Counter-Strike 2', 'steam', 'Tactical first-person shooter',
  '[{"key": "kills", "label": "Kills"}, {"key": "deaths", "label": "Deaths"}, {"key": "assists", "label": "Assists"}, {"key": "headshot_pct", "label": "HS%"}, {"key": "adr", "label": "ADR"}, {"key": "win_rate", "label": "Win Rate"}]',
  '{"tiers": ["Silver I", "Silver II", "Silver III", "Silver IV", "Silver Elite", "Silver Elite Master", "Gold Nova I", "Gold Nova II", "Gold Nova III", "Gold Nova Master", "Master Guardian I", "Master Guardian II", "Master Guardian Elite", "Distinguished Master Guardian", "Legendary Eagle", "Legendary Eagle Master", "Supreme Master First Class", "Global Elite"]}',
  2),
('pubg-mobile', 'PUBG Mobile', 'steam', 'Mobile battle royale shooter',
  '[{"key": "kills", "label": "Kills"}, {"key": "deaths", "label": "Deaths"}, {"key": "assists", "label": "Assists"}, {"key": "damage", "label": "Damage"}, {"key": "win_rate", "label": "Win Rate"}, {"key": "top10_rate", "label": "Top 10%"}]',
  '{"tiers": ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Crown", "Ace", "Ace Master", "Ace Dominator", "Conqueror"]}',
  3),
('freefire', 'Free Fire', 'steam', 'Mobile battle royale',
  '[{"key": "kills", "label": "Kills"}, {"key": "deaths", "label": "Deaths"}, {"key": "assists", "label": "Assists"}, {"key": "damage", "label": "Damage"}, {"key": "win_rate", "label": "Win Rate"}, {"key": "booyah", "label": "Booyah!"}]',
  '{"tiers": ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Heroic", "Grand Master"]}',
  4),
('coc', 'Clash of Clans', 'steam', 'Strategic clan-based mobile game',
  '[{"key": "trophies", "label": "Trophies"}, {"key": "war_stars", "label": "War Stars"}, {"key": "donations", "label": "Donations"}, {"key": "attack_wins", "label": "Attack Wins"}, {"key": "defense_wins", "label": "Defense Wins"}]',
  '{"tiers": ["Bronze League", "Silver League", "Gold League", "Crystal League", "Master League", "Champion League", "Titan League", "Legend League"]}',
  5),
('cod-mobile', 'COD Mobile', 'steam', 'Mobile first-person shooter',
  '[{"key": "kills", "label": "Kills"}, {"key": "deaths", "label": "Deaths"}, {"key": "assists", "label": "Assists"}, {"key": "kd_ratio", "label": "K/D"}, {"key": "win_rate", "label": "Win Rate"}, {"key": "score_per_min", "label": "Score/min"}]',
  '{"tiers": ["Rookie", "Veteran", "Elite", "Pro", "Master", "Grand Master", "Legendary"]}',
  6);

-- Enable RLS
ALTER TABLE game_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_match_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE supported_games ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_connections
CREATE POLICY "Users can view their own connections"
  ON game_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own connections"
  ON game_connections FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for game_stats (public read, private write)
CREATE POLICY "Anyone can view game stats"
  ON game_stats FOR SELECT
  USING (true);

CREATE POLICY "System can manage game stats"
  ON game_stats FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for game_match_history (public read, private write)
CREATE POLICY "Anyone can view match history"
  ON game_match_history FOR SELECT
  USING (true);

CREATE POLICY "System can manage match history"
  ON game_match_history FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for game_sync_jobs
CREATE POLICY "Users can view their own sync jobs"
  ON game_sync_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create sync jobs"
  ON game_sync_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for supported_games (public read)
CREATE POLICY "Anyone can view supported games"
  ON supported_games FOR SELECT
  USING (true);

-- Function to get user's connected games with stats
CREATE OR REPLACE FUNCTION get_user_game_connections(p_user_id UUID)
RETURNS TABLE (
  connection_id UUID,
  provider integration_provider,
  provider_username TEXT,
  provider_avatar_url TEXT,
  connected_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  games JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gc.id as connection_id,
    gc.provider,
    gc.provider_username,
    gc.provider_avatar_url,
    gc.connected_at,
    gc.last_synced_at,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'game_id', gs.game_id,
          'rank_info', gs.rank_info,
          'stats', gs.stats,
          'synced_at', gs.synced_at
        )
      ) FILTER (WHERE gs.id IS NOT NULL),
      '[]'::jsonb
    ) as games
  FROM game_connections gc
  LEFT JOIN game_stats gs ON gs.connection_id = gc.id
  WHERE gc.user_id = p_user_id AND gc.is_active = true
  GROUP BY gc.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create or update game stats
CREATE OR REPLACE FUNCTION upsert_game_stats(
  p_user_id UUID,
  p_connection_id UUID,
  p_game_id TEXT,
  p_game_mode TEXT,
  p_season TEXT,
  p_stats JSONB,
  p_rank_info JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO game_stats (user_id, connection_id, game_id, game_mode, season, stats, rank_info)
  VALUES (p_user_id, p_connection_id, p_game_id, p_game_mode, p_season, p_stats, COALESCE(p_rank_info, '{}'::jsonb))
  ON CONFLICT (user_id, game_id, game_mode, season)
  DO UPDATE SET
    stats = p_stats,
    rank_info = COALESCE(p_rank_info, game_stats.rank_info),
    synced_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to start a sync job
CREATE OR REPLACE FUNCTION start_game_sync(
  p_user_id UUID,
  p_connection_id UUID,
  p_sync_type TEXT DEFAULT 'full'
) RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
  v_existing_job UUID;
BEGIN
  -- Check for existing pending/running job
  SELECT id INTO v_existing_job
  FROM game_sync_jobs
  WHERE connection_id = p_connection_id
    AND status IN ('pending', 'syncing')
  LIMIT 1;

  IF v_existing_job IS NOT NULL THEN
    RETURN v_existing_job;
  END IF;

  -- Create new sync job
  INSERT INTO game_sync_jobs (user_id, connection_id, sync_type, status, started_at)
  VALUES (p_user_id, p_connection_id, p_sync_type, 'syncing', NOW())
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_game_connections_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER game_connections_updated_at
  BEFORE UPDATE ON game_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_game_connections_timestamp();

CREATE TRIGGER game_stats_updated_at
  BEFORE UPDATE ON game_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_game_connections_timestamp();

-- Add indexes for performance
CREATE INDEX idx_supported_games_provider ON supported_games(provider) WHERE is_active = true;
