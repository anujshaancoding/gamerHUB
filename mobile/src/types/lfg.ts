// LFG (Looking For Group) Types for Mobile App
import { Profile, Game } from './database';

export interface LFGPost {
  id: string;
  user_id: string;
  game_id: string;
  title: string;
  description: string | null;
  game_mode: string | null;
  min_rank: string | null;
  max_rank: string | null;
  roles_needed: string[];
  slots_total: number;
  slots_filled: number;
  region: string | null;
  language: string | null;
  mic_required: boolean;
  duration: '1hr' | '2hr' | '4hr' | '8hr' | 'until_full';
  status: 'open' | 'full' | 'closed' | 'expired';
  expires_at: string;
  created_at: string;
  updated_at: string;
  user?: Profile;
  game?: Game;
  applications?: LFGApplication[];
}

export interface LFGApplication {
  id: string;
  lfg_post_id: string;
  user_id: string;
  message: string | null;
  role: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
  user?: Profile;
}

export interface SquadDNAProfile {
  id: string;
  user_id: string;
  playstyle: ('aggressive' | 'defensive' | 'supportive' | 'adaptive' | 'strategic')[];
  communication: ('vocal' | 'callouts_only' | 'listener' | 'igl' | 'minimal')[];
  schedule: ('weekday_morning' | 'weekday_evening' | 'weekend' | 'late_night' | 'flexible')[];
  competitiveness: ('casual' | 'ranked_grind' | 'tournament' | 'pro' | 'for_fun')[];
  social_vibe: ('chill' | 'focused' | 'memey' | 'toxic_ok' | 'positive_only')[];
  learning: ('coach_me' | 'self_learner' | 'mentor' | 'peer_learning' | 'vod_reviewer')[];
  created_at: string;
  updated_at: string;
}

export interface MatchmakingSuggestion {
  user: Profile;
  compatibility_score: number;
  match_factors: {
    playstyle: number;
    skill_level: number;
    schedule: number;
    communication: number;
    social_vibe: number;
  };
  shared_games: string[];
}

export interface TeamBalanceSuggestion {
  teams: {
    team1: Profile[];
    team2: Profile[];
  };
  balance_score: number;
  alternative_compositions: {
    team1: Profile[];
    team2: Profile[];
    balance_score: number;
  }[];
}

export interface MatchPrediction {
  team1_win_probability: number;
  team2_win_probability: number;
  key_factors: string[];
  reasoning: string;
}
