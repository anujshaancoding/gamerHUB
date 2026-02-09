"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, ChevronRight, Star } from "lucide-react";
import { HorizontalScroll, Card, Button } from "@/components/ui";
import { ProPlayerCard } from "./pro-player-card";
import { useProPlayers } from "@/lib/hooks/useProPlayers";

interface ProPlayersSectionProps {
  className?: string;
  gameId?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function ProPlayersSection({ className, gameId, isExpanded, onToggleExpand }: ProPlayersSectionProps) {
  const { proPlayers, loading } = useProPlayers({
    gameId,
    limit: 10,
  });

  // Show loading state
  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-warning" />
            <h2 className="text-lg font-semibold text-text">Pro Players</h2>
          </div>
        </div>
        <HorizontalScroll>
          {[...Array(5)].map((_, i) => (
            <Card
              key={i}
              className="p-5 min-w-[240px] w-[240px] h-[280px] animate-pulse snap-start"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-full bg-surface-light" />
                <div className="w-28 h-5 bg-surface-light rounded" />
                <div className="w-20 h-4 bg-surface-light rounded" />
                <div className="w-24 h-4 bg-surface-light rounded" />
                <div className="flex gap-1">
                  <div className="w-16 h-6 bg-surface-light rounded-full" />
                  <div className="w-16 h-6 bg-surface-light rounded-full" />
                </div>
                <div className="w-full h-8 bg-surface-light rounded" />
              </div>
            </Card>
          ))}
        </HorizontalScroll>
      </div>
    );
  }

  // Empty state
  if (proPlayers.length === 0) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-warning" />
            <h2 className="text-lg font-semibold text-text">Pro Players</h2>
          </div>
        </div>
        <Card className="p-6 text-center">
          <Star className="h-10 w-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary mb-2">No pro players found</p>
          <p className="text-sm text-text-muted">
            Add games to discover pro players in your favorite titles
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-warning" />
          <h2 className="text-lg font-semibold text-text">Pro Players</h2>
          <span className="text-sm text-text-muted">
            in your games
          </span>
        </div>
        {isExpanded ? (
          <Button variant="ghost" size="sm" onClick={onToggleExpand}>
            Show Less
          </Button>
        ) : (
          <Link
            href="/find-gamers?style=pro"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            See All
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {isExpanded ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {proPlayers.map((player, index) => (
            <motion.div
              key={player.user_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ProPlayerCard player={player} />
            </motion.div>
          ))}
        </div>
      ) : (
        <>
          <HorizontalScroll>
            {proPlayers.map((player) => (
              <ProPlayerCard key={player.user_id} player={player} />
            ))}
          </HorizontalScroll>
          {proPlayers.length > 3 && onToggleExpand && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={onToggleExpand}>
                Show More ({proPlayers.length} players)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
