export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          banner_url: string | null;
          bio: string | null;
          gaming_style: 'casual' | 'competitive' | 'pro' | null;
          preferred_language: string;
          region: string | null;
          timezone: string | null;
          online_hours: Json | null;
          social_links: Json | null;
          is_online: boolean;
          last_seen: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          banner_url?: string | null;
          bio?: string | null;
          gaming_style?: 'casual' | 'competitive' | 'pro' | null;
          preferred_language?: string;
          region?: string | null;
          timezone?: string | null;
          online_hours?: Json | null;
          social_links?: Json | null;
          is_online?: boolean;
          last_seen?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          banner_url?: string | null;
          bio?: string | null;
          gaming_style?: 'casual' | 'competitive' | 'pro' | null;
          preferred_language?: string;
          region?: string | null;
          timezone?: string | null;
          online_hours?: Json | null;
          social_links?: Json | null;
          is_online?: boolean;
          last_seen?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      games: {
        Row: {
          id: string;
          slug: string;
          name: string;
          icon_url: string | null;
          banner_url: string | null;
          has_api: boolean;
          api_config: Json | null;
          ranks: Json | null;
          roles: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          icon_url?: string | null;
          banner_url?: string | null;
          has_api?: boolean;
          api_config?: Json | null;
          ranks?: Json | null;
          roles?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          icon_url?: string | null;
          banner_url?: string | null;
          has_api?: boolean;
          api_config?: Json | null;
          ranks?: Json | null;
          roles?: Json | null;
          created_at?: string;
        };
      };
      user_games: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          game_username: string | null;
          game_id_external: string | null;
          rank: string | null;
          role: string | null;
          stats: Json | null;
          is_verified: boolean;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_id: string;
          game_username?: string | null;
          game_id_external?: string | null;
          rank?: string | null;
          role?: string | null;
          stats?: Json | null;
          is_verified?: boolean;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_id?: string;
          game_username?: string | null;
          game_id_external?: string | null;
          rank?: string | null;
          role?: string | null;
          stats?: Json | null;
          is_verified?: boolean;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      matches: {
        Row: {
          id: string;
          host_id: string;
          game_id: string;
          title: string;
          description: string | null;
          game_mode: string | null;
          max_players: number;
          scheduled_at: string;
          status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
          voice_channel_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          host_id: string;
          game_id: string;
          title: string;
          description?: string | null;
          game_mode?: string | null;
          max_players?: number;
          scheduled_at: string;
          status?: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
          voice_channel_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          host_id?: string;
          game_id?: string;
          title?: string;
          description?: string | null;
          game_mode?: string | null;
          max_players?: number;
          scheduled_at?: string;
          status?: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
          voice_channel_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      friendships: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          friend_id?: string;
          created_at?: string;
        };
      };
      friend_requests: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          status: 'pending' | 'accepted' | 'rejected';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          status?: 'pending' | 'accepted' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          status?: 'pending' | 'accepted' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
      };
      clans: {
        Row: {
          id: string;
          name: string;
          tag: string;
          description: string | null;
          avatar_url: string | null;
          banner_url: string | null;
          owner_id: string;
          is_public: boolean;
          member_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          tag: string;
          description?: string | null;
          avatar_url?: string | null;
          banner_url?: string | null;
          owner_id: string;
          is_public?: boolean;
          member_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          tag?: string;
          description?: string | null;
          avatar_url?: string | null;
          banner_url?: string | null;
          owner_id?: string;
          is_public?: boolean;
          member_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          data: Json | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          data?: Json | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          body?: string | null;
          data?: Json | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Game = Database['public']['Tables']['games']['Row'];
export type UserGame = Database['public']['Tables']['user_games']['Row'];
export type Match = Database['public']['Tables']['matches']['Row'];
export type Friendship = Database['public']['Tables']['friendships']['Row'];
export type FriendRequest = Database['public']['Tables']['friend_requests']['Row'];
export type Clan = Database['public']['Tables']['clans']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
