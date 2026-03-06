"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wifi, ChevronRight } from "lucide-react";
import { Card, Button } from "@/components/ui";
import { GamerCard } from "./gamer-card";
import { useQuery } from "@tanstack/react-query";
import type { Profile, UserGame, Game } from "@/types/database";

interface GamerWithGames extends Profile {
  user_games: (UserGame & { game: Game })[];
}

interface OnlineGamersSectionProps {
  className?: string;
}

const INITIAL_COUNT = 3;
const LOAD_MORE_COUNT = 3;

export function OnlineGamersSection({ className }: OnlineGamersSectionProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  const { data, isLoading, error } = useQuery({
    queryKey: ["online-gamers", visibleCount],
    queryFn: async () => {
      const res = await fetch(`/api/gamers/online?limit=${visibleCount}`);
      if (!res.ok) throw new Error("Failed to fetch online gamers");
      return res.json() as Promise<{ gamers: GamerWithGames[]; hasMore: boolean }>;
    },
    refetchInterval: 30000, // Refresh every 30s to keep online status current
    staleTime: 15000,
  });

  const gamers = data?.gamers || [];
  const hasMore = data?.hasMore || false;

  // Don't render if no online gamers and not loading
  if (!isLoading && gamers.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wifi className="h-5 w-5 text-success" />
          <h2 className="text-lg font-semibold text-text">Online Gamers</h2>
          {gamers.length > 0 && (
            <span className="text-xs text-text-muted bg-surface-light px-2 py-0.5 rounded-full">
              {gamers.length} online
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4 h-[180px] animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-surface-light shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="w-24 h-4 bg-surface-light rounded" />
                  <div className="w-16 h-3 bg-surface-light rounded" />
                  <div className="w-32 h-3 bg-surface-light rounded" />
                </div>
              </div>
              <div className="flex justify-between items-center mt-auto pt-4">
                <div className="w-16 h-3 bg-surface-light rounded" />
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-surface-light rounded" />
                  <div className="w-8 h-8 bg-surface-light rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="p-4 text-center text-text-muted">
          Failed to load online gamers. Please try again later.
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {gamers.map((gamer, index) => (
              <motion.div
                key={gamer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GamerCard gamer={gamer} />
              </motion.div>
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((prev) => prev + LOAD_MORE_COUNT)}
              >
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
