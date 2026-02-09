import type { Database } from "./database";

// Database row types
export type RegionalCommunity = Database["public"]["Tables"]["regional_communities"]["Row"];
export type RegionalCommunityMember = Database["public"]["Tables"]["regional_community_members"]["Row"];
export type ChatTranslation = Database["public"]["Tables"]["chat_translations"]["Row"];
export type SchedulingPreference = Database["public"]["Tables"]["scheduling_preferences"]["Row"];
export type RegionalPricing = Database["public"]["Tables"]["regional_pricing"]["Row"];

// Supported languages
export type SupportedLanguage =
  | "en"
  | "es"
  | "pt"
  | "fr"
  | "de"
  | "it"
  | "ru"
  | "zh"
  | "ja"
  | "ko"
  | "ar"
  | "hi"
  | "tr"
  | "pl"
  | "nl"
  | "th"
  | "vi"
  | "id";

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, {
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
}> = {
  en: { name: "English", nativeName: "English", flag: "🇺🇸", rtl: false },
  es: { name: "Spanish", nativeName: "Español", flag: "🇪🇸", rtl: false },
  pt: { name: "Portuguese", nativeName: "Português", flag: "🇧🇷", rtl: false },
  fr: { name: "French", nativeName: "Français", flag: "🇫🇷", rtl: false },
  de: { name: "German", nativeName: "Deutsch", flag: "🇩🇪", rtl: false },
  it: { name: "Italian", nativeName: "Italiano", flag: "🇮🇹", rtl: false },
  ru: { name: "Russian", nativeName: "Русский", flag: "🇷🇺", rtl: false },
  zh: { name: "Chinese", nativeName: "中文", flag: "🇨🇳", rtl: false },
  ja: { name: "Japanese", nativeName: "日本語", flag: "🇯🇵", rtl: false },
  ko: { name: "Korean", nativeName: "한국어", flag: "🇰🇷", rtl: false },
  ar: { name: "Arabic", nativeName: "العربية", flag: "🇸🇦", rtl: true },
  hi: { name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", rtl: false },
  tr: { name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷", rtl: false },
  pl: { name: "Polish", nativeName: "Polski", flag: "🇵🇱", rtl: false },
  nl: { name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱", rtl: false },
  th: { name: "Thai", nativeName: "ไทย", flag: "🇹🇭", rtl: false },
  vi: { name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳", rtl: false },
  id: { name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩", rtl: false },
};

// Regions
export type Region =
  | "na"      // North America
  | "eu"      // Europe
  | "latam"   // Latin America
  | "br"      // Brazil
  | "sea"     // Southeast Asia
  | "oce"     // Oceania
  | "mena"    // Middle East & North Africa
  | "sa"      // South Asia
  | "ea"      // East Asia
  | "cis";    // CIS/Russia

export const REGIONS: Record<Region, {
  name: string;
  languages: SupportedLanguage[];
  timezones: string[];
  currency: string;
  flag: string;
}> = {
  na: {
    name: "North America",
    languages: ["en", "es", "fr"],
    timezones: ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles"],
    currency: "USD",
    flag: "🌎",
  },
  eu: {
    name: "Europe",
    languages: ["en", "de", "fr", "es", "it", "pl", "nl"],
    timezones: ["Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Warsaw"],
    currency: "EUR",
    flag: "🇪🇺",
  },
  latam: {
    name: "Latin America",
    languages: ["es", "pt"],
    timezones: ["America/Mexico_City", "America/Bogota", "America/Lima", "America/Santiago"],
    currency: "USD",
    flag: "🌎",
  },
  br: {
    name: "Brazil",
    languages: ["pt"],
    timezones: ["America/Sao_Paulo", "America/Manaus"],
    currency: "BRL",
    flag: "🇧🇷",
  },
  sea: {
    name: "Southeast Asia",
    languages: ["en", "th", "vi", "id"],
    timezones: ["Asia/Singapore", "Asia/Bangkok", "Asia/Ho_Chi_Minh", "Asia/Jakarta"],
    currency: "USD",
    flag: "🌏",
  },
  oce: {
    name: "Oceania",
    languages: ["en"],
    timezones: ["Australia/Sydney", "Australia/Melbourne", "Pacific/Auckland"],
    currency: "AUD",
    flag: "🇦🇺",
  },
  mena: {
    name: "Middle East & North Africa",
    languages: ["ar", "en", "tr"],
    timezones: ["Asia/Dubai", "Asia/Riyadh", "Africa/Cairo", "Asia/Istanbul"],
    currency: "USD",
    flag: "🌍",
  },
  sa: {
    name: "South Asia",
    languages: ["en", "hi"],
    timezones: ["Asia/Kolkata", "Asia/Karachi", "Asia/Dhaka"],
    currency: "INR",
    flag: "🇮🇳",
  },
  ea: {
    name: "East Asia",
    languages: ["zh", "ja", "ko"],
    timezones: ["Asia/Shanghai", "Asia/Tokyo", "Asia/Seoul"],
    currency: "USD",
    flag: "🌏",
  },
  cis: {
    name: "CIS / Russia",
    languages: ["ru"],
    timezones: ["Europe/Moscow", "Asia/Novosibirsk", "Asia/Vladivostok"],
    currency: "RUB",
    flag: "🇷🇺",
  },
};

// Pricing tiers by region
export interface RegionalPrice {
  amount: number;
  currency: string;
  formatted: string;
}

export const REGIONAL_PRICING: Record<Region, {
  multiplier: number;
  currency: string;
  currencySymbol: string;
}> = {
  na: { multiplier: 1.0, currency: "USD", currencySymbol: "$" },
  eu: { multiplier: 0.92, currency: "EUR", currencySymbol: "€" },
  latam: { multiplier: 0.6, currency: "USD", currencySymbol: "$" },
  br: { multiplier: 0.4, currency: "BRL", currencySymbol: "R$" },
  sea: { multiplier: 0.5, currency: "USD", currencySymbol: "$" },
  oce: { multiplier: 1.1, currency: "AUD", currencySymbol: "A$" },
  mena: { multiplier: 0.7, currency: "USD", currencySymbol: "$" },
  sa: { multiplier: 0.3, currency: "INR", currencySymbol: "₹" },
  ea: { multiplier: 0.8, currency: "USD", currencySymbol: "$" },
  cis: { multiplier: 0.35, currency: "RUB", currencySymbol: "₽" },
};

// Time format preferences
export type TimeFormat = "12h" | "24h";
export type DateFormat = "mdy" | "dmy" | "ymd";

export interface LocalePreferences {
  language: SupportedLanguage;
  region: Region;
  timezone: string;
  timeFormat: TimeFormat;
  dateFormat: DateFormat;
}

// Translation request/response
export interface TranslateRequest {
  text: string;
  sourceLanguage?: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  context?: "chat" | "post" | "guide" | "general";
}

export interface TranslateResponse {
  originalText: string;
  translatedText: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  confidence: number;
}

// Regional community types
export interface RegionalCommunityWithStats extends RegionalCommunity {
  member_count: number;
  online_count: number;
  is_member: boolean;
}

// Scheduling types
export interface ScheduleSlot {
  dayOfWeek: number; // 0-6, Sunday = 0
  startHour: number; // 0-23
  endHour: number;   // 0-23
  timezone: string;
}

export interface SchedulingPreferenceInput {
  available_times: ScheduleSlot[];
  preferred_regions: Region[];
  language_preferences: SupportedLanguage[];
  cross_region_matching: boolean;
}

// API request types
export interface UpdateLocalePreferencesRequest {
  language?: SupportedLanguage;
  region?: Region;
  timezone?: string;
  time_format?: TimeFormat;
  date_format?: DateFormat;
}

export interface JoinRegionalCommunityRequest {
  region_code: string;
  language?: SupportedLanguage;
}

// Helper functions
export function detectUserRegion(timezone: string): Region {
  const tzToRegion: Record<string, Region> = {
    "America/New_York": "na",
    "America/Chicago": "na",
    "America/Denver": "na",
    "America/Los_Angeles": "na",
    "Europe/London": "eu",
    "Europe/Paris": "eu",
    "Europe/Berlin": "eu",
    "Europe/Warsaw": "eu",
    "America/Mexico_City": "latam",
    "America/Bogota": "latam",
    "America/Lima": "latam",
    "America/Sao_Paulo": "br",
    "Asia/Singapore": "sea",
    "Asia/Bangkok": "sea",
    "Asia/Jakarta": "sea",
    "Australia/Sydney": "oce",
    "Pacific/Auckland": "oce",
    "Asia/Dubai": "mena",
    "Asia/Riyadh": "mena",
    "Asia/Istanbul": "mena",
    "Asia/Kolkata": "sa",
    "Asia/Shanghai": "ea",
    "Asia/Tokyo": "ea",
    "Asia/Seoul": "ea",
    "Europe/Moscow": "cis",
  };

  return tzToRegion[timezone] || "na";
}

export function formatPrice(amount: number, region: Region): string {
  const pricing = REGIONAL_PRICING[region];
  const adjustedAmount = amount * pricing.multiplier;

  // Convert to local currency if needed
  let finalAmount = adjustedAmount;
  if (pricing.currency === "BRL") {
    finalAmount = adjustedAmount * 5; // Approximate BRL conversion
  } else if (pricing.currency === "INR") {
    finalAmount = adjustedAmount * 83; // Approximate INR conversion
  } else if (pricing.currency === "RUB") {
    finalAmount = adjustedAmount * 90; // Approximate RUB conversion
  } else if (pricing.currency === "AUD") {
    finalAmount = adjustedAmount * 1.5; // Approximate AUD conversion
  }

  return `${pricing.currencySymbol}${finalAmount.toFixed(2)}`;
}

export function getTimezoneOffset(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find(p => p.type === "timeZoneName");
    return offsetPart?.value || "";
  } catch {
    return "";
  }
}

export function formatTimeForTimezone(date: Date, timezone: string, format: TimeFormat): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: format === "12h",
  }).format(date);
}

export function formatDateForLocale(
  date: Date,
  timezone: string,
  dateFormat: DateFormat,
  language: SupportedLanguage
): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  // Map our date format to locale
  const localeMap: Record<DateFormat, string> = {
    mdy: "en-US",
    dmy: "en-GB",
    ymd: "en-CA",
  };

  return new Intl.DateTimeFormat(localeMap[dateFormat], options).format(date);
}
