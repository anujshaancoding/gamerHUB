"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Eye,
  ArrowUp,
  Pin,
  Lock,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  Users,
  Megaphone,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Author {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface ForumPost {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  post_type: "discussion" | "question" | "guide" | "lfg" | "announcement";
  tags: string[];
  is_pinned: boolean;
  is_locked: boolean;
  is_solved: boolean;
  view_count: number;
  reply_count: number;
  vote_score: number;
  last_reply_at: string | null;
  created_at: string;
  author: Author;
  last_reply_author?: Author | null;
  category?: Category;
}

interface PostCardProps {
  post: ForumPost;
  showCategory?: boolean;
}

const postTypeConfig = {
  discussion: {
    icon: MessageSquare,
    label: "Discussion",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/50",
  },
  question: {
    icon: HelpCircle,
    label: "Question",
    color: "bg-purple-500/20 text-purple-300 border-purple-500/50",
  },
  guide: {
    icon: BookOpen,
    label: "Guide",
    color: "bg-green-500/20 text-green-300 border-green-500/50",
  },
  lfg: {
    icon: Users,
    label: "LFG",
    color: "bg-orange-500/20 text-orange-300 border-orange-500/50",
  },
  announcement: {
    icon: Megaphone,
    label: "Announcement",
    color: "bg-red-500/20 text-red-300 border-red-500/50",
  },
};

export function PostCard({ post, showCategory = false }: PostCardProps) {
  const typeConfig = postTypeConfig[post.post_type];
  const TypeIcon = typeConfig.icon;

  const categorySlug = post.category?.slug || "";
  const postUrl = `/forums/${categorySlug}/${post.slug}`;

  return (
    <Card
      className={cn(
        "p-4 bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors",
        post.is_pinned && "border-l-2 border-l-yellow-500"
      )}
    >
      <div className="flex gap-4">
        {/* Vote Score */}
        <div className="flex flex-col items-center shrink-0 pt-1">
          <ArrowUp className="h-4 w-4 text-zinc-500" />
          <span
            className={cn(
              "font-semibold text-sm",
              post.vote_score > 0
                ? "text-green-400"
                : post.vote_score < 0
                ? "text-red-400"
                : "text-zinc-500"
            )}
          >
            {post.vote_score}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {post.is_pinned && (
              <Pin className="h-4 w-4 text-yellow-400 shrink-0" />
            )}
            {post.is_locked && (
              <Lock className="h-4 w-4 text-zinc-500 shrink-0" />
            )}
            {post.is_solved && (
              <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
            )}

            <Badge variant="outline" className={cn("text-xs", typeConfig.color)}>
              <TypeIcon className="h-3 w-3 mr-1" />
              {typeConfig.label}
            </Badge>

            {showCategory && post.category && (
              <Badge
                variant="outline"
                className="text-xs bg-zinc-800 text-zinc-300"
              >
                {post.category.icon} {post.category.name}
              </Badge>
            )}
          </div>

          {/* Title */}
          <Link href={postUrl} className="group">
            <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors line-clamp-2 mb-2">
              {post.title}
            </h3>
          </Link>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {post.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs bg-zinc-800/50 text-zinc-400 border-zinc-700"
                >
                  {tag}
                </Badge>
              ))}
              {post.tags.length > 3 && (
                <span className="text-xs text-zinc-500">
                  +{post.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-3">
              {/* Author */}
              <Link
                href={`/profile/${post.author.username}`}
                className="flex items-center gap-2 hover:text-zinc-300"
              >
                <Avatar className="h-5 w-5">
                  {post.author.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.author.avatar_url}
                      alt={post.author.username}
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-zinc-700 flex items-center justify-center text-[10px]">
                      {post.author.username[0].toUpperCase()}
                    </div>
                  )}
                </Avatar>
                <span>{post.author.display_name || post.author.username}</span>
              </Link>

              <span>•</span>
              <span>
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {post.reply_count}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {post.view_count}
              </span>
            </div>
          </div>

          {/* Last Reply */}
          {post.last_reply_at && post.last_reply_author && (
            <div className="mt-2 pt-2 border-t border-zinc-800 text-xs text-zinc-500">
              Last reply by{" "}
              <Link
                href={`/profile/${post.last_reply_author.username}`}
                className="text-zinc-400 hover:text-zinc-300"
              >
                {post.last_reply_author.display_name ||
                  post.last_reply_author.username}
              </Link>{" "}
              {formatDistanceToNow(new Date(post.last_reply_at), {
                addSuffix: true,
              })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
