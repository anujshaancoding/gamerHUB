export interface SearchUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  is_online: boolean;
  is_premium: boolean;
  region: string | null;
}

export interface SearchBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  published_at: string;
  featured_image_url: string | null;
  author?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  game?: {
    id: string;
    name: string;
    icon_url: string | null;
  };
}

export interface SearchListing {
  id: string;
  title: string;
  listing_type: "tournament" | "giveaway";
  status: string;
  starts_at: string;
  ends_at: string | null;
  cover_image_url: string | null;
  creator?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  game?: {
    id: string;
    name: string;
    icon_url: string | null;
  };
}

export interface SearchClan {
  id: string;
  name: string;
  tag: string;
  slug: string;
  avatar_url: string | null;
  member_count: number;
  is_recruiting: boolean;
  primary_game?: {
    id: string;
    name: string;
    icon_url: string | null;
  };
}

export type SearchCategory = "users" | "blogs" | "listings" | "clans";
