/**
 * Profile Skin/Template Definitions
 * Each skin applies a CSS class that changes the profile's visual style.
 */

export interface ProfileSkin {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** CSS class applied to profile wrapper (defined in globals.css) */
  className: string;
  /** Preview colors for the selection card */
  previewColors: [string, string, string];
}

export const PROFILE_SKINS: ProfileSkin[] = [
  {
    id: "default",
    name: "Default",
    description: "Standard GamerHub profile",
    icon: "🎮",
    className: "",
    previewColors: ["#9f7aea", "#06b6d4", "#0a0a0f"],
  },
  {
    id: "rpg_sheet",
    name: "RPG Character Sheet",
    description: "Medieval parchment-style with fantasy borders",
    icon: "⚔️",
    className: "skin-rpg-sheet",
    previewColors: ["#d4a574", "#8b6914", "#2d1b00"],
  },
  {
    id: "esports_card",
    name: "Esports Pro Card",
    description: "Clean competitive look with sharp angles",
    icon: "🏆",
    className: "skin-esports-card",
    previewColors: ["#00ff88", "#0066ff", "#000a1a"],
  },
  {
    id: "retro_arcade",
    name: "Retro Arcade",
    description: "8-bit pixel art borders and neon glow",
    icon: "👾",
    className: "skin-retro-arcade",
    previewColors: ["#ff00ff", "#00ffff", "#1a0033"],
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk Terminal",
    description: "Hacker terminal aesthetic with glitch effects",
    icon: "🤖",
    className: "skin-cyberpunk",
    previewColors: ["#ff3366", "#33ffcc", "#0d0d1a"],
  },
  {
    id: "fantasy_quest",
    name: "Fantasy Quest Log",
    description: "Enchanted book with magical glow accents",
    icon: "🔮",
    className: "skin-fantasy-quest",
    previewColors: ["#a855f7", "#6366f1", "#0f0520"],
  },
];

export const COLOR_PALETTES = [
  { id: "midnight_gamer", name: "Midnight Gamer", primary: "#6366f1", secondary: "#1e1b4b", accent: "#818cf8" },
  { id: "neon_cyberpunk", name: "Neon Cyberpunk", primary: "#f43f5e", secondary: "#0f172a", accent: "#06b6d4" },
  { id: "arctic_frost", name: "Arctic Frost", primary: "#38bdf8", secondary: "#0c1929", accent: "#e0f2fe" },
  { id: "sunset_warrior", name: "Sunset Warrior", primary: "#f97316", secondary: "#1c1917", accent: "#fbbf24" },
  { id: "forest_shadow", name: "Forest Shadow", primary: "#22c55e", secondary: "#052e16", accent: "#4ade80" },
  { id: "ocean_deep", name: "Ocean Deep", primary: "#0ea5e9", secondary: "#0c2340", accent: "#06b6d4" },
  { id: "blood_moon", name: "Blood Moon", primary: "#dc2626", secondary: "#1a0000", accent: "#f87171" },
  { id: "gold_rush", name: "Gold Rush", primary: "#eab308", secondary: "#1a1500", accent: "#fde047" },
  { id: "lavender_dream", name: "Lavender Dream", primary: "#a855f7", secondary: "#1e0a3e", accent: "#d8b4fe" },
  { id: "toxic_green", name: "Toxic Green", primary: "#84cc16", secondary: "#0a1a00", accent: "#bef264" },
  { id: "coral_reef", name: "Coral Reef", primary: "#fb7185", secondary: "#1a0810", accent: "#fda4af" },
  { id: "monochrome", name: "Monochrome", primary: "#a1a1aa", secondary: "#18181b", accent: "#e4e4e7" },
];

export function getSkinById(id: string): ProfileSkin | undefined {
  return PROFILE_SKINS.find((s) => s.id === id);
}
