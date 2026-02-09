// Gaming mood types for mood-based matchmaking

export type GamingMood =
  | "tryhard"      // Competitive, focused, want to win
  | "chill"        // Relaxed, casual gaming
  | "social"       // Want to chat and hang out while gaming
  | "learning"     // Focus on improvement, open to feedback
  | "warming_up"   // Just starting session, getting in zone
  | "tilted"       // Frustrated, might need support
  | "celebrating"  // Just won, riding high, want more
  | "decompressing" // Gaming to unwind from stress
  | "grinding"     // Repetitive task focus (ranking, farming)
  | "exploring"    // Want to try new things, experiment
  | "coaching"     // In teaching/helping mode
  | "spectating";  // Just want to watch, not play

export interface MoodInfo {
  id: GamingMood;
  label: string;
  description: string;
  emoji: string;
  color: string;
  compatibleWith: GamingMood[];
  incompatibleWith: GamingMood[];
}

export const GAMING_MOODS: Record<GamingMood, MoodInfo> = {
  tryhard: {
    id: "tryhard",
    label: "Tryhard",
    description: "I'm here to win, give me your best",
    emoji: "🔥",
    color: "#EF4444",
    compatibleWith: ["tryhard", "warming_up", "grinding", "celebrating"],
    incompatibleWith: ["chill", "tilted", "decompressing", "spectating"],
  },
  chill: {
    id: "chill",
    label: "Chill",
    description: "Relaxed vibes, no pressure",
    emoji: "😎",
    color: "#3B82F6",
    compatibleWith: ["chill", "social", "decompressing", "exploring", "spectating"],
    incompatibleWith: ["tryhard", "grinding"],
  },
  social: {
    id: "social",
    label: "Social",
    description: "Let's chat while we play",
    emoji: "💬",
    color: "#8B5CF6",
    compatibleWith: ["social", "chill", "celebrating", "exploring", "coaching"],
    incompatibleWith: ["tryhard", "grinding"],
  },
  learning: {
    id: "learning",
    label: "Learning",
    description: "Help me improve, I'm open to tips",
    emoji: "📚",
    color: "#10B981",
    compatibleWith: ["learning", "coaching", "warming_up", "exploring"],
    incompatibleWith: ["tilted", "celebrating"],
  },
  warming_up: {
    id: "warming_up",
    label: "Warming Up",
    description: "Just getting started, finding my groove",
    emoji: "🎯",
    color: "#F59E0B",
    compatibleWith: ["warming_up", "chill", "learning", "tryhard"],
    incompatibleWith: ["tilted"],
  },
  tilted: {
    id: "tilted",
    label: "Tilted",
    description: "Frustrated but still want to play",
    emoji: "😤",
    color: "#F97316",
    compatibleWith: ["decompressing", "chill", "social"],
    incompatibleWith: ["tryhard", "grinding", "learning", "warming_up"],
  },
  celebrating: {
    id: "celebrating",
    label: "Celebrating",
    description: "On a win streak, feeling great!",
    emoji: "🎉",
    color: "#22C55E",
    compatibleWith: ["celebrating", "tryhard", "social", "grinding"],
    incompatibleWith: ["tilted", "decompressing"],
  },
  decompressing: {
    id: "decompressing",
    label: "Decompressing",
    description: "Gaming to relax after a long day",
    emoji: "🧘",
    color: "#06B6D4",
    compatibleWith: ["decompressing", "chill", "social", "spectating", "tilted"],
    incompatibleWith: ["tryhard", "grinding", "celebrating"],
  },
  grinding: {
    id: "grinding",
    label: "Grinding",
    description: "Focused on ranking up or farming",
    emoji: "⚔️",
    color: "#EC4899",
    compatibleWith: ["grinding", "tryhard", "celebrating"],
    incompatibleWith: ["chill", "social", "tilted", "decompressing", "spectating"],
  },
  exploring: {
    id: "exploring",
    label: "Exploring",
    description: "Trying new things, experimenting",
    emoji: "🧭",
    color: "#14B8A6",
    compatibleWith: ["exploring", "chill", "social", "learning"],
    incompatibleWith: ["tryhard", "grinding"],
  },
  coaching: {
    id: "coaching",
    label: "Coaching",
    description: "Happy to teach and give tips",
    emoji: "🎓",
    color: "#6366F1",
    compatibleWith: ["coaching", "learning", "social", "warming_up"],
    incompatibleWith: ["tilted", "grinding"],
  },
  spectating: {
    id: "spectating",
    label: "Spectating",
    description: "Just want to watch and hang",
    emoji: "👀",
    color: "#94A3B8",
    compatibleWith: ["spectating", "chill", "social", "decompressing"],
    incompatibleWith: ["tryhard", "grinding"],
  },
};

