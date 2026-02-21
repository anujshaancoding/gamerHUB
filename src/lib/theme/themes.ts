export interface ThemeColors {
  background: string;
  surface: string;
  surfaceLight: string;
  surfaceLighter: string;
  border: string;
  borderLight: string;
  primary: string;
  primaryDark: string;
  primaryGlow: string;
  accent: string;
  accentDark: string;
  accentGlow: string;
  secondary: string;
  warning: string;
  error: string;
  success: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textDim: string;
  foreground: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  category: "default" | "classic" | "game";
  gameSlug?: string;
  colors: ThemeColors;
  isDark: boolean;
}

// Default Theme - Neon Green & Black (Gaming Classic)
const neonGreenBlack: Theme = {
  id: "neon-green-black",
  name: "Neon Green",
  description: "Classic gaming aesthetic with neon green accents",
  category: "default",
  isDark: true,
  colors: {
    background: "#0a0a0f",
    surface: "#12121a",
    surfaceLight: "#1a1a25",
    surfaceLighter: "#22222f",
    border: "#2a2a35",
    borderLight: "#3a3a45",
    primary: "#00ff88",
    primaryDark: "#00cc6a",
    primaryGlow: "rgba(0, 255, 136, 0.3)",
    accent: "#00d4ff",
    accentDark: "#00a8cc",
    accentGlow: "rgba(0, 212, 255, 0.3)",
    secondary: "#ff00ff",
    warning: "#ffaa00",
    error: "#ff4444",
    success: "#00ff88",
    text: "#ffffff",
    textSecondary: "#b8b8c8",
    textMuted: "#8b8b9a",
    textDim: "#5a5a6a",
    foreground: "#ffffff",
  },
};

// Black & White - Minimalist
const blackWhite: Theme = {
  id: "black-white",
  name: "Monochrome",
  description: "Clean minimalist black and white theme",
  category: "classic",
  isDark: true,
  colors: {
    background: "#0a0a0a",
    surface: "#141414",
    surfaceLight: "#1e1e1e",
    surfaceLighter: "#282828",
    border: "#333333",
    borderLight: "#444444",
    primary: "#ffffff",
    primaryDark: "#cccccc",
    primaryGlow: "rgba(255, 255, 255, 0.2)",
    accent: "#888888",
    accentDark: "#666666",
    accentGlow: "rgba(136, 136, 136, 0.2)",
    secondary: "#aaaaaa",
    warning: "#ffaa00",
    error: "#ff4444",
    success: "#00ff88",
    text: "#ffffff",
    textSecondary: "#b0b0b0",
    textMuted: "#808080",
    textDim: "#505050",
    foreground: "#ffffff",
  },
};

// Red & Yellow - Fiery
const redYellow: Theme = {
  id: "red-yellow",
  name: "Inferno",
  description: "Bold fiery theme with red and yellow",
  category: "classic",
  isDark: true,
  colors: {
    background: "#0f0808",
    surface: "#1a1010",
    surfaceLight: "#251818",
    surfaceLighter: "#2f2020",
    border: "#3d2828",
    borderLight: "#4d3535",
    primary: "#ff4444",
    primaryDark: "#cc3333",
    primaryGlow: "rgba(255, 68, 68, 0.3)",
    accent: "#ffcc00",
    accentDark: "#cc9900",
    accentGlow: "rgba(255, 204, 0, 0.3)",
    secondary: "#ff8800",
    warning: "#ffcc00",
    error: "#ff4444",
    success: "#88ff44",
    text: "#ffffff",
    textSecondary: "#d4c4c4",
    textMuted: "#a08888",
    textDim: "#705858",
    foreground: "#ffffff",
  },
};

// Orange & White - Citrus
const orangeWhite: Theme = {
  id: "orange-white",
  name: "Citrus",
  description: "Vibrant orange with clean white accents",
  category: "classic",
  isDark: true,
  colors: {
    background: "#0f0c0a",
    surface: "#1a1512",
    surfaceLight: "#251e1a",
    surfaceLighter: "#2f2822",
    border: "#3d3228",
    borderLight: "#4d4035",
    primary: "#ff8800",
    primaryDark: "#cc6600",
    primaryGlow: "rgba(255, 136, 0, 0.3)",
    accent: "#ffffff",
    accentDark: "#cccccc",
    accentGlow: "rgba(255, 255, 255, 0.2)",
    secondary: "#ffaa44",
    warning: "#ffcc00",
    error: "#ff4444",
    success: "#88ff44",
    text: "#ffffff",
    textSecondary: "#d4ccc4",
    textMuted: "#a09080",
    textDim: "#706050",
    foreground: "#ffffff",
  },
};

