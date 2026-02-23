"use client";

import Image from "next/image";
import { Check, Lock, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

interface RewardItemProps {
  name: string;
  description?: string | null;
  iconUrl?: string | null;
  rarity: string;
  tier: "free" | "premium";
  isUnlocked: boolean;
  isClaimed: boolean;
  canClaim: boolean;
  onClaim?: () => void;
  isClaiming?: boolean;
}

const rarityColors: Record<string, string> = {
  common: "border-zinc-500 bg-zinc-500/10",
  uncommon: "border-green-500 bg-green-500/10",
  rare: "border-blue-500 bg-blue-500/10",
  epic: "border-purple-500 bg-purple-500/10",
  legendary: "border-yellow-500 bg-yellow-500/10",
};

const rarityGlows: Record<string, string> = {
  common: "",
  uncommon: "shadow-green-500/20",
  rare: "shadow-blue-500/20",
  epic: "shadow-purple-500/20",
  legendary: "shadow-yellow-500/30 animate-pulse",
};

export function RewardItem({
  name,
  description,
  iconUrl,
  rarity,
  tier,
  isUnlocked,
  isClaimed,
  canClaim,
  onClaim,
  isClaiming,
}: RewardItemProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center p-3 rounded-lg border-2 transition-all",
        rarityColors[rarity] || rarityColors.common,
        isUnlocked && !isClaimed && "shadow-lg",
        isUnlocked && rarityGlows[rarity],
        !isUnlocked && "opacity-50 grayscale"
      )}
    >
      {/* Tier indicator */}
      {tier === "premium" && (
        <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs px-1.5 py-0.5 rounded font-bold">
          PRO
        </div>
      )}

      {/* Icon/Preview */}
      <div
        className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center mb-2",
          "bg-zinc-800/50"
        )}
      >
        {iconUrl ? (
          <Image src={iconUrl} alt={name} width={40} height={40} className="w-10 h-10 object-contain" unoptimized />
        ) : (
          <Gift className="w-6 h-6 text-zinc-400" />
        )}
      </div>

      {/* Name */}
      <p className="text-xs text-center text-white font-medium line-clamp-2">
        {name}
      </p>

      {/* Status overlay */}
      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <Lock className="h-5 w-5 text-zinc-400" />
        </div>
      )}

      {isClaimed && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-lg">
          <Check className="h-5 w-5 text-green-400" />
        </div>
      )}

      {/* Claim button */}
      {canClaim && !isClaimed && (
        <button
          onClick={onClaim}
          disabled={isClaiming}
          className="absolute inset-0 flex items-center justify-center bg-orange-500/80 hover:bg-orange-500 rounded-lg transition-colors"
        >
          <span className="text-white text-xs font-bold">
            {isClaiming ? "..." : "CLAIM"}
          </span>
        </button>
      )}
    </div>
  );
}
