"use client";

import Link from "next/link";
import {
  Newspaper,
  BookOpen,
  Trophy,
  Gift,
  Users,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { SidebarActivityItem, SidebarActivityType } from "@/types/sidebar-activity";

const typeConfig: Record<
  SidebarActivityType,
  { icon: React.ComponentType<{ className?: string }>; color: string; label: string }
> = {
  news: { icon: Newspaper, color: "text-blue-400", label: "News" },
  blog: { icon: BookOpen, color: "text-purple-400", label: "Blog" },
  tournament: { icon: Trophy, color: "text-yellow-400", label: "Tournament" },
  giveaway: { icon: Gift, color: "text-green-400", label: "Giveaway" },
  friend_post: { icon: Users, color: "text-orange-400", label: "Post" },
};

function getMetaText(item: SidebarActivityItem): string | null {
  const meta = item.meta;
  if (!meta) return null;

  switch (item.type) {
    case "news":
      return [meta.category, meta.gameSlug].filter(Boolean).join(" · ");
    case "blog":
      return meta.authorName ? `by ${meta.authorName}` : meta.category || null;
    case "tournament":
    case "giveaway":
      return meta.gameName || null;
    case "friend_post":
      return meta.authorName || null;
    default:
      return null;
  }
}

export function CompactActivityItem({ item }: { item: SidebarActivityItem }) {
  const config = typeConfig[item.type];
  const Icon = config.icon;
  const metaText = getMetaText(item);

  return (
    <Link
      href={item.linkHref}
      className="flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-surface-light transition-colors group"
    >
      <div className={cn("mt-0.5 shrink-0", config.color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text leading-tight line-clamp-1 group-hover:text-primary transition-colors">
          {item.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {metaText && (
            <span className="text-[11px] text-text-muted truncate capitalize">
              {metaText}
            </span>
          )}
          <span className="text-[10px] text-text-muted/60 shrink-0">
            {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
          </span>
        </div>
      </div>
    </Link>
  );
}
