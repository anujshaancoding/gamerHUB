"use client";

import { useBattlePass } from "@/lib/hooks/useBattlePass";
import { Button } from "@/components/ui/button";
import { Sword, Clock, Star } from "lucide-react";
import Link from "next/link";

export function BattlePassBanner() {
  const { battlePass, currentLevel, maxLevel, daysRemaining, isLoading } =
    useBattlePass();

  if (isLoading || !battlePass) {
    return null;
  }

  return (
    <Link href="/battle-pass">
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-900/50 via-red-900/50 to-purple-900/50 border border-orange-500/30 rounded-xl p-4 sm:p-6 hover:border-orange-500/50 transition-colors cursor-pointer">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[url('/patterns/circuit.svg')] opacity-5" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-500/20 rounded-lg shrink-0">
              <Sword className="h-6 w-6 text-orange-400" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-lg">{battlePass.name}</h3>
                <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded">
                  Season {battlePass.season_number}
                </span>
              </div>

              <div className="flex items-center gap-4 mt-2 text-sm text-zinc-400">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span>
                    Level {currentLevel}/{maxLevel}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{daysRemaining} days left</span>
                </div>
              </div>
            </div>
          </div>

          <Button className="bg-orange-600 hover:bg-orange-700 shrink-0">
            View Battle Pass
          </Button>
        </div>

        {/* Progress bar */}
        <div className="relative mt-4">
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 transition-all duration-300"
              style={{ width: `${(currentLevel / maxLevel) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
