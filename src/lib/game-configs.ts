// Game-specific configurations for LFG system
// Each game has unique rank systems, game modes, agents/characters, and team sizes

export interface RankOption {
  value: string;
  label: string;
  tier?: number; // For sorting/filtering purposes
}

export interface GameModeOption {
  value: string;
  label: string;
  teamSize?: number; // Override default team size for this mode
}

export interface AgentOption {
  value: string;
  label: string;
  role?: string; // Associated role/class
}

export interface MapOption {
  value: string;
  label: string;
}

export interface GameConfig {
  slug: string;
  name: string;
  // Rank system
  rankType: "numeric" | "tier" | "mmr"; // numeric = CS2 rating, tier = Valorant/LoL, mmr = Dota
  ranks?: RankOption[];
  ratingRange?: { min: number; max: number; step?: number };
  ratingLabel?: string; // e.g., "Premier Rating", "MMR", "RP"
  // Game modes
  gameModes: GameModeOption[];
  // Agents/Characters/Legends (optional)
  hasAgents?: boolean;
  agentLabel?: string; // "Agent", "Legend", "Champion", "Character"
  agents?: AgentOption[];
  // Maps (optional, for BR games)
  hasMaps?: boolean;
  maps?: MapOption[];
  // Perspective (optional, for BR games like PUBG)
  hasPerspective?: boolean;
  perspectives?: { value: string; label: string }[];
  // Team sizes
  defaultTeamSize: number;
  teamSizeOptions: number[];
  // Additional options
  hasUnrankedOption?: boolean;
}

// ============================================
// COUNTER-STRIKE 2
// ============================================
export const CS2_CONFIG: GameConfig = {
  slug: "cs2",
  name: "Counter-Strike 2",
  rankType: "numeric",
  ratingRange: { min: 1000, max: 35000, step: 500 },
  ratingLabel: "Premier Rating",
  hasUnrankedOption: true,
  gameModes: [
    { value: "premier", label: "Premier" },
    { value: "competitive", label: "Competitive" },
    { value: "wingman", label: "Wingman", teamSize: 2 },
    { value: "casual", label: "Casual" },
    { value: "deathmatch", label: "Deathmatch" },
  ],
  defaultTeamSize: 5,
  teamSizeOptions: [2, 3, 4, 5],
};

