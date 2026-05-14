export type SensShareGame = "valorant" | "cs2" | "bgmi" | "freefire" | "codm" | "apex";
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
  { id: "cs2",       label: "CS2",       platform: "pc" },
  { id: "apex",      label: "Apex",      platform: "pc" },
  { id: "bgmi",      label: "BGMI",      platform: "mobile" },
  { id: "codm",      label: "CODM",      platform: "mobile" },
  { id: "freefire",  label: "Free Fire", platform: "mobile" },
];

// Default sens-key sets we render input rows for per game.
export const SENS_KEYS: Record<SensShareGame, string[]> = {
  valorant:  ["sensitivity", "dpi", "scoped_multiplier"],
  cs2:       ["sensitivity", "dpi", "zoom_sens"],
  apex:      ["sensitivity", "dpi", "ads_multiplier"],
  bgmi:      ["camera", "ads_red_dot", "ads_2x", "ads_3x", "ads_4x", "ads_6x", "ads_8x", "gyro"],
  codm:      ["camera", "ads_red_dot", "ads_2x", "ads_3x", "ads_4x", "ads_6x"],
  freefire:  ["general", "red_dot", "2x", "4x", "awm", "free_look"],
};
