// Achievement Hunting Groups - Coordinate achievement hunting with other players

export type HuntStatus = "recruiting" | "active" | "completed" | "cancelled";

export type AchievementDifficulty = "easy" | "medium" | "hard" | "extreme" | "impossible";

// Achievement definition
export interface Achievement {
  id: string;
  game_id: string;
  name: string;
  description: string;
  difficulty: AchievementDifficulty;
  players_required: number; // Min players needed (1 for solo, 2+ for coop)
  estimated_time_minutes?: number;
  guide_url?: string;
  icon_url?: string;
  rarity_percent?: number; // % of players who have this
  tags: string[];
}

// Achievement hunting group
export interface AchievementHunt {
  id: string;
  achievement_id: string;
  achievement: Achievement;
  creator_id: string;
  title: string;
  description?: string;
  status: HuntStatus;

  // Group settings
  max_members: number;
  current_members: number;
  requires_mic: boolean;
  min_level?: number;
  language?: string;

  // Schedule
  scheduled_time?: string;
  timezone?: string;
  estimated_duration_minutes?: number;

  // Members
  members: HuntMember[];

  // Progress
  attempts: number;
  completed_at?: string;

  created_at: string;
  updated_at: string;
}

export interface HuntMember {
  id: string;
  hunt_id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  role: "leader" | "member";
  has_achievement: boolean; // Already has the achievement (helping others)
  ready: boolean;
  joined_at: string;
}

// Hunt application
export interface HuntApplication {
  id: string;
  hunt_id: string;
  user_id: string;
  message?: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}

// Difficulty info
export const DIFFICULTY_INFO: Record<
  AchievementDifficulty,
  { name: string; color: string; description: string; multiplier: number }
> = {
  easy: {
    name: "Easy",
    color: "#22C55E",
    description: "Can be done quickly with minimal effort",
    multiplier: 1,
  },
  medium: {
    name: "Medium",
    color: "#3B82F6",
    description: "Requires some skill or time investment",
    multiplier: 1.5,
  },
  hard: {
    name: "Hard",
    color: "#F59E0B",
    description: "Challenging, requires coordination",
    multiplier: 2,
  },
  extreme: {
    name: "Extreme",
    color: "#EF4444",
    description: "Very difficult, needs skilled players",
    multiplier: 3,
  },
  impossible: {
    name: "Near Impossible",
    color: "#8B5CF6",
    description: "The rarest achievements, legendary difficulty",
    multiplier: 5,
  },
};

// Common achievement tags
export const ACHIEVEMENT_TAGS = [
  "multiplayer",
  "solo",
  "speedrun",
  "collectible",
  "story",
  "grind",
  "skill-based",
  "luck-based",
  "secret",
  "dlc",
  "limited-time",
  "pvp",
  "pve",
];

// API types
export interface CreateHuntRequest {
  achievement_id: string;
  title: string;
  description?: string;
  max_members: number;
  requires_mic?: boolean;
  min_level?: number;
  language?: string;
  scheduled_time?: string;
  timezone?: string;
  estimated_duration_minutes?: number;
}

export interface UpdateHuntRequest {
  title?: string;
  description?: string;
  max_members?: number;
  requires_mic?: boolean;
  scheduled_time?: string;
  status?: HuntStatus;
}

export interface ApplyToHuntRequest {
  message?: string;
}

// Helper functions
export function getDifficultyFromRarity(rarityPercent: number): AchievementDifficulty {
  if (rarityPercent >= 50) return "easy";
  if (rarityPercent >= 25) return "medium";
  if (rarityPercent >= 10) return "hard";
  if (rarityPercent >= 2) return "extreme";
  return "impossible";
}

export function formatEstimatedTime(minutes?: number): string {
  if (!minutes) return "Unknown";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function getHuntStatusColor(status: HuntStatus): string {
  const colors: Record<HuntStatus, string> = {
    recruiting: "#22C55E",
    active: "#3B82F6",
    completed: "#8B5CF6",
    cancelled: "#94A3B8",
  };
  return colors[status];
}

export function getHuntStatusLabel(status: HuntStatus): string {
  const labels: Record<HuntStatus, string> = {
    recruiting: "Looking for Players",
    active: "In Progress",
    completed: "Achievement Unlocked!",
    cancelled: "Cancelled",
  };
  return labels[status];
}

export function canJoinHunt(hunt: AchievementHunt, userId: string): boolean {
  if (hunt.status !== "recruiting") return false;
  if (hunt.current_members >= hunt.max_members) return false;
  if (hunt.members.some((m) => m.user_id === userId)) return false;
  return true;
}
