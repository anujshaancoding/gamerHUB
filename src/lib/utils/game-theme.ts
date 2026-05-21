export interface GameTheme {
  slug: string;
  primary: string;
  primaryBg: string;
  primaryText: string;
  primaryBorder: string;
  borderLeft: string;
  gradient: string;
  gradientHeader: string;
  glow: string;
  isMonochrome: boolean;
}

const GAME_THEMES: Record<string, Omit<GameTheme, 'slug' | 'isMonochrome'>> = {
  valorant: {
    primary: 'red-500',
    primaryBg: 'bg-red-500/20 text-red-400 border-red-500/30',
    primaryText: 'text-red-400',
    primaryBorder: 'border-red-500',
    borderLeft: 'border-l-red-500',
    gradient: 'from-red-500 to-red-700',
    gradientHeader: 'from-red-600 to-red-900',
    glow: 'shadow-red-500/20',
  },
};

const MONOCHROME_THEME: Omit<GameTheme, 'slug' | 'isMonochrome'> = {
  primary: 'gray-400',
  primaryBg: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  primaryText: 'text-gray-300',
  primaryBorder: 'border-gray-500',
  borderLeft: 'border-l-gray-500',
  gradient: 'from-gray-500 to-gray-700',
  gradientHeader: 'from-gray-700 to-gray-950',
  glow: 'shadow-gray-500/20',
};

export function getGameTheme(gameSlug?: string | null): GameTheme {
  const slug = gameSlug || 'other';
  const theme = GAME_THEMES[slug];

  if (theme) {
    return { ...theme, slug, isMonochrome: false };
  }

  return { ...MONOCHROME_THEME, slug, isMonochrome: true };
}