// Cyber Purple - Additional gaming theme
const cyberPurple: Theme = {
  id: "cyber-purple",
  name: "Cyber Purple",
  description: "Cyberpunk inspired purple and pink",
  category: "classic",
  isDark: true,
  colors: {
    background: "#0a080f",
    surface: "#14101a",
    surfaceLight: "#1e1825",
    surfaceLighter: "#28202f",
    border: "#352a3d",
    borderLight: "#45354d",
    primary: "#aa44ff",
    primaryDark: "#8833cc",
    primaryGlow: "rgba(170, 68, 255, 0.3)",
    accent: "#ff44aa",
    accentDark: "#cc3388",
    accentGlow: "rgba(255, 68, 170, 0.3)",
    secondary: "#44aaff",
    warning: "#ffaa00",
    error: "#ff4444",
    success: "#44ff88",
    text: "#ffffff",
    textSecondary: "#c4b8d4",
    textMuted: "#888ba0",
    textDim: "#585a70",
    foreground: "#ffffff",
  },
};

// Game-based themes
const valorantTheme: Theme = {
  id: "game-valorant",
  name: "Valorant",
  description: "Inspired by Valorant's red and dark aesthetic",
  category: "game",
  gameSlug: "valorant",
  isDark: true,
  colors: {
    background: "#0f1923",
    surface: "#1a2633",
    surfaceLight: "#253340",
    surfaceLighter: "#30404d",
    border: "#3d4d5a",
    borderLight: "#4d5d6a",
    primary: "#ff4655",
    primaryDark: "#cc3744",
    primaryGlow: "rgba(255, 70, 85, 0.3)",
    accent: "#fffbf5",
    accentDark: "#ccc8c0",
    accentGlow: "rgba(255, 251, 245, 0.2)",
    secondary: "#bd3944",
    warning: "#ffaa00",
    error: "#ff4655",
    success: "#00c896",
    text: "#fffbf5",
    textSecondary: "#c4c0b8",
    textMuted: "#8a8680",
    textDim: "#5a5650",
    foreground: "#fffbf5",
  },
};

const bgmiTheme: Theme = {
  id: "game-bgmi",
  name: "BGMI",
  description: "BGMI military tactical theme",
  category: "game",
  gameSlug: "bgmi",
  isDark: true,
  colors: {
    background: "#1a1c14",
    surface: "#24261c",
    surfaceLight: "#2e3024",
    surfaceLighter: "#383a2c",
    border: "#484a3c",
    borderLight: "#58594c",
    primary: "#f2a900",
    primaryDark: "#c28800",
    primaryGlow: "rgba(242, 169, 0, 0.3)",
    accent: "#4a5d23",
    accentDark: "#3b4a1c",
    accentGlow: "rgba(74, 93, 35, 0.3)",
    secondary: "#8b7355",
    warning: "#f2a900",
    error: "#c94f4f",
    success: "#4a5d23",
    text: "#f0ebe0",
    textSecondary: "#c8c4b8",
    textMuted: "#8a8678",
    textDim: "#5a5648",
    foreground: "#f0ebe0",
  },
};

const freefireTheme: Theme = {
  id: "game-freefire",
  name: "Free Fire",
  description: "Free Fire orange blaze theme",
  category: "game",
  gameSlug: "freefire",
  isDark: true,
  colors: {
    background: "#1a1210",
    surface: "#241a16",
    surfaceLight: "#2e221e",
    surfaceLighter: "#382a26",
    border: "#4d3a34",
    borderLight: "#5d4a44",
    primary: "#ff5722",
    primaryDark: "#cc451b",
    primaryGlow: "rgba(255, 87, 34, 0.3)",
    accent: "#ff9800",
    accentDark: "#cc7a00",
    accentGlow: "rgba(255, 152, 0, 0.3)",
    secondary: "#8b5e3c",
    warning: "#ff9800",
    error: "#ff5722",
    success: "#4caf50",
    text: "#fff3e0",
    textSecondary: "#c8b8a8",
    textMuted: "#8a7a6a",
    textDim: "#5a4a3a",
    foreground: "#fff3e0",
  },
};

// Export all themes
export const THEMES: Theme[] = [
  neonGreenBlack,
  blackWhite,
  redYellow,
  orangeWhite,
  cyberPurple,
  valorantTheme,
  bgmiTheme,
  freefireTheme,
];

export const DEFAULT_THEME = neonGreenBlack;

export const getThemeById = (id: string): Theme => {
  return THEMES.find((t) => t.id === id) || DEFAULT_THEME;
};

export const getThemesByCategory = (category: Theme["category"]): Theme[] => {
  return THEMES.filter((t) => t.category === category);
};

export const getGameTheme = (gameSlug: string): Theme | undefined => {
  return THEMES.find((t) => t.gameSlug === gameSlug);
};
