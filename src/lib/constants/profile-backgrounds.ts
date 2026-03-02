/**
 * Animated Background Definitions
 * Each background is a pure CSS animation — no images or videos needed.
 */

export interface ProfileBackground {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** CSS class name applied to the background layer (defined in globals.css) */
  className: string;
  premium: boolean;
}

export const PROFILE_BACKGROUNDS: ProfileBackground[] = [
  {
    id: "cyberpunk_grid",
    name: "Cyberpunk Grid",
    description: "Neon grid lines receding into the horizon",
    icon: "🌃",
    className: "bg-anim-cyberpunk-grid",
    premium: true,
  },
  {
    id: "starfield",
    name: "Starfield",
    description: "Stars zooming past at light speed",
    icon: "🌠",
    className: "bg-anim-starfield",
    premium: true,
  },
  {
    id: "retro_arcade",
    name: "Retro Arcade",
    description: "Classic arcade pixel patterns",
    icon: "👾",
    className: "bg-anim-retro-arcade",
    premium: true,
  },
  {
    id: "aurora",
    name: "Aurora Borealis",
    description: "Shimmering northern lights",
    icon: "🌌",
    className: "bg-anim-aurora",
    premium: true,
  },
  {
    id: "neon_waves",
    name: "Neon Waves",
    description: "Flowing neon wave patterns",
    icon: "🌊",
    className: "bg-anim-neon-waves",
    premium: true,
  },
  {
    id: "geometric",
    name: "Geometric Mesh",
    description: "Rotating geometric wireframe shapes",
    icon: "🔷",
    className: "bg-anim-geometric",
    premium: true,
  },
  {
    id: "smoke",
    name: "Smoke",
    description: "Wispy smoke drifting slowly",
    icon: "🌫️",
    className: "bg-anim-smoke",
    premium: true,
  },
  {
    id: "gradient_pulse",
    name: "Gradient Pulse",
    description: "Slowly pulsing color gradients",
    icon: "🎨",
    className: "bg-anim-gradient-pulse",
    premium: true,
  },
];

export function getBackgroundById(id: string): ProfileBackground | undefined {
  return PROFILE_BACKGROUNDS.find((b) => b.id === id);
}
