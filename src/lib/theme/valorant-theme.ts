// Official-feel VALORANT palette. This becomes the V2 default theme.
// Kept as a typed object so the future Settings theme-switcher can swap it.

export const VALORANT = {
  // Deep tactical navy-black (valorant.com background)
  bg: "#0F1923",
  bgDeep: "#0A1014",
  surface: "#1B232D",
  surfaceLight: "#232E39",
  border: "#2F3B47",
  borderLight: "#3D4A57",

  // Signature VALORANT red
  red: "#FF4655",
  redDark: "#BD3944",
  redGlow: "rgba(255, 70, 85, 0.35)",

  // Cream / off-white (VALORANT's signature text color)
  cream: "#ECE8E1",
  text: "#ECE8E1",
  textMuted: "#8B978F",
  textDim: "#6B7780",

  // Secondary tactical teal (used sparingly, like in-game ally markers)
  teal: "#0AC8B9",
} as const;

export type ValorantPalette = typeof VALORANT;

/** Inline style object that maps the palette onto CSS vars for a scoped wrapper. */
export const valorantVars: React.CSSProperties = {
  ["--v-bg" as string]: VALORANT.bg,
  ["--v-bg-deep" as string]: VALORANT.bgDeep,
  ["--v-surface" as string]: VALORANT.surface,
  ["--v-surface-light" as string]: VALORANT.surfaceLight,
  ["--v-border" as string]: VALORANT.border,
  ["--v-red" as string]: VALORANT.red,
  ["--v-red-dark" as string]: VALORANT.redDark,
  ["--v-cream" as string]: VALORANT.cream,
  ["--v-text-muted" as string]: VALORANT.textMuted,
  ["--v-text-dim" as string]: VALORANT.textDim,
  ["--v-teal" as string]: VALORANT.teal,
};
