// Commitment Contract - Mutual gaming commitments between players

export type CommitmentStatus = "pending" | "active" | "completed" | "failed" | "cancelled";

export type CommitmentType =
  | "sessions" // Play X sessions together
  | "weekly" // Play X times per week
  | "daily" // Play X times per day
  | "rank_goal" // Reach a rank together
  | "achievement" // Complete achievements
  | "custom"; // Custom commitment

export type CommitmentFrequency = "daily" | "weekly" | "monthly" | "total";

// Main commitment contract
export interface CommitmentContract {
  id: string;
  title: string;
  description?: string;
  type: CommitmentType;
  status: CommitmentStatus;
  game_id: string;
  creator_id: string;

  // Participants
  participants: CommitmentParticipant[];

  // Goals
  target_count: number; // e.g., 10 sessions
  frequency: CommitmentFrequency;
  current_count: number;

  // Timeline
  start_date: string;
  end_date: string;

  // Stakes (optional)
  has_stakes: boolean;
  stakes_description?: string;

  // Tracking
  check_ins: CommitmentCheckIn[];

  // Settings
  require_photo_proof: boolean;
  auto_verify: boolean; // Auto-verify from game stats

  created_at: string;
  completed_at?: string;
}

export interface CommitmentParticipant {
  id: string;
  contract_id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  accepted: boolean;
  accepted_at?: string;
  contribution_count: number;
  last_check_in?: string;
  streak: number;
}

export interface CommitmentCheckIn {
  id: string;
  contract_id: string;
  user_id: string;
  username: string;
  note?: string;
  proof_url?: string; // Screenshot or photo
  session_id?: string; // Link to gaming session
  verified: boolean;
  created_at: string;
}

// Templates for quick contract creation
export interface CommitmentTemplate {
  id: string;
  name: string;
  description: string;
  type: CommitmentType;
  suggested_target: number;
  suggested_frequency: CommitmentFrequency;
  suggested_duration_days: number;
  icon: string;
}

export const COMMITMENT_TEMPLATES: CommitmentTemplate[] = [
  {
    id: "weekly-grind",
    name: "Weekly Grind Partners",
    description: "Commit to playing ranked together every week",
    type: "weekly",
    suggested_target: 3,
    suggested_frequency: "weekly",
    suggested_duration_days: 30,
    icon: "calendar",
  },
  {
    id: "rank-climb",
    name: "Rank Climb Challenge",
    description: "Push through the ranks together",
    type: "sessions",
    suggested_target: 20,
    suggested_frequency: "total",
    suggested_duration_days: 14,
    icon: "trending-up",
  },
  {
    id: "daily-practice",
    name: "Daily Practice Pact",
    description: "Practice together every day",
    type: "daily",
    suggested_target: 1,
    suggested_frequency: "daily",
    suggested_duration_days: 7,
    icon: "target",
  },
  {
    id: "achievement-hunt",
    name: "Achievement Hunt",
    description: "Complete achievements together",
    type: "achievement",
    suggested_target: 5,
    suggested_frequency: "total",
    suggested_duration_days: 30,
    icon: "trophy",
  },
];

// API types
export interface CreateContractRequest {
  title: string;
  description?: string;
  type: CommitmentType;
  game_id: string;
  participant_ids: string[];
  target_count: number;
  frequency: CommitmentFrequency;
  start_date: string;
  end_date: string;
  has_stakes?: boolean;
  stakes_description?: string;
  require_photo_proof?: boolean;
}

export interface CheckInRequest {
  note?: string;
  proof_url?: string;
  session_id?: string;
}

export interface RespondToContractRequest {
  accepted: boolean;
}

// Helper functions
export function getContractProgress(contract: CommitmentContract): number {
  return Math.min(100, Math.round((contract.current_count / contract.target_count) * 100));
}

export function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getContractStatusColor(status: CommitmentStatus): string {
  const colors: Record<CommitmentStatus, string> = {
    pending: "#F59E0B",
    active: "#3B82F6",
    completed: "#22C55E",
    failed: "#EF4444",
    cancelled: "#94A3B8",
  };
  return colors[status];
}

export function getContractStatusLabel(status: CommitmentStatus): string {
  const labels: Record<CommitmentStatus, string> = {
    pending: "Pending Acceptance",
    active: "In Progress",
    completed: "Completed!",
    failed: "Failed",
    cancelled: "Cancelled",
  };
  return labels[status];
}

export function formatFrequency(frequency: CommitmentFrequency, target: number): string {
  switch (frequency) {
    case "daily":
      return `${target}x per day`;
    case "weekly":
      return `${target}x per week`;
    case "monthly":
      return `${target}x per month`;
    case "total":
      return `${target} total`;
  }
}

export function isOnTrack(contract: CommitmentContract): boolean {
  const totalDays = Math.ceil(
    (new Date(contract.end_date).getTime() - new Date(contract.start_date).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const daysPassed = Math.ceil(
    (Date.now() - new Date(contract.start_date).getTime()) / (1000 * 60 * 60 * 24)
  );
  const expectedProgress = (daysPassed / totalDays) * contract.target_count;

  return contract.current_count >= expectedProgress * 0.8; // 80% threshold
}
