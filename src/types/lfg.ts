import type { Profile, Game } from "./database";

export interface GameRole {
  id: string;
  game_id: string;
  name: string;
  display_name: string;
  description: string | null;
  icon_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface LFGPost {
  id: string;
  creator_id: string;
  game_id: string;
  title: string;
  description: string | null;
  creator_role: string | null;
  creator_rating: number | null;
  creator_rank: string | null; // Tier-based rank (e.g., "gold1", "diamond3")
  creator_is_unranked: boolean;
  creator_agent: string | null; // Agent/Legend/Character
  looking_for_roles: string[];
  min_rating: number | null;
  max_rating: number | null;
  min_rank: string | null; // Tier-based rank requirement
  max_rank: string | null; // Tier-based rank requirement
  accept_unranked: boolean;
  game_mode: string | null;
  map_preference: string | null; // For BR games like PUBG
  perspective: string | null; // TPP/FPP for PUBG
  region: string | null;
  language: string;
  voice_required: boolean;
  current_players: number;
  max_players: number;
  duration_type: "1hr" | "2hr" | "4hr" | "8hr" | "until_full";
  expires_at: string;
  status: "active" | "full" | "expired" | "cancelled";
  created_at: string;
  updated_at: string;
  // Joined data
  creator?: Profile;
  game?: Game;
  applications?: LFGApplication[];
  applications_count?: number;
}

export interface LFGApplication {
  id: string;
  post_id: string;
  applicant_id: string;
  applicant_role: string | null;
  applicant_rating: number | null;
  applicant_rank: string | null;
  applicant_is_unranked: boolean;
  applicant_agent: string | null;
  message: string | null;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  responded_at: string | null;
  // Joined data
  applicant?: Profile;
}

export interface LFGFilters {
  game?: string;
  gameMode?: string;
  role?: string;
  minRating?: number;
  maxRating?: number;
  minRank?: string;
  maxRank?: string;
  includeUnranked?: boolean;
  region?: string;
  language?: string;
  map?: string;
  perspective?: string;
  hasSlots?: boolean;
}

export interface CreateLFGPostInput {
  game_id: string;
  title: string;
  description?: string;
  creator_role?: string;
  creator_rating?: number;
  creator_rank?: string; // Tier-based rank
  creator_is_unranked?: boolean;
  creator_agent?: string; // Agent/Legend/Character
  looking_for_roles?: string[];
  min_rating?: number;
  max_rating?: number;
  min_rank?: string; // Tier-based rank requirement
  max_rank?: string; // Tier-based rank requirement
  accept_unranked?: boolean;
  game_mode?: string;
  map_preference?: string; // For BR games
  perspective?: string; // TPP/FPP
  region?: string;
  language?: string;
  voice_required?: boolean;
  max_players?: number;
  duration_type?: "1hr" | "2hr" | "4hr" | "8hr" | "until_full";
}

export interface ApplyToLFGInput {
  post_id: string;
  applicant_role?: string;
  applicant_rating?: number;
  applicant_rank?: string; // Tier-based rank
  applicant_is_unranked?: boolean;
  applicant_agent?: string; // Agent/Legend/Character
  message?: string;
}

// Generic constants
export const DURATION_OPTIONS = [
  { value: "1hr", label: "1 Hour" },
  { value: "2hr", label: "2 Hours" },
  { value: "4hr", label: "4 Hours" },
  { value: "8hr", label: "8 Hours" },
  { value: "until_full", label: "Until Full" },
] as const;

export { REGIONS } from "@/lib/constants/games";

// Re-export game configs for convenience
export { getGameConfig, GAME_CONFIGS, usesNumericRating } from "@/lib/game-configs";
export type { GameConfig, RankOption, GameModeOption, AgentOption, MapOption } from "@/lib/game-configs";

