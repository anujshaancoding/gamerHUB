"use client";

import { motion } from "framer-motion";
import {
  Gamepad2,
  Shield,
  Trophy,
  CheckCircle,
  ChevronRight,
  Swords,
  Target,
  Clock,
  Flame,
} from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";
import type { UserGame, Game } from "@/types/database";

interface UserGameWithGame extends UserGame {
  game: Game | null;
}

interface ProfileGamesProps {
  userGames: UserGameWithGame[];
}

// Rank color configurations
const rankColors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  // Generic ranks
  bronze: { bg: "bg-amber-900/30", text: "text-amber-400", border: "border-amber-600", glow: "shadow-amber-500/30" },
  silver: { bg: "bg-gray-400/20", text: "text-gray-300", border: "border-gray-400", glow: "shadow-gray-400/30" },
  gold: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500", glow: "shadow-yellow-500/40" },
  platinum: { bg: "bg-cyan-400/20", text: "text-cyan-300", border: "border-cyan-400", glow: "shadow-cyan-400/40" },
  diamond: { bg: "bg-blue-400/20", text: "text-blue-300", border: "border-blue-400", glow: "shadow-blue-400/50" },
  master: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500", glow: "shadow-purple-500/50" },
  grandmaster: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500", glow: "shadow-red-500/50" },
  challenger: { bg: "bg-gradient-to-r from-yellow-500/30 to-orange-500/30", text: "text-yellow-300", border: "border-yellow-400", glow: "shadow-yellow-500/60" },
  // Valorant ranks
  iron: { bg: "bg-gray-600/30", text: "text-gray-400", border: "border-gray-500", glow: "shadow-gray-500/30" },
  immortal: { bg: "bg-red-600/30", text: "text-red-400", border: "border-red-500", glow: "shadow-red-500/50" },
  radiant: { bg: "bg-gradient-to-r from-yellow-400/30 to-white/20", text: "text-yellow-200", border: "border-yellow-300", glow: "shadow-yellow-300/60" },
  // CS2 ranks
  "global elite": { bg: "bg-yellow-500/30", text: "text-yellow-300", border: "border-yellow-400", glow: "shadow-yellow-400/50" },
  // Default
  default: { bg: "bg-primary/20", text: "text-primary", border: "border-primary/50", glow: "shadow-primary/30" },
};

function getRankStyle(rank: string | null) {
  if (!rank) return rankColors.default;
  const lowerRank = rank.toLowerCase();
  for (const [key, value] of Object.entries(rankColors)) {
    if (lowerRank.includes(key)) return value;
  }
  return rankColors.default;
}

function GameCard({ ug, index }: { ug: UserGameWithGame; index: number }) {
  const rankStyle = getRankStyle(ug.rank);
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
      <div className="relative w-28 md:w-36 shrink-0 bg-surface overflow-hidden min-h-[100px]">
        {ug.game?.icon_url ? (
          <img
            src={ug.game.icon_url}
            alt={ug.game.name}
            className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gamepad2 className="h-10 w-10 text-primary opacity-50" />
          </div>
        )}
        {/* Subtle edge fade */}
        <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-r from-transparent to-surface-light/80" />

        {/* Verified badge */}
        {ug.is_verified && (
          <div className="absolute top-2 left-2 p-1 rounded-full bg-primary/90">
            <CheckCircle className="h-3 w-3 text-black" />
          </div>
        )}
      </div>

      {/* Game Info */}
      <div className="flex-1 p-4 min-w-0 flex flex-col justify-center">
        {/* Game Name */}
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-text text-lg truncate group-hover:text-primary transition-colors">
            {ug.game?.name || "Unknown Game"}
          </h3>
          <ChevronRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
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
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                ${rankStyle.bg} border ${rankStyle.border}
                shadow-lg ${rankStyle.glow}
              `}
            >
              <Trophy className={`h-3.5 w-3.5 ${rankStyle.text}`} />
              <span className={`text-sm font-bold ${rankStyle.text}`}>
                {ug.rank}
              </span>
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
        <div className="hidden lg:flex items-center gap-4 px-4 border-l border-border">
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

      {/* Hover glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
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
            className="text-center py-12"
          >
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-4 border border-border">
                <Gamepad2 className="h-10 w-10 text-text-muted" />
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