// ============================================
// VALORANT
// ============================================
export const VALORANT_CONFIG: GameConfig = {
  slug: "valorant",
  name: "Valorant",
  rankType: "tier",
  ranks: [
    { value: "iron1", label: "Iron 1", tier: 1 },
    { value: "iron2", label: "Iron 2", tier: 2 },
    { value: "iron3", label: "Iron 3", tier: 3 },
    { value: "bronze1", label: "Bronze 1", tier: 4 },
    { value: "bronze2", label: "Bronze 2", tier: 5 },
    { value: "bronze3", label: "Bronze 3", tier: 6 },
    { value: "silver1", label: "Silver 1", tier: 7 },
    { value: "silver2", label: "Silver 2", tier: 8 },
    { value: "silver3", label: "Silver 3", tier: 9 },
    { value: "gold1", label: "Gold 1", tier: 10 },
    { value: "gold2", label: "Gold 2", tier: 11 },
    { value: "gold3", label: "Gold 3", tier: 12 },
    { value: "platinum1", label: "Platinum 1", tier: 13 },
    { value: "platinum2", label: "Platinum 2", tier: 14 },
    { value: "platinum3", label: "Platinum 3", tier: 15 },
    { value: "diamond1", label: "Diamond 1", tier: 16 },
    { value: "diamond2", label: "Diamond 2", tier: 17 },
    { value: "diamond3", label: "Diamond 3", tier: 18 },
    { value: "ascendant1", label: "Ascendant 1", tier: 19 },
    { value: "ascendant2", label: "Ascendant 2", tier: 20 },
    { value: "ascendant3", label: "Ascendant 3", tier: 21 },
    { value: "immortal1", label: "Immortal 1", tier: 22 },
    { value: "immortal2", label: "Immortal 2", tier: 23 },
    { value: "immortal3", label: "Immortal 3", tier: 24 },
    { value: "radiant", label: "Radiant", tier: 25 },
  ],
  hasUnrankedOption: true,
  gameModes: [
    { value: "competitive", label: "Competitive" },
    { value: "unrated", label: "Unrated" },
    { value: "swiftplay", label: "Swiftplay" },
    { value: "spike_rush", label: "Spike Rush" },
    { value: "deathmatch", label: "Deathmatch" },
    { value: "escalation", label: "Escalation" },
    { value: "team_deathmatch", label: "Team Deathmatch" },
    { value: "premier", label: "Premier" },
  ],
  hasAgents: true,
  agentLabel: "Agent",
  agents: [
    // Duelists
    { value: "jett", label: "Jett", role: "duelist" },
    { value: "reyna", label: "Reyna", role: "duelist" },
    { value: "phoenix", label: "Phoenix", role: "duelist" },
    { value: "raze", label: "Raze", role: "duelist" },
    { value: "yoru", label: "Yoru", role: "duelist" },
    { value: "neon", label: "Neon", role: "duelist" },
    { value: "iso", label: "Iso", role: "duelist" },
    { value: "waylay", label: "Waylay", role: "duelist" },
    // Controllers
    { value: "omen", label: "Omen", role: "controller" },
    { value: "brimstone", label: "Brimstone", role: "controller" },
    { value: "astra", label: "Astra", role: "controller" },
    { value: "viper", label: "Viper", role: "controller" },
    { value: "harbor", label: "Harbor", role: "controller" },
    { value: "clove", label: "Clove", role: "controller" },
    // Initiators
    { value: "sova", label: "Sova", role: "initiator" },
    { value: "breach", label: "Breach", role: "initiator" },
    { value: "skye", label: "Skye", role: "initiator" },
    { value: "kayo", label: "KAY/O", role: "initiator" },
    { value: "fade", label: "Fade", role: "initiator" },
    { value: "gekko", label: "Gekko", role: "initiator" },
    { value: "tejo", label: "Tejo", role: "initiator" },
    // Sentinels
    { value: "sage", label: "Sage", role: "sentinel" },
    { value: "cypher", label: "Cypher", role: "sentinel" },
    { value: "killjoy", label: "Killjoy", role: "sentinel" },
    { value: "chamber", label: "Chamber", role: "sentinel" },
    { value: "deadlock", label: "Deadlock", role: "sentinel" },
    { value: "vyse", label: "Vyse", role: "sentinel" },
  ],
  defaultTeamSize: 5,
  teamSizeOptions: [2, 3, 4, 5],
};

