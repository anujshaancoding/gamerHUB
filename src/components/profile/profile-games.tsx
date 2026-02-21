"use client";

import { motion } from "framer-motion";
import {
  Gamepad2,
  CheckCircle,
  Swords,
  Target,
  Clock,
  Flame,
  ShieldAlert,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";
import { AnimatedRankEmblem } from "@/components/profile/animated-rank-emblem";
import { useGameTheme } from "@/components/profile/game-theme-provider";
import type { UserGame, Game } from "@/types/database";

interface UserGameWithGame extends UserGame {
  game: Game | null;
}

interface ProfileGamesProps {
  userGames: UserGameWithGame[];
}

function GameCard({ ug, index }: { ug: UserGameWithGame; index: number }) {
  const { theme: gameTheme } = useGameTheme();
  const stats = ug.stats as Record<string, number> | null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -30, rotateY: -10 }}
      animate={{ opacity: 1, x: 0, rotateY: 0 }}
      transition={{
        delay: index * 0.1,
        type: "spring",
        stiffness: 100,
      }}
      whileHover={{
        scale: 1.02,
        x: 10,
        transition: { duration: 0.2 },
      }}
      className={`
        relative flex items-stretch gap-0 rounded-xl overflow-hidden
        bg-surface-light border border-border
        hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10
        transition-all duration-300 group
      `}
    >
      {/* Game Image/Icon Section */}
      <div className="relative w-20 sm:w-28 md:w-36 shrink-0 bg-surface overflow-hidden min-h-[80px] sm:min-h-[100px]">
        {ug.game?.icon_url ? (
          <img
            src={ug.game.icon_url}
            alt={ug.game.name}
            className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-110"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/games/other.svg'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gamepad2 className="h-10 w-10 text-primary opacity-50" />
          </div>
        )}
        {/* Subtle edge fade */}
        <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-r from-transparent to-surface-light/80" />

        {/* Verified / Self-Reported badge */}
        {ug.is_verified ? (
          <div className="absolute top-2 left-2 p-1 rounded-full bg-primary/90">
            <CheckCircle className="h-3 w-3 text-black" />
          </div>
        ) : (ug.rank || ug.game_username) ? (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-surface/90 border border-border text-[10px] text-text-muted">
            <ShieldAlert className="h-2.5 w-2.5" />
            <span>Self-Reported</span>
          </div>
        ) : null}
      </div>

      {/* Game Info */}
      <div className="flex-1 p-3 sm:p-4 min-w-0 flex flex-col justify-center">
        {/* Game Name */}
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-text text-base sm:text-lg truncate group-hover:text-primary transition-colors">
            {ug.game?.name || "Unknown Game"}
          </h3>
        </div>

        {/* In-game username */}
        {ug.game_username && (
          <p className="text-sm text-text-muted truncate mb-2">
            <span className="text-text-dim">IGN:</span> {ug.game_username}
          </p>
        )}

        {/* Rank & Role */}
        <div className="flex flex-wrap gap-2">
          {ug.rank && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            >
              <AnimatedRankEmblem
                rank={ug.rank}
                gameSlug={ug.game?.slug}
                size="md"
              />
            </motion.div>
          )}
          {ug.role && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 + 0.3 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/20 border border-secondary/50"
            >
              <Swords className="h-3.5 w-3.5 text-secondary" />
              <span className="text-sm font-medium text-secondary">{ug.role}</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Stats Section */}
      {stats && Object.keys(stats).length > 0 && (
        <div className="hidden xl:flex items-center gap-4 px-4 border-l border-border">
          {Object.entries(stats)
            .slice(0, 3)
            .map(([key, value], i) => {
              const icons = [Target, Flame, Clock];
              const Icon = icons[i % icons.length];
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Icon className="h-3 w-3 text-text-muted" />
                    <p className="text-xl font-black text-text">{value}</p>
                  </div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">
                    {key.replace(/_/g, " ")}
                  </p>
                </motion.div>
              );
            })}
        </div>
      )}

      {/* Hover glow effect — themed */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to right, ${gameTheme.colors.primary}0D, transparent)` }}
        />
      </div>
    </motion.div>
  );
}

export function ProfileGames({ userGames }: ProfileGamesProps) {
  if (userGames.length === 0) {
    return (
      <Card className="gaming-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/20">
              <Gamepad2 className="h-5 w-5 text-primary" />
            </div>
            Games
          </CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-6"
          >
            <div className="relative inline-block">
              <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-3 border border-border">
                <Gamepad2 className="h-8 w-8 text-text-muted" />
              </div>
              {/* Animated rings */}
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-2xl border-2 border-primary/30"
              />
            </div>
            <p className="text-text-muted font-medium">No games linked yet</p>
            <p className="text-text-dim text-sm mt-1">
              Link your gaming accounts to showcase your stats!
            </p>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gaming-card-border overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/20">
              <Gamepad2 className="h-5 w-5 text-primary" />
            </div>
            Games
          </CardTitle>
          <Badge variant="primary" className="gap-1">
            <Flame className="h-3 w-3" />
            {userGames.length} Linked
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {userGames.map((ug, index) => (
            <GameCard key={ug.id} ug={ug} index={index} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
