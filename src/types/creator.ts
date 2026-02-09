import type { Database } from "./database";

// Database row types
export type CreatorProfile = Database["public"]["Tables"]["creator_profiles"]["Row"];
export type StreamerOverlay = Database["public"]["Tables"]["streamer_overlays"]["Row"];
export type CreatorAnalytics = Database["public"]["Tables"]["creator_analytics"]["Row"];
export type CreatorClip = Database["public"]["Tables"]["creator_clips"]["Row"];
export type SponsorshipOpportunity = Database["public"]["Tables"]["sponsorship_opportunities"]["Row"];
export type SponsorshipApplication = Database["public"]["Tables"]["sponsorship_applications"]["Row"];

// Creator tier levels
export type CreatorTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export const CREATOR_TIERS: Record<CreatorTier, {
  name: string;
  minFollowers: number;
  color: string;
  benefits: string[];
}> = {
  bronze: {
    name: "Bronze Creator",
    minFollowers: 0,
    color: "#CD7F32",
    benefits: [
      "Creator badge on profile",
      "Basic analytics dashboard",
      "1 custom overlay",
    ],
  },
  silver: {
    name: "Silver Creator",
    minFollowers: 100,
    color: "#C0C0C0",
    benefits: [
      "All Bronze benefits",
      "Priority LFG visibility",
      "3 custom overlays",
      "Basic clip editing tools",
    ],
  },
  gold: {
    name: "Gold Creator",
    minFollowers: 500,
    color: "#FFD700",
    benefits: [
      "All Silver benefits",
      "Featured on creator page",
      "10 custom overlays",
      "Advanced analytics",
      "Sponsorship access",
    ],
  },
  platinum: {
    name: "Platinum Creator",
    minFollowers: 2500,
    color: "#E5E4E2",
    benefits: [
      "All Gold benefits",
      "Verified creator badge",
      "Unlimited overlays",
      "Priority sponsorships",
      "Custom creator URL",
    ],
  },
  diamond: {
    name: "Diamond Creator",
    minFollowers: 10000,
    color: "#B9F2FF",
    benefits: [
      "All Platinum benefits",
      "Direct platform support",
      "Revenue share program",
      "Early feature access",
      "Custom integrations",
    ],
  },
};

// Overlay types
export type OverlayType = "lfg_status" | "stats" | "social" | "schedule" | "alerts" | "custom";

export const OVERLAY_TYPES: Record<OverlayType, {
  name: string;
  description: string;
  defaultSize: { width: number; height: number };
}> = {
  lfg_status: {
    name: "LFG Status",
    description: "Show your current LFG status and availability",
    defaultSize: { width: 400, height: 100 },
  },
  stats: {
    name: "Game Stats",
    description: "Display your game statistics and rank",
    defaultSize: { width: 300, height: 200 },
  },
  social: {
    name: "Social Links",
    description: "Show your social media and platform links",
    defaultSize: { width: 250, height: 150 },
  },
  schedule: {
    name: "Stream Schedule",
    description: "Display your streaming schedule",
    defaultSize: { width: 350, height: 250 },
  },
  alerts: {
    name: "Activity Alerts",
    description: "Show alerts for new followers, messages, etc.",
    defaultSize: { width: 400, height: 100 },
  },
  custom: {
    name: "Custom Overlay",
    description: "Create a fully customized overlay",
    defaultSize: { width: 400, height: 200 },
  },
};

// Overlay configuration
export interface OverlayConfig {
  type: OverlayType;
  theme: "dark" | "light" | "transparent" | "custom";
  position: { x: number; y: number };
  size: { width: number; height: number };
  opacity: number;
  borderRadius: number;
  showBackground: boolean;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  fontFamily?: string;
  fontSize?: number;
  animation?: "none" | "fade" | "slide" | "bounce";
  customCSS?: string;
  // Type-specific config
  lfgConfig?: {
    showGame: boolean;
    showRank: boolean;
    showAvailability: boolean;
  };
  statsConfig?: {
    games: string[];
    showRank: boolean;
    showWinRate: boolean;
    showKD: boolean;
  };
  socialConfig?: {
    platforms: string[];
    showIcons: boolean;
    layout: "horizontal" | "vertical" | "grid";
  };
  scheduleConfig?: {
    showDays: number;
    timezone: string;
    format: "12h" | "24h";
  };
  alertConfig?: {
    types: ("follower" | "message" | "lfg_join")[];
    duration: number;
    sound: boolean;
  };
}

// Analytics time ranges
export type AnalyticsTimeRange = "7d" | "30d" | "90d" | "1y" | "all";

// Analytics data structures
export interface AnalyticsSummary {
  totalViews: number;
  totalFollowers: number;
  totalClips: number;
  totalLikes: number;
  viewsTrend: number; // percentage change
  followersTrend: number;
  engagementRate: number;
}