// ============================================
// PUBG MOBILE
// ============================================
export const PUBG_MOBILE_CONFIG: GameConfig = {
  slug: "pubg-mobile",
  name: "PUBG Mobile",
  rankType: "tier",
  ranks: [
    { value: "bronze5", label: "Bronze V", tier: 1 },
    { value: "bronze4", label: "Bronze IV", tier: 2 },
    { value: "bronze3", label: "Bronze III", tier: 3 },
    { value: "bronze2", label: "Bronze II", tier: 4 },
    { value: "bronze1", label: "Bronze I", tier: 5 },
    { value: "silver5", label: "Silver V", tier: 6 },
    { value: "silver4", label: "Silver IV", tier: 7 },
    { value: "silver3", label: "Silver III", tier: 8 },
    { value: "silver2", label: "Silver II", tier: 9 },
    { value: "silver1", label: "Silver I", tier: 10 },
    { value: "gold5", label: "Gold V", tier: 11 },
    { value: "gold4", label: "Gold IV", tier: 12 },
    { value: "gold3", label: "Gold III", tier: 13 },
    { value: "gold2", label: "Gold II", tier: 14 },
    { value: "gold1", label: "Gold I", tier: 15 },
    { value: "platinum5", label: "Platinum V", tier: 16 },
    { value: "platinum4", label: "Platinum IV", tier: 17 },
    { value: "platinum3", label: "Platinum III", tier: 18 },
    { value: "platinum2", label: "Platinum II", tier: 19 },
    { value: "platinum1", label: "Platinum I", tier: 20 },
    { value: "diamond5", label: "Diamond V", tier: 21 },
    { value: "diamond4", label: "Diamond IV", tier: 22 },
    { value: "diamond3", label: "Diamond III", tier: 23 },
    { value: "diamond2", label: "Diamond II", tier: 24 },
    { value: "diamond1", label: "Diamond I", tier: 25 },
    { value: "master", label: "Master", tier: 26 },
  ],
  hasUnrankedOption: true,
  gameModes: [
    { value: "squad", label: "Squad", teamSize: 4 },
    { value: "duo", label: "Duo", teamSize: 2 },
    { value: "solo", label: "Solo", teamSize: 1 },
    { value: "ranked_squad", label: "Ranked Squad", teamSize: 4 },
    { value: "ranked_solo", label: "Ranked Solo", teamSize: 1 },
    { value: "arcade", label: "Arcade" },
  ],
  hasMaps: true,
  maps: [
    { value: "erangel", label: "Erangel" },
    { value: "miramar", label: "Miramar" },
    { value: "sanhok", label: "Sanhok" },
    { value: "vikendi", label: "Vikendi" },
    { value: "livik", label: "Livik" },
    { value: "nusa", label: "Nusa" },
    { value: "random", label: "Random" },
  ],
  hasPerspective: true,
  perspectives: [
    { value: "tpp", label: "TPP (Third Person)" },
    { value: "fpp", label: "FPP (First Person)" },
  ],
  defaultTeamSize: 4,
  teamSizeOptions: [1, 2, 4],
};

// ============================================
// CLASH OF CLANS
// ============================================
export const COC_CONFIG: GameConfig = {
  slug: "coc",
  name: "Clash of Clans",
  rankType: "tier",
  ranks: [
    { value: "bronze", label: "Bronze League", tier: 1 },
    { value: "silver", label: "Silver League", tier: 2 },
    { value: "gold", label: "Gold League", tier: 3 },
    { value: "crystal", label: "Crystal League", tier: 4 },
    { value: "master", label: "Master League", tier: 5 },
    { value: "champion", label: "Champion League", tier: 6 },
    { value: "titan", label: "Titan League", tier: 7 },
    { value: "legend", label: "Legend League", tier: 8 },
  ],
  hasUnrankedOption: true,
  gameModes: [
    { value: "clan_wars", label: "Clan Wars", teamSize: 50 },
    { value: "cwl", label: "Clan War Leagues", teamSize: 30 },
    { value: "friendly_wars", label: "Friendly Wars", teamSize: 50 },
    { value: "builder_base", label: "Builder Base", teamSize: 1 },
    { value: "clan_games", label: "Clan Games", teamSize: 50 },
    { value: "capital_raids", label: "Clan Capital Raids", teamSize: 50 },
    { value: "legend_league", label: "Legend League Attacks", teamSize: 1 },
  ],
  defaultTeamSize: 50,
  teamSizeOptions: [1, 5, 10, 15, 30, 50],
};

