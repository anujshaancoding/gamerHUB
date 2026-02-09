// Console Platform Integration Types

export type ConsolePlatform = 'playstation' | 'xbox' | 'nintendo';
export type GamePlatform = 'pc' | 'playstation' | 'xbox' | 'switch' | 'mobile';

export interface ConsoleConnection {
  id: string;
  user_id: string;
  platform: ConsolePlatform;
  platform_user_id: string;
  platform_username: string | null;
  platform_avatar_url: string | null;
  online_id: string | null; // PSN ID, Gamertag, Friend Code
  account_id: string | null;
  is_verified: boolean;
  verification_method: string | null;
  verified_at: string | null;
  last_online_at: string | null;
  is_active: boolean;
  games_owned: string[];
  recent_games: RecentGame[];
  connected_at: string;
  created_at: string;
  updated_at: string;
}

export interface RecentGame {
  title: string;
  last_played: string;
  hours?: number;
  platform_game_id?: string;
}

export interface CrossplayParty {
  id: string;
  creator_id: string;
  game_id: string;
  title: string | null;
  description: string | null;
  platforms_allowed: GamePlatform[];
  voice_platform: 'discord' | 'game_native' | 'gamerhub';
  voice_channel_link: string | null;
  invite_code: string;
  max_members: number;
  status: 'open' | 'full' | 'in_game' | 'closed';
  current_members: number;
  game_started_at: string | null;
  last_activity_at: string;
  created_at: string;
  expires_at: string;
  // Joined data
  creator?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  game?: {
    id: string;
    slug: string;
    name: string;
    icon_url: string | null;
  };
  members?: CrossplayPartyMember[];
}

export interface CrossplayPartyMember {
  id: string;
  party_id: string;
  user_id: string;
  platform: GamePlatform;
  platform_username: string | null;
  is_leader: boolean;
  can_invite: boolean;
  status: 'joined' | 'ready' | 'in_game' | 'away';
  joined_at: string;
  left_at: string | null;
  // Joined data
  user?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export interface PlatformFriend {
  id: string;
  user_id: string;
  platform: ConsolePlatform;
  platform_friend_id: string;
  platform_friend_username: string | null;
  platform_friend_avatar: string | null;
  gamerhub_user_id: string | null;
  is_matched: boolean;
  imported_at: string;
  // Joined data
  gamerhub_user?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

// API Request/Response types
export interface ConnectConsoleRequest {
  platform: ConsolePlatform;
  code?: string; // OAuth code
  online_id?: string; // Manual entry
  verification_code?: string;
}

export interface ConsoleConnectionStatus {
  platform: ConsolePlatform;
  connected: boolean;
  platform_username: string | null;
  online_id: string | null;
  is_verified: boolean;
  last_online_at: string | null;
}

export interface CreateCrossplayPartyRequest {
  game_id: string;
  title?: string;
  description?: string;
  platforms_allowed?: GamePlatform[];
  voice_platform?: 'discord' | 'game_native' | 'gamerhub';
  voice_channel_link?: string;
  max_members?: number;
}

export interface JoinCrossplayPartyRequest {
  invite_code?: string;
  platform: GamePlatform;
  platform_username?: string;
}

export interface UpdatePartyMemberRequest {
  status?: 'joined' | 'ready' | 'in_game' | 'away';
  platform_username?: string;
}

// Platform-specific helpers
export const PLATFORM_CONFIG: Record<ConsolePlatform, {
  name: string;
  idLabel: string;
  idPlaceholder: string;
  color: string;
  icon: string;
  supportsOAuth: boolean;
}> = {
  playstation: {
    name: 'PlayStation Network',
    idLabel: 'PSN Online ID',
    idPlaceholder: 'Enter your PSN ID',
    color: '#003791',
    icon: '/images/platforms/playstation.svg',
    supportsOAuth: true,
  },
  xbox: {
    name: 'Xbox Live',
    idLabel: 'Xbox Gamertag',
    idPlaceholder: 'Enter your Gamertag',
    color: '#107C10',
    icon: '/images/platforms/xbox.svg',
    supportsOAuth: true,
  },
  nintendo: {
    name: 'Nintendo Switch Online',
    idLabel: 'Nintendo Friend Code',
    idPlaceholder: 'SW-XXXX-XXXX-XXXX',
    color: '#E60012',
    icon: '/images/platforms/nintendo.svg',
    supportsOAuth: false,
  },
};

export const GAME_PLATFORM_CONFIG: Record<GamePlatform, {
  name: string;
  shortName: string;
  color: string;
}> = {
  pc: {
    name: 'PC',
    shortName: 'PC',
    color: '#6366F1',
  },
  playstation: {
    name: 'PlayStation',
    shortName: 'PS',
    color: '#003791',
  },
  xbox: {
    name: 'Xbox',
    shortName: 'XB',
    color: '#107C10',
  },
  switch: {
    name: 'Nintendo Switch',
    shortName: 'NSW',
    color: '#E60012',
  },
  mobile: {
    name: 'Mobile',
    shortName: 'MOB',
    color: '#F59E0B',
  },
};

// Validation helpers
export function validateNintendoFriendCode(code: string): boolean {
  // Format: SW-XXXX-XXXX-XXXX
  const regex = /^SW-\d{4}-\d{4}-\d{4}$/;
  return regex.test(code);
}

export function formatNintendoFriendCode(input: string): string {
  // Remove all non-digits except SW-
  const digits = input.replace(/[^\d]/g, '');

  if (digits.length === 0) return '';
  if (digits.length <= 4) return `SW-${digits}`;
  if (digits.length <= 8) return `SW-${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `SW-${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}`;
}
