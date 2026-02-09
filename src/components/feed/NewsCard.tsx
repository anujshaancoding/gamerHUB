"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pin, Calendar, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NewsPost {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  banner_url: string | null;
  post_type: string;
  is_pinned: boolean;
  published_at: string;
  tags: string[];
}

interface NewsCardProps {
  post: NewsPost;
  variant?: "default" | "compact";
}

const postTypeColors: Record<string, string> = {
  news: "bg-blue-500/20 text-blue-300 border-blue-500/50",
  update: "bg-green-500/20 text-green-300 border-green-500/50",
  event: "bg-purple-500/20 text-purple-300 border-purple-500/50",
  maintenance: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
  feature: "bg-orange-500/20 text-orange-300 border-orange-500/50",
};

export function NewsCard({ post, variant = "default" }: NewsCardProps) {
  if (variant === "compact") {
    return (
      <Link href={`/news/${post.id}`}>
        <Card className="p-4 bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                {post.is_pinned && (
                  <Pin className="h-3 w-3 text-yellow-400 shrink-0" />
                )}
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs capitalize",
                    postTypeColors[post.post_type] || postTypeColors.news
                  )}
                >
                  {post.post_type}
                </Badge>
              </div>
              <h3 className="font-semibold text-white line-clamp-1">
                {post.title}
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                {format(new Date(post.published_at), "MMM d, yyyy")}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-zinc-500 shrink-0" />
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/news/${post.id}`}>
      <Card className="overflow-hidden bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
        {post.banner_url && (
          <div className="aspect-video relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.banner_url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            {post.is_pinned && (
              <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                <Pin className="h-3 w-3" />
                Pinned
              </div>
            )}
          </div>
        )}

        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant="outline"
              className={cn(
                "capitalize",
                postTypeColors[post.post_type] || postTypeColors.news
              )}
            >
              {post.post_type}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Calendar className="h-3 w-3" />
              {format(new Date(post.published_at), "MMM d, yyyy")}
            </div>
          </div>

          <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
            {post.title}
          </h3>

          {post.excerpt && (
            <p className="text-sm text-zinc-400 line-clamp-2">{post.excerpt}</p>
          )}

          <div className="flex items-center gap-1 mt-3 text-sm text-purple-400">
            Read more
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
