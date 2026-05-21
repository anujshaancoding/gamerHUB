// Game-specific theme definitions for profile customization
// Each theme matches the visual identity of the game

export interface GameThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  cardBorder: string;
  textAccent: string;
  glow: string;
}

export interface RankVisual {
  color: string;
  glowColor: string;
  borderColor: string;
  animation: "pulse" | "glow" | "shimmer" | "none";
}

export interface GameTheme {
  slug: string;
  name: string;
  colors: GameThemeColors;
  gradient: {
    background: string;
    card: string;
    accent: string;
  };
  particles: {
    colors: string[];
    count: number;
  };
  watermark: {
    iconPath: string;
    opacity: number;
    position: "bottom-right" | "center";
  };
  rankVisuals: Record<string, RankVisual>;
}

// ─── Valorant ────────────────────────────────────────────────
const valorantTheme: GameTheme = {
  slug: "valorant",
  name: "Valorant",
  colors: {
    primary: "#FF4655",
    secondary: "#0F1923",
    accent: "#FFFFFF",
    background: "#0F1923",
    cardBorder: "#FF465540",
    textAccent: "#FF4655",
    glow: "rgba(255, 70, 85, 0.4)",
  },
  gradient: {
    background: "linear-gradient(135deg, #0F1923 0%, #1a1030 50%, #0F1923 100%)",
    card: "linear-gradient(135deg, #FF465515 0%, transparent 60%)",
    accent: "linear-gradient(90deg, #FF4655, #FF8A8A, #FF4655)",
  },
  particles: {
    colors: ["#FF4655", "#FF8A8A", "#BD3944", "#FF465580"],
    count: 18,
  },
  watermark: {
    iconPath: "/images/games/valorant.svg",
    opacity: 0.04,
    position: "bottom-right",
  },
  rankVisuals: {
    iron: { color: "#8B8B8B", glowColor: "rgba(139,139,139,0.3)", borderColor: "#8B8B8B60", animation: "none" },
    bronze: { color: "#C5915A", glowColor: "rgba(197,145,90,0.3)", borderColor: "#C5915A60", animation: "none" },
    silver: { color: "#C0C0C0", glowColor: "rgba(192,192,192,0.3)", borderColor: "#C0C0C060", animation: "none" },
    gold: { color: "#ECB731", glowColor: "rgba(236,183,49,0.3)", borderColor: "#ECB73160", animation: "glow" },
    platinum: { color: "#3CBDB1", glowColor: "rgba(60,189,177,0.3)", borderColor: "#3CBDB160", animation: "glow" },
    diamond: { color: "#B489FF", glowColor: "rgba(180,137,255,0.4)", borderColor: "#B489FF60", animation: "glow" },
    ascendant: { color: "#2FBF71", glowColor: "rgba(47,191,113,0.4)", borderColor: "#2FBF7160", animation: "pulse" },
    immortal: { color: "#FF4655", glowColor: "rgba(255,70,85,0.5)", borderColor: "#FF465580", animation: "pulse" },
    radiant: { color: "#FFFFAA", glowColor: "rgba(255,255,170,0.6)", borderColor: "#FFFFAA80", animation: "shimmer" },
  },
};

// ─── Default (GamerHub) ─────────────────────────────────────
const defaultTheme: GameTheme = {
  slug: "default",
  name: "GamerHub",
  colors: {
    primary: "#9f7aea",
    secondary: "#0a0a0f",
    accent: "#00d4ff",
    background: "#0a0a0f",
    cardBorder: "#9f7aea40",
    textAccent: "#9f7aea",
    glow: "rgba(159, 122, 234, 0.4)",
  },
  gradient: {
    background: "linear-gradient(135deg, #0a0a0f 0%, #1a1025 50%, #0a0a0f 100%)",
    card: "linear-gradient(135deg, #9f7aea15 0%, transparent 60%)",
    accent: "linear-gradient(90deg, #9f7aea, #00d4ff, #ff00ff)",
  },
  particles: {
    colors: ["#9f7aea", "#00d4ff", "#ff00ff", "#9f7aea80"],
    count: 15,
  },
  watermark: {
    iconPath: "",
    opacity: 0,
    position: "bottom-right",
  },
  rankVisuals: {
    bronze: { color: "#CD7F32", glowColor: "rgba(205,127,50,0.3)", borderColor: "#CD7F3260", animation: "none" },
    silver: { color: "#C0C0C0", glowColor: "rgba(192,192,192,0.3)", borderColor: "#C0C0C060", animation: "none" },
    gold: { color: "#FFD700", glowColor: "rgba(255,215,0,0.3)", borderColor: "#FFD70060", animation: "glow" },
    platinum: { color: "#00CED1", glowColor: "rgba(0,206,209,0.3)", borderColor: "#00CED160", animation: "glow" },
    diamond: { color: "#4169E1", glowColor: "rgba(65,105,225,0.4)", borderColor: "#4169E160", animation: "glow" },
    master: { color: "#9f7aea", glowColor: "rgba(159,122,234,0.4)", borderColor: "#9f7aea60", animation: "pulse" },
    grandmaster: { color: "#ff00ff", glowColor: "rgba(255,0,255,0.5)", borderColor: "#ff00ff80", animation: "pulse" },
    challenger: { color: "#FFD700", glowColor: "rgba(255,215,0,0.6)", borderColor: "#FFD70080", animation: "shimmer" },
  },
};

// ─── Theme Registry ──────────────────────────────────────────

export const GAME_THEMES: Record<string, GameTheme> = {
  valorant: valorantTheme,
  default: defaultTheme,
  other: defaultTheme,
};

/** Get a game theme by slug, falling back to default */
export function getGameTheme(slug?: string | null): GameTheme {
  if (!slug) return defaultTheme;
  return GAME_THEMES[slug] ?? defaultTheme;
}

/** Get rank visual for a specific rank string within a game theme */
export function getRankVisual(theme: GameTheme, rank: string): RankVisual {
  const lowerRank = rank.toLowerCase();
  for (const [key, visual] of Object.entries(theme.rankVisuals)) {
    if (lowerRank.includes(key)) return visual;
  }
  // Fallback: determine tier from common rank keywords
  if (lowerRank.includes("legend") || lowerRank.includes("radiant") || lowerRank.includes("global")) {
    return { color: "#FFD700", glowColor: "rgba(255,215,0,0.6)", borderColor: "#FFD70080", animation: "shimmer" };
  }
  if (lowerRank.includes("immortal") || lowerRank.includes("champion") || lowerRank.includes("supreme")) {
    return { color: "#EF4444", glowColor: "rgba(239,68,68,0.4)", borderColor: "#EF444460", animation: "pulse" };
  }
  return { color: "#9f7aea", glowColor: "rgba(159,122,234,0.3)", borderColor: "#9f7aea60", animation: "none" };
}