// Intensity level (1-5)
export type MoodIntensity = 1 | 2 | 3 | 4 | 5;

export interface IntensityInfo {
  level: MoodIntensity;
  label: string;
  description: string;
}

export const MOOD_INTENSITIES: IntensityInfo[] = [
  { level: 1, label: "Low", description: "Barely feeling it" },
  { level: 2, label: "Mild", description: "Somewhat in that mood" },
  { level: 3, label: "Moderate", description: "Definitely there" },
  { level: 4, label: "High", description: "Strongly feeling it" },
  { level: 5, label: "Maximum", description: "100% committed" },
];

// User's current mood state
export interface UserMood {
  id: string;
  user_id: string;
  mood: GamingMood;
  intensity: MoodIntensity;
  game_id?: string;
  note?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

// Mood history entry
export interface MoodHistoryEntry {
  id: string;
  user_id: string;
  mood: GamingMood;
  intensity: MoodIntensity;
  game_id?: string;
  duration_minutes?: number;
  outcome?: "good" | "neutral" | "bad";
  created_at: string;
}

// Mood compatibility result
export interface MoodCompatibility {
  score: number; // 0-100
  level: "perfect" | "great" | "good" | "okay" | "poor";
  reason: string;
}

// API request/response types
export interface SetMoodRequest {
  mood: GamingMood;
  intensity?: MoodIntensity;
  game_id?: string;
  note?: string;
  duration_hours?: number; // How long the mood is valid (default 2)
}

export interface FindByMoodRequest {
  mood?: GamingMood;
  compatible_only?: boolean;
  game_id?: string;
  limit?: number;
}

export interface MoodStatsResponse {
  totalEntries: number;
  mostCommonMood: GamingMood;
  averageIntensity: number;
  moodDistribution: Record<GamingMood, number>;
  bestOutcomeMood: GamingMood;
}

// Helper functions
export function calculateMoodCompatibility(
  mood1: GamingMood,
  intensity1: MoodIntensity,
  mood2: GamingMood,
  intensity2: MoodIntensity
): MoodCompatibility {
  const moodInfo1 = GAMING_MOODS[mood1];
  const moodInfo2 = GAMING_MOODS[mood2];

  // Same mood = perfect match
  if (mood1 === mood2) {
    const intensityDiff = Math.abs(intensity1 - intensity2);
    const intensityBonus = (5 - intensityDiff) * 4; // 0-20 bonus
    return {
      score: Math.min(100, 80 + intensityBonus),
      level: intensityDiff <= 1 ? "perfect" : "great",
      reason: `Both in ${moodInfo1.label} mode!`,
    };
  }

  // Check if compatible
  if (moodInfo1.compatibleWith.includes(mood2)) {
    const avgIntensity = (intensity1 + intensity2) / 2;
    const baseScore = 60 + avgIntensity * 4;
    return {
      score: Math.round(baseScore),
      level: baseScore >= 80 ? "great" : "good",
      reason: `${moodInfo1.label} works well with ${moodInfo2.label}`,
    };
  }

  // Check if incompatible
  if (moodInfo1.incompatibleWith.includes(mood2)) {
    return {
      score: 20,
      level: "poor",
      reason: `${moodInfo1.label} and ${moodInfo2.label} may clash`,
    };
  }

  // Neutral compatibility
  return {
    score: 50,
    level: "okay",
    reason: "Different vibes, might still work",
  };
}

export function getMoodCompatibilityColor(level: MoodCompatibility["level"]): string {
  const colors: Record<MoodCompatibility["level"], string> = {
    perfect: "#22C55E",
    great: "#84CC16",
    good: "#3B82F6",
    okay: "#F59E0B",
    poor: "#EF4444",
  };
  return colors[level];
}

export function formatMoodExpiry(expiresAt: string): string {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();

  if (diffMs <= 0) return "Expired";

  const diffMins = Math.round(diffMs / (1000 * 60));
  if (diffMins < 60) return `${diffMins}m left`;

  const diffHours = Math.round(diffMins / 60);
  return `${diffHours}h left`;
}

// Default mood duration in hours
export const DEFAULT_MOOD_DURATION = 2;

// Get suggested mood based on time of day
export function getSuggestedMood(): GamingMood {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 12) return "warming_up";
  if (hour >= 12 && hour < 17) return "grinding";
  if (hour >= 17 && hour < 21) return "tryhard";
  if (hour >= 21 || hour < 2) return "chill";
  return "decompressing"; // 2am - 6am
}
