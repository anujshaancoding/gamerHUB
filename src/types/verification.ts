// Verification and Anti-Bot Types

export type VerificationLevel = 0 | 1 | 2 | 3 | 4;
// 0 = none, 1 = email, 2 = phone, 3 = game, 4 = full

export type ReportType =
  | "bot"
  | "fake_account"
  | "harassment"
  | "spam"
  | "toxic"
  | "cheating"
  | "impersonation"
  | "other";

export type ReportStatus =
  | "pending"
  | "investigating"
  | "resolved"
  | "dismissed"
  | "escalated";

export type ReportPriority = "low" | "normal" | "high" | "critical";

export type BadgeType =
  | "phone_verified"
  | "email_verified"
  | "game_verified"
  | "streamer"
  | "pro_player"
  | "content_creator"
  | "tournament_winner"
  | "early_adopter"
  | "premium_member";

export type SignalType =
  | "rapid_messages"
  | "profile_view_pattern"
  | "lfg_spam"
  | "suspicious_login"
  | "mass_follow"
  | "unusual_activity"
  | "multiple_accounts";

// ============================================
// Phone Verification
// ============================================
export interface PhoneVerification {
  id: string;
  user_id: string;
  phone_number: string;
  country_code: string;
  verification_code?: string;
  code_expires_at?: string;
  verified_at?: string;
  attempts: number;
  max_attempts: number;
  last_sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SendVerificationCodeRequest {
  phone_number: string;
  country_code: string;
}

export interface VerifyPhoneRequest {
  code: string;
}

export interface PhoneVerificationResponse {
  success: boolean;
  message: string;
  verified?: boolean;
  attempts_remaining?: number;
  can_resend_at?: string;
}

// ============================================
// Account Verification
// ============================================
export interface AccountVerification {
  id: string;
  user_id: string;
  email_verified: boolean;
  phone_verified: boolean;
  game_account_verified: boolean;
  verified_game_accounts: string[];
  verified_platforms: string[];
  verification_level: VerificationLevel;
  trust_score: number;
  trust_factors: TrustFactors;
  account_age_days: number;
  is_flagged: boolean;
  flag_reason?: string;
  flagged_at?: string;
  flagged_by?: string;
  captcha_required: boolean;
  captcha_required_until?: string;
  last_captcha_solve?: string;
  captcha_failures: number;
  is_restricted: boolean;
  restriction_reason?: string;
  restriction_expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TrustFactors {
  account_age?: number;
  email_verified?: number;
  phone_verified?: number;
  verified_games?: number;
  positive_ratings?: number;
  confirmed_reports?: number;
  [key: string]: number | undefined;
}

export interface VerificationStatusResponse {
  verification_level: VerificationLevel;
  trust_score: number;
  email_verified: boolean;
  phone_verified: boolean;
  game_account_verified: boolean;
  verified_game_accounts: string[];
  is_flagged: boolean;
  is_restricted: boolean;
  badges: VerifiedBadge[];
}

// ============================================
// Behavioral Signals
// ============================================
export interface BehavioralSignal {
  id: string;
  user_id: string;
  signal_type: SignalType;
  signal_data: Record<string, unknown>;
  risk_score: number;
  is_processed: boolean;
  processed_at?: string;
  action_taken?: string;
  created_at: string;
}

// ============================================
// User Reports
// ============================================
export interface UserReport {
  id: string;
  reporter_id?: string;
  reported_user_id: string;
  report_type: ReportType;
  report_category?: string;
  description?: string;
  evidence_urls: string[];
  context_type?: "match" | "chat" | "lfg" | "profile" | "clan";
  context_id?: string;
  status: ReportStatus;
  priority: ReportPriority;
  resolved_by?: string;
  resolution_note?: string;
  resolution_action?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  // Joined data
  reporter?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  reported_user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export interface CreateReportRequest {
  reported_user_id: string;
  report_type: ReportType;
  report_category?: string;
  description?: string;
  evidence_urls?: string[];
  context_type?: "match" | "chat" | "lfg" | "profile" | "clan";
  context_id?: string;
}

export interface ReportResponse {
  success: boolean;
  message: string;
  report?: UserReport;
}

// ============================================
// Verified Badges
// ============================================
export interface VerifiedBadge {
  id: string;
  user_id: string;
  badge_type: BadgeType;
  game_id?: string;
  external_username?: string;
  external_id?: string;
  display_name?: string;
  icon_url?: string;
  verification_method?: string;
  verification_data?: Record<string, unknown>;
  verified_at: string;
  verified_by?: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  // Joined data
  game?: {
    id: string;
    slug: string;
    name: string;
    icon_url?: string;
  };
}

// ============================================
// Blocked Users
// ============================================
export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  reason?: string;
  created_at: string;
  // Joined data
  blocked_user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export interface BlockUserRequest {
  blocked_id: string;
  reason?: string;
}

// ============================================
// Login History
// ============================================
export interface LoginHistoryEntry {
  id: string;
  user_id: string;
  ip_address?: string;
  ip_hash?: string;
  user_agent?: string;
  device_fingerprint?: string;
  country_code?: string;
  city?: string;
  is_suspicious: boolean;
  suspicion_reason?: string;
  login_at: string;
}

// ============================================
// Trust Score Display
// ============================================
export type TrustLevel = "low" | "medium" | "high" | "verified";

export function getTrustLevel(score: number): TrustLevel {
  if (score >= 80) return "verified";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export function getTrustLevelColor(level: TrustLevel): string {
  switch (level) {
    case "verified":
      return "text-green-500";
    case "high":
      return "text-blue-500";
    case "medium":
      return "text-yellow-500";
    case "low":
      return "text-red-500";
  }
}

export function getVerificationLevelLabel(level: VerificationLevel): string {
  switch (level) {
    case 0:
      return "Unverified";
    case 1:
      return "Email Verified";
    case 2:
      return "Phone Verified";
    case 3:
      return "Game Verified";
    case 4:
      return "Fully Verified";
  }
}
