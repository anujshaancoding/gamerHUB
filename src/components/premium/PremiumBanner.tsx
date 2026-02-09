"use client";

import { Crown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";

interface PremiumBannerProps {
  dismissible?: boolean;
  variant?: "default" | "compact";
}

export function PremiumBanner({
  dismissible = true,
  variant = "default",
}: PremiumBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  if (variant === "compact") {
    return (
      <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-lg p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-yellow-400" />
          <span className="text-sm text-zinc-200">
            Unlock premium features
          </span>
        </div>
        <Link href="/premium">
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 h-7 text-xs">
            Upgrade
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-lg p-4 sm:p-6">
      {dismissible && (
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-yellow-500/20 rounded-lg shrink-0">
            <Crown className="h-6 w-6 text-yellow-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">
              Upgrade to Premium
            </h3>
            <p className="text-sm text-zinc-300 mt-1">
              Get exclusive features, priority matchmaking, and stand out with unique cosmetics.
            </p>
          </div>
        </div>

        <Link href="/premium" className="shrink-0">
          <Button className="bg-purple-600 hover:bg-purple-700">
            View Plans
          </Button>
        </Link>
      </div>
    </div>
  );
}
