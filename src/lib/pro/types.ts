export type ProGame = "valorant";

export type Platform = "pc" | "mobile";

export interface ProSocials {
  twitter?: string;
  instagram?: string;
  youtube?: string;
  twitch?: string;
  discord?: string;
  website?: string;
}

export interface ProTeam {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  game: ProGame;
  logo_url: string | null;
  region: string;
  founded_year: number | null;
  socials: ProSocials;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProPlayer {
  id: string;
  slug: string;
  game: ProGame;
  ign: string;
  real_name: string | null;
  team_id: string | null;
  role: string | null;
  country: string;
  region: string | null;
  photo_url: string | null;
  bio: string | null;
  age: number | null;
  date_of_birth: string | null;
  total_earnings: number | null;
  earnings_currency: string;
  peak_rank: string | null;
  current_rank: string | null;
  national_rank: number | null;
  socials: ProSocials;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProPlayerWithTeam extends ProPlayer {
  team: ProTeam | null;
}

export interface ValorantAgentUsage {
  agent: string;
  pick_rate: number;       // 0-100
  matches: number;
  win_rate?: number;
}

export interface ValorantGameStats {
  agent_pool?: ValorantAgentUsage[];
  first_blood_pct?: number;
  clutch_won?: number;
  primary_role?: string;
  notes?: string;
}

export type GameStatsBlob = ValorantGameStats | Record<string, unknown>;

export interface ProPlayerStats {
  id: string;
  player_id: string;
  season: string;
  is_current: boolean;
  matches_played: number | null;
  wins: number | null;
  losses: number | null;
  k_d_ratio: number | null;
  adr: number | null;
  hs_pct: number | null;
  acs: number | null;
  game_stats: GameStatsBlob;
  source_url: string | null;
  fetched_at: string;
  created_at: string;
  updated_at: string;
}

export interface SensitivityBlock {
  general?: number | string;
  ads?: Record<string, number | string>;   // per-scope (1x, 2x, 4x, 6x) or per-weapon
  edpi?: number;
  zoom?: number;
}

export interface IngameSettings {
  crosshair_code?: string;
  graphics_preset?: string;
  fps_cap?: number;
  hud_notes?: string;
  [key: string]: unknown;
}

export interface ProPlayerGear {
  id: string;
  player_id: string;
  platform: Platform;
  device_model: string | null;
  cpu: string | null;
  gpu: string | null;
  ram: string | null;
  monitor: string | null;
  monitor_hz: number | null;
  mouse: string | null;
  keyboard: string | null;
  headphones: string | null;
  mousepad: string | null;
  grip_style: string | null;
  controllers: string | null;
  sensitivities: SensitivityBlock;
  ingame_settings: IngameSettings;
  layout_image_url: string | null;
  notes: string | null;
  source_url: string | null;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProPlayerDetail {
  player: ProPlayerWithTeam;
  current_stats: ProPlayerStats | null;
  past_seasons: ProPlayerStats[];
  gear: ProPlayerGear | null;
}

export type ProEventStatus = "upcoming" | "live" | "completed" | "cancelled";

export interface ProEvent {
  id: string;
  slug: string;
  game: ProGame;
  name: string;
  short_name: string | null;
  region: string;
  status: ProEventStatus;
  starts_at: string;
  ends_at: string | null;
  venue: string | null;
  prize_pool: number | null;
  prize_currency: string;
  description: string | null;
  banner_url: string | null;
  official_url: string | null;
  stream_url: string | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}
