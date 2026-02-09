"use client";

import { Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Feature {
  name: string;
  free: boolean | string;
  premium: boolean | string;
}

const features: Feature[] = [
  { name: "Basic matchmaking", free: true, premium: true },
  { name: "Create and join clans", free: true, premium: true },
  { name: "Participate in tournaments", free: true, premium: true },
  { name: "Direct messaging", free: true, premium: true },
  { name: "Voice/video calls", free: true, premium: true },
  { name: "Media uploads", free: "20MB limit", premium: "100MB limit" },
  { name: "Following limit", free: "100", premium: "Unlimited" },
  { name: "Priority matchmaking", free: false, premium: true },
  { name: "Advanced stats dashboard", free: false, premium: true },
  { name: "See who viewed your profile", free: false, premium: true },
  { name: "Exclusive titles & frames", free: false, premium: true },
  { name: "Premium profile themes", free: false, premium: true },
  { name: "Premium badge on profile", free: false, premium: true },
  { name: "Early access to new features", free: false, premium: true },
  { name: "Priority customer support", free: false, premium: true },
];

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm text-zinc-300">{value}</span>;
  }

  return value ? (
    <Check className="h-5 w-5 text-green-400" />
  ) : (
    <X className="h-5 w-5 text-zinc-600" />
  );
}

interface PlanComparisonProps {
  isPremium?: boolean;
}

export function PlanComparison({ isPremium = false }: PlanComparisonProps) {
  return (
    <Card className="overflow-hidden bg-zinc-900/50 border-zinc-800">
      {/* Header */}
      <div className="grid grid-cols-3 border-b border-zinc-800">
        <div className="p-4 border-r border-zinc-800">
          <h3 className="font-semibold text-white">Features</h3>
        </div>
        <div className="p-4 text-center border-r border-zinc-800">
          <h3 className="font-semibold text-white">Free</h3>
          <p className="text-sm text-zinc-400 mt-1">$0/month</p>
        </div>
        <div className="p-4 text-center bg-purple-500/10">
          <h3 className="font-semibold text-purple-300">Premium</h3>
          <p className="text-sm text-zinc-400 mt-1">$9.99/month</p>
        </div>
      </div>

      {/* Features */}
      <div className="divide-y divide-zinc-800">
        {features.map((feature, index) => (
          <div
            key={feature.name}
            className={cn(
              "grid grid-cols-3",
              index % 2 === 0 && "bg-zinc-900/30"
            )}
          >
            <div className="p-4 border-r border-zinc-800">
              <span className="text-sm text-zinc-300">{feature.name}</span>
            </div>
            <div className="p-4 flex items-center justify-center border-r border-zinc-800">
              <FeatureValue value={feature.free} />
            </div>
            <div className="p-4 flex items-center justify-center bg-purple-500/5">
              <FeatureValue value={feature.premium} />
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="grid grid-cols-3 border-t border-zinc-800">
        <div className="p-4 border-r border-zinc-800" />
        <div className="p-4 flex items-center justify-center border-r border-zinc-800">
          {isPremium ? (
            <span className="text-sm text-zinc-500">Your old plan</span>
          ) : (
            <span className="text-sm text-zinc-400">Current plan</span>
          )}
        </div>
        <div className="p-4 flex items-center justify-center bg-purple-500/10">
          {isPremium ? (
            <span className="text-sm text-green-400">Your current plan</span>
          ) : (
            <Link href="/premium">
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                Upgrade Now
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
