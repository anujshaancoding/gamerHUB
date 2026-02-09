"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  game_id: string | null;
  post_count: number;
  is_locked: boolean;
}

interface CategoryCardProps {
  category: Category;
  variant?: "default" | "compact";
}

export function CategoryCard({ category, variant = "default" }: CategoryCardProps) {
  if (variant === "compact") {
    return (
      <Link href={`/forums/${category.slug}`}>
        <Card className="p-3 bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-xl">{category.icon || "💬"}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white truncate">{category.name}</h3>
              <p className="text-xs text-zinc-500">
                {category.post_count} posts
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-500" />
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/forums/${category.slug}`}>
      <Card
        className={cn(
          "p-4 bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors",
          category.color && `border-l-4`
        )}
        style={{
          borderLeftColor: category.color || undefined,
        }}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
            <span className="text-2xl">{category.icon || "💬"}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-white">{category.name}</h3>
              {category.is_locked && (
                <Badge variant="outline" className="text-xs text-zinc-500">
                  Locked
                </Badge>
              )}
            </div>
            {category.description && (
              <p className="text-sm text-zinc-400 line-clamp-2">
                {category.description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 text-zinc-400">
              <MessageSquare className="h-4 w-4" />
              <span className="font-medium">{category.post_count}</span>
            </div>
            <p className="text-xs text-zinc-500">posts</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
