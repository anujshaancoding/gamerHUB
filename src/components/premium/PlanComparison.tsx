"use client";

import { Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { isPromoPeriodActive, PROMO_END_LABEL } from "@/lib/promo";

interface Feature {
  name: string;
  free: boolean | string;
  premium: boolean | string;
}

const features: Feature[] = [
  { name: "Create tournaments/giveaways", free: false, premium: true },
  { name: "Create clans", free: false, premium: true },
  { name: "Participate in tournaments/giveaways", free: true, premium: true },
  { name: "Join/request clans", free: true, premium: true },
  { name: "Direct messaging", free: true, premium: true },
  { name: "Media uploads", free: "20MB limit", premium: "100MB limit" },
  { name: "Following limit", free: "100", premium: "Unlimited" },
  { name: "Advanced stats dashboard (Coming Soon)", free: false, premium: true },
  { name: "See who viewed your profile", free: false, premium: true },
  { name: "Exclusive titles & frames", free: false, premium: true },
  { name: "Premium profile themes", free: false, premium: true },
  { name: "Premium badge on profile", free: false, premium: true },
  { name: "Early access to new features", free: false, premium: true },
  { name: "Priority customer support", free: false, premium: true },
];

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm text-text-secondary">{value}</span>;
  }

  return value ? (
    <Check className="h-5 w-5 text-success" />
  ) : (
    <X className="h-5 w-5 text-text-muted" />
  );
}

interface PlanComparisonProps {
  isPremium?: boolean;
}

export function PlanComparison({ isPremium = false }: PlanComparisonProps) {
  return (
    <Card className="overflow-hidden bg-surface/50 border-border">
      {/* Header */}
      <div className="grid grid-cols-3 border-b border-border">
        <div className="p-4 border-r border-border">
          <h3 className="font-semibold text-text">Features</h3>
        </div>
        <div className="p-4 text-center border-r border-border">
          <h3 className="font-semibold text-text">Free</h3>
          <p className="text-sm text-text-muted mt-1">Free</p>
        </div>
        <div className="p-4 text-center bg-primary/10">
          <h3 className="font-semibold text-primary/80">Premium</h3>
          <p className="text-sm text-text-muted mt-1">
            {isPromoPeriodActive()
              ? `FREE until ${PROMO_END_LABEL}`
              : "Starting at ₹99/month"}
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="divide-y divide-border">
        {features.map((feature, index) => (
          <div
            key={feature.name}
            className={cn(
              "grid grid-cols-3",
              index % 2 === 0 && "bg-surface/30"
            )}
          >
            <div className="p-4 border-r border-border">
              <span className="text-sm text-text-secondary">{feature.name}</span>
            </div>
            <div className="p-4 flex items-center justify-center border-r border-border">
              <FeatureValue value={feature.free} />
            </div>
            <div className="p-4 flex items-center justify-center bg-primary/5">
              <FeatureValue value={feature.premium} />
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="grid grid-cols-3 border-t border-border">
        <div className="p-4 border-r border-border" />
        <div className="p-4 flex items-center justify-center border-r border-border">
          {isPremium ? (
            <span className="text-sm text-text-muted">Your old plan</span>
          ) : (
            <span className="text-sm text-text-muted">Current plan</span>
          )}
        </div>
        <div className="p-4 flex items-center justify-center bg-primary/10">
          {isPremium || isPromoPeriodActive() ? (
            <span className="text-sm text-success">
              {isPromoPeriodActive() ? `Free until ${PROMO_END_LABEL}` : "Your current plan"}
            </span>
          ) : (
            <Link href="/premium">
              <Button size="sm" className="bg-primary hover:bg-primary-dark">
                Upgrade Now
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
