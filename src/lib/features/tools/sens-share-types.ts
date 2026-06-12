export type SensShareGame = "valorant";
export type SensSharePlatform = "pc" | "mobile";

export interface SensShareAuthor {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface SensShare {
  id: string;
  author_id: string;
  game: SensShareGame;
  platform: SensSharePlatform;
  title: string;
  sensitivities: Record<string, string | number>;
  ingame_settings: Record<string, string | number>;
  device_model: string | null;
  grip_style: string | null;
  rank: string | null;
  notes: string | null;
  copy_count: number;
  vote_score: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  author?: SensShareAuthor | null;
  user_vote?: 1 | -1 | null;
}

export const SENS_GAMES: { id: SensShareGame; label: string; platform: SensSharePlatform }[] = [
  { id: "valorant",  label: "Valorant",  platform: "pc" },
];

// Default sens-key sets we render input rows for per game.
export const SENS_KEYS: Record<SensShareGame, string[]> = {
  valorant:  ["sensitivity", "dpi", "scoped_multiplier"],
};
