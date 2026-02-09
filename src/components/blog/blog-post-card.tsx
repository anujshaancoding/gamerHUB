"use client";

import { motion } from "framer-motion";
import {
  Eye,
  Heart,
  MessageCircle,
  Clock,
  Gamepad2,
  ArrowUpRight,
  Pin,
  Sparkles,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { BlogPost } from "@/types/blog";
import { BLOG_CATEGORIES, AUTHOR_ROLES } from "@/types/blog";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface BlogPostCardProps {
  post: BlogPost;
  featured?: boolean;
}

export function BlogPostCard({ post, featured = false }: BlogPostCardProps) {
  const categoryInfo = BLOG_CATEGORIES[post.category];
  const authorRole = post.author?.blog_author?.role;
  const authorRoleInfo = authorRole ? AUTHOR_ROLES[authorRole] : null;

  const categoryColors: Record<string, string> = {
    blue: "text-blue-400 border-blue-400/30 bg-blue-500/10",
    green: "text-emerald-400 border-emerald-400/30 bg-emerald-500/10",
    purple: "text-purple-400 border-purple-400/30 bg-purple-500/10",
    orange: "text-orange-400 border-orange-400/30 bg-orange-500/10",
    red: "text-red-400 border-red-400/30 bg-red-500/10",
    cyan: "text-cyan-400 border-cyan-400/30 bg-cyan-500/10",
    yellow: "text-yellow-400 border-yellow-400/30 bg-yellow-500/10",
    pink: "text-pink-400 border-pink-400/30 bg-pink-500/10",
  };

  const getCategoryStyle = () => {
    const color = categoryInfo?.color || "blue";
    return categoryColors[color] || categoryColors.blue;
  };

  return (
    <Link href={`/blog/${post.slug}`} className="block h-full">
      <motion.article
        whileHover={{ y: -6 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`group relative h-full rounded-xl overflow-hidden bg-surface border border-border hover:border-primary/40 transition-all duration-300 ${
          featured ? "ring-1 ring-primary/20" : ""
        }`}
      >
        {/* Hover glow effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        </div>

        {/* Featured image */}
        {post.featured_image_url && (
          <div
            className={`relative overflow-hidden ${
              featured ? "h-52" : "h-40"
            }`}
          >
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />

            {/* Badges overlay */}
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
              <div className="flex items-center gap-2">
                {post.is_featured && (
                  <Badge className="bg-gradient-to-r from-primary to-accent text-black font-bold shadow-lg shadow-primary/20 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Featured
                  </Badge>
                )}
                {post.is_pinned && !post.is_featured && (
                  <Badge className="bg-yellow-500/90 text-black font-bold shadow-lg flex items-center gap-1">
                    <Pin className="w-3 h-3" />
                    Pinned
                  </Badge>
                )}
              </div>

              {/* Read indicator */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-2 bg-black/60 backdrop-blur-sm rounded-full">
                  <ArrowUpRight className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            {/* Game tag on image */}
            {post.game && (
              <div className="absolute bottom-3 left-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-full text-xs text-white/90">
                  {post.game.icon_url ? (
                    <img
                      src={post.game.icon_url}
                      alt={post.game.name}
                      className="w-4 h-4 rounded"
                    />
                  ) : (
                    <Gamepad2 className="w-3.5 h-3.5" />
                  )}
                  <span>{post.game.name}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-5">
          {/* Category Badge */}
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className={getCategoryStyle()}>
              {categoryInfo?.label || post.category}
            </Badge>
            {post.published_at && (
              <span className="text-xs text-text-dim flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(post.published_at), {
                  addSuffix: true,
                })}
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            className={`font-bold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors ${
              featured ? "text-xl" : "text-base"
            }`}
          >
            {post.title}
          </h3>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-text-secondary text-sm mb-4 line-clamp-2">
              {post.excerpt}
            </p>
          )}

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-text-muted bg-surface-light px-2 py-0.5 rounded-md hover:bg-surface-lighter transition-colors"
                >
                  #{tag}
                </span>
              ))}
              {post.tags.length > 3 && (
                <span className="text-xs text-text-dim">
                  +{post.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            {/* Author */}
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Avatar
                  src={post.author?.avatar_url}
                  alt={
                    post.author?.display_name ||
                    post.author?.username ||
                    "Author"
                  }
                  size="sm"
                />
                {authorRoleInfo && (
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface bg-${authorRoleInfo.color}-500`}
                  />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {post.author?.display_name || post.author?.username}
                </p>
                {authorRoleInfo && (
                  <p className={`text-xs text-${authorRoleInfo.color}-400`}>
                    {authorRoleInfo.label}
                  </p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span className="flex items-center gap-1 hover:text-primary transition-colors">
                <Eye className="w-3.5 h-3.5" />
                {post.views_count > 999
                  ? `${(post.views_count / 1000).toFixed(1)}k`
                  : post.views_count}
              </span>
              <span className="flex items-center gap-1 hover:text-red-400 transition-colors">
                <Heart className="w-3.5 h-3.5" />
                {post.likes_count}
              </span>
              <span className="flex items-center gap-1 hover:text-accent transition-colors">
                <MessageCircle className="w-3.5 h-3.5" />
                {post.comments_count}
              </span>
            </div>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
