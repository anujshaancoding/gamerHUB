"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  ExternalLink,
  Clock,
  Eye,
  Gamepad2,
} from "lucide-react";
import { Card, CardContent, RelativeTime } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  GAME_COLORS,
  GAME_BORDER_COLORS,
  GAME_DISPLAY_NAMES,
  CATEGORY_COLORS,
} from "@/lib/news/constants";
import { NEWS_CATEGORIES } from "@/types/news";
import type { NewsArticle } from "@/types/news";

interface NewsArticleCardProps {
  article: NewsArticle;
  index?: number;
  variant?: "default" | "compact";
}

export function NewsArticleCard({ article, index = 0, variant = "default" }: NewsArticleCardProps) {
  const gameName = GAME_DISPLAY_NAMES[article.game_slug] || article.game_slug;
  const gameColor = GAME_COLORS[article.game_slug] || "bg-primary/20 text-primary border-primary/30";
  const borderColor = GAME_BORDER_COLORS[article.game_slug] || "border-l-primary";
  const categoryInfo = NEWS_CATEGORIES[article.category];
  const categoryColor = CATEGORY_COLORS[article.category] || "bg-gray-500/20 text-gray-400";

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
      >
        <a
          href={article.original_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg border-l-2 hover:bg-surface-light transition-colors",
            borderColor
          )}>
            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium uppercase", categoryColor)}>
              {categoryInfo?.label || article.category}
            </span>
            <span className="text-sm text-text flex-1 line-clamp-1">{article.title}</span>
            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", gameColor)}>
              {gameName}
            </span>
            <span className="text-xs text-text-muted whitespace-nowrap">
              <RelativeTime date={article.published_at || article.created_at} />
            </span>
          </div>
        </a>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <a
        href={article.original_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <Card className={cn(
          "overflow-hidden hover:border-primary/50 transition-colors cursor-pointer border-l-4",
          borderColor
        )}>
          <CardContent className="p-0">
            <div className="flex gap-0">
              {/* Thumbnail */}
              {article.thumbnail_url && (
                <div className="relative w-[120px] sm:w-[160px] flex-shrink-0 bg-surface-light min-h-[100px]">
                  <Image
                    src={article.thumbnail_url}
                    alt={article.title}
                    fill
                    className="object-cover"
                    sizes="160px"
                    unoptimized
                  />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 p-3 sm:p-4 min-w-0">
                {/* Badges */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
                    gameColor
                  )}>
                    <Gamepad2 className="h-3 w-3" />
                    {gameName}
                  </span>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium",
                    categoryColor
                  )}>
                    {categoryInfo?.label || article.category}
                  </span>
                  {article.region !== "global" && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                      {article.region.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-sm sm:text-base font-semibold text-text mb-1.5 line-clamp-2">
                  {article.title}
                </h3>

                {/* Excerpt */}
                {article.excerpt && (
                  <p className="text-xs sm:text-sm text-text-muted line-clamp-2 mb-2">
                    {article.excerpt}
                  </p>
                )}

                {/* Meta row */}
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  {article.source && (
                    <span className="font-medium text-text-secondary">
                      {article.source.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <RelativeTime date={article.published_at || article.created_at} />
                  </span>
                  {article.views_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {article.views_count.toLocaleString()}
                    </span>
                  )}
                  <ExternalLink className="h-3 w-3 ml-auto flex-shrink-0" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </a>
    </motion.div>
  );
}
