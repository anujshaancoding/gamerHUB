export const SUPPORTED_GAMES = [
  {
    slug: "valorant",
    name: "Valorant",
    iconUrl: "/images/games/valorant.png",
    hasApi: true,
    ranks: [
      "Iron 1", "Iron 2", "Iron 3",
      "Bronze 1", "Bronze 2", "Bronze 3",
      "Silver 1", "Silver 2", "Silver 3",
      "Gold 1", "Gold 2", "Gold 3",
      "Platinum 1", "Platinum 2", "Platinum 3",
      "Diamond 1", "Diamond 2", "Diamond 3",
      "Ascendant 1", "Ascendant 2", "Ascendant 3",
      "Immortal 1", "Immortal 2", "Immortal 3",
      "Radiant"
    ],
    roles: ["Duelist", "Controller", "Initiator", "Sentinel"]
  },
  {
    slug: "cs2",
    name: "Counter-Strike 2",
    iconUrl: "/images/games/cs2.png",
    hasApi: true,
    ranks: [
      "Silver I", "Silver II", "Silver III", "Silver IV",
      "Silver Elite", "Silver Elite Master",
      "Gold Nova I", "Gold Nova II", "Gold Nova III", "Gold Nova Master",
      "Master Guardian I", "Master Guardian II",
      "Master Guardian Elite", "Distinguished Master Guardian",
      "Legendary Eagle", "Legendary Eagle Master",
      "Supreme Master First Class", "Global Elite"
    ],
    roles: ["Entry Fragger", "AWPer", "Support", "Lurker", "IGL"]
  },
  {
    slug: "pubg-mobile",
    name: "PUBG Mobile",
    iconUrl: "/images/games/pubg-mobile.png",
    hasApi: false,
    ranks: [
      "Bronze V-I", "Silver V-I", "Gold V-I",
      "Platinum V-I", "Diamond V-I",
      "Crown V-I", "Ace", "Ace Master",
      "Ace Dominator", "Conqueror"
    ],
    roles: ["Fragger", "Support", "Scout", "IGL"]
  },
  {
    slug: "freefire",
    name: "Free Fire",
    iconUrl: "/images/games/freefire.png",
    hasApi: false,
    ranks: [
      "Bronze I-III", "Silver I-III", "Gold I-IV",
      "Platinum I-IV", "Diamond I-IV",
      "Heroic", "Grandmaster"
    ],
    roles: ["Rusher", "Support", "Sniper", "Defuser"]
  },
  {
    slug: "coc",
    name: "Clash of Clans",
    iconUrl: "/images/games/coc.png",
    hasApi: true,
    ranks: [
      "Bronze League", "Silver League", "Gold League",
      "Crystal League", "Master League",
      "Champion League", "Titan League", "Legend League"
    ],
    roles: ["War Specialist", "Donator", "Clan Leader", "Base Builder"]
  },
  {
    slug: "cod-mobile",
    name: "COD Mobile",
    iconUrl: "/images/games/cod-mobile.png",
    hasApi: false,
    ranks: [
      "Rookie I-V", "Veteran I-V", "Elite I-V",
      "Pro I-V", "Master I-V",
      "Grandmaster I-V", "Legendary"
    ],
    roles: ["Slayer", "OBJ", "Anchor", "Support"]
  },
  {
    slug: "other",
    name: "Other",
    iconUrl: "/images/games/other.png",
    hasApi: false,
    ranks: [],
    roles: []
  }
] as const;

export const REGIONS = [
  { value: "na", label: "North America" },
  { value: "eu", label: "Europe" },
  { value: "asia", label: "Asia" },
  { value: "oce", label: "Oceania" },
  { value: "sa", label: "South America" },
  { value: "mena", label: "Middle East & North Africa" },
  { value: "sea", label: "Southeast Asia" },
] as const;

export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "pt", label: "Portuguese" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ru", label: "Russian" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "ar", label: "Arabic" },
  { value: "hi", label: "Hindi" },
] as const;

export const GAMING_STYLES = [
  { value: "casual", label: "Casual", description: "Play for fun, no pressure" },
  { value: "competitive", label: "Competitive", description: "Ranked grinder, always improving" },
  { value: "pro", label: "Professional", description: "Tournament player or aspiring pro" },
] as const;

export const PLAYTIMES = [
  { value: "morning", label: "Morning (6AM - 12PM)" },
  { value: "afternoon", label: "Afternoon (12PM - 6PM)" },
  { value: "evening", label: "Evening (6PM - 12AM)" },
  { value: "night", label: "Night (12AM - 6AM)" },
  { value: "flexible", label: "Flexible" },
] as const;
