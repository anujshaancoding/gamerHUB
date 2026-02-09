"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Newspaper,
  RefreshCw,
  Search,
  X,
  Filter,
} from "lucide-react";
import { Card, Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useNewsArticles } from "@/lib/hooks/useNews";
import { NewsArticleCard } from "./NewsArticleCard";
import {
  ALL_GAME_SLUGS,
  GAME_DISPLAY_NAMES,
  GAME_COLORS,
} from "@/lib/news/constants";
import { NEWS_CATEGORIES } from "@/types/news";
import type { NewsCategory, GameSlug, NewsFilters } from "@/types/news";

export function NewsFeed() {
  const [gameFilter, setGameFilter] = useState<GameSlug | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<NewsCategory | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const filters: NewsFilters = {
    game: gameFilter,
    category: categoryFilter,
    search: activeSearch || undefined,
  };

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useNewsArticles(filters);

  const articles = data?.pages.flatMap((page) => page.posts) || [];
  const totalCount = data?.pages[0]?.total || 0;

  const handleSearch = useCallback(() => {
    setActiveSearch(searchQuery.trim());
  }, [searchQuery]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setActiveSearch("");
  }, []);

  const clearFilters = useCallback(() => {
    setGameFilter(undefined);
    setCategoryFilter(undefined);
    setSearchQuery("");
    setActiveSearch("");
  }, []);

  const hasActiveFilters = gameFilter || categoryFilter || activeSearch;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search news..."
            className="pl-9 pr-8"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
        </Button>
      </div>

      {/* Game Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setGameFilter(undefined)}
          className={cn(
            "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
            !gameFilter
              ? "bg-primary/20 text-primary border-primary/30"
              : "bg-surface-light text-text-secondary border-border hover:text-text hover:border-text-muted"
          )}
        >
          All Games
        </button>
        {ALL_GAME_SLUGS.map((slug) => {
          const isActive = gameFilter === slug;
          const color = GAME_COLORS[slug];
          return (
            <button
              key={slug}
              onClick={() => setGameFilter(isActive ? undefined : slug)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                isActive
                  ? color
                  : "bg-surface-light text-text-secondary border-border hover:text-text hover:border-text-muted"
              )}
            >
              {GAME_DISPLAY_NAMES[slug]}
            </button>
          );
        })}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setCategoryFilter(undefined)}
          className={cn(
            "flex-shrink-0 px-2.5 py-1 rounded text-xs font-medium transition-colors",
            !categoryFilter
              ? "bg-text/10 text-text"
              : "text-text-muted hover:text-text"
          )}
        >
          All
        </button>
        {(Object.entries(NEWS_CATEGORIES) as [NewsCategory, { label: string; color: string }][]).map(
          ([key, value]) => (
            <button
              key={key}
              onClick={() => setCategoryFilter(categoryFilter === key ? undefined : key)}
              className={cn(
                "flex-shrink-0 px-2.5 py-1 rounded text-xs font-medium transition-colors",
                categoryFilter === key
                  ? "bg-text/10 text-text"
                  : "text-text-muted hover:text-text"
              )}
            >
              {value.label}
            </button>
          )
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Filter className="h-3 w-3" />
          <span>
            {totalCount} result{totalCount !== 1 ? "s" : ""}
          </span>
          <button
            onClick={clearFilters}
            className="text-primary hover:text-primary/80 ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Articles List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="overflow-hidden border-l-4 border-l-border animate-pulse">
              <div className="flex gap-0">
                <div className="w-[120px] sm:w-[160px] h-[100px] bg-surface-light" />
                <div className="flex-1 p-4 space-y-3">
                  <div className="flex gap-2">
                    <div className="h-5 w-16 bg-surface-light rounded" />
                    <div className="h-5 w-20 bg-surface-light rounded" />
                  </div>
                  <div className="h-5 w-3/4 bg-surface-light rounded" />
                  <div className="h-4 w-full bg-surface-light rounded" />
                  <div className="h-3 w-1/3 bg-surface-light rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <Card className="p-8 text-center">
          <Newspaper className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">
            No news yet
          </h3>
          <p className="text-text-muted">
            {hasActiveFilters
              ? "No articles match your filters. Try adjusting them."
              : "Gaming news will appear here once articles are published. Check back soon!"}
          </p>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-3">
              Clear Filters
            </Button>
          )}
        </Card>
      ) : (
        <motion.div
          className="space-y-3"
          initial={false}
        >
          {articles.map((article, index) => (
            <NewsArticleCard
              key={article.id}
              article={article}
              index={index}
            />
          ))}
        </motion.div>
      )}

      {/* Load More */}
      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
