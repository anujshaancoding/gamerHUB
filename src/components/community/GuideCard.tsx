"use client";

import { motion } from "framer-motion";
import { Clock, Eye, Heart, MessageSquare, BookOpen } from "lucide-react";
import Link from "next/link";
import type { Guide, GuideDifficulty, GuideType } from "@/types/community";

interface GuideCardProps {
  guide: Guide;
  variant?: "default" | "compact" | "featured";
}

const DIFFICULTY_COLORS: Record<GuideDifficulty, string> = {
  beginner: "bg-green-500/10 text-green-500",
  intermediate: "bg-yellow-500/10 text-yellow-500",
  advanced: "bg-orange-500/10 text-orange-500",
  expert: "bg-red-500/10 text-red-500",
};

const TYPE_LABELS: Record<GuideType, string> = {
  beginner: "Beginner",
  advanced: "Advanced",
  meta: "Meta",
  character: "Character",
  map: "Map",
  strategy: "Strategy",
  tips: "Tips & Tricks",
  settings: "Settings",
  other: "Guide",
};

export function GuideCard({ guide, variant = "default" }: GuideCardProps) {
  if (variant === "compact") {
    return (
      <Link href={`/guides/${guide.slug}`}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
        >
          {guide.cover_image_url ? (
            <img
              src={guide.cover_image_url}
              alt={guide.title}
              className="w-16 h-12 rounded object-cover"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/banners/gaming-3.svg'; }}
            />
          ) : (
            <div className="w-16 h-12 rounded bg-muted flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{guide.title}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{guide.author?.username}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {guide.estimated_read_minutes} min
              </span>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              DIFFICULTY_COLORS[guide.difficulty]
            }`}
          >
            {guide.difficulty}
          </span>
        </motion.div>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link href={`/guides/${guide.slug}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl border border-border bg-card group"
        >
          {/* Cover Image */}
          <div className="relative h-48 overflow-hidden">
            {guide.cover_image_url ? (
              <img
                src={guide.cover_image_url}
                alt={guide.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/banners/gaming-3.svg'; }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-primary/50" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

            {/* Game Badge */}
            {guide.game && (
              <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                {guide.game.icon_url && (
                  <img
                    src={guide.game.icon_url}
                    alt={guide.game.name}
                    className="w-4 h-4 rounded"
                  />
                )}
                <span className="text-xs text-white">{guide.game.name}</span>
              </div>
            )}

            {/* Featured Badge */}
            {guide.is_featured && (
              <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-yellow-500/90 text-xs font-medium text-black">
                Featured
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                {guide.title}
              </h3>
            </div>

            {guide.excerpt && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {guide.excerpt}
              </p>
            )}

            <div className="flex items-center gap-3">
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  DIFFICULTY_COLORS[guide.difficulty]
                }`}
              >
                {guide.difficulty}
              </span>
              <span className="text-xs text-muted-foreground">
                {TYPE_LABELS[guide.guide_type]}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                {guide.author?.avatar_url ? (
                  <img
                    src={guide.author.avatar_url}
                    alt={guide.author.username}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-muted" />
                )}
                <span className="text-sm">{guide.author?.username}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {guide.estimated_read_minutes} min
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {guide.view_count}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {guide.like_count}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  // Default variant
  return (
    <Link href={`/guides/${guide.slug}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
      >
        {/* Thumbnail */}
        {guide.cover_image_url ? (
          <img
            src={guide.cover_image_url}
            alt={guide.title}
            className="w-24 h-20 rounded-lg object-cover flex-shrink-0"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/banners/gaming-3.svg'; }}
          />
        ) : (
          <div className="w-24 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold line-clamp-1">{guide.title}</h3>
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                DIFFICULTY_COLORS[guide.difficulty]
              }`}
            >
              {guide.difficulty}
            </span>
          </div>

          {guide.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {guide.excerpt}
            </p>
          )}

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{guide.author?.username}</span>
              {guide.game && (
                <>
                  <span>•</span>
                  <span>{guide.game.name}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {guide.estimated_read_minutes}m
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {guide.view_count}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