// ============================================
// COD MOBILE
// ============================================
export const COD_MOBILE_CONFIG: GameConfig = {
  slug: "cod-mobile",
  name: "COD Mobile",
  rankType: "tier",
  ranks: [
    { value: "rookie1", label: "Rookie I", tier: 1 },
    { value: "rookie2", label: "Rookie II", tier: 2 },
    { value: "rookie3", label: "Rookie III", tier: 3 },
    { value: "rookie4", label: "Rookie IV", tier: 4 },
    { value: "rookie5", label: "Rookie V", tier: 5 },
    { value: "veteran1", label: "Veteran I", tier: 6 },
    { value: "veteran2", label: "Veteran II", tier: 7 },
    { value: "veteran3", label: "Veteran III", tier: 8 },
    { value: "veteran4", label: "Veteran IV", tier: 9 },
    { value: "veteran5", label: "Veteran V", tier: 10 },
    { value: "elite1", label: "Elite I", tier: 11 },
    { value: "elite2", label: "Elite II", tier: 12 },
    { value: "elite3", label: "Elite III", tier: 13 },
    { value: "elite4", label: "Elite IV", tier: 14 },
    { value: "elite5", label: "Elite V", tier: 15 },
    { value: "pro1", label: "Pro I", tier: 16 },
    { value: "pro2", label: "Pro II", tier: 17 },
    { value: "pro3", label: "Pro III", tier: 18 },
    { value: "pro4", label: "Pro IV", tier: 19 },
    { value: "pro5", label: "Pro V", tier: 20 },
    { value: "master1", label: "Master I", tier: 21 },
    { value: "master2", label: "Master II", tier: 22 },
    { value: "master3", label: "Master III", tier: 23 },
    { value: "master4", label: "Master IV", tier: 24 },
    { value: "master5", label: "Master V", tier: 25 },
    { value: "grandmaster1", label: "Grandmaster I", tier: 26 },
    { value: "grandmaster2", label: "Grandmaster II", tier: 27 },
    { value: "grandmaster3", label: "Grandmaster III", tier: 28 },
    { value: "grandmaster4", label: "Grandmaster IV", tier: 29 },
    { value: "grandmaster5", label: "Grandmaster V", tier: 30 },
    { value: "legendary", label: "Legendary", tier: 31 },
  ],
  hasUnrankedOption: true,
  gameModes: [
    { value: "mp_ranked", label: "MP Ranked", teamSize: 5 },
    { value: "br_squad", label: "BR Squad", teamSize: 4 },
    { value: "br_duo", label: "BR Duo", teamSize: 2 },
    { value: "br_solo", label: "BR Solo", teamSize: 1 },
    { value: "mp_unranked", label: "MP Unranked", teamSize: 5 },
    { value: "snd", label: "Search & Destroy", teamSize: 5 },
    { value: "hardpoint", label: "Hardpoint", teamSize: 5 },
    { value: "domination", label: "Domination", teamSize: 5 },
  ],
  hasMaps: true,
  maps: [
    { value: "isolated", label: "Isolated" },
    { value: "blackout", label: "Blackout" },
    { value: "nuketown", label: "Nuketown" },
    { value: "crash", label: "Crash" },
    { value: "crossfire", label: "Crossfire" },
    { value: "firing_range", label: "Firing Range" },
    { value: "standoff", label: "Standoff" },
    { value: "summit", label: "Summit" },
  ],
  defaultTeamSize: 5,
  teamSizeOptions: [1, 2, 4, 5],
};

