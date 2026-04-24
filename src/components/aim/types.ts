export type AimModeId =
  | "reaction"
  | "flick"
  | "tracking"
  | "peek"
  | "echo"
  | "clutch"
  | "daily";

export interface AimResult {
  mode: AimModeId;
  score: number;
  label: string;
  detail?: string;
  playedAt: number;
}

export interface ModeMeta {
  id: AimModeId;
  title: string;
  tagline: string;
  description: string;
  emoji: string;
  tone: "baseline" | "creative";
  scoreSuffix: string;
  higherIsBetter: boolean;
}

export const MODES: ModeMeta[] = [
  {
    id: "reaction",
    title: "Reaction",
    tagline: "How fast do your fingers wake up?",
    description: "Five rounds. Click the moment the screen turns green. We measure your average reaction in milliseconds.",
    emoji: "⚡",
    tone: "baseline",
    scoreSuffix: "ms",
    higherIsBetter: false,
  },
  {
    id: "flick",
    title: "Flick Shots",
    tagline: "One target. Next. Next. Next.",
    description: "Thirty seconds of rapid-fire target acquisition. Hit as many as you can — misses cost you time.",
    emoji: "🎯",
    tone: "baseline",
    scoreSuffix: "hits",
    higherIsBetter: true,
  },
  {
    id: "tracking",
    title: "Tracking",
    tagline: "Stay on the dot.",
    description: "A target weaves across the canvas. Hold the button and keep your crosshair glued on it. Accuracy wins.",
    emoji: "🌀",
    tone: "baseline",
    scoreSuffix: "% on target",
    higherIsBetter: true,
  },
  {
    id: "peek",
    title: "Peek Duel",
    tagline: "Pre-aim or perish.",
    description: "Enemies peek from cover for a fraction of a second. Your crosshair better already be there. Windows shrink every round.",
    emoji: "🎭",
    tone: "creative",
    scoreSuffix: "/ 10 peeks",
    higherIsBetter: true,
  },
  {
    id: "echo",
    title: "Ghost Echo",
    tagline: "Watch. Remember. Replay.",
    description: "A ghost fires a sequence of shots. Reproduce it — same targets, same order, same rhythm. Pure muscle memory.",
    emoji: "👻",
    tone: "creative",
    scoreSuffix: "levels",
    higherIsBetter: true,
  },
  {
    id: "clutch",
    title: "Clutch 1v5",
    tagline: "Low HP. Five enemies. One shot each.",
    description: "A scripted post-plant. Every miss chips your HP. Drop all five before they drop you. The tension is the training.",
    emoji: "🩸",
    tone: "creative",
    scoreSuffix: "HP left",
    higherIsBetter: true,
  },
  {
    id: "daily",
    title: "Daily Gauntlet",
    tagline: "Same challenge. Same seed. Every player.",
    description: "One aim puzzle per day, identical for everyone. Post your score. Wake up tomorrow. Try again.",
    emoji: "🗓️",
    tone: "creative",
    scoreSuffix: "points",
    higherIsBetter: true,
  },
];

export const MODE_BY_ID: Record<AimModeId, ModeMeta> = MODES.reduce(
  (acc, m) => ({ ...acc, [m.id]: m }),
  {} as Record<AimModeId, ModeMeta>,
);
