// GamerHub Dark Gaming Theme - matching web app
export const colors = {
  // Background colors
  background: '#0a0a0f',
  surface: '#12121a',
  surfaceLight: '#1a1a25',
  surfaceLighter: '#22222f',

  // Border colors
  border: '#2a2a35',
  borderLight: '#3a3a45',

  // Primary - Neon Green
  primary: '#00ff88',
  primaryDark: '#00cc6a',
  primaryGlow: 'rgba(0, 255, 136, 0.3)',

  // Accent - Cyan
  accent: '#00d4ff',
  accentDark: '#00a8cc',
  accentGlow: 'rgba(0, 212, 255, 0.3)',

  // Secondary colors
  secondary: '#ff00ff',
  warning: '#ffaa00',
  error: '#ff4444',
  success: '#00ff88',

  // Text colors
  text: '#ffffff',
  textSecondary: '#b8b8c8',
  textMuted: '#8b8b9a',
  textDim: '#5a5a6a',

  // Foreground
  foreground: '#ffffff',

  // Transparent variants
  primaryTransparent: 'rgba(0, 255, 136, 0.1)',
  accentTransparent: 'rgba(0, 212, 255, 0.1)',
  secondaryTransparent: 'rgba(255, 0, 255, 0.1)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export default {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
};
