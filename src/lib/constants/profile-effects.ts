/**
 * Profile Effect Definitions
 * Each effect generates CSS-based particles/animations on the profile page.
 */

export interface ProfileEffect {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji for quick display
  particleCount: number;
  colors: string[];
  /** CSS animation name (defined in globals.css) */
  animationName: string;
  /** Particle shape */
  shape: "circle" | "square" | "line" | "custom";
  /** Custom character for particle (used when shape is "custom") */
  character?: string;
  /** Size range [min, max] in px */
  sizeRange: [number, number];
  /** Duration range [min, max] in seconds */
  durationRange: [number, number];
}

export const PROFILE_EFFECTS: ProfileEffect[] = [
  {
    id: "snow",
    name: "Snowfall",
    description: "Gentle snowflakes drifting down",
    icon: "❄️",
    particleCount: 40,
    colors: ["#ffffff", "#e0e7ff", "#c7d2fe"],
    animationName: "effectSnowfall",
    shape: "circle",
    sizeRange: [3, 8],
    durationRange: [5, 12],
  },
  {
    id: "rain",
    name: "Rain",
    description: "Streaks of rain falling",
    icon: "🌧️",
    particleCount: 50,
    colors: ["#60a5fa", "#93c5fd", "#3b82f6"],
    animationName: "effectRain",
    shape: "line",
    sizeRange: [1, 3],
    durationRange: [0.5, 1.5],
  },
  {
    id: "fireflies",
    name: "Fireflies",
    description: "Glowing fireflies floating around",
    icon: "✨",
    particleCount: 20,
    colors: ["#fbbf24", "#fcd34d", "#f59e0b"],
    animationName: "effectFireflies",
    shape: "circle",
    sizeRange: [3, 6],
    durationRange: [4, 8],
  },
  {
    id: "cherry_blossoms",
    name: "Cherry Blossoms",
    description: "Pink petals floating in the wind",
    icon: "🌸",
    particleCount: 25,
    colors: ["#f9a8d4", "#f472b6", "#ec4899"],
    animationName: "effectCherryBlossoms",
    shape: "custom",
    character: "🌸",
    sizeRange: [10, 18],
    durationRange: [6, 14],
  },
  {
    id: "embers",
    name: "Fire Embers",
    description: "Glowing embers rising up",
    icon: "🔥",
    particleCount: 30,
    colors: ["#ef4444", "#f97316", "#fbbf24"],
    animationName: "effectEmbers",
    shape: "circle",
    sizeRange: [2, 5],
    durationRange: [3, 7],
  },
  {
    id: "sparks",
    name: "Electric Sparks",
    description: "Crackling electric sparks",
    icon: "⚡",
    particleCount: 15,
    colors: ["#06b6d4", "#22d3ee", "#67e8f9"],
    animationName: "effectSparks",
    shape: "circle",
    sizeRange: [2, 4],
    durationRange: [0.5, 2],
  },
  {
    id: "matrix",
    name: "Matrix Rain",
    description: "Digital code raining down",
    icon: "🟩",
    particleCount: 35,
    colors: ["#22c55e", "#4ade80", "#16a34a"],
    animationName: "effectMatrix",
    shape: "custom",
    character: "0",
    sizeRange: [10, 14],
    durationRange: [2, 6],
  },
  {
    id: "pixels",
    name: "Pixel Sparkles",
    description: "Retro pixel particles appearing",
    icon: "🎮",
    particleCount: 20,
    colors: ["#a78bfa", "#c084fc", "#e879f9", "#f472b6"],
    animationName: "effectPixels",
    shape: "square",
    sizeRange: [4, 8],
    durationRange: [2, 5],
  },
  {
    id: "bubbles",
    name: "Bubbles",
    description: "Translucent bubbles floating up",
    icon: "🫧",
    particleCount: 15,
    colors: ["rgba(96,165,250,0.3)", "rgba(147,197,253,0.3)", "rgba(191,219,254,0.3)"],
    animationName: "effectBubbles",
    shape: "circle",
    sizeRange: [8, 20],
    durationRange: [5, 10],
  },
  {
    id: "aurora",
    name: "Aurora Wisps",
    description: "Northern lights wisps",
    icon: "🌌",
    particleCount: 10,
    colors: ["#34d399", "#2dd4bf", "#a78bfa", "#818cf8"],
    animationName: "effectAurora",
    shape: "circle",
    sizeRange: [15, 40],
    durationRange: [6, 12],
  },
];

export function getEffectById(id: string): ProfileEffect | undefined {
  return PROFILE_EFFECTS.find((e) => e.id === id);
}
