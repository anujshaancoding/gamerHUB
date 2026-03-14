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
        "relative flex flex-col p-6 bg-surface/50 border-border",
        isPopular && "border-primary ring-1 ring-primary",
        isCurrentPlan && "border-success ring-1 ring-success",
        className
      )}
    >
      {isPopular && !isCurrentPlan && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
          Most Popular
        </Badge>
      )}

      {isCurrentPlan && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-success">
          Current Plan
        </Badge>
      )}

      <div className="mb-4">
        <h3 className="text-xl font-bold text-text">{name}</h3>
        {description && (
          <p className="text-sm text-text-muted mt-1">{description}</p>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          {isFree ? (
            <>
              <span className="text-4xl font-bold text-success">FREE</span>
              {originalMonthlyEquivalent && (
                <span className="text-lg text-text-muted line-through">
                  {formatAmount(originalMonthlyEquivalent)}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="text-4xl font-bold text-text">
                {formatAmount(monthlyEquivalent)}
              </span>
              <span className="text-text-muted">/month</span>
              {originalMonthlyEquivalent && originalMonthlyEquivalent !== monthlyEquivalent && (
                <span className="text-lg text-text-muted line-through">
                  {formatAmount(originalMonthlyEquivalent)}
                </span>
              )}
            </>
          )}
        </div>

        {billingCycle === "yearly" && !isFree && (
          <div className="mt-1 space-y-1">
            <p className="text-sm text-text-muted">
              {formatAmount(price)} billed yearly
            </p>
            {savings > 0 && (
              <p className="text-sm text-success">
                Save {formatAmount(savings)}/year
              </p>
            )}
          </div>
        )}

        {coupon && (
          <div className="mt-2 inline-flex items-center gap-1.5 bg-success/10 border border-success/30 rounded-md px-2 py-1">
            <Tag className="h-3 w-3 text-success" />
            <span className="text-xs text-success font-medium">
              {coupon.discount_label} applied
            </span>
          </div>
        )}
      </div>

      <ul className="space-y-3 mb-6 flex-1">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
            <span className="text-sm text-text-secondary">{feature}</span>
          </li>
        ))}
      </ul>

      {isCurrentPlan ? (
        <div className="text-center py-3 px-4 bg-surface-light rounded-lg text-text-muted">
          Your current plan
        </div>
      ) : onRedeemCoupon ? (
        <Button
          onClick={onRedeemCoupon}
          disabled={isRedeemingCoupon}
          className="w-full bg-success hover:bg-success/90"
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
          className="w-full bg-primary hover:bg-primary-dark"
        >
          Subscribe Now
        </CheckoutButton>
      ) : (
        <div className="text-center py-3 px-4 bg-surface-light rounded-lg text-text-muted">
          Coming Soon
        </div>
      )}
    </Card>
  );
}
