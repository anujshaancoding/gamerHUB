// Extended Clan Types for Mobile App
import { Profile, Game } from './database';

export interface ClanMember {
  id: string;
  clan_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joined_at: string;
  user?: Profile;
}

export interface ClanInvite {
  id: string;
  clan_id: string;
  user_id: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  message: string | null;
  created_at: string;
  expires_at: string;
  clan?: ClanDetails;
  user?: Profile;
  inviter?: Profile;
}

export interface ClanDetails {
  id: string;
  name: string;
  tag: string;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  owner_id: string;
  primary_game_id: string | null;
  region: string | null;
  is_public: boolean;
  is_recruiting: boolean;
  member_count: number;
  max_members: number;
  created_at: string;
  updated_at: string;
  owner?: Profile;
  primary_game?: Game;
  members?: ClanMember[];
  games?: ClanGame[];
}

export interface ClanGame {
  id: string;
  clan_id: string;
  game_id: string;
  is_primary: boolean;
  game?: Game;
}

export interface ClanChallenge {
  id: string;
  clan_id: string;
  challenger_clan_id: string;
  game_id: string;
  title: string;
  description: string | null;
  wager_type: 'none' | 'bragging_rights' | 'custom';
  wager_value: Record<string, unknown> | null;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  winner_clan_id: string | null;
  scheduled_at: string;
  created_at: string;
  completed_at: string | null;
  clan?: ClanDetails;
  challenger_clan?: ClanDetails;
  game?: Game;
}

export interface ClanRecruitmentPost {
  id: string;
  clan_id: string;
  title: string;
  description: string;
  requirements: string | null;
  roles_needed: string[];
  min_rank: string | null;
  region: string | null;
  language: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  clan?: ClanDetails;
}

export interface ClanApplication {
  id: string;
  clan_id: string;
  user_id: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  user?: Profile;
}
