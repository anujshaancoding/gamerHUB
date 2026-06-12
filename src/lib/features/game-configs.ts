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
  rankType: "numeric" | "tier" | "mmr"; // tier = Valorant rank tiers
  ranks?: RankOption[];
  ratingRange?: { min: number; max: number; step?: number };
  ratingLabel?: string; // e.g., "Premier Rating", "MMR", "RP"
  // Game modes
  gameModes: GameModeOption[];
  // Agents/Characters/Legends (optional)
  hasAgents?: boolean;
  agentLabel?: string; // "Agent", "Legend", "Champion", "Character"
  agents?: AgentOption[];
  // Maps (optional)
  hasMaps?: boolean;
  maps?: MapOption[];
  // Perspective (optional)
  hasPerspective?: boolean;
  perspectives?: { value: string; label: string }[];
  // Team sizes
  defaultTeamSize: number;
  teamSizeOptions: number[];
  // Additional options
  hasUnrankedOption?: boolean;
}

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
// CONFIG MAP
// ============================================
export const GAME_CONFIGS: Record<string, GameConfig> = {
  valorant: VALORANT_CONFIG,
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
