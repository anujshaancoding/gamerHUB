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

export type BlogTemplate =
  | "classic"
  | "magazine"
  | "cyberpunk"
  | "minimal"
  | "card_grid"
  | "gaming_stream";

export type BlogColorPalette =
  | "neon_surge"
  | "crimson_fire"
  | "ocean_depth"
  | "phantom_violet"
  | "arctic_frost"
  | "toxic_waste";

export const BLOG_TEMPLATES: Record<
  BlogTemplate,
  { label: string; description: string; icon: string }
> = {
  classic: {
    label: "Classic Editorial",
    description: "Clean layout with large hero image and elegant spacing. Medium.com inspired.",
    icon: "BookOpen",
  },
  magazine: {
    label: "Magazine Spread",
    description: "Full-width hero with overlaid title, immersive cinematic reading.",
    icon: "Newspaper",
  },
  cyberpunk: {
    label: "Cyber Punk",
    description: "Neon-bordered sections, glitch headings, terminal aesthetics.",
    icon: "Zap",
  },
  minimal: {
    label: "Minimal Focus",
    description: "Ultra-clean centered column, maximum readability, zero noise.",
    icon: "Minus",
  },
  card_grid: {
    label: "Card Grid",
    description: "Content in card sections, perfect for listicles and guides.",
    icon: "LayoutGrid",
  },
  gaming_stream: {
    label: "Gaming Stream",
    description: "Twitch/YouTube inspired, media-prominent with overlay aesthetics.",
    icon: "Monitor",
  },
};

export const BLOG_COLOR_PALETTES: Record<
  BlogColorPalette,
  {
    label: string;
    description: string;
    primary: string;
    secondary: string;
    background: string;
    primaryHex: string;
    secondaryHex: string;
    backgroundHex: string;
  }
> = {
  neon_surge: {
    label: "Neon Surge",
    description: "Default gaming vibe",
    primary: "green",
    secondary: "purple",
    background: "dark",
    primaryHex: "#00ff88",
    secondaryHex: "#A78BFA",
    backgroundHex: "#0a0a0f",
  },
  crimson_fire: {
    label: "Crimson Fire",
    description: "Competitive & aggressive",
    primary: "red",
    secondary: "orange",
    background: "charcoal",
    primaryHex: "#DC2626",
    secondaryHex: "#F97316",
    backgroundHex: "#1a1210",
  },
  ocean_depth: {
    label: "Ocean Depth",
    description: "Calm & strategic",
    primary: "cyan",
    secondary: "blue",
    background: "navy",
    primaryHex: "#06B6D4",
    secondaryHex: "#60A5FA",
    backgroundHex: "#0a0f1a",
  },
  phantom_violet: {
    label: "Phantom Violet",
    description: "Mystical RPG feel",
    primary: "purple",
    secondary: "pink",
    background: "slate",
    primaryHex: "#8B5CF6",
    secondaryHex: "#F472B6",
    backgroundHex: "#0f0a1a",
  },
  arctic_frost: {
    label: "Arctic Frost",
    description: "Clean esports pro",
    primary: "ice-blue",
    secondary: "white",
    background: "steel",
    primaryHex: "#93C5FD",
    secondaryHex: "#F8FAFC",
    backgroundHex: "#111318",
  },
  toxic_waste: {
    label: "Toxic Waste",
    description: "Retro gaming radioactive",
    primary: "lime",
    secondary: "yellow",
    background: "olive",
    primaryHex: "#84CC16",
    secondaryHex: "#EAB308",
    backgroundHex: "#0f1408",
  },
};

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
  content_json?: Record<string, unknown> | null;
  featured_image_url: string | null;
  game_id: string | null;
  category: BlogCategory;
  tags: string[];
  template: BlogTemplate;
  color_palette: BlogColorPalette;
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
  content_json?: Record<string, unknown>;
  excerpt?: string;
  featured_image_url?: string;
  game_id?: string;
  category: BlogCategory;
  tags?: string[];
  template?: BlogTemplate;
  color_palette?: BlogColorPalette;
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
