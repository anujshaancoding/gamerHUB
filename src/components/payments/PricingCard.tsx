"use client";

import { Check, Loader2, Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "./CheckoutButton";
import { formatAmount } from "@/lib/stripe";
import { cn } from "@/lib/utils";

interface CouponInfo {
  code: string;
  discount_percent: number;
  discount_label: string;
}

interface PricingCardProps {
  name: string;
  description?: string | null;
  priceMonthly: number;
  priceYearly: number;
  originalPriceMonthly?: number;
  originalPriceYearly?: number;
  stripePriceIdMonthly?: string | null;
  stripePriceIdYearly?: string | null;
  features: string[];
  billingCycle: "monthly" | "yearly";
  isCurrentPlan?: boolean;
  isPopular?: boolean;
  className?: string;
  coupon?: CouponInfo | null;
  onRedeemCoupon?: () => void;
  isRedeemingCoupon?: boolean;
}

export function PricingCard({
  name,
  description,
  priceMonthly,
  priceYearly,
  originalPriceMonthly,
  originalPriceYearly,
  stripePriceIdMonthly,
  stripePriceIdYearly,
  features,
  billingCycle,
  isCurrentPlan = false,
  isPopular = false,
  className,
  coupon,
  onRedeemCoupon,
  isRedeemingCoupon,
}: PricingCardProps) {
  const price = billingCycle === "yearly" ? priceYearly : priceMonthly;
  const originalPrice = billingCycle === "yearly" ? originalPriceYearly : originalPriceMonthly;
  const priceId =
    billingCycle === "yearly" ? stripePriceIdYearly : stripePriceIdMonthly;
  const monthlyEquivalent =
    billingCycle === "yearly" ? Math.round(priceYearly / 12) : priceMonthly;
  const originalMonthlyEquivalent =
    originalPrice && billingCycle === "yearly"
      ? Math.round((originalPriceYearly || 0) / 12)
      : originalPriceMonthly;
  const savings =
    billingCycle === "yearly" ? priceMonthly * 12 - priceYearly : 0;
  const isFree = coupon?.discount_percent === 100;

  return (
    <Card
      className={cn(
        "relative flex flex-col p-6 bg-zinc-900/50 border-zinc-800",
        isPopular && "border-purple-500 ring-1 ring-purple-500",
        isCurrentPlan && "border-green-500 ring-1 ring-green-500",
        className
      )}
    >
      {isPopular && !isCurrentPlan && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500">
          Most Popular
        </Badge>
      )}

      {isCurrentPlan && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500">
          Current Plan
        </Badge>
      )}

      <div className="mb-4">
        <h3 className="text-xl font-bold text-white">{name}</h3>
        {description && (
          <p className="text-sm text-zinc-400 mt-1">{description}</p>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          {isFree ? (
            <>
              <span className="text-4xl font-bold text-green-400">FREE</span>
              {originalMonthlyEquivalent && (
                <span className="text-lg text-zinc-500 line-through">
                  {formatAmount(originalMonthlyEquivalent)}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="text-4xl font-bold text-white">
                {formatAmount(monthlyEquivalent)}
              </span>
              <span className="text-zinc-400">/month</span>
              {originalMonthlyEquivalent && originalMonthlyEquivalent !== monthlyEquivalent && (
                <span className="text-lg text-zinc-500 line-through">
                  {formatAmount(originalMonthlyEquivalent)}
                </span>
              )}
            </>
          )}
        </div>

        {billingCycle === "yearly" && !isFree && (
          <div className="mt-1 space-y-1">
            <p className="text-sm text-zinc-400">
              {formatAmount(price)} billed yearly
            </p>
            {savings > 0 && (
              <p className="text-sm text-green-400">
                Save {formatAmount(savings)}/year
              </p>
            )}
          </div>
        )}

        {coupon && (
          <div className="mt-2 inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 rounded-md px-2 py-1">
            <Tag className="h-3 w-3 text-green-400" />
            <span className="text-xs text-green-300 font-medium">
              {coupon.discount_label} applied
            </span>
          </div>
        )}
      </div>

      <ul className="space-y-3 mb-6 flex-1">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
            <span className="text-sm text-zinc-300">{feature}</span>
          </li>
        ))}
      </ul>

      {isCurrentPlan ? (
        <div className="text-center py-3 px-4 bg-zinc-800 rounded-lg text-zinc-400">
          Your current plan
        </div>
      ) : onRedeemCoupon ? (
        <Button
          onClick={onRedeemCoupon}
          disabled={isRedeemingCoupon}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isRedeemingCoupon ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Activating...
            </>
          ) : (
            "Activate Premium Free"
          )}
        </Button>
      ) : priceId ? (
        <CheckoutButton
          priceId={priceId}
          mode="subscription"
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          Subscribe Now
        </CheckoutButton>
      ) : (
        <div className="text-center py-3 px-4 bg-zinc-800 rounded-lg text-zinc-400">
          Coming Soon
        </div>
      )}
    </Card>
  );
}
