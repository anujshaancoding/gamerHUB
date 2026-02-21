"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  X,
  Eye,
  Heart,
  MessageCircle,
  Clock,
  Gamepad2,
  Sparkles,
  Pin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { BLOG_CATEGORIES } from "@/types/blog";
import type { BlogPost, BlogCategory } from "@/types/blog";
import { formatDistanceToNow } from "date-fns";

interface BlogListContentProps {
  initialPosts: BlogPost[];
  totalPosts: number;
  currentPage: number;
  limit: number;
  games: { id: string; slug: string; name: string; icon_url: string | null }[];
  currentFilters: Record<string, string | undefined>;
}

export function BlogListContent({
  initialPosts,
  totalPosts,
  currentPage,
  limit,
  games,
  currentFilters,
}: BlogListContentProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(currentFilters.search || "");

  const totalPages = Math.ceil(totalPosts / limit);

  const buildUrl = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { ...currentFilters, ...updates };

    // Reset page when changing filters
    if (updates.page === undefined && Object.keys(updates).some((k) => k !== "page")) {
      delete merged.page;
    }

    Object.entries(merged).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    const qs = params.toString();
    return `/blog${qs ? `?${qs}` : ""}`;
  };

  const handleSearch = () => {
    router.push(buildUrl({ search: searchInput || undefined }));
  };

  const clearFilter = (key: string) => {
    router.push(buildUrl({ [key]: undefined }));
  };

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

  const activeFilters = Object.entries(currentFilters).filter(
    ([key, val]) => val && key !== "page"
  );

  return (
    <div>
      {/* Search bar */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-lg text-text text-sm placeholder:text-text-dim focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-5 py-2.5 bg-primary text-black font-medium text-sm rounded-lg hover:bg-primary-dark transition-colors"
        >
          Search
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
        <Link
          href={buildUrl({ category: undefined })}
          className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !currentFilters.category
              ? "bg-primary text-black"
              : "bg-surface text-text-muted hover:bg-surface-light"
          }`}
        >
          All
        </Link>
        {Object.entries(BLOG_CATEGORIES).map(([key, { label, color }]) => (
          <Link
            key={key}
            href={buildUrl({ category: key })}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentFilters.category === key
                ? "bg-primary text-black"
                : "bg-surface text-text-muted hover:bg-surface-light"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Game filter */}
      {games.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          <Link
            href={buildUrl({ game: undefined })}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !currentFilters.game
                ? "bg-accent/20 text-accent border border-accent/30"
                : "bg-surface text-text-muted hover:bg-surface-light"
            }`}
          >
            All Games
          </Link>
          {games.map((game) => (
            <Link
              key={game.id}
              href={buildUrl({ game: game.slug })}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                currentFilters.game === game.slug
                  ? "bg-accent/20 text-accent border border-accent/30"
                  : "bg-surface text-text-muted hover:bg-surface-light"
              }`}
            >
              {game.icon_url ? (
                <img
                  src={game.icon_url}
                  alt={game.name}
                  className="w-4 h-4 rounded"
                />
              ) : (
                <Gamepad2 className="w-3.5 h-3.5" />
              )}
              {game.name}
            </Link>
          ))}
        </div>
      )}

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {activeFilters.map(([key, val]) => (
            <button
              key={key}
              onClick={() => clearFilter(key)}
              className="flex items-center gap-1.5 px-3 py-1 bg-surface-light text-text-secondary text-xs rounded-full hover:bg-surface-lighter transition-colors"
            >
              <span className="capitalize">{key}:</span>
              <span className="text-text">{val}</span>
              <X className="w-3 h-3 ml-0.5" />
            </button>
          ))}
          <Link
            href="/blog"
            className="px-3 py-1 text-xs text-text-dim hover:text-text transition-colors"
          >
            Clear all
          </Link>
        </div>
      )}

      {/* Posts grid */}
      {initialPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {initialPosts.map((post) => {
            const catInfo = BLOG_CATEGORIES[post.category];
            const catColor =
              categoryColors[catInfo?.color || "blue"] || categoryColors.blue;

            return (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group block h-full"
              >
                <article className="relative h-full rounded-xl overflow-hidden bg-surface border border-border hover:border-primary/40 transition-all duration-300 hover:-translate-y-1">
                  {/* Cover image */}
                  {post.featured_image_url && (
                    <div className="relative h-40 overflow-hidden">
                      <Image
                        src={post.featured_image_url}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        {post.is_featured && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-primary to-accent text-black text-xs font-bold rounded">
                            <Sparkles className="w-3 h-3" />
                            Featured
                          </span>
                        )}
                        {post.is_pinned && !post.is_featured && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/90 text-black text-xs font-bold rounded">
                            <Pin className="w-3 h-3" />
                            Pinned
                          </span>
                        )}
                      </div>

                      {/* Game tag */}
                      {post.game && (
                        <div className="absolute bottom-3 left-3">
                          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-full text-xs text-white/90">
                            {post.game.icon_url ? (
                              <img
                                src={post.game.icon_url}
                                alt={post.game.name}
                                className="w-4 h-4 rounded"
                              />
                            ) : (
                              <Gamepad2 className="w-3.5 h-3.5" />
                            )}
                            {post.game.name}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-5">
                    {/* Category + date */}
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium border ${catColor}`}
                      >
                        {catInfo?.label || post.category}
                      </span>
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
                    <h2 className="font-bold text-text mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs text-text-muted bg-surface-light px-2 py-0.5 rounded-md"
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

                    {/* Footer: author + stats */}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-2">
                        {post.author?.avatar_url ? (
                          <img
                            src={post.author.avatar_url}
                            alt={
                              post.author.display_name ||
                              post.author.username ||
                              ""
                            }
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-surface-light" />
                        )}
                        <span className="text-sm text-text-secondary truncate max-w-[120px]">
                          {post.author?.display_name || post.author?.username}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {post.views_count > 999
                            ? `${(post.views_count / 1000).toFixed(1)}k`
                            : post.views_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5" />
                          {post.likes_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5" />
                          {post.comments_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-text-muted text-lg mb-2">No posts found</p>
          <p className="text-text-dim text-sm mb-6">
            Try adjusting your filters or search terms
          </p>
          <Link
            href="/blog"
            className="inline-block px-5 py-2.5 bg-primary text-black font-semibold rounded-lg hover:bg-primary-dark transition-colors text-sm"
          >
            View all posts
          </Link>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="flex items-center justify-center gap-2"
          aria-label="Blog pagination"
        >
          {currentPage > 1 && (
            <Link
              href={buildUrl({ page: String(currentPage - 1) })}
              className="flex items-center gap-1 px-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-muted hover:bg-surface-light hover:text-text transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Link>
          )}

          <span className="px-4 py-2 text-sm text-text-muted">
            Page {currentPage} of {totalPages}
          </span>

          {currentPage < totalPages && (
            <Link
              href={buildUrl({ page: String(currentPage + 1) })}
              className="flex items-center gap-1 px-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-muted hover:bg-surface-light hover:text-text transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
