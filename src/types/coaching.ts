// Coaching system types

export type CoachTier = "rising" | "established" | "expert" | "master";

export type CoachingStatus = "available" | "busy" | "offline" | "vacation";

export type SessionType = "one_on_one" | "group" | "vod_review" | "live_coaching";

export type SessionStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";

// Coach profile
export interface CoachProfile {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  display_name: string;
  bio: string;
  games: string[]; // game IDs
  specialties: string[]; // e.g., "aim training", "game sense", "team coordination"
  tier: CoachTier;
  status: CoachingStatus;
  hourly_rate?: number; // null = free coaching
  currency: string;
  languages: string[];
  experience_years: number;
  total_sessions: number;
  total_students: number;
  average_rating: number;
  rating_count: number;
  availability: CoachAvailability;
  verified: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface CoachAvailability {
  timezone: string;
  weekly_hours: WeeklyAvailability;
  exceptions: AvailabilityException[];
}

export interface WeeklyAvailability {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

export interface TimeSlot {
  start: string; // HH:mm format
  end: string;
}

export interface AvailabilityException {
  date: string; // YYYY-MM-DD
  available: boolean;
  slots?: TimeSlot[];
  reason?: string;
}

// Coaching session
export interface CoachingSession {
  id: string;
  coach_id: string;
  student_id: string;
  session_type: SessionType;
  status: SessionStatus;
  game_id: string;
  scheduled_at: string;
  duration_minutes: number;
  price?: number;
  currency?: string;
  topic?: string;
  goals?: string[];
  notes?: string;
  meeting_link?: string;
  recording_url?: string;
  coach?: Partial<CoachProfile>;
  student?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  created_at: string;
  updated_at: string;
}

// VOD review
export interface VODReview {
  id: string;
  session_id: string;
  coach_id: string;
  student_id: string;
  video_url: string;
  video_platform: "youtube" | "twitch" | "upload" | "other";
  game_id: string;
  status: "pending" | "in_progress" | "completed";
  timestamps: VODTimestamp[];
  overall_feedback?: string;
  rating?: number;
  created_at: string;
  completed_at?: string;
}

export interface VODTimestamp {
  id: string;
  time_seconds: number;
  type: "mistake" | "good_play" | "tip" | "question";
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
}

// Student progress
export interface StudentProgress {
  id: string;
  student_id: string;
  coach_id: string;
  game_id: string;
  skill_area: string;
  initial_rating: number;
  current_rating: number;
  target_rating: number;
  milestones: ProgressMilestone[];
  homework: HomeworkItem[];
  notes: ProgressNote[];
  created_at: string;
  updated_at: string;
}

export interface ProgressMilestone {
  id: string;
  title: string;
  description: string;
  target_date?: string;
  completed: boolean;
  completed_at?: string;
}

export interface HomeworkItem {
  id: string;
  title: string;
  description: string;
  due_date?: string;
  completed: boolean;
  completed_at?: string;
  coach_feedback?: string;
}

export interface ProgressNote {
  id: string;
  content: string;
  created_at: string;
  created_by: "coach" | "student";
}

// Coach review
export interface CoachReview {
  id: string;
  coach_id: string;
  student_id: string;
  session_id?: string;
  rating: number; // 1-5
  title: string;
  content: string;
  pros?: string[];
  cons?: string[];
  would_recommend: boolean;
  verified_session: boolean;
  helpful_count: number;
  created_at: string;
}

// Coach tier info
export const COACH_TIERS: Record<CoachTier, {
  name: string;
  minSessions: number;
  minRating: number;
  color: string;
  benefits: string[];
}> = {
  rising: {
    name: "Rising Coach",
    minSessions: 0,
    minRating: 0,
    color: "#94A3B8",
    benefits: ["Basic profile", "Up to 5 active students"],
  },
  established: {
    name: "Established Coach",
    minSessions: 25,
    minRating: 4.0,
    color: "#3B82F6",
    benefits: ["Priority search", "Up to 15 active students", "Group sessions"],
  },
  expert: {
    name: "Expert Coach",
    minSessions: 100,
    minRating: 4.5,
    color: "#8B5CF6",
    benefits: ["Featured on homepage", "Unlimited students", "Custom branding"],
  },
  master: {
    name: "Master Coach",
    minSessions: 500,
    minRating: 4.8,
    color: "#F59E0B",
    benefits: ["Top placement", "Verified badge", "Revenue share bonus"],
  },
};

// Session type info
export const SESSION_TYPES: Record<SessionType, {
  name: string;
  description: string;
  icon: string;
  defaultDuration: number;
}> = {
  one_on_one: {
    name: "1-on-1 Session",
    description: "Private coaching tailored to your needs",
    icon: "user",
    defaultDuration: 60,
  },
  group: {
    name: "Group Session",
    description: "Learn with other players (max 5)",
    icon: "users",
    defaultDuration: 90,
  },
  vod_review: {
    name: "VOD Review",
    description: "Get detailed feedback on your gameplay",
    icon: "video",
    defaultDuration: 45,
  },
  live_coaching: {
    name: "Live Coaching",
    description: "Real-time guidance while you play",
    icon: "monitor",
    defaultDuration: 120,
  },
};

// API types
export interface CreateCoachProfileRequest {
  bio: string;
  games: string[];
  specialties: string[];
  hourly_rate?: number;
  currency?: string;
  languages: string[];
  experience_years: number;
  availability: CoachAvailability;
}

export interface UpdateCoachProfileRequest {
  bio?: string;
  games?: string[];
  specialties?: string[];
  hourly_rate?: number;
  currency?: string;
  languages?: string[];
  status?: CoachingStatus;
  availability?: Partial<CoachAvailability>;
}

export interface BookSessionRequest {
  coach_id: string;
  session_type: SessionType;
  game_id: string;
  scheduled_at: string;
  duration_minutes: number;
  topic?: string;
  goals?: string[];
}

export interface SubmitReviewRequest {
  coach_id: string;
  session_id?: string;
  rating: number;
  title: string;
  content: string;
  pros?: string[];
  cons?: string[];
  would_recommend: boolean;
}

// Helper functions
export function getCoachTier(sessions: number, rating: number): CoachTier {
  if (sessions >= 500 && rating >= 4.8) return "master";
  if (sessions >= 100 && rating >= 4.5) return "expert";
  if (sessions >= 25 && rating >= 4.0) return "established";
  return "rising";
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatPrice(amount: number | undefined, currency: string = "INR"): string {
  if (!amount || amount === 0) return "Free";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(amount);
}

export function isSlotAvailable(
  availability: CoachAvailability,
  date: Date,
  startTime: string,
  durationMinutes: number
): boolean {
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayName = dayNames[date.getDay()] as keyof WeeklyAvailability;
  const dateStr = date.toISOString().split("T")[0];

  // Check exceptions first
  const exception = availability.exceptions.find((e) => e.date === dateStr);
  if (exception) {
    if (!exception.available) return false;
    if (exception.slots) {
      return exception.slots.some((slot) => isWithinSlot(startTime, durationMinutes, slot));
    }
  }

  // Check weekly availability
  const slots = availability.weekly_hours[dayName];
  return slots.some((slot) => isWithinSlot(startTime, durationMinutes, slot));
}

function isWithinSlot(startTime: string, duration: number, slot: TimeSlot): boolean {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [slotStartHour, slotStartMin] = slot.start.split(":").map(Number);
  const [slotEndHour, slotEndMin] = slot.end.split(":").map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = startMinutes + duration;
  const slotStartMinutes = slotStartHour * 60 + slotStartMin;
  const slotEndMinutes = slotEndHour * 60 + slotEndMin;

  return startMinutes >= slotStartMinutes && endMinutes <= slotEndMinutes;
}
