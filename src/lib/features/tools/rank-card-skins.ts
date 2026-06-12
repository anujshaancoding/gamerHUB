import { tierGroup } from "@/lib/features/tools/valorant-ranks";

export type RankCardSkin = {
  tier: string;
  label: string;
  accent: string;
  secondary: string;
  glow: string;
  background: string;
  plate: string;
  line: string;
  texture: string;
};

const SKINS: Record<string, Omit<RankCardSkin, "tier">> = {
  iron: {
    label: "Iron forged",
    accent: "#8f949b",
    secondary: "#343941",
    glow: "rgba(143, 148, 155, 0.28)",
    background: "linear-gradient(135deg, #080a0d 0%, #171a1f 48%, #07080b 100%)",
    plate: "linear-gradient(135deg, rgba(143,148,155,0.20), rgba(52,57,65,0.08))",
    line: "#8f949b",
    texture:
      "linear-gradient(120deg, transparent 0 42%, rgba(143,148,155,0.10) 42% 47%, transparent 47% 100%)",
  },
  bronze: {
    label: "Bronze heat",
    accent: "#d28a45",
    secondary: "#6f3f1f",
    glow: "rgba(210, 138, 69, 0.30)",
    background: "linear-gradient(135deg, #100805 0%, #1b1110 46%, #07080b 100%)",
    plate: "linear-gradient(135deg, rgba(210,138,69,0.22), rgba(111,63,31,0.09))",
    line: "#d28a45",
    texture:
      "linear-gradient(120deg, transparent 0 44%, rgba(210,138,69,0.11) 44% 50%, transparent 50% 100%)",
  },
  silver: {
    label: "Silver mirror",
    accent: "#d7dde4",
    secondary: "#7c8792",
    glow: "rgba(215, 221, 228, 0.26)",
    background: "linear-gradient(135deg, #080b10 0%, #151a22 46%, #07080b 100%)",
    plate: "linear-gradient(135deg, rgba(215,221,228,0.20), rgba(124,135,146,0.08))",
    line: "#d7dde4",
    texture:
      "linear-gradient(120deg, transparent 0 40%, rgba(215,221,228,0.12) 40% 45%, transparent 45% 100%)",
  },
  gold: {
    label: "Gold prestige",
    accent: "#ffd447",
    secondary: "#9d6c1e",
    glow: "rgba(255, 212, 71, 0.32)",
    background: "linear-gradient(135deg, #100b04 0%, #19140a 46%, #07080b 100%)",
    plate: "linear-gradient(135deg, rgba(255,212,71,0.23), rgba(157,108,30,0.08))",
    line: "#ffd447",
    texture:
      "linear-gradient(120deg, transparent 0 42%, rgba(255,212,71,0.13) 42% 49%, transparent 49% 100%)",
  },
  platinum: {
    label: "Platinum current",
    accent: "#5fe3f0",
    secondary: "#278694",
    glow: "rgba(95, 227, 240, 0.30)",
    background: "linear-gradient(135deg, #041013 0%, #0b1b22 48%, #07080b 100%)",
    plate: "linear-gradient(135deg, rgba(95,227,240,0.21), rgba(39,134,148,0.08))",
    line: "#5fe3f0",
    texture:
      "linear-gradient(120deg, transparent 0 43%, rgba(95,227,240,0.13) 43% 48%, transparent 48% 100%)",
  },
  diamond: {
    label: "Diamond prism",
    accent: "#c58cff",
    secondary: "#6d45b5",
    glow: "rgba(197, 140, 255, 0.30)",
    background: "linear-gradient(135deg, #100818 0%, #151225 48%, #07080b 100%)",
    plate: "linear-gradient(135deg, rgba(197,140,255,0.22), rgba(109,69,181,0.08))",
    line: "#c58cff",
    texture:
      "linear-gradient(120deg, transparent 0 40%, rgba(197,140,255,0.13) 40% 47%, transparent 47% 100%)",
  },
  ascendant: {
    label: "Ascendant pulse",
    accent: "#2fe48e",
    secondary: "#125f42",
    glow: "rgba(47, 228, 142, 0.30)",
    background: "linear-gradient(135deg, #04100c 0%, #0c1816 48%, #07080b 100%)",
    plate: "linear-gradient(135deg, rgba(47,228,142,0.22), rgba(18,95,66,0.08))",
    line: "#2fe48e",
    texture:
      "linear-gradient(120deg, transparent 0 42%, rgba(47,228,142,0.12) 42% 49%, transparent 49% 100%)",
  },
  immortal: {
    label: "Immortal surge",
    accent: "#ff4655",
    secondary: "#7f1724",
    glow: "rgba(255, 70, 85, 0.33)",
    background: "linear-gradient(135deg, #130509 0%, #1a0d13 47%, #07080b 100%)",
    plate: "linear-gradient(135deg, rgba(255,70,85,0.22), rgba(127,23,36,0.08))",
    line: "#ff4655",
    texture:
      "linear-gradient(120deg, transparent 0 41%, rgba(255,70,85,0.13) 41% 49%, transparent 49% 100%)",
  },
  radiant: {
    label: "Radiant crown",
    accent: "#fff4a8",
    secondary: "#d29c35",
    glow: "rgba(255, 244, 168, 0.34)",
    background: "linear-gradient(135deg, #161104 0%, #1a1820 46%, #07080b 100%)",
    plate: "linear-gradient(135deg, rgba(255,244,168,0.22), rgba(210,156,53,0.08))",
    line: "#fff4a8",
    texture:
      "linear-gradient(120deg, transparent 0 39%, rgba(255,244,168,0.13) 39% 48%, transparent 48% 100%)",
  },
  all: {
    label: "ggLobby redline",
    accent: "#ff4655",
    secondary: "#111827",
    glow: "rgba(255, 70, 85, 0.30)",
    background: "linear-gradient(135deg, #0a0d12 0%, #11151d 48%, #07080b 100%)",
    plate: "linear-gradient(135deg, rgba(255,70,85,0.18), rgba(17,24,39,0.08))",
    line: "#ff4655",
    texture:
      "linear-gradient(120deg, transparent 0 42%, rgba(255,70,85,0.11) 42% 49%, transparent 49% 100%)",
  },
};

export function rankCardSkin(rank: string): RankCardSkin {
  const tier = tierGroup(rank);
  return { tier, ...(SKINS[tier] || SKINS.all) };
}
