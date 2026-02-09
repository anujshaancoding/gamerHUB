import type { Profile, Game } from "./database";

export type BlogCategory =
  | "news"
  | "interview"
  | "analysis"
  | "match_report"
  | "opinion"
  | "transfer"
  | "guide"
  | "announcement";

export type BlogStatus = "draft" | "pending_review" | "published" | "archived";

export type AuthorRole = "contributor" | "journalist" | "editor" | "admin";

export interface BlogAuthor {
  id: string;
  user_id: string;
  role: AuthorRole;
  bio: string | null;
  can_publish_directly: boolean;
  is_verified: boolean;
  articles_count: number;
  created_at: string;
  updated_at: string;
  // Joined data
  profile?: Profile;
}

export interface BlogPost {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  game_id: string | null;
  category: BlogCategory;
  tags: string[];
  status: BlogStatus;
  published_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  views_count: number;
  likes_count: number;
  comments_count: number;
  meta_title: string | null;
  meta_description: string | null;
  is_featured: boolean;
  is_pinned: boolean;
  allow_comments: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  author?: Profile & { blog_author?: BlogAuthor };
  game?: Game;
  user_has_liked?: boolean;
  user_has_bookmarked?: boolean;
}

export interface BlogComment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  likes_count: number;
  status: "visible" | "hidden" | "deleted";
  created_at: string;
  updated_at: string;
  // Joined data
  author?: Profile;
  replies?: BlogComment[];
  user_has_liked?: boolean;
}

export interface BlogFilters {
  game?: string;
  category?: BlogCategory;
  tag?: string;
  author?: string;
  featured?: boolean;
  search?: string;
}

export interface CreateBlogPostInput {
  title: string;
  content: string;
  excerpt?: string;
  featured_image_url?: string;
  game_id?: string;
  category: BlogCategory;
  tags?: string[];
  status?: BlogStatus;
  meta_title?: string;
  meta_description?: string;
  allow_comments?: boolean;
}

export interface UpdateBlogPostInput extends Partial<CreateBlogPostInput> {
  is_featured?: boolean;
  is_pinned?: boolean;
}

export interface CreateBlogCommentInput {
  post_id: string;
  content: string;
  parent_id?: string;
}

// Category display info
export const BLOG_CATEGORIES: Record<
  BlogCategory,
  { label: string; color: string }
> = {
  news: { label: "News", color: "blue" },
  interview: { label: "Interview", color: "purple" },
  analysis: { label: "Analysis", color: "cyan" },
  match_report: { label: "Match Report", color: "green" },
  opinion: { label: "Opinion", color: "orange" },
  transfer: { label: "Transfer", color: "red" },
  guide: { label: "Guide", color: "yellow" },
  announcement: { label: "Announcement", color: "pink" },
};

// Author role display info
export const AUTHOR_ROLES: Record<AuthorRole, { label: string; color: string }> =
  {
    contributor: { label: "Contributor", color: "gray" },
    journalist: { label: "Journalist", color: "blue" },
    editor: { label: "Editor", color: "purple" },
    admin: { label: "Admin", color: "red" },
  };
