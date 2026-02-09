// Gamification Types for Mobile App
export interface Title {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  color: string | null;
}

export interface ProfileFrame {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface ProfileTheme {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  primary_color: string;
  secondary_color: string | null;
  accent_color: string | null;
  background_gradient: Record<string, string> | null;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserProgression {
  id: string;
  user_id: string;
  total_xp: number;
  level: number;
  current_level_xp: number;
  xp_to_next_level: number;
  prestige_level: number;
  active_title_id: string | null;
  active_frame_id: string | null;
  active_theme_id: string | null;
  showcase_badges: string[];
  stats: {
    matches_played: number;
    matches_won: number;
    challenges_completed: number;
    quests_completed: number;
    current_win_streak: number;
    best_win_streak: number;
  };
  active_title: Title | null;
  active_frame: ProfileFrame | null;
  active_theme: ProfileTheme | null;
  created_at: string;
  updated_at: string;
}

export interface QuestDefinition {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  quest_type: 'daily' | 'weekly' | 'special';
  requirements: Record<string, unknown>;
  xp_reward: number;
  bonus_rewards: Record<string, unknown>;
  game_id: string | null;
}

export interface UserQuest {
  id: string;
  user_id: string;
  quest_id: string;
  status: 'active' | 'completed' | 'expired' | 'claimed';
  progress: { current: number; target: number };
  assigned_at: string;
  expires_at: string;
  completed_at: string | null;
  claimed_at: string | null;
  period_type: string;
  period_key: string;
  quest: QuestDefinition;
}

export interface BadgeDefinition {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  category: 'skill' | 'social' | 'milestone' | 'seasonal' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xp_reward: number;
  game_id: string | null;
  is_secret: boolean;
  unlock_criteria: Record<string, unknown>;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  progress: Record<string, unknown>;
  season: string | null;
  badge: BadgeDefinition;
}

export interface BattlePassReward {
  id: string;
  battle_pass_id: string;
  level: number;
  tier: 'free' | 'premium';
  reward_type: string;
  reward_value: Record<string, unknown>;
  name: string;
  description: string | null;
  icon_url: string | null;
  rarity: string;
  sort_order: number;
}

export interface BattlePass {
  id: string;
  name: string;
  slug: string;
  season_number: number;
  description: string | null;
  banner_url: string | null;
  price_standard: number;
  price_premium: number | null;
  starts_at: string;
  ends_at: string;
  max_level: number;
  xp_per_level: number;
  status: 'upcoming' | 'active' | 'completed';
  rewards: BattlePassReward[];
}

export interface BattlePassProgress {
  id: string;
  user_id: string;
  battle_pass_id: string;
  is_premium: boolean;
  current_level: number;
  current_xp: number;
  claimed_rewards: string[];
  purchased_at: string | null;
}

export interface Season {
  id: string;
  name: string;
  slug: string;
  number: number;
  starts_at: string;
  ends_at: string;
  status: 'upcoming' | 'active' | 'completed';
  theme: string | null;
  rewards: SeasonReward[];
}

export interface SeasonReward {
  id: string;
  season_id: string;
  rank_threshold: number;
  reward_type: string;
  reward_value: Record<string, unknown>;
  name: string;
  description: string | null;
  icon_url: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  total_xp: number;
  level: number;
  prestige_level: number;
  score: number;
}
