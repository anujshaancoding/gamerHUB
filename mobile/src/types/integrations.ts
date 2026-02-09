// Platform Integration Types for Mobile App
export interface PlatformConnection {
  id: string;
  user_id: string;
  platform: 'riot' | 'steam' | 'twitch' | 'discord' | 'playstation' | 'xbox' | 'nintendo';
  platform_user_id: string;
  platform_username: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  scopes: string[];
  is_active: boolean;
  connected_at: string;
  last_synced_at: string | null;
}

export interface RiotAccount {
  puuid: string;
  game_name: string;
  tag_line: string;
  region: string;
}

export interface ValorantStats {
  puuid: string;
  current_rank: string;
  current_rr: number;
  peak_rank: string;
  wins: number;
  losses: number;
  matches_played: number;
  kd_ratio: number;
  headshot_percentage: number;
  most_played_agent: string;
  last_updated: string;
}

export interface LeagueOfLegendsStats {
  summoner_id: string;
  summoner_name: string;
  summoner_level: number;
  region: string;
  solo_rank: string | null;
  solo_lp: number;
  flex_rank: string | null;
  flex_lp: number;
  wins: number;
  losses: number;
  most_played_champions: string[];
  last_updated: string;
}

export interface SteamProfile {
  steam_id: string;
  persona_name: string;
  profile_url: string;
  avatar_url: string;
  games_owned: number;
  visibility: 'public' | 'private' | 'friends_only';
}

export interface CS2Stats {
  steam_id: string;
  current_rank: string | null;
  premier_rating: number | null;
  total_kills: number;
  total_deaths: number;
  total_wins: number;
  total_matches: number;
  headshot_percentage: number;
  last_updated: string;
}

export interface TwitchProfile {
  twitch_id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
  broadcaster_type: 'partner' | 'affiliate' | '';
  follower_count: number;
  is_live: boolean;
  stream_title: string | null;
  stream_game: string | null;
  viewer_count: number;
}

export interface DiscordProfile {
  discord_id: string;
  username: string;
  discriminator: string;
  avatar_url: string | null;
  guilds: DiscordGuild[];
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon_url: string | null;
  is_owner: boolean;
  permissions: string;
}

export interface IntegrationSyncResult {
  platform: string;
  success: boolean;
  synced_at: string;
  stats_updated: boolean;
  error?: string;
}
