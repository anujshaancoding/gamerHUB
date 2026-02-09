// Anti-Toxic Verified Queue - Matchmake with verified positive players

export type VerificationStatus = "unverified" | "pending" | "verified" | "suspended";

export type BehaviorRating = "excellent" | "good" | "neutral" | "warning" | "poor";

export type ReportReason =
  | "toxicity"
  | "harassment"
  | "griefing"
  | "afk"
  | "cheating"
  | "smurfing"
  | "boosting"
  | "other";

// User's verification profile
export interface VerifiedProfile {
  id: string;
  user_id: string;
  status: VerificationStatus;
  behavior_score: number; // 0-100
  behavior_rating: BehaviorRating;

  // Verification requirements
  phone_verified: boolean;
  email_verified: boolean;
  platform_linked: boolean; // Linked to game platform
  playtime_hours: number;

  // Stats
  positive_endorsements: number;
  negative_reports: number;
  games_played: number;
  active_strikes: number;

  // Timestamps
  verified_at?: string;
  last_behavior_update: string;
  suspension_ends_at?: string;
  created_at: string;
}

// Player endorsement
export interface PlayerEndorsement {
  id: string;
  from_user_id: string;
  to_user_id: string;
  game_id: string;
  session_id?: string;
  type: EndorsementType;
  note?: string;
  created_at: string;
}

export type EndorsementType =
  | "good_teammate"
  | "great_communication"
  | "positive_attitude"
  | "skilled_player"
  | "helpful"
  | "fun_to_play_with";

// Player report
export interface PlayerReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  game_id: string;
  session_id?: string;
  reason: ReportReason;
  description?: string;
  evidence_urls?: string[];
  status: "pending" | "reviewed" | "actioned" | "dismissed";
  reviewed_by?: string;
  action_taken?: string;
  created_at: string;
  reviewed_at?: string;
}

// Verified queue entry
export interface QueueEntry {
  id: string;
  user_id: string;
  game_id: string;
  game_mode?: string;
  rank?: string;
  region: string;
  min_behavior_score: number;
  status: "searching" | "matched" | "cancelled";
  matched_with?: string[];
  created_at: string;
  matched_at?: string;
}

// Behavior score thresholds
export const BEHAVIOR_THRESHOLDS: Record<BehaviorRating, { min: number; max: number; color: string }> = {
  excellent: { min: 90, max: 100, color: "#22C55E" },
  good: { min: 75, max: 89, color: "#84CC16" },
  neutral: { min: 50, max: 74, color: "#F59E0B" },
  warning: { min: 25, max: 49, color: "#EF4444" },
  poor: { min: 0, max: 24, color: "#7F1D1D" },
};

// Endorsement info
export const ENDORSEMENT_TYPES: Record<
  EndorsementType,
  { name: string; emoji: string; description: string; points: number }
> = {
  good_teammate: {
    name: "Good Teammate",
    emoji: "🤝",
    description: "Plays well with the team",
    points: 2,
  },
  great_communication: {
    name: "Great Communication",
    emoji: "🎤",
    description: "Communicates effectively",
    points: 2,
  },
  positive_attitude: {
    name: "Positive Attitude",
    emoji: "😊",
    description: "Keeps team morale high",
    points: 3,
  },
  skilled_player: {
    name: "Skilled Player",
    emoji: "🎯",
    description: "High skill level",
    points: 1,
  },
  helpful: {
    name: "Helpful",
    emoji: "💡",
    description: "Helps teammates improve",
    points: 2,
  },
  fun_to_play_with: {
    name: "Fun to Play With",
    emoji: "🎮",
    description: "Makes games enjoyable",
    points: 2,
  },
};

// Report severity
export const REPORT_SEVERITY: Record<ReportReason, { name: string; severity: number; points: number }> = {
  toxicity: { name: "Toxic Behavior", severity: 2, points: -5 },
  harassment: { name: "Harassment", severity: 3, points: -10 },
  griefing: { name: "Griefing", severity: 2, points: -5 },
  afk: { name: "AFK/Leaving", severity: 1, points: -3 },
  cheating: { name: "Cheating", severity: 4, points: -25 },
  smurfing: { name: "Smurfing", severity: 2, points: -5 },
  boosting: { name: "Boosting", severity: 2, points: -5 },
  other: { name: "Other", severity: 1, points: -2 },
};

// API types
export interface EndorsePlayerRequest {
  user_id: string;
  game_id: string;
  session_id?: string;
  type: EndorsementType;
  note?: string;
}

export interface ReportPlayerRequest {
  user_id: string;
  game_id: string;
  session_id?: string;
  reason: ReportReason;
  description?: string;
  evidence_urls?: string[];
}

export interface JoinQueueRequest {
  game_id: string;
  game_mode?: string;
  rank?: string;
  region: string;
  min_behavior_score?: number;
}

// Helper functions
export function getBehaviorRating(score: number): BehaviorRating {
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 50) return "neutral";
  if (score >= 25) return "warning";
  return "poor";
}

export function getBehaviorColor(rating: BehaviorRating): string {
  return BEHAVIOR_THRESHOLDS[rating].color;
}

export function getVerificationProgress(profile: VerifiedProfile): number {
  let progress = 0;
  if (profile.email_verified) progress += 25;
  if (profile.phone_verified) progress += 25;
  if (profile.platform_linked) progress += 25;
  if (profile.playtime_hours >= 10) progress += 25;
  return progress;
}

export function canAccessVerifiedQueue(profile: VerifiedProfile): boolean {
  return (
    profile.status === "verified" &&
    profile.behavior_score >= 50 &&
    profile.active_strikes === 0
  );
}

export function formatBehaviorScore(score: number): string {
  const rating = getBehaviorRating(score);
  return `${score} (${rating.charAt(0).toUpperCase() + rating.slice(1)})`;
}

// Calculate new score after endorsement/report
export function calculateNewScore(
  currentScore: number,
  pointChange: number,
  totalInteractions: number
): number {
  // Weight decreases as total interactions increase (harder to change established scores)
  const weight = Math.max(0.1, 1 - totalInteractions / 1000);
  const newScore = currentScore + pointChange * weight;
  return Math.max(0, Math.min(100, Math.round(newScore)));
}
