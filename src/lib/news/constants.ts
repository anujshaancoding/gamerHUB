export const GAME_KEYWORDS: Record<string, string[]> = {
  'valorant': ['valorant', 'vct', 'champions tour', 'riot games valorant', 'vct pacific', 'vct ascension'],
  'bgmi': ['bgmi', 'battlegrounds mobile india', 'pubg mobile', 'pubg', 'battlegrounds mobile', 'pubg mobile india'],
  'freefire': ['free fire', 'freefire', 'garena free fire', 'ff max', 'free fire india'],
};

export const INDIA_ASIA_KEYWORDS = [
  'india', 'indian', 'south asia', 'bgmi',
  'mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'hyderabad',
  'skyesports', 'nodwin', 'gamerji', 'upthrust',
  'asia', 'asian', 'pacific', 'apac',
  'sea', 'southeast asia', 'singapore', 'indonesia', 'philippines', 'thailand', 'vietnam', 'malaysia',
  'japan', 'korea', 'china',
  'vct pacific', 'vct ascension pacific',
];

export const ALL_GAME_SLUGS = ['valorant', 'bgmi', 'freefire'] as const;

export const GAME_COLORS: Record<string, string> = {
  'valorant': 'bg-red-500/20 text-red-400 border-red-500/30',
  'bgmi': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'freefire': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'other': 'bg-gray-500/10 text-gray-400 border-gray-500/30',
};

export const GAME_BORDER_COLORS: Record<string, string> = {
  'valorant': 'border-l-red-500',
  'bgmi': 'border-l-orange-500',
  'freefire': 'border-l-yellow-500',
  'other': 'border-l-gray-500',
};

export const GAME_DISPLAY_NAMES: Record<string, string> = {
  'valorant': 'Valorant',
  'bgmi': 'BGMI',
  'freefire': 'Free Fire',
  'other': 'Other',
};

export const GAME_GRADIENT_HEADERS: Record<string, string> = {
  'valorant': 'from-red-600 to-red-900',
  'bgmi': 'from-orange-600 to-orange-900',
  'freefire': 'from-yellow-600 to-yellow-900',
  'other': 'from-gray-700 to-gray-950',
};

export const GAME_ACCENT_COLORS: Record<string, string> = {
  'valorant': 'text-red-400',
  'bgmi': 'text-orange-400',
  'freefire': 'text-yellow-400',
  'other': 'text-gray-300',
};

export const GAME_GLOW_COLORS: Record<string, string> = {
  'valorant': 'hover:shadow-red-500/20',
  'bgmi': 'hover:shadow-orange-500/20',
  'freefire': 'hover:shadow-yellow-500/20',
  'other': 'hover:shadow-gray-500/20',
};

export const CATEGORY_COLORS: Record<string, string> = {
  'patch': 'bg-green-500/20 text-green-400',
  'tournament': 'bg-purple-500/20 text-purple-400',
  'event': 'bg-blue-500/20 text-blue-400',
  'update': 'bg-cyan-500/20 text-cyan-400',
  'roster': 'bg-orange-500/20 text-orange-400',
  'meta': 'bg-yellow-500/20 text-yellow-400',
  'general': 'bg-gray-500/20 text-gray-400',
};
