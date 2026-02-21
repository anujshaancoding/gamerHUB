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
      achievements: {
        Row: {
          id: string;
          user_id: string | null;
          game_id: string | null;
          title: string;
          description: string | null;
          badge_url: string | null;
          achievement_date: string | null;
          is_public: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          game_id?: string | null;
          title: string;
          description?: string | null;
          badge_url?: string | null;
          achievement_date?: string | null;
          is_public?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          game_id?: string | null;
          title?: string;
          description?: string | null;
          badge_url?: string | null;
          achievement_date?: string | null;
          is_public?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
      badge_definitions: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          icon_url: string | null;
          category: string;
          rarity: string;
          unlock_criteria: Json;
          xp_reward: number | null;
          game_id: string | null;
          is_active: boolean | null;
          is_secret: boolean | null;
          available_from: string | null;
          available_until: string | null;
          sort_order: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          icon_url?: string | null;
          category: string;
          rarity: string;
          unlock_criteria: Json;
          xp_reward?: number | null;
          game_id?: string | null;
          is_active?: boolean | null;
          is_secret?: boolean | null;
          available_from?: string | null;
          available_until?: string | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          icon_url?: string | null;
          category?: string;
          rarity?: string;
          unlock_criteria?: Json;
          xp_reward?: number | null;
          game_id?: string | null;
          is_active?: boolean | null;
          is_secret?: boolean | null;
          available_from?: string | null;
          available_until?: string | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
      blocked_users: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          reason: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          blocker_id: string;
          blocked_id: string;
          reason?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          blocker_id?: string;
          blocked_id?: string;
          reason?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
      blog_authors: {
        Row: {
          id: string;
          user_id: string;
          role: string | null;
          bio: string | null;
          can_publish_directly: boolean | null;
          is_verified: boolean | null;
          articles_count: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: string | null;
          bio?: string | null;
          can_publish_directly?: boolean | null;
          is_verified?: boolean | null;
          articles_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string | null;
          bio?: string | null;
          can_publish_directly?: boolean | null;
          is_verified?: boolean | null;
          articles_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
 };
      blog_bookmarks: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string | null;
        };
        Relationships: [];
 };
      blog_comment_likes: {
        Row: {
          id: string;
          comment_id: string;
          user_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          comment_id: string;
          user_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          comment_id?: string;
          user_id?: string;
          created_at?: string | null;
        };
        Relationships: [];
 };
      blog_comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          parent_id: string | null;
          content: string;
          likes_count: number | null;
          status: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          parent_id?: string | null;
          content: string;
          likes_count?: number | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          post_id?: string;
          author_id?: string;
          parent_id?: string | null;
          content?: string;
          likes_count?: number | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
 };
      blog_likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string | null;
        };
        Relationships: [];
 };
      blog_posts: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          slug: string;
          excerpt: string | null;
          content: string;
          featured_image_url: string | null;
          game_id: string | null;
          category: string;
          tags: string[] | null;
          status: string | null;
          published_at: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          views_count: number | null;
          likes_count: number | null;
          comments_count: number | null;
          meta_title: string | null;
          meta_description: string | null;
          is_featured: boolean | null;
          is_pinned: boolean | null;
          allow_comments: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          author_id: string;
          title: string;
          slug: string;
          excerpt?: string | null;
          content: string;
          featured_image_url?: string | null;
          game_id?: string | null;
          category: string;
          tags?: string[] | null;
          status?: string | null;
          published_at?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          views_count?: number | null;
          likes_count?: number | null;
          comments_count?: number | null;
          meta_title?: string | null;
          meta_description?: string | null;
          is_featured?: boolean | null;
          is_pinned?: boolean | null;
          allow_comments?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          author_id?: string;
          title?: string;
          slug?: string;
          excerpt?: string | null;
          content?: string;
          featured_image_url?: string | null;
          game_id?: string | null;
          category?: string;
          tags?: string[] | null;
          status?: string | null;
          published_at?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          views_count?: number | null;
          likes_count?: number | null;
          comments_count?: number | null;
          meta_title?: string | null;
          meta_description?: string | null;
          is_featured?: boolean | null;
          is_pinned?: boolean | null;
          allow_comments?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
 };
      call_participants: {
        Row: {
          id: string;
          call_id: string;
          user_id: string;
          status: string | null;
          joined_at: string | null;
          left_at: string | null;
          is_muted: boolean | null;
          is_video_enabled: boolean | null;
          is_screen_sharing: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          call_id: string;
          user_id: string;
          status?: string | null;
          joined_at?: string | null;
          left_at?: string | null;
          is_muted?: boolean | null;
          is_video_enabled?: boolean | null;
          is_screen_sharing?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          call_id?: string;
          user_id?: string;
          status?: string | null;
          joined_at?: string | null;
          left_at?: string | null;
          is_muted?: boolean | null;
          is_video_enabled?: boolean | null;
          is_screen_sharing?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
      calls: {
        Row: {
          id: string;
          conversation_id: string;
          initiator_id: string | null;
          type: string;
          status: string | null;
          room_name: string;
          started_at: string | null;
          ended_at: string | null;
          duration_seconds: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          initiator_id?: string | null;
          type: string;
          status?: string | null;
          room_name: string;
          started_at?: string | null;
          ended_at?: string | null;
          duration_seconds?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          initiator_id?: string | null;
          type?: string;
          status?: string | null;
          room_name?: string;
          started_at?: string | null;
          ended_at?: string | null;
          duration_seconds?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
 };
      challenge_progress: {
        Row: {
          id: string;
          challenge_id: string;
          user_id: string;
          status: string | null;
          progress: Json;
          started_at: string | null;
          completed_at: string | null;
          points_awarded: number | null;
          metadata: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          challenge_id: string;
          user_id: string;
          status?: string | null;
          progress: Json;
          started_at?: string | null;
          completed_at?: string | null;
          points_awarded?: number | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          challenge_id?: string;
          user_id?: string;
          status?: string | null;
          progress?: Json;
          started_at?: string | null;
          completed_at?: string | null;
          points_awarded?: number | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
 };
      challenges: {
        Row: {
          id: string;
          creator_id: string | null;
          game_id: string | null;
          title: string;
          description: string | null;
          rules: string | null;
          rank_requirement: string | null;
          reward: string | null;
          status: string | null;
          accepted_by: string | null;
          match_id: string | null;
          expires_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          creator_id?: string | null;
          game_id?: string | null;
          title: string;
          description?: string | null;
          rules?: string | null;
          rank_requirement?: string | null;
          reward?: string | null;
          status?: string | null;
          accepted_by?: string | null;
          match_id?: string | null;
          expires_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          creator_id?: string | null;
          game_id?: string | null;
          title?: string;
          description?: string | null;
          rules?: string | null;
          rank_requirement?: string | null;
          reward?: string | null;
          status?: string | null;
          accepted_by?: string | null;
          match_id?: string | null;
          expires_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
      clan_achievements: {
        Row: {
          id: string;
          clan_id: string;
          title: string;
          description: string | null;
          badge_url: string | null;
          achievement_type: string | null;
          achievement_date: string | null;
          metadata: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          clan_id: string;
          title: string;
          description?: string | null;
          badge_url?: string | null;
          achievement_type?: string | null;
          achievement_date?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          clan_id?: string;
          title?: string;
          description?: string | null;
          badge_url?: string | null;
          achievement_type?: string | null;
          achievement_date?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
      clan_activity_log: {
        Row: {
          id: string;
          clan_id: string;
          user_id: string | null;
          activity_type: string;
          description: string | null;
          metadata: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          clan_id: string;
          user_id?: string | null;
          activity_type: string;
          description?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          clan_id?: string;
          user_id?: string | null;
          activity_type?: string;
          description?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
      clan_challenges: {
        Row: {
          id: string;
          challenger_clan_id: string;
          challenged_clan_id: string | null;
          game_id: string | null;
          title: string;
          description: string | null;
          rules: string | null;
          format: string | null;
          team_size: number | null;
          scheduled_at: string | null;
          status: string | null;
          winner_clan_id: string | null;
          result: Json | null;
          conversation_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          challenger_clan_id: string;
          challenged_clan_id?: string | null;
          game_id?: string | null;
          title: string;
          description?: string | null;
          rules?: string | null;
          format?: string | null;
          team_size?: number | null;
          scheduled_at?: string | null;
          status?: string | null;
          winner_clan_id?: string | null;
          result?: Json | null;
          conversation_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          challenger_clan_id?: string;
          challenged_clan_id?: string | null;
          game_id?: string | null;
          title?: string;
          description?: string | null;
          rules?: string | null;
          format?: string | null;
          team_size?: number | null;
          scheduled_at?: string | null;
          status?: string | null;
          winner_clan_id?: string | null;
          result?: Json | null;
          conversation_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
 };
      clan_games: {
        Row: {
          id: string;
          clan_id: string;
          game_id: string;
          is_primary: boolean | null;
          min_rank: string | null;
          stats: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          clan_id: string;
          game_id: string;
          is_primary?: boolean | null;
          min_rank?: string | null;
          stats?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          clan_id?: string;
          game_id?: string;
          is_primary?: boolean | null;
          min_rank?: string | null;
          stats?: Json | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
      clan_invites: {
        Row: {
          id: string;
          clan_id: string;
          user_id: string;
          invited_by: string | null;
          type: string;
          status: string | null;
          message: string | null;
          expires_at: string | null;
          created_at: string | null;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          clan_id: string;
          user_id: string;
          invited_by?: string | null;
          type: string;
          status?: string | null;
          message?: string | null;
          expires_at?: string | null;
          created_at?: string | null;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          clan_id?: string;
          user_id?: string;
          invited_by?: string | null;
          type?: string;
          status?: string | null;
          message?: string | null;
          expires_at?: string | null;
          created_at?: string | null;
          responded_at?: string | null;
        };
        Relationships: [];
 };
      clan_members: {
        Row: {
          id: string;
          clan_id: string;
          user_id: string;
          role: string | null;
          joined_at: string | null;
          promoted_at: string | null;
          contribution_points: number | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          clan_id: string;
          user_id: string;
          role?: string | null;
          joined_at?: string | null;
          promoted_at?: string | null;
          contribution_points?: number | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          clan_id?: string;
          user_id?: string;
          role?: string | null;
          joined_at?: string | null;
          promoted_at?: string | null;
          contribution_points?: number | null;
          notes?: string | null;
        };
        Relationships: [];
 };
      clan_recruitment_posts: {
        Row: {
          id: string;
          clan_id: string;
          created_by: string | null;
          game_id: string | null;
          title: string;
          description: string;
          requirements: Json | null;
          positions_available: number | null;
          is_active: boolean | null;
          expires_at: string | null;
          views_count: number | null;
          applications_count: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          clan_id: string;
          created_by?: string | null;
          game_id?: string | null;
          title: string;
          description: string;
          requirements?: Json | null;
          positions_available?: number | null;
          is_active?: boolean | null;
          expires_at?: string | null;
          views_count?: number | null;
          applications_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          clan_id?: string;
          created_by?: string | null;
          game_id?: string | null;
          title?: string;
          description?: string;
          requirements?: Json | null;
          positions_available?: number | null;
          is_active?: boolean | null;
          expires_at?: string | null;
          views_count?: number | null;
          applications_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
 };
      clans: {
        Row: {
          id: string;
          name: string;
          tag: string;
          slug: string;
          description: string | null;
          avatar_url: string | null;
          banner_url: string | null;
          primary_game_id: string | null;
          region: string | null;
          language: string | null;
          min_rank_requirement: string | null;
          max_members: number | null;
          is_public: boolean | null;
          is_recruiting: boolean | null;
          conversation_id: string | null;
          settings: Json | null;
          stats: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          tag: string;
          slug: string;
          description?: string | null;
          avatar_url?: string | null;
          banner_url?: string | null;
          primary_game_id?: string | null;
          region?: string | null;
          language?: string | null;
          min_rank_requirement?: string | null;
          max_members?: number | null;
          is_public?: boolean | null;
          is_recruiting?: boolean | null;
          conversation_id?: string | null;
          settings?: Json | null;
          stats?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          tag?: string;
          slug?: string;
          description?: string | null;
          avatar_url?: string | null;
          banner_url?: string | null;
          primary_game_id?: string | null;
          region?: string | null;
          language?: string | null;
          min_rank_requirement?: string | null;
          max_members?: number | null;
          is_public?: boolean | null;
          is_recruiting?: boolean | null;
          conversation_id?: string | null;
          settings?: Json | null;
          stats?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
 };
      community_challenges: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          rules: string | null;
          challenge_type: string;
          difficulty: string | null;
          season_id: string | null;
          game_id: string | null;
          period_type: string;
          starts_at: string;
          ends_at: string;
          status: string | null;
          objectives: Json;
          points_reward: number | null;
          bonus_rewards: Json | null;
          max_participants: number | null;
          icon_url: string | null;
          banner_url: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          rules?: string | null;
          challenge_type: string;
          difficulty?: string | null;
          season_id?: string | null;
          game_id?: string | null;
          period_type: string;
          starts_at: string;
          ends_at: string;
          status?: string | null;
          objectives: Json;
          points_reward?: number | null;
          bonus_rewards?: Json | null;
          max_participants?: number | null;
          icon_url?: string | null;
          banner_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          rules?: string | null;
          challenge_type?: string;
          difficulty?: string | null;
          season_id?: string | null;
          game_id?: string | null;
          period_type?: string;
          starts_at?: string;
          ends_at?: string;
          status?: string | null;
          objectives?: Json;
          points_reward?: number | null;
          bonus_rewards?: Json | null;
          max_participants?: number | null;
          icon_url?: string | null;
          banner_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
 };
      conversation_participants: {
        Row: {
          id: string;
          conversation_id: string | null;
          user_id: string | null;
          last_read_at: string | null;
          joined_at: string | null;
        };
        Insert: {
          id?: string;
          conversation_id?: string | null;
          user_id?: string | null;
          last_read_at?: string | null;
          joined_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string | null;
          user_id?: string | null;
          last_read_at?: string | null;
          joined_at?: string | null;
        };
        Relationships: [];
 };
      conversations: {
        Row: {
          id: string;
          type: string | null;
          match_id: string | null;
          name: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          type?: string | null;
          match_id?: string | null;
          name?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          type?: string | null;
          match_id?: string | null;
          name?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
 };
      followers_only_view: {
        Row: {
          user_id: string | null;
          follower_id: string | null;
          created_at: string | null;
        };
        Insert: {
          user_id?: string | null;
          follower_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          user_id?: string | null;
          follower_id?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
      following_only_view: {
        Row: {
          user_id: string | null;
          following_id: string | null;
          created_at: string | null;
        };
        Insert: {
          user_id?: string | null;
          following_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          user_id?: string | null;
          following_id?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
      follows: {
        Row: {
          id: string;
          follower_id: string | null;
          following_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          follower_id?: string | null;
          following_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          follower_id?: string | null;
          following_id?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
      friend_requests: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          message: string | null;
          status: string | null;
          created_at: string | null;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          message?: string | null;
          status?: string | null;
          created_at?: string | null;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          sender_id?: string;
          recipient_id?: string;
          message?: string | null;
          status?: string | null;
          created_at?: string | null;
          responded_at?: string | null;
        };
        Relationships: [];
 };
      game_connections: {
        Row: {
          id: string;
          user_id: string;
          provider: "riot" | "steam" | "supercell";
          provider_user_id: string;
          provider_username: string | null;
          provider_avatar_url: string | null;
          access_token: string | null;
          refresh_token: string | null;
          token_expires_at: string | null;
          scopes: string[] | null;
          metadata: Json | null;
          connected_at: string | null;
          last_synced_at: string | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: "riot" | "steam" | "supercell";
          provider_user_id: string;
          provider_username?: string | null;
          provider_avatar_url?: string | null;
          access_token?: string | null;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          scopes?: string[] | null;
          metadata?: Json | null;
          connected_at?: string | null;
          last_synced_at?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: "riot" | "steam" | "supercell";
          provider_user_id?: string;
          provider_username?: string | null;
          provider_avatar_url?: string | null;
          access_token?: string | null;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          scopes?: string[] | null;
          metadata?: Json | null;
          connected_at?: string | null;
          last_synced_at?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
 };
      game_match_history: {
        Row: {
          id: string;
          user_id: string;
          connection_id: string;
          game_id: string;
          external_match_id: string;
          game_mode: string | null;
          map_name: string | null;
          agent_or_champion: string | null;
          result: string | null;
          score: Json | null;
          stats: Json;
          duration_seconds: number | null;
          played_at: string;
          synced_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          connection_id: string;
          game_id: string;
          external_match_id: string;
          game_mode?: string | null;
          map_name?: string | null;
          agent_or_champion?: string | null;
          result?: string | null;
          score?: Json | null;
          stats: Json;
          duration_seconds?: number | null;
          played_at: string;
          synced_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          connection_id?: string;
          game_id?: string;
          external_match_id?: string;
          game_mode?: string | null;
          map_name?: string | null;
          agent_or_champion?: string | null;
          result?: string | null;
          score?: Json | null;
          stats?: Json;
          duration_seconds?: number | null;
          played_at?: string;
          synced_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
      game_roles: {
        Row: {
          id: string;
          game_id: string;
          name: string;
          display_name: string;
          description: string | null;
          icon_url: string | null;
          sort_order: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          game_id: string;
          name: string;
          display_name: string;
          description?: string | null;
          icon_url?: string | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          game_id?: string;
          name?: string;
          display_name?: string;
          description?: string | null;
          icon_url?: string | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
      game_stats: {
        Row: {
          id: string;
          user_id: string;
          connection_id: string;
          game_id: string;
          game_mode: string | null;
          season: string | null;
          stats: Json;
          rank_info: Json | null;
          last_match_at: string | null;
          synced_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          connection_id: string;
          game_id: string;
          game_mode?: string | null;
          season?: string | null;
          stats: Json;
          rank_info?: Json | null;
          last_match_at?: string | null;
          synced_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          connection_id?: string;
          game_id?: string;
          game_mode?: string | null;
          season?: string | null;
          stats?: Json;
          rank_info?: Json | null;
          last_match_at?: string | null;
          synced_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
 };
      game_sync_jobs: {
        Row: {
          id: string;
          user_id: string;
          connection_id: string;
          sync_type: string;
          status: "pending" | "syncing" | "completed" | "failed";
          started_at: string | null;
          completed_at: string | null;
          error_message: string | null;
          stats_synced: number | null;
          matches_synced: number | null;
          metadata: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          connection_id: string;
          sync_type?: string;
          status?: "pending" | "syncing" | "completed" | "failed";
          started_at?: string | null;
          completed_at?: string | null;
          error_message?: string | null;
          stats_synced?: number | null;
          matches_synced?: number | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          connection_id?: string;
          sync_type?: string;
          status?: "pending" | "syncing" | "completed" | "failed";
          started_at?: string | null;
          completed_at?: string | null;
          error_message?: string | null;
          stats_synced?: number | null;
          matches_synced?: number | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
      games: {
        Row: {
          id: string;
          slug: string;
          name: string;
          icon_url: string | null;
          banner_url: string | null;
          has_api: boolean | null;
          api_config: Json | null;
          ranks: Json | null;
          roles: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          icon_url?: string | null;
          banner_url?: string | null;
          has_api?: boolean | null;
          api_config?: Json | null;
          ranks?: Json | null;
          roles?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          icon_url?: string | null;
          banner_url?: string | null;
          has_api?: boolean | null;
          api_config?: Json | null;
          ranks?: Json | null;
          roles?: Json | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
      leaderboard_snapshots: {
        Row: {
          id: string;
          season_id: string;
          game_id: string | null;
          region: string | null;
          snapshot_type: string;
          snapshot_date: string;
          rankings: Json;
          total_participants: number | null;
          average_points: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          season_id: string;
          game_id?: string | null;
          region?: string | null;
          snapshot_type: string;
          snapshot_date: string;
          rankings: Json;
          total_participants?: number | null;
          average_points?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          season_id?: string;
          game_id?: string | null;
          region?: string | null;
          snapshot_type?: string;
          snapshot_date?: string;
          rankings?: Json;
          total_participants?: number | null;
          average_points?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
      level_thresholds: {
        Row: {
          level: number;
          xp_required: number;
          total_xp_required: number;
          rewards: Json | null;
          created_at: string | null;
        };
        Insert: {
          level: number;
          xp_required: number;
          total_xp_required: number;
          rewards?: Json | null;
          created_at?: string | null;
        };
        Update: {
          level?: number;
          xp_required?: number;
          total_xp_required?: number;
          rewards?: Json | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
      lfg_applications: {
        Row: {
          id: string;
          post_id: string;
          applicant_id: string;
          applicant_role: string | null;
          applicant_rating: number | null;
          applicant_is_unranked: boolean | null;
          message: string | null;
          status: string | null;
          created_at: string | null;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          post_id: string;
          applicant_id: string;
          applicant_role?: string | null;
          applicant_rating?: number | null;
          applicant_is_unranked?: boolean | null;
          message?: string | null;
          status?: string | null;
          created_at?: string | null;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          post_id?: string;
          applicant_id?: string;
          applicant_role?: string | null;
          applicant_rating?: number | null;
          applicant_is_unranked?: boolean | null;
          message?: string | null;
          status?: string | null;
          created_at?: string | null;
          responded_at?: string | null;
        };
        Relationships: [];
 };
      lfg_posts: {
        Row: {
          id: string;
          creator_id: string;
          game_id: string;
          title: string;
          description: string | null;
          creator_role: string | null;
          creator_rating: number | null;
          creator_is_unranked: boolean | null;
          looking_for_roles: string[] | null;
          min_rating: number | null;
          max_rating: number | null;
          accept_unranked: boolean | null;
          game_mode: string | null;
          region: string | null;
          language: string | null;
          voice_required: boolean | null;
          current_players: number | null;
          max_players: number | null;
          duration_type: string | null;
          expires_at: string;
          status: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          creator_id: string;
          game_id: string;
          title: string;
          description?: string | null;
          creator_role?: string | null;
          creator_rating?: number | null;
          creator_is_unranked?: boolean | null;
          looking_for_roles?: string[] | null;
          min_rating?: number | null;
          max_rating?: number | null;
          accept_unranked?: boolean | null;
          game_mode?: string | null;
          region?: string | null;
          language?: string | null;
          voice_required?: boolean | null;
          current_players?: number | null;
          max_players?: number | null;
          duration_type?: string | null;
          expires_at: string;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          creator_id?: string;
          game_id?: string;
          title?: string;
          description?: string | null;
          creator_role?: string | null;
          creator_rating?: number | null;
          creator_is_unranked?: boolean | null;
          looking_for_roles?: string[] | null;
          min_rating?: number | null;
          max_rating?: number | null;
          accept_unranked?: boolean | null;
          game_mode?: string | null;
          region?: string | null;
          language?: string | null;
          voice_required?: boolean | null;
          current_players?: number | null;
          max_players?: number | null;
          duration_type?: string | null;
          expires_at?: string;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
 };
      match_participants: {
        Row: {
          id: string;
          match_id: string | null;
          user_id: string | null;
          status: string | null;
          team: string | null;
          joined_at: string | null;
        };
        Insert: {
          id?: string;
          match_id?: string | null;
          user_id?: string | null;
          status?: string | null;
          team?: string | null;
          joined_at?: string | null;
        };
        Update: {
          id?: string;
          match_id?: string | null;
          user_id?: string | null;
          status?: string | null;
          team?: string | null;
          joined_at?: string | null;
        };
        Relationships: [];
 };
      matches: {
        Row: {
          id: string;
          game_id: string | null;
          creator_id: string | null;
          title: string | null;
          description: string | null;
          scheduled_at: string;
          duration_minutes: number | null;
          max_players: number | null;
          status: string | null;
          match_type: string | null;
          requirements: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          game_id?: string | null;
          creator_id?: string | null;
          title?: string | null;
          description?: string | null;
          scheduled_at: string;
          duration_minutes?: number | null;
          max_players?: number | null;
          status?: string | null;
          match_type?: string | null;
          requirements?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          game_id?: string | null;
          creator_id?: string | null;
          title?: string | null;
          description?: string | null;
          scheduled_at?: string;
          duration_minutes?: number | null;
          max_players?: number | null;
          status?: string | null;
          match_type?: string | null;
          requirements?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
 };
      media: {
        Row: {
          id: string;
          user_id: string | null;
          game_id: string | null;
          type: string;
          url: string;
          thumbnail_url: string | null;
          title: string | null;
          description: string | null;
          file_size: number | null;
          duration_seconds: number | null;
          is_public: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          game_id?: string | null;
          type: string;
          url: string;
          thumbnail_url?: string | null;
          title?: string | null;
          description?: string | null;
          file_size?: number | null;
          duration_seconds?: number | null;
          is_public?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          game_id?: string | null;
          type?: string;
          url?: string;
          thumbnail_url?: string | null;
          title?: string | null;
          description?: string | null;
          file_size?: number | null;
          duration_seconds?: number | null;
          is_public?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
      messages: {
        Row: {
          id: string;
          conversation_id: string | null;
          sender_id: string | null;
          content: string;
          type: string | null;
          is_edited: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          conversation_id?: string | null;
          sender_id?: string | null;
          content: string;
          type?: string | null;
          is_edited?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string | null;
          sender_id?: string | null;
          content?: string;
          type?: string | null;
          is_edited?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
 };
      point_transactions: {
        Row: {
          id: string;
          season_points_id: string;
          user_id: string;
          season_id: string;
          points: number;
          transaction_type: string;
          source_type: string | null;
          source_id: string | null;
          description: string | null;
          metadata: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          season_points_id: string;
          user_id: string;
          season_id: string;
          points: number;
          transaction_type: string;
          source_type?: string | null;
          source_id?: string | null;
          description?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          season_points_id?: string;
          user_id?: string;
          season_id?: string;
          points?: number;
          transaction_type?: string;
          source_type?: string | null;
          source_id?: string | null;
          description?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
      profile_frames: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          image_url: string;
          unlock_type: string;
          unlock_value: Json | null;
          rarity: string | null;
          is_active: boolean | null;
          sort_order: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          image_url: string;
          unlock_type: string;
          unlock_value?: Json | null;
          rarity?: string | null;
          is_active?: boolean | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          image_url?: string;
          unlock_type?: string;
          unlock_value?: Json | null;
          rarity?: string | null;
          is_active?: boolean | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
      profile_themes: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          primary_color: string;
          secondary_color: string | null;
          accent_color: string | null;
          background_gradient: Json | null;
          unlock_type: string;
          unlock_value: Json | null;
          rarity: string | null;
          is_active: boolean | null;
          sort_order: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          primary_color: string;
          secondary_color?: string | null;
          accent_color?: string | null;
          background_gradient?: Json | null;
          unlock_type: string;
          unlock_value?: Json | null;
          rarity?: string | null;
          is_active?: boolean | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          primary_color?: string;
          secondary_color?: string | null;
          accent_color?: string | null;
          background_gradient?: Json | null;
          unlock_type?: string;
          unlock_value?: Json | null;
          rarity?: string | null;
          is_active?: boolean | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          banner_url: string | null;
          bio: string | null;
          gaming_style: string | null;
          preferred_language: string | null;
          region: string | null;
          timezone: string | null;
          online_hours: Json | null;
          social_links: Json | null;
          is_online: boolean | null;
          last_seen: string | null;
          status: string;
          status_until: string | null;
          is_premium: boolean | null;
          premium_until: string | null;
          is_verified: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          banner_url?: string | null;
          bio?: string | null;
          gaming_style?: string | null;
          preferred_language?: string | null;
          region?: string | null;
          timezone?: string | null;
          online_hours?: Json | null;
          social_links?: Json | null;
          is_online?: boolean | null;
          last_seen?: string | null;
          status?: string;
          status_until?: string | null;
          is_premium?: boolean | null;
          premium_until?: string | null;
          is_verified?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          banner_url?: string | null;
          bio?: string | null;
          gaming_style?: string | null;
          preferred_language?: string | null;
          region?: string | null;
          timezone?: string | null;
          online_hours?: Json | null;
          social_links?: Json | null;
          is_online?: boolean | null;
          last_seen?: string | null;
          status?: string;
          status_until?: string | null;
          is_premium?: boolean | null;
          premium_until?: string | null;
          is_verified?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
 };
      quest_definitions: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          icon_url: string | null;
          quest_type: string;
          requirements: Json;
          xp_reward: number;
          bonus_rewards: Json | null;
          weight: number | null;
          game_id: string | null;
          is_active: boolean | null;
          min_level: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          icon_url?: string | null;
          quest_type: string;
          requirements: Json;
          xp_reward: number;
          bonus_rewards?: Json | null;
          weight?: number | null;
          game_id?: string | null;
          is_active?: boolean | null;
          min_level?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          icon_url?: string | null;
          quest_type?: string;
          requirements?: Json;
          xp_reward?: number;
          bonus_rewards?: Json | null;
          weight?: number | null;
          game_id?: string | null;
          is_active?: boolean | null;
          min_level?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
      ratings: {
        Row: {
          id: string;
          rater_id: string | null;
          rated_id: string | null;
          match_id: string | null;
          politeness: number | null;
          fair_play: number | null;
          communication: number | null;
          skill_consistency: number | null;
          comment: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          rater_id?: string | null;
          rated_id?: string | null;
          match_id?: string | null;
          politeness?: number | null;
          fair_play?: number | null;
          communication?: number | null;
          skill_consistency?: number | null;
          comment?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          rater_id?: string | null;
          rated_id?: string | null;
          match_id?: string | null;
          politeness?: number | null;
          fair_play?: number | null;
          communication?: number | null;
          skill_consistency?: number | null;
          comment?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
      season_points: {
        Row: {
          id: string;
          season_id: string;
          user_id: string;
          game_id: string | null;
          total_points: number | null;
          match_points: number | null;
          challenge_points: number | null;
          rating_points: number | null;
          bonus_points: number | null;
          matches_played: number | null;
          matches_won: number | null;
          current_win_streak: number | null;
          best_win_streak: number | null;
          challenges_completed: number | null;
          ratings_received: number | null;
          average_rating: number | null;
          login_streak_days: number | null;
          last_login_date: string | null;
          last_match_date: string | null;
          region: string | null;
          current_rank: number | null;
          peak_rank: number | null;
          previous_rank: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          season_id: string;
          user_id: string;
          game_id?: string | null;
          total_points?: number | null;
          match_points?: number | null;
          challenge_points?: number | null;
          rating_points?: number | null;
          bonus_points?: number | null;
          matches_played?: number | null;
          matches_won?: number | null;
          current_win_streak?: number | null;
          best_win_streak?: number | null;
          challenges_completed?: number | null;
          ratings_received?: number | null;
          average_rating?: number | null;
          login_streak_days?: number | null;
          last_login_date?: string | null;
          last_match_date?: string | null;
          region?: string | null;
          current_rank?: number | null;
          peak_rank?: number | null;
          previous_rank?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          season_id?: string;
          user_id?: string;
          game_id?: string | null;
          total_points?: number | null;
          match_points?: number | null;
          challenge_points?: number | null;
          rating_points?: number | null;
          bonus_points?: number | null;
          matches_played?: number | null;
          matches_won?: number | null;
          current_win_streak?: number | null;
          best_win_streak?: number | null;
          challenges_completed?: number | null;
          ratings_received?: number | null;
          average_rating?: number | null;
          login_streak_days?: number | null;
          last_login_date?: string | null;
          last_match_date?: string | null;
          region?: string | null;
          current_rank?: number | null;
          peak_rank?: number | null;
          previous_rank?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
 };
      season_rewards: {
        Row: {
          id: string;
          season_id: string;
          name: string;
          description: string | null;
          reward_type: string;
          reward_value: Json;
          rank_requirement: number | null;
          points_requirement: number | null;
          percentile_requirement: number | null;
          max_recipients: number | null;
          current_recipients: number | null;
          auto_grant: boolean | null;
          claim_deadline: string | null;
          icon_url: string | null;
          rarity: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          season_id: string;
          name: string;
          description?: string | null;
          reward_type: string;
          reward_value: Json;
          rank_requirement?: number | null;
          points_requirement?: number | null;
          percentile_requirement?: number | null;
          max_recipients?: number | null;
          current_recipients?: number | null;
          auto_grant?: boolean | null;
          claim_deadline?: string | null;
          icon_url?: string | null;
          rarity?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          season_id?: string;
          name?: string;
          description?: string | null;
          reward_type?: string;
          reward_value?: Json;
          rank_requirement?: number | null;
          points_requirement?: number | null;
          percentile_requirement?: number | null;
          max_recipients?: number | null;
          current_recipients?: number | null;
          auto_grant?: boolean | null;
          claim_deadline?: string | null;
          icon_url?: string | null;
          rarity?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
      seasons: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          season_number: number;
          starts_at: string;
          ends_at: string;
          status: string | null;
          game_id: string | null;
          point_config: Json | null;
          banner_url: string | null;
          theme_config: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          season_number: number;
          starts_at: string;
          ends_at: string;
          status?: string | null;
          game_id?: string | null;
          point_config?: Json | null;
          banner_url?: string | null;
          theme_config?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          season_number?: number;
          starts_at?: string;
          ends_at?: string;
          status?: string | null;
          game_id?: string | null;
          point_config?: Json | null;
          banner_url?: string | null;
          theme_config?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
 };
      supported_games: {
        Row: {
          id: string;
          name: string;
          provider: "riot" | "steam" | "supercell";
          icon_url: string | null;
          banner_url: string | null;
          description: string | null;
          stat_fields: Json | null;
          rank_system: Json | null;
          is_active: boolean | null;
          display_order: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          provider: "riot" | "steam" | "supercell";
          icon_url?: string | null;
          banner_url?: string | null;
          description?: string | null;
          stat_fields?: Json | null;
          rank_system?: Json | null;
          is_active?: boolean | null;
          display_order?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          provider?: "riot" | "steam" | "supercell";
          icon_url?: string | null;
          banner_url?: string | null;
          description?: string | null;
          stat_fields?: Json | null;
          rank_system?: Json | null;
          is_active?: boolean | null;
          display_order?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
      titles: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          unlock_type: string;
          unlock_value: Json | null;
          rarity: string | null;
          color: string | null;
          is_active: boolean | null;
          sort_order: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          unlock_type: string;
          unlock_value?: Json | null;
          rarity?: string | null;
          color?: string | null;
          is_active?: boolean | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          unlock_type?: string;
          unlock_value?: Json | null;
          rarity?: string | null;
          color?: string | null;
          is_active?: boolean | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
      tournament_activity_log: {
        Row: {
          id: string;
          tournament_id: string;
          match_id: string | null;
          user_id: string | null;
          activity_type: string;
          description: string | null;
          metadata: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          match_id?: string | null;
          user_id?: string | null;
          activity_type: string;
          description?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          match_id?: string | null;
          user_id?: string | null;
          activity_type?: string;
          description?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
      tournament_match_games: {
        Row: {
          id: string;
          match_id: string;
          game_number: number;
          winner_id: string | null;
          team1_score: number | null;
          team2_score: number | null;
          map: string | null;
          duration_seconds: number | null;
          stats: Json | null;
          screenshot_url: string | null;
          played_at: string | null;
        };
        Insert: {
          id?: string;
          match_id: string;
          game_number: number;
          winner_id?: string | null;
          team1_score?: number | null;
          team2_score?: number | null;
          map?: string | null;
          duration_seconds?: number | null;
          stats?: Json | null;
          screenshot_url?: string | null;
          played_at?: string | null;
        };
        Update: {
          id?: string;
          match_id?: string;
          game_number?: number;
          winner_id?: string | null;
          team1_score?: number | null;
          team2_score?: number | null;
          map?: string | null;
          duration_seconds?: number | null;
          stats?: Json | null;
          screenshot_url?: string | null;
          played_at?: string | null;
        };
        Relationships: [];
 };
      tournament_matches: {
        Row: {
          id: string;
          tournament_id: string;
          round: number;
          match_number: number;
          bracket_type: string | null;
          team1_id: string | null;
          team2_id: string | null;
          winner_advances_to: string | null;
          loser_advances_to: string | null;
          team1_from_match: string | null;
          team2_from_match: string | null;
          team1_is_winner: boolean | null;
          team2_is_winner: boolean | null;
          scheduled_at: string | null;
          started_at: string | null;
          completed_at: string | null;
          status: string | null;
          winner_id: string | null;
          team1_score: number | null;
          team2_score: number | null;
          result: Json | null;
          best_of: number | null;
          disputed: boolean | null;
          dispute_reason: string | null;
          dispute_resolved_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          round: number;
          match_number: number;
          bracket_type?: string | null;
          team1_id?: string | null;
          team2_id?: string | null;
          winner_advances_to?: string | null;
          loser_advances_to?: string | null;
          team1_from_match?: string | null;
          team2_from_match?: string | null;
          team1_is_winner?: boolean | null;
          team2_is_winner?: boolean | null;
          scheduled_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          status?: string | null;
          winner_id?: string | null;
          team1_score?: number | null;
          team2_score?: number | null;
          result?: Json | null;
          best_of?: number | null;
          disputed?: boolean | null;
          dispute_reason?: string | null;
          dispute_resolved_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          round?: number;
          match_number?: number;
          bracket_type?: string | null;
          team1_id?: string | null;
          team2_id?: string | null;
          winner_advances_to?: string | null;
          loser_advances_to?: string | null;
          team1_from_match?: string | null;
          team2_from_match?: string | null;
          team1_is_winner?: boolean | null;
          team2_is_winner?: boolean | null;
          scheduled_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          status?: string | null;
          winner_id?: string | null;
          team1_score?: number | null;
          team2_score?: number | null;
          result?: Json | null;
          best_of?: number | null;
          disputed?: boolean | null;
          dispute_reason?: string | null;
          dispute_resolved_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
 };
      tournament_participants: {
        Row: {
          id: string;
          tournament_id: string;
          clan_id: string;
          registered_by: string | null;
          seed: number | null;
          status: string | null;
          checked_in_at: string | null;
          checked_in_by: string | null;
          final_placement: number | null;
          total_wins: number | null;
          total_losses: number | null;
          roster: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          clan_id: string;
          registered_by?: string | null;
          seed?: number | null;
          status?: string | null;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          final_placement?: number | null;
          total_wins?: number | null;
          total_losses?: number | null;
          roster?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          clan_id?: string;
          registered_by?: string | null;
          seed?: number | null;
          status?: string | null;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          final_placement?: number | null;
          total_wins?: number | null;
          total_losses?: number | null;
          roster?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
 };
      tournaments: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          banner_url: string | null;
          organizer_clan_id: string | null;
          organizer_user_id: string | null;
          game_id: string | null;
          format: string;
          team_size: number | null;
          max_teams: number | null;
          min_teams: number | null;
          registration_start: string;
          registration_end: string;
          start_date: string;
          end_date: string | null;
          status: string | null;
          prize_pool: Json | null;
          rules: string | null;
          settings: Json | null;
          bracket_data: Json | null;
          conversation_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          banner_url?: string | null;
          organizer_clan_id?: string | null;
          organizer_user_id?: string | null;
          game_id?: string | null;
          format?: string;
          team_size?: number | null;
          max_teams?: number | null;
          min_teams?: number | null;
          registration_start: string;
          registration_end: string;
          start_date: string;
          end_date?: string | null;
          status?: string | null;
          prize_pool?: Json | null;
          rules?: string | null;
          settings?: Json | null;
          bracket_data?: Json | null;
          conversation_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          banner_url?: string | null;
          organizer_clan_id?: string | null;
          organizer_user_id?: string | null;
          game_id?: string | null;
          format?: string;
          team_size?: number | null;
          max_teams?: number | null;
          min_teams?: number | null;
          registration_start?: string;
          registration_end?: string;
          start_date?: string;
          end_date?: string | null;
          status?: string | null;
          prize_pool?: Json | null;
          rules?: string | null;
          settings?: Json | null;
          bracket_data?: Json | null;
          conversation_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
 };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          earned_at: string | null;
          progress: Json | null;
          season: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_id: string;
          earned_at?: string | null;
          progress?: Json | null;
          season?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          badge_id?: string;
          earned_at?: string | null;
          progress?: Json | null;
          season?: string | null;
        };
        Relationships: [];
 };
      user_frames: {
        Row: {
          id: string;
          user_id: string;
          frame_id: string;
          unlocked_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          frame_id: string;
          unlocked_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          frame_id?: string;
          unlocked_at?: string | null;
        };
        Relationships: [];
 };
      user_game_progression: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          xp: number | null;
          level: number | null;
          stats: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_id: string;
          xp?: number | null;
          level?: number | null;
          stats?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_id?: string;
          xp?: number | null;
          level?: number | null;
          stats?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
 };
      user_games: {
        Row: {
          id: string;
          user_id: string | null;
          game_id: string | null;
          game_username: string | null;
          game_id_external: string | null;
          rank: string | null;
          role: string | null;
          stats: Json | null;
          is_verified: boolean | null;
          is_public: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          game_id?: string | null;
          game_username?: string | null;
          game_id_external?: string | null;
          rank?: string | null;
          role?: string | null;
          stats?: Json | null;
          is_verified?: boolean | null;
          is_public?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          game_id?: string | null;
          game_username?: string | null;
          game_id_external?: string | null;
          rank?: string | null;
          role?: string | null;
          stats?: Json | null;
          is_verified?: boolean | null;
          is_public?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
 };
      user_progression: {
        Row: {
          id: string;
          user_id: string;
          total_xp: number | null;
          level: number | null;
          current_level_xp: number | null;
          xp_to_next_level: number | null;
          prestige_level: number | null;
          active_title_id: string | null;
          active_frame_id: string | null;
          active_theme_id: string | null;
          showcase_badges: Json | null;
          stats: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          total_xp?: number | null;
          level?: number | null;
          current_level_xp?: number | null;
          xp_to_next_level?: number | null;
          prestige_level?: number | null;
          active_title_id?: string | null;
          active_frame_id?: string | null;
          active_theme_id?: string | null;
          showcase_badges?: Json | null;
          stats?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          total_xp?: number | null;
          level?: number | null;
          current_level_xp?: number | null;
          xp_to_next_level?: number | null;
          prestige_level?: number | null;
          active_title_id?: string | null;
          active_frame_id?: string | null;
          active_theme_id?: string | null;
          showcase_badges?: Json | null;
          stats?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
 };
      user_quests: {
        Row: {
          id: string;
          user_id: string;
          quest_id: string;
          status: string | null;
          progress: Json | null;
          assigned_at: string | null;
          expires_at: string;
          completed_at: string | null;
          claimed_at: string | null;
          period_type: string;
          period_key: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          quest_id: string;
          status?: string | null;
          progress?: Json | null;
          assigned_at?: string | null;
          expires_at: string;
          completed_at?: string | null;
          claimed_at?: string | null;
          period_type: string;
          period_key: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          quest_id?: string;
          status?: string | null;
          progress?: Json | null;
          assigned_at?: string | null;
          expires_at?: string;
          completed_at?: string | null;
          claimed_at?: string | null;
          period_type?: string;
          period_key?: string;
        };
        Relationships: [];
 };
      user_rewards: {
        Row: {
          id: string;
          user_id: string;
          season_reward_id: string | null;
          reward_name: string;
          reward_type: string;
          reward_value: Json;
          season_id: string | null;
          earned_rank: number | null;
          earned_points: number | null;
          status: string | null;
          claimed_at: string | null;
          expires_at: string | null;
          is_equipped: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          season_reward_id?: string | null;
          reward_name: string;
          reward_type: string;
          reward_value: Json;
          season_id?: string | null;
          earned_rank?: number | null;
          earned_points?: number | null;
          status?: string | null;
          claimed_at?: string | null;
          expires_at?: string | null;
          is_equipped?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          season_reward_id?: string | null;
          reward_name?: string;
          reward_type?: string;
          reward_value?: Json;
          season_id?: string | null;
          earned_rank?: number | null;
          earned_points?: number | null;
          status?: string | null;
          claimed_at?: string | null;
          expires_at?: string | null;
          is_equipped?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
      user_themes: {
        Row: {
          id: string;
          user_id: string;
          theme_id: string;
          unlocked_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme_id: string;
          unlocked_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          theme_id?: string;
          unlocked_at?: string | null;
        };
        Relationships: [];
 };
      user_titles: {
        Row: {
          id: string;
          user_id: string;
          title_id: string;
          unlocked_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title_id: string;
          unlocked_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title_id?: string;
          unlocked_at?: string | null;
        };
        Relationships: [];
 };
      xp_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          source_type: string;
          source_id: string | null;
          description: string | null;
          game_id: string | null;
          metadata: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          source_type: string;
          source_id?: string | null;
          description?: string | null;
          game_id?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          source_type?: string;
          source_id?: string | null;
          description?: string | null;
          game_id?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Relationships: [];
 };
    };
    Views: {
      active_challenges: {
        Row: {
          id: string | null;
          title: string | null;
          description: string | null;
          rules: string | null;
          challenge_type: string | null;
          difficulty: string | null;
          season_id: string | null;
          game_id: string | null;
          period_type: string | null;
          starts_at: string | null;
          ends_at: string | null;
          status: string | null;
          objectives: Json | null;
          points_reward: number | null;
          bonus_rewards: Json | null;
          max_participants: number | null;
          icon_url: string | null;
          banner_url: string | null;
          created_at: string | null;
          updated_at: string | null;
          game_name: string | null;
          game_slug: string | null;
          season_name: string | null;
          participant_count: number | null;
          completion_count: number | null;
        };
        Relationships: [];
      };
      friends_view: {
        Row: {
          user_id: string | null;
          friend_id: string | null;
          friends_since: string | null;
        };
        Relationships: [];
      };
      leaderboard_global: {
        Row: {
          id: string | null;
          season_id: string | null;
          user_id: string | null;
          game_id: string | null;
          total_points: number | null;
          matches_played: number | null;
          matches_won: number | null;
          challenges_completed: number | null;
          average_rating: number | null;
          current_rank: number | null;
          peak_rank: number | null;
          region: string | null;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          game_name: string | null;
          game_slug: string | null;
          season_name: string | null;
          season_status: string | null;
          computed_rank: number | null;
        };
        Relationships: [];
      };
      leaderboard_regional: {
        Row: {
          id: string | null;
          season_id: string | null;
          user_id: string | null;
          game_id: string | null;
          total_points: number | null;
          match_points: number | null;
          challenge_points: number | null;
          rating_points: number | null;
          bonus_points: number | null;
          matches_played: number | null;
          matches_won: number | null;
          current_win_streak: number | null;
          best_win_streak: number | null;
          challenges_completed: number | null;
          ratings_received: number | null;
          average_rating: number | null;
          login_streak_days: number | null;
          last_login_date: string | null;
          last_match_date: string | null;
          region: string | null;
          current_rank: number | null;
          peak_rank: number | null;
          previous_rank: number | null;
          created_at: string | null;
          updated_at: string | null;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          game_name: string | null;
          regional_rank: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      create_direct_conversation: {
        Args: {
          other_user_id: string;
        };
        Returns: unknown;
      };
      is_conversation_member: {
        Args: {
          check_user_id: string;
          conv_id: string;
        };
        Returns: unknown;
      };
      award_xp: {
        Args: {
          p_amount: number;
          p_description?: string;
          p_game_id?: string;
          p_source_id?: string;
          p_source_type: string;
          p_user_id: string;
        };
        Returns: unknown;
      };
      get_friends: {
        Args: {
          p_user_id: string;
        };
        Returns: unknown;
      };
      start_game_sync: {
        Args: {
          p_connection_id: string;
          p_sync_type?: string;
          p_user_id: string;
        };
        Returns: unknown;
      };
      get_pro_players_by_games: {
        Args: {
          p_limit?: number;
          p_user_id: string;
        };
        Returns: unknown;
      };
      upsert_game_stats: {
        Args: {
          p_connection_id: string;
          p_game_id: string;
          p_game_mode: string;
          p_rank_info?: Json;
          p_season: string;
          p_stats: Json;
          p_user_id: string;
        };
        Returns: unknown;
      };
      accept_friend_request: {
        Args: {
          p_recipient_id: string;
          p_request_id: string;
        };
        Returns: unknown;
      };
      update_challenge_progress: {
        Args: {
          p_challenge_id: string;
          p_increment?: number;
          p_objective_index: number;
          p_user_id: string;
        };
        Returns: unknown;
      };
      remove_friend: {
        Args: {
          p_friend_id: string;
          p_user_id: string;
        };
        Returns: unknown;
      };
      get_followers_only_count: {
        Args: {
          p_user_id: string;
        };
        Returns: unknown;
      };
      assign_quests: {
        Args: {
          p_quest_type: string;
          p_user_id: string;
        };
        Returns: unknown;
      };
      get_user_game_connections: {
        Args: {
          p_user_id: string;
        };
        Returns: unknown;
      };
      send_friend_request: {
        Args: {
          p_message?: string;
          p_recipient_id: string;
          p_sender_id: string;
        };
        Returns: unknown;
      };
      calculate_xp_for_level: {
        Args: {
          p_level: number;
        };
        Returns: unknown;
      };
      grant_season_rewards: {
        Args: {
          p_season_id: string;
        };
        Returns: unknown;
      };
      get_similar_rank_players: {
        Args: {
          p_limit?: number;
          p_rank_tolerance?: number;
          p_user_id: string;
        };
        Returns: unknown;
      };
      get_popular_pro_players: {
        Args: {
          p_limit?: number;
        };
        Returns: unknown;
      };
      expire_lfg_posts: {
        Args: Record<string, never>;
        Returns: unknown;
      };
      are_friends: {
        Args: {
          user1_id: string;
          user2_id: string;
        };
        Returns: unknown;
      };
      update_quest_progress: {
        Args: {
          p_event_data?: Json;
          p_event_type: string;
          p_user_id: string;
        };
        Returns: unknown;
      };
      get_relationship_status: {
        Args: {
          current_user_id: string;
          target_user_id: string;
        };
        Returns: unknown;
      };
      refresh_leaderboard_rankings: {
        Args: {
          p_season_id: string;
        };
        Returns: unknown;
      };
      increment_blog_view: {
        Args: {
          post_slug: string;
        };
        Returns: unknown;
      };
      get_user_followers_list: {
        Args: {
          p_limit?: number;
          p_offset?: number;
          p_search?: string;
          p_user_id: string;
          p_viewer_id?: string;
        };
        Returns: unknown;
      };
      cancel_friend_request: {
        Args: {
          p_request_id: string;
          p_sender_id: string;
        };
        Returns: unknown;
      };
      get_user_friends_list: {
        Args: {
          p_limit?: number;
          p_offset?: number;
          p_search?: string;
          p_user_id: string;
          p_viewer_id?: string;
        };
        Returns: unknown;
      };
      get_user_social_counts: {
        Args: {
          p_user_id: string;
        };
        Returns: unknown;
      };
      get_mutual_friends: {
        Args: {
          p_limit?: number;
          p_user_id: string;
        };
        Returns: unknown;
      };
      initialize_season_points: {
        Args: {
          p_game_id?: string;
          p_season_id: string;
          p_user_id: string;
        };
        Returns: unknown;
      };
      get_user_following_list: {
        Args: {
          p_limit?: number;
          p_offset?: number;
          p_search?: string;
          p_user_id: string;
          p_viewer_id?: string;
        };
        Returns: unknown;
      };
      decline_friend_request: {
        Args: {
          p_recipient_id: string;
          p_request_id: string;
        };
        Returns: unknown;
      };
      get_following_only_count: {
        Args: {
          p_user_id: string;
        };
        Returns: unknown;
      };
      get_friend_count: {
        Args: {
          p_user_id: string;
        };
        Returns: unknown;
      };
      award_points: {
        Args: {
          p_description?: string;
          p_game_id: string;
          p_points: number;
          p_season_id: string;
          p_source_id?: string;
          p_source_type: string;
          p_transaction_type: string;
          p_user_id: string;
        };
        Returns: unknown;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// ============================================
// Activity Tracking
// ============================================

export interface UserActivityDay {
  id: string;
  user_id: string;
  activity_date: string; // DATE as YYYY-MM-DD
  minutes_online: number;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string | null;
}

// ============================================
// HELPER TYPES
// ============================================

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Game = Database["public"]["Tables"]["games"]["Row"];
export type UserGame = Database["public"]["Tables"]["user_games"]["Row"];
export type Achievement = Database["public"]["Tables"]["achievements"]["Row"];
export type Match = Database["public"]["Tables"]["matches"]["Row"];
export type MatchParticipant = Database["public"]["Tables"]["match_participants"]["Row"];
export type Challenge = Database["public"]["Tables"]["challenges"]["Row"];
export type Media = Database["public"]["Tables"]["media"]["Row"];
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
export type ConversationParticipant = Database["public"]["Tables"]["conversation_participants"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Follow = Database["public"]["Tables"]["follows"]["Row"];
export type Call = Database["public"]["Tables"]["calls"]["Row"];
export type CallParticipant = Database["public"]["Tables"]["call_participants"]["Row"];

// Friend types
export type FriendRequest = Database["public"]["Tables"]["friend_requests"]["Row"];
export type BlockedUser = Database["public"]["Tables"]["blocked_users"]["Row"];
export type FriendRequestStatus = "pending" | "accepted" | "declined" | "cancelled";

export interface RelationshipStatus {
  is_friend: boolean;
  is_following: boolean;
  is_follower: boolean;
  has_pending_request_sent: boolean;
  has_pending_request_received: boolean;
  is_blocked: boolean;
  is_blocked_by: boolean;
}

export interface FriendRequestWithProfiles extends FriendRequest {
  sender: Profile;
  recipient: Profile;
}

export interface FriendWithProfile {
  friend_id: string;
  friends_since: string;
  profile: Profile;
}

export interface FollowWithProfile extends Follow {
  profile: Profile;
}

export interface SocialCounts {
  friends: number;
  following: number;
  followers: number;
  pending_requests: number;
}

// Clan types
export type Clan = Database["public"]["Tables"]["clans"]["Row"];
export type ClanMember = Database["public"]["Tables"]["clan_members"]["Row"];
export type ClanInvite = Database["public"]["Tables"]["clan_invites"]["Row"];
export type ClanGame = Database["public"]["Tables"]["clan_games"]["Row"];
export type ClanAchievement = Database["public"]["Tables"]["clan_achievements"]["Row"];
export type ClanChallenge = Database["public"]["Tables"]["clan_challenges"]["Row"];
export type ClanRecruitmentPost = Database["public"]["Tables"]["clan_recruitment_posts"]["Row"];
export type ClanActivityLog = Database["public"]["Tables"]["clan_activity_log"]["Row"];

export type ClanMemberRole = "leader" | "co_leader" | "officer" | "member";
export type ClanJoinType = "open" | "invite_only" | "closed";

export interface ClanWithDetails extends Clan {
  primary_game: Game | null;
  members: (ClanMember & { profile: Profile })[];
  games: (ClanGame & { game: Game })[];
  member_count: number;
}

export interface ClanMemberWithProfile extends ClanMember {
  profile: Profile;
  user_games?: (UserGame & { game: Game })[];
}

export interface ClanSettings {
  join_approval_required: boolean;
  allow_member_invites: boolean;
  min_games_played?: number;
  require_discord?: boolean;
}

export interface ClanStats {
  total_wins: number;
  total_matches: number;
  challenges_won: number;
  challenges_lost?: number;
  win_rate?: number;
}

// Tournament types
export type Tournament = Database["public"]["Tables"]["tournaments"]["Row"];
export type TournamentParticipant = Database["public"]["Tables"]["tournament_participants"]["Row"];
export type TournamentMatch = Database["public"]["Tables"]["tournament_matches"]["Row"];
export type TournamentMatchGame = Database["public"]["Tables"]["tournament_match_games"]["Row"];
export type TournamentActivityLog = Database["public"]["Tables"]["tournament_activity_log"]["Row"];

export type TournamentFormat = "single_elimination" | "double_elimination" | "round_robin";
export type TournamentStatus = "draft" | "registration" | "seeding" | "in_progress" | "completed" | "cancelled";
export type ParticipantStatus = "pending" | "registered" | "checked_in" | "eliminated" | "winner" | "withdrawn" | "disqualified";
export type MatchStatus = "pending" | "scheduled" | "ready" | "in_progress" | "completed" | "bye" | "forfeit";
export type BracketType = "winners" | "losers" | "finals" | "grand_finals";

export interface PrizeDistribution {
  place: number;
  amount: number;
  percentage: number;
}

export interface PrizePool {
  total: number;
  currency: string;
  distribution: PrizeDistribution[];
}

export interface TournamentSettings {
  check_in_required: boolean;
  check_in_window_minutes: number;
  allow_substitutes: boolean;
  max_substitutes: number;
  seeding_method: "random" | "manual" | "rating";
  third_place_match: boolean;
  matches_best_of: 1 | 3 | 5 | 7;
}

export interface RosterMember {
  user_id: string;
  role: string;
  is_substitute: boolean;
}

export interface MatchResult {
  games?: {
    game_number: number;
    team1_score: number;
    team2_score: number;
    winner_id: string;
    map?: string;
  }[];
  submitted_by?: string;
  submitted_at?: string;
  confirmed_by?: string;
  confirmed_at?: string;
}

export interface TournamentWithDetails extends Tournament {
  organizer_clan: Clan | null;
  game: Game | null;
  participants: TournamentParticipantWithClan[];
  participant_count: number;
}

export interface TournamentParticipantWithClan extends TournamentParticipant {
  clan: Clan;
  roster_profiles?: Profile[];
}

export interface TournamentMatchWithTeams extends TournamentMatch {
  team1: TournamentParticipantWithClan | null;
  team2: TournamentParticipantWithClan | null;
  winner: TournamentParticipantWithClan | null;
  games?: TournamentMatchGame[];
}

export interface BracketMatch {
  id: string;
  round: number;
  matchNumber: number;
  bracketType: BracketType;
  team1Seed: number | null;
  team2Seed: number | null;
  winnerAdvancesTo: { round: number; matchNumber: number; slot: "team1" | "team2" } | null;
  loserAdvancesTo?: { round: number; matchNumber: number; slot: "team1" | "team2" } | null;
}

// Season & Leaderboard types
export type Season = Database["public"]["Tables"]["seasons"]["Row"];
export type SeasonPoints = Database["public"]["Tables"]["season_points"]["Row"];
export type PointTransaction = Database["public"]["Tables"]["point_transactions"]["Row"];
export type CommunityChallenge = Database["public"]["Tables"]["community_challenges"]["Row"];
export type ChallengeProgress = Database["public"]["Tables"]["challenge_progress"]["Row"];
export type SeasonReward = Database["public"]["Tables"]["season_rewards"]["Row"];
export type UserReward = Database["public"]["Tables"]["user_rewards"]["Row"];
export type LeaderboardSnapshot = Database["public"]["Tables"]["leaderboard_snapshots"]["Row"];

export type SeasonStatus = "upcoming" | "active" | "completed" | "cancelled";
export type ChallengeType = "match_count" | "win_count" | "win_streak" | "rating_average" | "game_specific" | "clan_participation" | "social" | "composite";
export type ChallengeDifficulty = "easy" | "medium" | "hard" | "legendary";
export type ChallengePeriod = "daily" | "weekly" | "monthly" | "seasonal" | "event";
export type ChallengeProgressStatus = "in_progress" | "completed" | "failed" | "expired";
export type RewardType = "badge" | "title" | "avatar_frame" | "banner" | "currency" | "exclusive_item" | "early_access";
export type RewardRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type TransactionType = "match_win" | "match_loss" | "challenge_complete" | "rating_bonus" | "daily_bonus" | "streak_bonus" | "admin_adjustment" | "decay" | "refund";

export interface SeasonPointConfig {
  match_win_casual: number;
  match_win_competitive: number;
  match_win_tournament: number;
  challenge_base: number;
  rating_bonus: number;
  daily_first_match: number;
  streak_bonus_per_day: number;
  max_streak_days: number;
}

export interface ChallengeObjective {
  type: string;
  target: number;
  game_filter?: string;
  match_type?: string;
  action?: string;
  min_ratings?: number;
}

export interface ChallengeProgressEntry {
  objective_index: number;
  current: number;
  target: number;
  completed: boolean;
}

export interface BadgeRewardValue {
  badge_url: string;
  badge_id: string;
}

export interface TitleRewardValue {
  title_text: string;
  color?: string;
}

export interface CurrencyRewardValue {
  amount: number;
  currency_type: string;
}

export interface SeasonWithDetails extends Season {
  game?: Game | null;
  rewards: SeasonReward[];
  challenges: CommunityChallenge[];
  participant_count: number;
}

export interface LeaderboardEntry extends SeasonPoints {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_premium?: boolean | null;
  game_name?: string;
  game_slug?: string;
  computed_rank: number;
  rank_change?: number;
}

export interface ChallengeWithProgress extends CommunityChallenge {
  game?: Game | null;
  season?: Season | null;
  user_progress?: ChallengeProgress | null;
  participant_count: number;
  completion_count: number;
}

export interface UserRewardWithDetails extends UserReward {
  season?: Season | null;
  season_reward?: SeasonReward | null;
}

// ============================================
// GAMIFICATION TYPES
// ============================================

export type BadgeRarity = "common" | "rare" | "epic" | "legendary";
export type BadgeCategory = "skill" | "social" | "milestone" | "seasonal" | "special";
export type QuestType = "daily" | "weekly" | "special";
export type QuestStatus = "active" | "completed" | "expired" | "claimed";
export type UnlockType = "level" | "badge" | "achievement" | "purchase" | "special" | "default";

export type Title = Database["public"]["Tables"]["titles"]["Row"];
export type ProfileFrame = Database["public"]["Tables"]["profile_frames"]["Row"];
export type ProfileTheme = Database["public"]["Tables"]["profile_themes"]["Row"];
export type BadgeDefinition = Database["public"]["Tables"]["badge_definitions"]["Row"];

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
  stats: UserProgressionStats;
  created_at: string;
  updated_at: string;
}

export interface UserProgressionStats {
  matches_played: number;
  matches_won: number;
  challenges_completed: number;
  quests_completed: number;
  current_win_streak: number;
  best_win_streak: number;
}

export type UserBadge = Database["public"]["Tables"]["user_badges"]["Row"];

export interface UserBadgeWithDetails extends UserBadge {
  badge: BadgeDefinition;
}

export interface UserQuest {
  id: string;
  user_id: string;
  quest_id: string;
  status: QuestStatus;
  progress: { current: number; target: number };
  assigned_at: string;
  expires_at: string;
  completed_at: string | null;
  claimed_at: string | null;
  period_type: string;
  period_key: string;
}

export interface UserQuestWithDetails extends UserQuest {
  quest: Database["public"]["Tables"]["quest_definitions"]["Row"];
}

export interface UserProgressionWithDetails extends UserProgression {
  active_title: Title | null;
  active_frame: ProfileFrame | null;
  active_theme: ProfileTheme | null;
}

export interface ProfileFrameWithUnlockStatus extends ProfileFrame {
  is_unlocked: boolean;
}

export interface ProfileThemeWithUnlockStatus extends ProfileTheme {
  is_unlocked: boolean;
}

export interface LeaderboardEntryGamification {
  rank: number;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  total_xp: number;
  active_title: Title | null;
  active_frame: ProfileFrame | null;
  is_current_user: boolean;
}

// ============================================
// SOCIAL SUGGESTIONS TYPES
// ============================================

export interface SuggestedUser {
  user_id: string;
  profile: Profile & { user_games: (UserGame & { game: Game })[] };
  suggestion_reason: SuggestionReason;
}

export interface SuggestionReason {
  type: "mutual" | "similar_rank";
  mutual_friend_count?: number;
  mutual_friend_names?: string[];
  common_games?: {
    game_name: string;
    user_rank: string;
    their_rank: string;
  }[];
}

export interface ProPlayer {
  user_id: string;
  profile: Profile & { user_games: (UserGame & { game: Game })[] };
  follower_count: number;
  common_games?: {
    game_id: string;
    game_name: string;
    rank: string;
  }[];
  is_followed_by_viewer: boolean;
}

export interface ProfileWithRelationship extends Profile {
  relationship_to_viewer: {
    is_friend: boolean;
    is_following: boolean;
    has_pending_request: boolean;
  } | null;
  followed_since?: string;
  friends_since?: string;
}

export interface UserSocialCounts {
  friends_count: number;
  followers_count: number;
  following_count: number;
}

// ============================================
// AUTOMATION & DISCORD TYPES
// ============================================

export type NotificationChannel = "in_app" | "email" | "discord" | "push";
export type NotificationType = "match_reminder" | "tournament_update" | "clan_activity" | "friend_request" | "direct_message" | "achievement" | "system";
export type AutomationTrigger = "member_join" | "member_leave" | "match_created" | "match_completed" | "challenge_accepted" | "tournament_update" | "scheduled";
export type AutomationAction = "send_discord_message" | "create_notification" | "update_role" | "send_webhook";
export type ScheduledNotificationStatus = "pending" | "sent" | "cancelled" | "failed";
export type AutomationLogStatus = "success" | "failed" | "skipped";

export interface AutomationRule {
  id: string;
  clan_id: string;
  name: string;
  description: string | null;
  trigger_type: AutomationTrigger;
  trigger_conditions: Json;
  action_type: AutomationAction;
  action_config: Json;
  is_enabled: boolean;
  cooldown_minutes: number;
  last_triggered_at: string | null;
  trigger_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AutomationLog {
  id: string;
  rule_id: string;
  clan_id: string;
  trigger_data: Json;
  action_result: Json;
  status: AutomationLogStatus;
  error_message: string | null;
  executed_at: string;
}

export interface AutomationRuleWithCreator extends AutomationRule {
  created_by_profile?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

// ============================================
// TRAIT ENDORSEMENT & TRUST ENGINE TYPES
// ============================================

export type TraitKey = "friendly" | "team_player" | "leader" | "communicative" | "reliable";

export interface TraitEndorsementStats {
  friendly: number;
  teamPlayer: number;
  leader: number;
  communicative: number;
  reliable: number;
  totalEndorsers: number;
}

export interface TrustBadges {
  isVeteran: boolean;
  isActive: boolean;
  isTrusted: boolean;
  isVerified: boolean;
  isCommunityPillar: boolean;
  isEstablished: boolean;
}

export type StandingLevel = "new" | "growing" | "established" | "veteran";

export type UserStatus = "online" | "away" | "dnd" | "offline";
export type UserStatusPreference = "auto" | "online" | "away" | "dnd" | "offline";

export interface AccountStandingFactor {
  key: string;
  label: string;
  level: StandingLevel;
}
