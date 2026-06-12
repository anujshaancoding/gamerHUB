// VALORANT rank-tier color themes for Instagram carousel slides.
// Picking a rank theme tints the accent stripe + badge so players scrolling
// see "their" color and stop. The "all" theme is the default ggLobby red.

export type RankTier =
  | "all"
  | "iron"
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "ascendant"
  | "immortal"
  | "radiant";

export interface RankTheme {
  label: string;
  accent: string;
  accentSoft: string;
  textOnAccent: string;
}

export const RANK_THEMES: Record<RankTier, RankTheme> = {
  all: {
    label: "All Ranks",
    accent: "#FF4655",
    accentSoft: "rgba(255, 70, 85, 0.18)",
    textOnAccent: "#ECE8E1",
  },
  iron: {
    label: "Iron",
    accent: "#5B5B5B",
    accentSoft: "rgba(91, 91, 91, 0.28)",
    textOnAccent: "#ECE8E1",
  },
  bronze: {
    label: "Bronze",
    accent: "#B8763A",
    accentSoft: "rgba(184, 118, 58, 0.22)",
    textOnAccent: "#ECE8E1",
  },
  silver: {
    label: "Silver",
    accent: "#C7CCD1",
    accentSoft: "rgba(199, 204, 209, 0.22)",
    textOnAccent: "#0F1923",
  },
  gold: {
    label: "Gold",
    accent: "#F2C94C",
    accentSoft: "rgba(242, 201, 76, 0.22)",
    textOnAccent: "#0F1923",
  },
  platinum: {
    label: "Platinum",
    accent: "#4DD0E1",
    accentSoft: "rgba(77, 208, 225, 0.22)",
    textOnAccent: "#0F1923",
  },
  diamond: {
    label: "Diamond",
    accent: "#B47AE6",
    accentSoft: "rgba(180, 122, 230, 0.22)",
    textOnAccent: "#ECE8E1",
  },
  ascendant: {
    label: "Ascendant",
    accent: "#2ECC71",
    accentSoft: "rgba(46, 204, 113, 0.22)",
    textOnAccent: "#0F1923",
  },
  immortal: {
    label: "Immortal",
    accent: "#C0392B",
    accentSoft: "rgba(192, 57, 43, 0.25)",
    textOnAccent: "#ECE8E1",
  },
  radiant: {
    label: "Radiant",
    accent: "#FFF5A0",
    accentSoft: "rgba(255, 245, 160, 0.25)",
    textOnAccent: "#0F1923",
  },
};

export const RANK_TIERS = Object.keys(RANK_THEMES) as RankTier[];
