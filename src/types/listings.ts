export type ListingType = "tournament" | "giveaway";
export type ListingStatus = "draft" | "active" | "completed" | "cancelled";

export interface CommunityListing {
  id: string;
  creator_id: string;
  game_id: string | null;
  title: string;
  description: string;
  cover_image_url: string | null;
  listing_type: ListingType;
  organizer_name: string | null;
  organizer_url: string | null;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  rules: string | null;
  external_link: string | null;
  prize_description: string | null;
  status: ListingStatus;
  view_count: number;
  bookmark_count: number;
  likes_count: number;
  comments_count: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  // Joined data
  creator?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  game?: {
    id: string;
    slug: string;
    name: string;
    icon_url: string | null;
  };
  winners?: ListingWinner[];
  user_bookmarked?: boolean;
  user_liked?: boolean;
}

export interface ListingWinner {
  id: string;
  listing_id: string;
  user_id: string | null;
  display_name: string;
  placement: number | null;
  prize_awarded: string | null;
  created_at: string;
}

export interface CreateListingRequest {
  title: string;
  description: string;
  listing_type: ListingType;
  game_id?: string;
  game_slug?: string;
  custom_game_name?: string;
  cover_image_url?: string;
  organizer_name?: string;
  organizer_url?: string;
  starts_at: string;
  ends_at?: string;
  timezone?: string;
  rules?: string;
  external_link?: string;
  prize_description?: string;
  tags?: string[];
}

export interface AddWinnerRequest {
  listing_id: string;
  display_name: string;
  user_id?: string;
  placement?: number;
  prize_awarded?: string;
}

export interface ListingFilters {
  type?: ListingType;
  gameId?: string;
  status?: ListingStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListingComment {
  id: string;
  listing_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  likes_count: number;
  status: 'visible' | 'hidden' | 'deleted';
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  replies?: ListingComment[];
  user_has_liked?: boolean;
}

export interface CreateListingCommentInput {
  listing_id: string;
  content: string;
  parent_id?: string;
}
