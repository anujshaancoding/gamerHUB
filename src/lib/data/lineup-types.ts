// Shared lineup types. Lineups are dynamic content the admin adds over time
// via /admin/lineups; storage is a JSON file on the upload volume (no DB
// migration needed). Each lineup links a map + agent + ability + side.

export type LineupSide = "Attack" | "Defense";

export interface Lineup {
  id: string;
  map: string; // map slug
  agent: string; // agent slug
  ability: string; // ability name, e.g. "Snake Bite"
  side: LineupSide;
  site: string; // "A" | "B" | "C" | "Mid"
  fromCallout: string; // e.g. "A Main"
  toCallout: string; // e.g. "A Site default plant"
  title: string;
  description: string;
  difficulty: 1 | 2 | 3;
  /** Uploaded clip served from /uploads/... (mp4/webm, <=10MB). */
  videoUrl?: string;
  /** Alternative to an uploaded clip — YouTube video id. */
  youtubeId?: string;
  createdAt: string;
}

export type NewLineup = Omit<Lineup, "id" | "createdAt">;

export const SIDES: LineupSide[] = ["Attack", "Defense"];

export const DIFFICULTY_LABEL: Record<number, string> = {
  1: "Easy",
  2: "Medium",
  3: "Hard",
};
