import type { Database } from "./database";

// Database row types
export type RegionalCommunity = Database["public"]["Tables"]["regional_communities"]["Row"];
export type RegionalCommunityMember = Database["public"]["Tables"]["regional_community_members"]["Row"];
export type ChatTranslation = Database["public"]["Tables"]["chat_translations"]["Row"];
export type SchedulingPreference = Database["public"]["Tables"]["scheduling_preferences"]["Row"];
export type RegionalPricing = Database["public"]["Tables"]["regional_pricing"]["Row"];

// Supported languages (Indian scheduled languages + English)
export type SupportedLanguage =
  | "en"
  | "hi"
  | "bn"
  | "te"
  | "mr"
  | "ta"
  | "gu"
  | "ur"
  | "kn"
  | "or"
  | "ml"
  | "pa"
  | "as"
  | "mai"
  | "sa"
  | "sd"
  | "ks"
  | "ne"
  | "kok"
  | "doi"
  | "mni"
  | "sat"
  | "brx"
  | "other";

export const SUPPORTED_LANGUAGES: Record<string, {
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
}> = {
  en: { name: "English", nativeName: "English", flag: "🇮🇳", rtl: false },
  hi: { name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", rtl: false },
  bn: { name: "Bengali", nativeName: "বাংলা", flag: "🇮🇳", rtl: false },
  te: { name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳", rtl: false },
  mr: { name: "Marathi", nativeName: "मराठी", flag: "🇮🇳", rtl: false },
  ta: { name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳", rtl: false },
  gu: { name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳", rtl: false },
  ur: { name: "Urdu", nativeName: "اردو", flag: "🇮🇳", rtl: true },
  kn: { name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳", rtl: false },
  or: { name: "Odia", nativeName: "ଓଡ଼ିଆ", flag: "🇮🇳", rtl: false },
  ml: { name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳", rtl: false },
  pa: { name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳", rtl: false },
  as: { name: "Assamese", nativeName: "অসমীয়া", flag: "🇮🇳", rtl: false },
  mai: { name: "Maithili", nativeName: "मैथिली", flag: "🇮🇳", rtl: false },
  sa: { name: "Sanskrit", nativeName: "संस्कृतम्", flag: "🇮🇳", rtl: false },
  sd: { name: "Sindhi", nativeName: "سنڌي", flag: "🇮🇳", rtl: true },
  ks: { name: "Kashmiri", nativeName: "كٲشُر", flag: "🇮🇳", rtl: true },
  ne: { name: "Nepali", nativeName: "नेपाली", flag: "🇮🇳", rtl: false },
  kok: { name: "Konkani", nativeName: "कोंकणी", flag: "🇮🇳", rtl: false },
  doi: { name: "Dogri", nativeName: "डोगरी", flag: "🇮🇳", rtl: false },
  mni: { name: "Manipuri", nativeName: "মৈতৈলোন্", flag: "🇮🇳", rtl: false },
  sat: { name: "Santali", nativeName: "ᱥᱟᱱᱛᱟᱲᱤ", flag: "🇮🇳", rtl: false },
  brx: { name: "Bodo", nativeName: "बड़ो", flag: "🇮🇳", rtl: false },
  other: { name: "Other", nativeName: "Other", flag: "🇮🇳", rtl: false },
};

// Region type (Indian states/UTs + other/custom)
export type Region = string;

export const REGIONS: Record<string, {
  name: string;
  languages: string[];
  timezones: string[];
  currency: string;
  flag: string;
}> = {
  "andhra-pradesh": { name: "Andhra Pradesh", languages: ["te", "en", "ur"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "arunachal-pradesh": { name: "Arunachal Pradesh", languages: ["en", "hi"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "assam": { name: "Assam", languages: ["as", "en", "bn"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "bihar": { name: "Bihar", languages: ["hi", "en", "mai", "ur"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "chhattisgarh": { name: "Chhattisgarh", languages: ["hi", "en"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "goa": { name: "Goa", languages: ["kok", "en", "mr"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "gujarat": { name: "Gujarat", languages: ["gu", "en", "hi"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "haryana": { name: "Haryana", languages: ["hi", "en", "pa"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "himachal-pradesh": { name: "Himachal Pradesh", languages: ["hi", "en"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "jharkhand": { name: "Jharkhand", languages: ["hi", "en", "sat"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "karnataka": { name: "Karnataka", languages: ["kn", "en", "hi"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "kerala": { name: "Kerala", languages: ["ml", "en"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "madhya-pradesh": { name: "Madhya Pradesh", languages: ["hi", "en"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "maharashtra": { name: "Maharashtra", languages: ["mr", "en", "hi"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "manipur": { name: "Manipur", languages: ["mni", "en"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "meghalaya": { name: "Meghalaya", languages: ["en", "hi"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "mizoram": { name: "Mizoram", languages: ["en", "hi"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "nagaland": { name: "Nagaland", languages: ["en", "hi"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "odisha": { name: "Odisha", languages: ["or", "en", "hi"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "punjab": { name: "Punjab", languages: ["pa", "en", "hi"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "rajasthan": { name: "Rajasthan", languages: ["hi", "en"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "sikkim": { name: "Sikkim", languages: ["ne", "en", "hi"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "tamil-nadu": { name: "Tamil Nadu", languages: ["ta", "en"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "telangana": { name: "Telangana", languages: ["te", "en", "ur"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "tripura": { name: "Tripura", languages: ["bn", "en", "kok"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "uttar-pradesh": { name: "Uttar Pradesh", languages: ["hi", "en", "ur"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "uttarakhand": { name: "Uttarakhand", languages: ["hi", "en", "sa"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "west-bengal": { name: "West Bengal", languages: ["bn", "en", "hi"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "andaman-nicobar": { name: "Andaman & Nicobar Islands", languages: ["en", "hi"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "chandigarh": { name: "Chandigarh", languages: ["en", "hi", "pa"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "dadra-nagar-haveli": { name: "Dadra & Nagar Haveli and Daman & Diu", languages: ["gu", "en", "hi"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "delhi": { name: "Delhi", languages: ["hi", "en", "ur", "pa"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "jammu-kashmir": { name: "Jammu & Kashmir", languages: ["ks", "en", "hi", "ur", "doi"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "ladakh": { name: "Ladakh", languages: ["en", "hi"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "lakshadweep": { name: "Lakshadweep", languages: ["ml", "en"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "puducherry": { name: "Puducherry", languages: ["ta", "en", "te", "ml"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
  "other": { name: "Other", languages: ["en", "hi"], timezones: ["Asia/Kolkata"], currency: "INR", flag: "🇮🇳" },
};

// Pricing (India-only, INR)
export interface RegionalPrice {
  amount: number;
  currency: string;
  formatted: string;
}

const INR_PRICING = { multiplier: 0.3, currency: "INR", currencySymbol: "₹" };

export function getRegionalPricing(_region?: string) {
  return INR_PRICING;
}

// Keep REGIONAL_PRICING for backward compatibility
export const REGIONAL_PRICING: Record<string, {
  multiplier: number;
  currency: string;
  currencySymbol: string;
}> = new Proxy({} as Record<string, typeof INR_PRICING>, {
  get: () => INR_PRICING,
});

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
export function detectUserRegion(_timezone: string): Region {
  // India-only app: default to Delhi
  return "delhi";
}

export function formatPrice(amount: number, _region?: string): string {
  const adjustedAmount = amount * INR_PRICING.multiplier * 83; // Approximate USD to INR
  return `₹${adjustedAmount.toFixed(0)}`;
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
  _language: SupportedLanguage
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
