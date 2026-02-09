export const GAME_KEYWORDS: Record<string, string[]> = {
  'valorant': ['valorant', 'vct', 'champions tour', 'riot games valorant', 'vct pacific', 'vct ascension'],
  'cs2': ['counter-strike', 'cs2', 'csgo', 'cs:go', 'counter strike', 'major', 'blast premier', 'esl pro league'],
  'pubg-mobile': ['pubg mobile', 'pubg', 'battlegrounds mobile', 'bgmi', 'pubg mobile india'],
  'freefire': ['free fire', 'freefire', 'garena free fire', 'ff max', 'free fire india'],
  'coc': ['clash of clans', 'coc', 'supercell clash', 'clan war', 'clan war league', 'cwl'],
  'cod-mobile': ['cod mobile', 'call of duty mobile', 'codm', 'call of duty: mobile'],
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

export const ALL_GAME_SLUGS = ['valorant', 'cs2', 'pubg-mobile', 'freefire', 'coc', 'cod-mobile'] as const;

export const GAME_COLORS: Record<string, string> = {
  'valorant': 'bg-red-500/20 text-red-400 border-red-500/30',
  'cs2': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'pubg-mobile': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'freefire': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'coc': 'bg-green-500/20 text-green-400 border-green-500/30',
  'cod-mobile': 'bg-sky-500/20 text-sky-400 border-sky-500/30',
};

export const GAME_BORDER_COLORS: Record<string, string> = {
  'valorant': 'border-l-red-500',
  'cs2': 'border-l-amber-500',
  'pubg-mobile': 'border-l-orange-500',
  'freefire': 'border-l-yellow-500',
  'coc': 'border-l-green-500',
  'cod-mobile': 'border-l-sky-500',
};

export const GAME_DISPLAY_NAMES: Record<string, string> = {
  'valorant': 'Valorant',
  'cs2': 'CS2',
  'pubg-mobile': 'PUBG Mobile',
  'freefire': 'Free Fire',
  'coc': 'Clash of Clans',
  'cod-mobile': 'COD Mobile',
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
