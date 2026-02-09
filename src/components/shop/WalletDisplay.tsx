"use client";

import { useWallet } from "@/lib/hooks/useWallet";
import { Coins, Gem, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface WalletDisplayProps {
  showBuyButton?: boolean;
  className?: string;
  compact?: boolean;
}

export function WalletDisplay({
  showBuyButton = true,
  className,
  compact = false,
}: WalletDisplayProps) {
  const { coins, gems, isLoadingWallet } = useWallet();

  if (isLoadingWallet) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="h-8 w-20 bg-zinc-800 animate-pulse rounded" />
        <div className="h-8 w-20 bg-zinc-800 animate-pulse rounded" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-1 text-yellow-400">
          <Coins className="h-4 w-4" />
          <span className="text-sm font-medium">{coins.toLocaleString()}</span>
        </div>
        <div className="w-px h-4 bg-zinc-700" />
        <div className="flex items-center gap-1 text-purple-400">
          <Gem className="h-4 w-4" />
          <span className="text-sm font-medium">{gems.toLocaleString()}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Coins */}
      <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-1.5">
        <Coins className="h-5 w-5 text-yellow-400" />
        <span className="font-semibold text-yellow-300">
          {coins.toLocaleString()}
        </span>
      </div>

      {/* Gems */}
      <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-lg px-3 py-1.5">
        <Gem className="h-5 w-5 text-purple-400" />
        <span className="font-semibold text-purple-300">
          {gems.toLocaleString()}
        </span>
        {showBuyButton && (
          <Link href="/shop?tab=gems">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
