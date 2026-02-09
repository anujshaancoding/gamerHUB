// Chat Types for Mobile App
import { Profile } from './database';

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  avatar_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message?: ChatMessage;
  participants?: ConversationParticipant[];
  unread_count?: number;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  last_read_at: string | null;
  is_muted: boolean;
  user?: Profile;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  attachment_url: string | null;
  reply_to_id: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  sender?: Profile;
  reply_to?: ChatMessage;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface TypingIndicator {
  conversation_id: string;
  user_id: string;
  username: string;
  timestamp: number;
}

export interface CallSession {
  id: string;
  conversation_id: string;
  initiated_by: string;
  type: 'voice' | 'video';
  status: 'ringing' | 'ongoing' | 'ended' | 'missed' | 'declined';
  started_at: string | null;
  ended_at: string | null;
  participants: CallParticipant[];
}

export interface CallParticipant {
  user_id: string;
  joined_at: string;
  left_at: string | null;
  is_muted: boolean;
  is_video_enabled: boolean;
  user?: Profile;
}
