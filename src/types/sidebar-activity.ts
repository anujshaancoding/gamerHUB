export type SidebarActivityType = "news" | "blog" | "tournament" | "giveaway" | "friend_post";

export interface SidebarActivityMeta {
  authorName?: string;
  authorAvatar?: string;
  category?: string;
  gameName?: string;
  gameSlug?: string;
  likesCount?: number;
}

export interface SidebarActivityItem {
  id: string;
  type: SidebarActivityType;
  title: string;
  thumbnailUrl: string | null;
  linkHref: string;
  timestamp: string;
  meta?: SidebarActivityMeta;
}
