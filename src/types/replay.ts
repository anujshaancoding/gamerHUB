// Replay Together - synchronized replay watching

export type ReplaySource = "youtube" | "twitch" | "upload" | "external";

export type ReplayRoomStatus = "waiting" | "playing" | "paused" | "ended";

export type ParticipantRole = "host" | "viewer";

// Replay room for synchronized watching
export interface ReplayRoom {
  id: string;
  code: string; // Short join code
  name: string;
  host_id: string;
  game_id: string;
  replay_url: string;
  replay_source: ReplaySource;
  replay_title?: string;
  replay_duration?: number; // in seconds
  status: ReplayRoomStatus;
  current_time: number; // current playback position in seconds
  playback_speed: number; // 0.5, 1, 1.5, 2
  is_public: boolean;
  max_participants: number;
  participant_count: number;
  allow_reactions: boolean;
  allow_drawing: boolean;
  chat_enabled: boolean;
  created_at: string;
  started_at?: string;
  ended_at?: string;
}

// Room participant
export interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  role: ParticipantRole;
  is_ready: boolean;
  joined_at: string;
  last_active_at: string;
}

// Chat message in replay room
export interface ReplayMessage {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  content: string;
  timestamp: number; // video timestamp when message was sent
  type: "chat" | "reaction" | "timestamp_link" | "system";
  created_at: string;
}

// Reaction/marker on timeline
export interface ReplayMarker {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  timestamp: number;
  type: "highlight" | "question" | "mistake" | "good_play" | "funny";
  label?: string;
  created_at: string;
}

// Drawing annotation
export interface ReplayDrawing {
  id: string;
  room_id: string;
  user_id: string;
  timestamp: number;
  duration: number; // how long to show
  paths: DrawingPath[];
  created_at: string;
}

export interface DrawingPath {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

// Saved timestamp/bookmark
export interface ReplayBookmark {
  id: string;
  user_id: string;
  room_id?: string;
  replay_url: string;
  timestamp: number;
  title: string;
  description?: string;
  is_public: boolean;
  created_at: string;
}

// API types
export interface CreateRoomRequest {
  name: string;
  game_id: string;
  replay_url: string;
  replay_source: ReplaySource;
  replay_title?: string;
  is_public?: boolean;
  max_participants?: number;
  allow_reactions?: boolean;
  allow_drawing?: boolean;
  chat_enabled?: boolean;
}

export interface UpdateRoomRequest {
  status?: ReplayRoomStatus;
  current_time?: number;
  playback_speed?: number;
  name?: string;
  is_public?: boolean;
}

export interface JoinRoomRequest {
  code: string;
}

export interface SendMessageRequest {
  content: string;
  timestamp: number;
  type?: ReplayMessage["type"];
}

export interface AddMarkerRequest {
  timestamp: number;
  type: ReplayMarker["type"];
  label?: string;
}

// Marker type info
export const MARKER_TYPES: Record<
  ReplayMarker["type"],
  { name: string; emoji: string; color: string }
> = {
  highlight: { name: "Highlight", emoji: "⭐", color: "#F59E0B" },
  question: { name: "Question", emoji: "❓", color: "#3B82F6" },
  mistake: { name: "Mistake", emoji: "❌", color: "#EF4444" },
  good_play: { name: "Good Play", emoji: "✅", color: "#22C55E" },
  funny: { name: "Funny", emoji: "😂", color: "#8B5CF6" },
};

// Reaction emojis for quick reactions
export const QUICK_REACTIONS = ["👍", "👎", "😮", "🔥", "💀", "🎯", "👀", "😂"];

// Helper functions
export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function parseTimestamp(str: string): number {
  const parts = str.split(":").map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parseInt(str) || 0;
}

export function detectReplaySource(url: string): ReplaySource {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return "youtube";
  }
  if (url.includes("twitch.tv")) {
    return "twitch";
  }
  return "external";
}

export function getEmbedUrl(url: string, source: ReplaySource): string {
  if (source === "youtube") {
    // Extract video ID
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}?enablejsapi=1`;
    }
  }
  if (source === "twitch") {
    // Extract video ID
    const match = url.match(/twitch\.tv\/videos\/(\d+)/);
    if (match) {
      return `https://player.twitch.tv/?video=${match[1]}&parent=${typeof window !== "undefined" ? window.location.hostname : "localhost"}`;
    }
  }
  return url;
}