// ============================================
// FREE FIRE
// ============================================
export const FREEFIRE_CONFIG: GameConfig = {
  slug: "freefire",
  name: "Free Fire",
  rankType: "tier",
  ranks: [
    { value: "bronze3", label: "Bronze III", tier: 1 },
    { value: "bronze2", label: "Bronze II", tier: 2 },
    { value: "bronze1", label: "Bronze I", tier: 3 },
    { value: "silver3", label: "Silver III", tier: 4 },
    { value: "silver2", label: "Silver II", tier: 5 },
    { value: "silver1", label: "Silver I", tier: 6 },
    { value: "gold4", label: "Gold IV", tier: 7 },
    { value: "gold3", label: "Gold III", tier: 8 },
    { value: "gold2", label: "Gold II", tier: 9 },
    { value: "gold1", label: "Gold I", tier: 10 },
    { value: "platinum4", label: "Platinum IV", tier: 11 },
    { value: "platinum3", label: "Platinum III", tier: 12 },
    { value: "platinum2", label: "Platinum II", tier: 13 },
    { value: "platinum1", label: "Platinum I", tier: 14 },
    { value: "diamond4", label: "Diamond IV", tier: 15 },
    { value: "diamond3", label: "Diamond III", tier: 16 },
    { value: "diamond2", label: "Diamond II", tier: 17 },
    { value: "diamond1", label: "Diamond I", tier: 18 },
    { value: "heroic", label: "Heroic", tier: 19 },
    { value: "grandmaster", label: "Grandmaster", tier: 20 },
  ],
  hasUnrankedOption: true,
  gameModes: [
    { value: "battle_royale", label: "Battle Royale", teamSize: 4 },
    { value: "clash_squad", label: "Clash Squad", teamSize: 4 },
    { value: "ranked_br", label: "Ranked BR", teamSize: 4 },
    { value: "ranked_cs", label: "Ranked Clash Squad", teamSize: 4 },
    { value: "duo", label: "Duo", teamSize: 2 },
    { value: "solo", label: "Solo", teamSize: 1 },
    { value: "lone_wolf", label: "Lone Wolf", teamSize: 1 },
  ],
  hasMaps: true,
  maps: [
    { value: "bermuda", label: "Bermuda" },
    { value: "purgatory", label: "Purgatory" },
    { value: "kalahari", label: "Kalahari" },
    { value: "alpine", label: "Alpine" },
    { value: "nexterra", label: "Nexterra" },
  ],
  hasAgents: true,
  agentLabel: "Character",
  agents: [
    { value: "alok", label: "DJ Alok" },
    { value: "chrono", label: "Chrono" },
    { value: "k", label: "K" },
    { value: "skyler", label: "Skyler" },
    { value: "wukong", label: "Wukong" },
    { value: "clu", label: "Clu" },
    { value: "kelly", label: "Kelly" },
    { value: "andrew", label: "Andrew" },
    { value: "hayato", label: "Hayato" },
    { value: "moco", label: "Moco" },
    { value: "rafael", label: "Rafael" },
    { value: "laura", label: "Laura" },
    { value: "a124", label: "A124" },
    { value: "jota", label: "Jota" },
    { value: "xayne", label: "Xayne" },
    { value: "dimitri", label: "Dimitri" },
    { value: "orion", label: "Orion" },
    { value: "tatsuya", label: "Tatsuya" },
  ],
  defaultTeamSize: 4,
  teamSizeOptions: [1, 2, 4],
};

// ============================================
// CONFIG MAP
// ============================================
export const GAME_CONFIGS: Record<string, GameConfig> = {
  cs2: CS2_CONFIG,
  valorant: VALORANT_CONFIG,
  "pubg-mobile": PUBG_MOBILE_CONFIG,
  freefire: FREEFIRE_CONFIG,
  coc: COC_CONFIG,
  "cod-mobile": COD_MOBILE_CONFIG,
};

export function getGameConfig(slug: string): GameConfig | undefined {
  return GAME_CONFIGS[slug];
}

// Helper to get team size from game mode
export function getTeamSizeForMode(
  config: GameConfig,
  gameMode: string
): number {
  const mode = config.gameModes.find((m) => m.value === gameMode);
  return mode?.teamSize ?? config.defaultTeamSize;
}

// Helper to check if game uses numeric rating
export function usesNumericRating(config: GameConfig): boolean {
  return config.rankType === "numeric" || config.rankType === "mmr";
}

// Helper to get rank tier value for comparison
export function getRankTier(config: GameConfig, rankValue: string): number {
  const rank = config.ranks?.find((r) => r.value === rankValue);
  return rank?.tier ?? 0;
}
