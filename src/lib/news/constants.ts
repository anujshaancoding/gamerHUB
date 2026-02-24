// ── Game detection keywords (scored by weight) ─────────────────────────
// Higher weight = stronger signal. We score each game and pick the highest.
export interface GameKeyword {
  term: string;
  weight: number; // 3 = definitive, 2 = strong, 1 = weak/ambiguous
}

export const GAME_KEYWORDS_SCORED: Record<string, GameKeyword[]> = {
  'valorant': [
    // Definitive — only Valorant
    { term: 'valorant', weight: 3 },
    { term: 'vct ', weight: 3 },        // space to avoid false matches
    { term: 'champions tour', weight: 3 },
    { term: 'vct pacific', weight: 3 },
    { term: 'vct ascension', weight: 3 },
    { term: 'vct masters', weight: 3 },
    { term: 'vct champions', weight: 3 },
    { term: 'valorant champions', weight: 3 },
    // Agent names (unique to Valorant)
    { term: 'jett', weight: 1 },
    { term: 'reyna', weight: 1 },
    { term: 'omen', weight: 1 },
    { term: 'sova', weight: 1 },
    { term: 'killjoy', weight: 2 },
    { term: 'cypher', weight: 1 },
    { term: 'astra', weight: 2 },
    { term: 'viper', weight: 1 },
    { term: 'brimstone', weight: 2 },
    { term: 'phoenix', weight: 1 },
    { term: 'neon', weight: 1 },
    { term: 'gekko', weight: 2 },
    { term: 'deadlock', weight: 1 },
    { term: 'iso ', weight: 2 },
    { term: 'clove', weight: 2 },
    { term: 'vyse', weight: 2 },
    { term: 'tejo', weight: 2 },
    // Maps
    { term: 'ascent', weight: 1 },
    { term: 'bind', weight: 1 },
    { term: 'haven', weight: 1 },
    { term: 'split', weight: 1 },
    { term: 'icebox', weight: 1 },
    { term: 'breeze', weight: 1 },
    { term: 'fracture', weight: 1 },
    { term: 'pearl', weight: 1 },
    { term: 'lotus', weight: 1 },
    { term: 'sunset', weight: 1 },
    { term: 'abyss', weight: 1 },
    // Indian Valorant scene
    { term: 'global esports', weight: 1 },
    { term: 'velocity gaming', weight: 2 },
    { term: 'orangutan', weight: 1 },
    { term: 'skyesports valorant', weight: 3 },
  ],
  'bgmi': [
    // Definitive
    { term: 'bgmi', weight: 3 },
    { term: 'battlegrounds mobile india', weight: 3 },
    { term: 'bgmi india', weight: 3 },
    { term: 'pubg mobile india', weight: 3 },
    { term: 'bmps', weight: 3 },         // BGMI Pro Series
    { term: 'bmoc', weight: 3 },         // BGMI Open Challenge
    { term: 'bgis', weight: 3 },         // BGMI India Series
    // Strong
    { term: 'pubg mobile', weight: 2 },
    { term: 'pubg', weight: 1 },
    { term: 'battlegrounds mobile', weight: 2 },
    // Indian BGMI teams
    { term: 'godlike esports', weight: 2 },
    { term: 'soul', weight: 1 },
    { term: 'team xspark', weight: 2 },
    { term: 'blind esports', weight: 2 },
    { term: 'jonathan gaming', weight: 2 },
    { term: 'krafton india', weight: 3 },
    { term: 'krafton', weight: 1 },
    // Gameplay terms
    { term: 'erangel', weight: 2 },
    { term: 'miramar', weight: 2 },
    { term: 'sanhok', weight: 2 },
  ],
  'freefire': [
    // Definitive
    { term: 'free fire', weight: 3 },
    { term: 'freefire', weight: 3 },
    { term: 'garena free fire', weight: 3 },
    { term: 'ff max', weight: 3 },
    { term: 'free fire max', weight: 3 },
    { term: 'free fire india', weight: 3 },
    // Tournaments
    { term: 'ffws', weight: 3 },         // Free Fire World Series
    { term: 'ffic', weight: 3 },         // Free Fire India Championship
    { term: 'free fire continental', weight: 3 },
    // Strong
    { term: 'garena', weight: 2 },
    // Characters
    { term: 'chrono', weight: 1 },
    { term: 'alok', weight: 2 },
    { term: 'hayato', weight: 2 },
  ],
};

// Simple flat keyword map (for backward compat or quick checks)
export const GAME_KEYWORDS: Record<string, string[]> = Object.fromEntries(
  Object.entries(GAME_KEYWORDS_SCORED).map(([slug, kws]) => [
    slug,
    kws.map((k) => k.term.trim()),
  ])
);

// ── Exclusion keywords: articles mentioning these are about OTHER games ──
// If an article strongly matches one of these AND doesn't match our 3 games,
// we reject it outright.
export const OTHER_GAME_KEYWORDS: string[] = [
  // Counter-Strike
  'counter-strike', 'counter strike', 'csgo', 'cs:go', 'cs2', 'cs 2',
  'counter-strike 2', 'major championship cs', 'iem katowice', 'blast premier',
  'esl pro league', 'pgl major', 'faceit',
  'zywoo', 's1mple', 'niko', 'device', 'donk',
  // League of Legends
  'league of legends', 'lol worlds', 'lck', 'lpl', 'lec', 'lcs',
  'summoner\'s rift', 'riot games lol',
  // Dota 2
  'dota 2', 'dota2', 'the international dota',
  // Fortnite
  'fortnite', 'fortnite battle royale', 'epic games fortnite', 'fncs',
  // Apex Legends
  'apex legends', 'apex', 'respawn entertainment',
  // Call of Duty
  'call of duty', 'cod warzone', 'warzone', 'modern warfare', 'cod mobile',
  'cdl ', 'call of duty league',
  // Overwatch
  'overwatch', 'overwatch 2', 'owl ',
  // Clash of Clans / Clash Royale / Supercell
  'clash of clans', 'clash royale', 'supercell', 'coc ', 'brawl stars',
  // Roblox
  'roblox',
  // Minecraft
  'minecraft',
  // FIFA / EA FC
  'ea fc', 'fifa', 'ea sports fc',
  // Genshin Impact
  'genshin impact', 'genshin', 'hoyoverse', 'honkai', 'star rail',
  // Pokemon
  'pokemon', 'pokémon',
  // MLBB
  'mobile legends', 'mlbb',
  // Rocket League
  'rocket league',
  // Rainbow Six
  'rainbow six', 'r6 siege',
  // Tekken / Fighting games
  'tekken', 'street fighter',
  // GTA
  'gta online', 'gta 6', 'gta vi',
];

// ── India/region detection ──────────────────────────────────────────────
export const INDIA_KEYWORDS = [
  'india', 'indian', 'south asia', 'bgmi',
  'mumbai', 'delhi', 'bangalore', 'bengaluru', 'chennai', 'kolkata',
  'hyderabad', 'pune', 'ahmedabad', 'jaipur',
  'skyesports', 'nodwin', 'gamerji', 'upthrust', 'villager esports',
  'godlike', 'team xspark', 'orangutan', 'velocity gaming',
  'bmps', 'bmoc', 'bgis', 'ffic',
];

export const INDIA_ASIA_KEYWORDS = [
  ...INDIA_KEYWORDS,
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
