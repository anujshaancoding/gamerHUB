// Community/UGC Feature Types

// ============= GUIDES =============

export interface Guide {
  id: string;
  author_id: string;
  game_id: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  guide_type: GuideType;
  difficulty: GuideDifficulty;
  tags: string[];
  estimated_read_minutes: number;
  is_published: boolean;
  is_featured: boolean;
  view_count: number;
  like_count: number;
  comment_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  author?: {
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
  sections?: GuideSection[];
}

export interface GuideSection {
  id: string;
  guide_id: string;
  section_order: number;
  title: string | null;
  content: string;
  content_type: 'text' | 'code' | 'image' | 'video' | 'tip' | 'warning';
  media_url: string | null;
  created_at: string;
  updated_at: string;
}

export type GuideType =
  | 'beginner'
  | 'advanced'
  | 'meta'
  | 'character'
  | 'map'
  | 'strategy'
  | 'tips'
  | 'settings'
  | 'other';

export type GuideDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// ============= CLIPS =============

export interface Clip {
  id: string;
  creator_id: string;
  game_id: string | null;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  clip_type: ClipType;
  tags: string[];
  is_featured: boolean;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
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
  };
  reactions?: ClipReaction[];
  user_reaction?: ClipReactionType | null;
}

export interface ClipReaction {
  id: string;
  clip_id: string;
  user_id: string;
  reaction_type: ClipReactionType;
  created_at: string;
}

export type ClipType = 'highlight' | 'funny' | 'fail' | 'clutch' | 'tutorial' | 'montage' | 'other';

export type ClipReactionType =
  | 'fire'
  | 'skull'
  | 'goat'
  | 'cap'
  | 'w'
  | 'l'
  | 'heart'
  | 'mindblown'
  | 'clap'
  | 'sus';

export const CLIP_REACTIONS: Record<ClipReactionType, { emoji: string; label: string }> = {
  fire: { emoji: '🔥', label: 'Fire' },
  skull: { emoji: '💀', label: 'Dead' },
  goat: { emoji: '🐐', label: 'GOAT' },
  cap: { emoji: '🧢', label: 'Cap' },
  w: { emoji: '⬆️', label: 'W' },
  l: { emoji: '⬇️', label: 'L' },
  heart: { emoji: '❤️', label: 'Love' },
  mindblown: { emoji: '🤯', label: 'Mind Blown' },
  clap: { emoji: '👏', label: 'Clap' },
  sus: { emoji: '🤔', label: 'Sus' },
};

// ============= POLLS =============

export interface Poll {
  id: string;
  creator_id: string;
  game_id: string | null;
  question: string;
  description: string | null;
  poll_type: PollType;
  options: PollOption[];
  allow_multiple: boolean;
  is_anonymous: boolean;
  ends_at: string | null;
  total_votes: number;
  is_active: boolean;
  created_at: string;
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
  };
  user_votes?: string[]; // Option IDs user voted for
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  option_order: number;
  vote_count: number;
  image_url: string | null;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}

export type PollType = 'general' | 'meta' | 'tierlist' | 'vs' | 'prediction' | 'feedback';

// ============= EVENTS =============

export interface CommunityEvent {
  id: string;
  organizer_id: string;
  game_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  event_type: EventType;
  location_type: 'online' | 'in_person' | 'hybrid';
  location_details: string | null;
  external_link: string | null;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  max_attendees: number | null;
  rsvp_count: number;
  is_featured: boolean;
  is_recurring: boolean;
  recurrence_rule: string | null;
  status: EventStatus;
  created_at: string;
  updated_at: string;
  // Joined data
  organizer?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  game?: {
    id: string;
    slug: string;
    name: string;
  };
  user_rsvp?: EventRSVPStatus | null;
}

export interface EventRSVP {
  id: string;
  event_id: string;
  user_id: string;
  status: EventRSVPStatus;
  response_message: string | null;
  created_at: string;
  updated_at: string;
}

export type EventType =
  | 'tournament'
  | 'viewing_party'
  | 'meetup'
  | 'stream'
  | 'practice'
  | 'workshop'
  | 'other';

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type EventRSVPStatus = 'going' | 'maybe' | 'not_going';

// ============= MEMES =============

export interface Meme {
  id: string;
  creator_id: string;
  game_id: string | null;
  title: string;
  image_url: string;
  caption: string | null;
  template_name: string | null;
  tags: string[];
  is_nsfw: boolean;
  is_approved: boolean;
  like_count: number;
  comment_count: number;
  view_count: number;
  created_at: string;
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
  };
  user_liked?: boolean;
}

export interface MemeLike {
  id: string;
  meme_id: string;
  user_id: string;
  created_at: string;
}

// ============= COMMENTS (shared) =============

export interface ContentComment {
  id: string;
  content_type: 'guide' | 'clip' | 'poll' | 'event' | 'meme';
  content_id: string;
  user_id: string;
  parent_id: string | null;
  text: string;
  is_edited: boolean;
  like_count: number;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  replies?: ContentComment[];
  user_liked?: boolean;
}

// ============= API TYPES =============

export interface CreateGuideRequest {
  title: string;
  game_id?: string;
  excerpt?: string;
  cover_image_url?: string;
  guide_type?: GuideType;
  difficulty?: GuideDifficulty;
  tags?: string[];
  sections: {
    title?: string;
    content: string;
    content_type?: 'text' | 'code' | 'image' | 'video' | 'tip' | 'warning';
    media_url?: string;
  }[];
  is_published?: boolean;
}

export interface CreateClipRequest {
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  game_id?: string;
  clip_type?: ClipType;
  tags?: string[];
}

export interface CreatePollRequest {
  question: string;
  description?: string;
  game_id?: string;
  poll_type?: PollType;
  options: { text: string; image_url?: string }[];
  allow_multiple?: boolean;
  is_anonymous?: boolean;
  ends_at?: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  cover_image_url?: string;
  game_id?: string;
  event_type?: EventType;
  location_type?: 'online' | 'in_person' | 'hybrid';
  location_details?: string;
  external_link?: string;
  starts_at: string;
  ends_at?: string;
  timezone?: string;
  max_attendees?: number;
}

export interface CreateMemeRequest {
  title: string;
  image_url: string;
  caption?: string;
  template_name?: string;
  game_id?: string;
  tags?: string[];
}
