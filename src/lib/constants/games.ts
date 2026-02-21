export const SUPPORTED_GAMES = [
  {
    slug: "valorant",
    name: "Valorant",
    iconUrl: "/images/games/valorant.svg",
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
    slug: "bgmi",
    name: "BGMI",
    iconUrl: "/images/games/bgmi.svg",
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
    iconUrl: "/images/games/freefire.svg",
    hasApi: false,
    ranks: [
      "Bronze I-III", "Silver I-III", "Gold I-IV",
      "Platinum I-IV", "Diamond I-IV",
      "Heroic", "Grandmaster"
    ],
    roles: ["Rusher", "Support", "Sniper", "Defuser"]
  },
  {
    slug: "other",
    name: "Other",
    iconUrl: "/images/games/other.svg",
    hasApi: false,
    ranks: [],
    roles: []
  }
] as const;

export const REGIONS = [
  // Indian States
  { value: "andhra-pradesh", label: "Andhra Pradesh" },
  { value: "arunachal-pradesh", label: "Arunachal Pradesh" },
  { value: "assam", label: "Assam" },
  { value: "bihar", label: "Bihar" },
  { value: "chhattisgarh", label: "Chhattisgarh" },
  { value: "goa", label: "Goa" },
  { value: "gujarat", label: "Gujarat" },
  { value: "haryana", label: "Haryana" },
  { value: "himachal-pradesh", label: "Himachal Pradesh" },
  { value: "jharkhand", label: "Jharkhand" },
  { value: "karnataka", label: "Karnataka" },
  { value: "kerala", label: "Kerala" },
  { value: "madhya-pradesh", label: "Madhya Pradesh" },
  { value: "maharashtra", label: "Maharashtra" },
  { value: "manipur", label: "Manipur" },
  { value: "meghalaya", label: "Meghalaya" },
  { value: "mizoram", label: "Mizoram" },
  { value: "nagaland", label: "Nagaland" },
  { value: "odisha", label: "Odisha" },
  { value: "punjab", label: "Punjab" },
  { value: "rajasthan", label: "Rajasthan" },
  { value: "sikkim", label: "Sikkim" },
  { value: "tamil-nadu", label: "Tamil Nadu" },
  { value: "telangana", label: "Telangana" },
  { value: "tripura", label: "Tripura" },
  { value: "uttar-pradesh", label: "Uttar Pradesh" },
  { value: "uttarakhand", label: "Uttarakhand" },
  { value: "west-bengal", label: "West Bengal" },
  // Union Territories
  { value: "andaman-nicobar", label: "Andaman & Nicobar Islands" },
  { value: "chandigarh", label: "Chandigarh" },
  { value: "dadra-nagar-haveli", label: "Dadra & Nagar Haveli and Daman & Diu" },
  { value: "delhi", label: "Delhi" },
  { value: "jammu-kashmir", label: "Jammu & Kashmir" },
  { value: "ladakh", label: "Ladakh" },
  { value: "lakshadweep", label: "Lakshadweep" },
  { value: "puducherry", label: "Puducherry" },
  // Other
  { value: "other", label: "Other" },
] as const;

export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "bn", label: "Bengali" },
  { value: "te", label: "Telugu" },
  { value: "mr", label: "Marathi" },
  { value: "ta", label: "Tamil" },
  { value: "gu", label: "Gujarati" },
  { value: "ur", label: "Urdu" },
  { value: "kn", label: "Kannada" },
  { value: "or", label: "Odia" },
  { value: "ml", label: "Malayalam" },
  { value: "pa", label: "Punjabi" },
  { value: "as", label: "Assamese" },
  { value: "mai", label: "Maithili" },
  { value: "sa", label: "Sanskrit" },
  { value: "sd", label: "Sindhi" },
  { value: "ks", label: "Kashmiri" },
  { value: "ne", label: "Nepali" },
  { value: "kok", label: "Konkani" },
  { value: "doi", label: "Dogri" },
  { value: "mni", label: "Manipuri" },
  { value: "sat", label: "Santali" },
  { value: "brx", label: "Bodo" },
  { value: "other", label: "Other" },
] as const;

export function getRegionLabel(value: string): string {
  return REGIONS.find((r) => r.value === value)?.label || value;
}

export function getLanguageLabel(value: string): string {
  return LANGUAGES.find((l) => l.value === value)?.label || value;
}

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
