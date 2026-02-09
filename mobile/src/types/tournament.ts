// Tournament Types for Mobile App
import { Profile, Game } from './database';

export interface Tournament {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  game_id: string;
  organizer_clan_id: string | null;
  format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
  max_participants: number;
  min_participants: number;
  team_size: number;
  entry_fee: number;
  prize_pool: Record<string, unknown> | null;
  rules: string | null;
  banner_url: string | null;
  status: 'draft' | 'registration' | 'in_progress' | 'completed' | 'cancelled';
  registration_starts_at: string;
  registration_ends_at: string;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  game?: Game;
  participants_count?: number;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  user_id: string | null;
  team_id: string | null;
  seed: number | null;
  status: 'registered' | 'checked_in' | 'eliminated' | 'winner';
  registered_at: string;
  user?: Profile;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  round: number;
  match_number: number;
  bracket_position: string;
  participant1_id: string | null;
  participant2_id: string | null;
  winner_id: string | null;
  score1: number | null;
  score2: number | null;
  status: 'pending' | 'in_progress' | 'completed' | 'bye';
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  participant1?: TournamentParticipant;
  participant2?: TournamentParticipant;
}

export interface TournamentBracket {
  tournament: Tournament;
  rounds: TournamentRound[];
  matches: TournamentMatch[];
}

export interface TournamentRound {
  round_number: number;
  name: string;
  matches: TournamentMatch[];
}

export interface Challenge {
  id: string;
  creator_id: string;
  opponent_id: string | null;
  game_id: string;
  title: string;
  description: string | null;
  wager_amount: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  winner_id: string | null;
  created_at: string;
  expires_at: string;
  completed_at: string | null;
  game?: Game;
  creator?: Profile;
  opponent?: Profile;
}

export interface CommunityChallenge {
  id: string;
  title: string;
  description: string | null;
  game_id: string | null;
  challenge_type: 'achievement' | 'score' | 'time' | 'collection';
  target_value: number;
  xp_reward: number;
  bonus_rewards: Record<string, unknown>;
  start_date: string;
  end_date: string;
  max_participants: number | null;
  status: 'upcoming' | 'active' | 'completed';
  participants_count: number;
  game?: Game;
}

export interface CommunityChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  progress: number;
  completed: boolean;
  joined_at: string;
  completed_at: string | null;
  user?: Profile;
}
