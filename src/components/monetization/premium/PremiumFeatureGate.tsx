"use client";

import { useSubscription } from "@/lib/hooks/useSubscription";
import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ReactNode } from "react";

interface PremiumFeatureGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  featureName?: string;
}

export function PremiumFeatureGate({
  children,
  fallback,
  featureName = "This feature",
}: PremiumFeatureGateProps) {
  const { isPremium, isLoadingSubscription } = useSubscription();

  if (isLoadingSubscription) {
    return (
      <div className="animate-pulse bg-zinc-800/50 rounded-lg h-32" />
    );
  }

  if (isPremium) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="relative">
      {/* Blurred content preview */}
      <div className="blur-sm pointer-events-none opacity-50">{children}</div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 backdrop-blur-sm rounded-lg">
        <div className="text-center p-6">
          <div className="inline-flex items-center justify-center p-3 bg-purple-500/20 rounded-full mb-4">
            <Lock className="h-6 w-6 text-purple-400" />
          </div>
          <h3 className="font-semibold text-white mb-2">Premium Feature</h3>
          <p className="text-sm text-zinc-400 mb-4 max-w-xs">
            {featureName} is available exclusively for Premium members.
          </p>
          <Link href="/premium">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Crown className="mr-2 h-4 w-4" />
              Upgrade to Premium
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// HOC version for wrapping entire pages/sections
export function withPremiumAccess<P extends object>(
  Component: React.ComponentType<P>,
  featureName?: string
) {
  return function PremiumWrapper(props: P) {
    const { isPremium, isLoadingSubscription } = useSubscription();

    if (isLoadingSubscription) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
        </div>
      );
    }

    if (!isPremium) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
          <div className="inline-flex items-center justify-center p-4 bg-purple-500/20 rounded-full mb-6">
            <Lock className="h-8 w-8 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Premium Required</h2>
          <p className="text-zinc-400 mb-6 text-center max-w-md">
            {featureName || "This page"} is available exclusively for Premium
            members. Upgrade to unlock all features.
          </p>
          <Link href="/premium">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
              <Crown className="mr-2 h-5 w-5" />
              Upgrade to Premium
            </Button>
          </Link>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