export interface AnalyticsChartData {
  date: string;
  views: number;
  followers: number;
  engagements: number;
}

export interface TopContent {
  id: string;
  title: string;
  type: "clip" | "post" | "lfg";
  views: number;
  likes: number;
  thumbnail?: string;
}

export interface AudienceInsight {
  metric: string;
  breakdown: { label: string; value: number; percentage: number }[];
}

// Clip editing
export interface ClipEdit {
  startTime: number;
  endTime: number;
  title: string;
  description?: string;
  tags: string[];
  visibility: "public" | "unlisted" | "private";
  thumbnail?: string;
  overlayText?: {
    text: string;
    position: "top" | "bottom" | "center";
    style: "default" | "bold" | "gaming";
  };
}

// Sponsorship types
export type SponsorshipCategory =
  | "gaming_gear"
  | "energy_drinks"
  | "software"
  | "peripherals"
  | "apparel"
  | "food_beverage"
  | "streaming"
  | "other";

export const SPONSORSHIP_CATEGORIES: Record<SponsorshipCategory, {
  name: string;
  icon: string;
}> = {
  gaming_gear: { name: "Gaming Gear", icon: "gamepad-2" },
  energy_drinks: { name: "Energy Drinks", icon: "zap" },
  software: { name: "Software", icon: "code" },
  peripherals: { name: "Peripherals", icon: "mouse" },
  apparel: { name: "Apparel", icon: "shirt" },
  food_beverage: { name: "Food & Beverage", icon: "coffee" },
  streaming: { name: "Streaming", icon: "video" },
  other: { name: "Other", icon: "package" },
};

export type SponsorshipStatus = "open" | "reviewing" | "closed";
export type ApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export interface SponsorshipRequirements {
  minFollowers: number;
  minEngagementRate?: number;
  requiredGames?: string[];
  requiredPlatforms?: string[];
  regionRestrictions?: string[];
  creatorTierRequired?: CreatorTier;
}

export interface SponsorshipBenefits {
  compensation?: string;
  products?: string[];
  exclusiveAccess?: string[];
  discountCode?: string;
  affiliatePercentage?: number;
}

// API request/response types
export interface CreateCreatorProfileRequest {
  display_name: string;
  bio?: string;
  streaming_platforms?: string[];
  social_links?: Record<string, string>;
  games?: string[];
}

export interface UpdateCreatorProfileRequest {
  display_name?: string;
  bio?: string;
  banner_url?: string;
  streaming_platforms?: string[];
  social_links?: Record<string, string>;
  games?: string[];
  custom_url?: string;
}

export interface CreateOverlayRequest {
  name: string;
  type: OverlayType;
  config: OverlayConfig;
}

export interface UpdateOverlayRequest {
  name?: string;
  config?: Partial<OverlayConfig>;
  is_active?: boolean;
}

export interface CreateClipRequest {
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration: number;
  game_id?: string;
  tags?: string[];
  visibility?: "public" | "unlisted" | "private";
}

export interface ApplySponsorshipRequest {
  pitch: string;
  portfolio_urls?: string[];
  expected_deliverables?: string;
  additional_info?: string;
}

// Creator profile with expanded data
export interface CreatorProfileWithStats extends CreatorProfile {
  follower_count: number;
  total_views: number;
  total_clips: number;
  recent_clips?: CreatorClip[];
  active_sponsorships?: number;
}

// Sponsorship with brand info
export interface SponsorshipWithBrand extends SponsorshipOpportunity {
  brand_name: string;
  brand_logo?: string;
  application_count?: number;
  user_applied?: boolean;
}

// Helper functions
export function getCreatorTier(followerCount: number): CreatorTier {
  if (followerCount >= 10000) return "diamond";
  if (followerCount >= 2500) return "platinum";
  if (followerCount >= 500) return "gold";
  if (followerCount >= 100) return "silver";
  return "bronze";
}

export function canAccessFeature(
  tier: CreatorTier,
  feature: "sponsorships" | "unlimited_overlays" | "advanced_analytics" | "custom_url"
): boolean {
  const tierOrder: CreatorTier[] = ["bronze", "silver", "gold", "platinum", "diamond"];
  const tierIndex = tierOrder.indexOf(tier);

  const featureRequirements: Record<string, CreatorTier> = {
    sponsorships: "gold",
    unlimited_overlays: "platinum",
    advanced_analytics: "gold",
    custom_url: "platinum",
  };

  const requiredTier = featureRequirements[feature];
  const requiredIndex = tierOrder.indexOf(requiredTier);

  return tierIndex >= requiredIndex;
}

export function getMaxOverlays(tier: CreatorTier): number {
  const limits: Record<CreatorTier, number> = {
    bronze: 1,
    silver: 3,
    gold: 10,
    platinum: Infinity,
    diamond: Infinity,
  };
  return limits[tier];
}
