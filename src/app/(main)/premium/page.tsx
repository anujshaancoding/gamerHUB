"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Crown, Check, Sparkles, Loader2, Tag, AlertCircle, RefreshCw, Gift } from "lucide-react";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { isPromoPeriodActive, PROMO_END_LABEL } from "@/lib/promo";
import { PricingCard } from "@/components/payments/PricingCard";
import { SubscriptionStatus } from "@/components/premium/SubscriptionStatus";
import { PlanComparison } from "@/components/premium/PlanComparison";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/lib/stripe";

export default function PremiumPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-purple-400" /></div>}>
      <PremiumPageContent />
    </Suspense>
  );
}

interface CouponInfo {
  code: string;
  discount_percent: number;
  discount_label: string;
}

function PremiumPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");
  const couponRedeemed = searchParams.get("coupon_redeemed");

  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponInfo | null>(null);
  const [redeemLoading, setRedeemLoading] = useState(false);

  const {
    plans,
    isPremium,
    subscription,
    isLoadingPlans,
    isLoadingSubscription,
    plansError,
    refetchPlans,
    refetch,
  } = useSubscription();

  const premiumPlan = plans.find((p) => p.slug === "premium");

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError("");
    setAppliedCoupon(null);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim().toUpperCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCouponError(data.error || "Invalid coupon code");
        return;
      }

      setAppliedCoupon(data.coupon);
    } catch {
      setCouponError("Failed to validate coupon. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRedeemCoupon = async () => {
    if (!appliedCoupon || appliedCoupon.discount_percent !== 100) return;

    setRedeemLoading(true);

    try {
      const res = await fetch("/api/coupons/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: appliedCoupon.code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCouponError(data.error || "Failed to redeem coupon");
        return;
      }

      // Refresh subscription data and redirect with success
      refetch();
      router.push("/premium?coupon_redeemed=true");
    } catch {
      setCouponError("Failed to redeem coupon. Please try again.");
    } finally {
      setRedeemLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const getDiscountedPrice = (price: number) => {
    if (!appliedCoupon) return price;
    return Math.round(price * (1 - appliedCoupon.discount_percent / 100));
  };

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      {/* Success/Cancel messages */}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
          <Check className="h-5 w-5 text-green-400" />
          <div>
            <p className="font-semibold text-green-300">Welcome to Premium!</p>
            <p className="text-sm text-green-400/80">
              Your subscription is now active. Enjoy all the premium features!
            </p>
          </div>
        </div>
      )}

      {couponRedeemed && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
          <Check className="h-5 w-5 text-green-400" />
          <div>
            <p className="font-semibold text-green-300">Coupon Redeemed Successfully!</p>
            <p className="text-sm text-green-400/80">
              Your premium access has been activated. Enjoy all the premium features!
            </p>
          </div>
        </div>
      )}

      {canceled && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-yellow-300">
            Checkout was canceled. No charges were made.
          </p>
        </div>
      )}

      {/* Launch Promo Banner */}
      {isPromoPeriodActive() && (
        <div className="bg-gradient-to-r from-purple-600/20 via-pink-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6 text-center">
          <div className="inline-flex items-center justify-center p-2 bg-purple-500/20 rounded-full mb-3">
            <Gift className="h-6 w-6 text-purple-300" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Launch Celebration — Premium is FREE for Everyone!
          </h2>
          <p className="text-zinc-300 max-w-lg mx-auto">
            All premium features are unlocked for every user until{" "}
            <span className="font-semibold text-purple-300">{PROMO_END_LABEL}</span>.
            No credit card required.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-purple-500/20 rounded-full">
          <Crown className="h-8 w-8 text-purple-400" />
        </div>
        <h1 className="text-4xl font-bold text-white">
          GamerHub Premium
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          {isPromoPeriodActive()
            ? "You currently have full access to all premium features. Here's what's included."
            : "Take your gaming experience to the next level with exclusive features, priority access, and unique cosmetics."}
        </p>
      </div>

      {/* Current Subscription Status (if subscribed) */}
      {isPremium && !isLoadingSubscription && (
        <div className="max-w-lg mx-auto">
          <SubscriptionStatus />
        </div>
      )}

      {/* Pricing Section (if not subscribed) */}
      {!isPremium && (
        <>
          {/* Billing Toggle */}
          <div className="flex justify-center">
            <div className="inline-flex items-center bg-zinc-900/50 rounded-lg p-1 border border-zinc-800">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  billingCycle === "monthly"
                    ? "bg-purple-600 text-white"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                  billingCycle === "yearly"
                    ? "bg-purple-600 text-white"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                Yearly
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white">Free</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  Everything you need to get started
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-white">₹0</span>
                  <span className="text-zinc-400 ml-2">/month</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6 flex-1">
                {[
                  "Join/request clans",
                  "Participate in tournaments/giveaways",
                  "Direct messaging",
                  "20MB media uploads",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-zinc-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button variant="outline" disabled className="w-full">
                Current Plan
              </Button>
            </div>

            {/* Premium Plan */}
            {isLoadingPlans ? (
              <div className="bg-zinc-900/50 border border-purple-500/30 rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-zinc-800 rounded w-1/3 mb-4" />
                <div className="h-10 bg-zinc-800 rounded w-1/2 mb-6" />
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-4 bg-zinc-800 rounded w-full" />
                  ))}
                </div>
              </div>
            ) : plansError || !premiumPlan ? (
              <div className="bg-zinc-900/50 border border-red-500/30 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-4">
                <AlertCircle className="h-10 w-10 text-red-400" />
                <div>
                  <p className="text-white font-semibold">Failed to load pricing</p>
                  <p className="text-sm text-zinc-400 mt-1">
                    There was a problem loading the plan details.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchPlans()}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              </div>
            ) : (
              <PricingCard
                name={premiumPlan.name}
                description={premiumPlan.description}
                priceMonthly={
                  appliedCoupon
                    ? getDiscountedPrice(premiumPlan.price_monthly)
                    : premiumPlan.price_monthly
                }
                priceYearly={
                  appliedCoupon
                    ? getDiscountedPrice(premiumPlan.price_yearly)
                    : premiumPlan.price_yearly
                }
                originalPriceMonthly={appliedCoupon ? premiumPlan.price_monthly : undefined}
                originalPriceYearly={appliedCoupon ? premiumPlan.price_yearly : undefined}
                stripePriceIdMonthly={premiumPlan.stripe_price_id_monthly}
                stripePriceIdYearly={premiumPlan.stripe_price_id_yearly}
                features={premiumPlan.features}
                billingCycle={billingCycle}
                isPopular
                coupon={appliedCoupon}
                onRedeemCoupon={
                  appliedCoupon?.discount_percent === 100
                    ? handleRedeemCoupon
                    : undefined
                }
                isRedeemingCoupon={redeemLoading}
              />
            )}
          </div>

          {/* Coupon Section */}
          <div className="max-w-md mx-auto">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">Have a coupon code?</h3>
              </div>

              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-green-300 font-medium">
                      {appliedCoupon.code}
                    </span>
                    <span className="text-xs text-green-400/80">
                      ({appliedCoupon.discount_label})
                    </span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleApplyCoupon();
                    }}
                    placeholder="Enter coupon code"
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-4"
                  >
                    {couponLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </Button>
                </div>
              )}

              {couponError && (
                <p className="text-xs text-red-400 mt-2">{couponError}</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Features Highlight */}
      <div className="pt-8">
        <h2 className="text-2xl font-bold text-white text-center mb-8">
          Premium Features
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Sparkles,
              title: "Exclusive Cosmetics",
              description:
                "Stand out with premium titles, frames, and themes that show off your status.",
            },
            {
              icon: Crown,
              title: "Priority Matchmaking",
              description:
                "Skip the queue and get matched with other premium players faster.",
            },
            {
              icon: Check,
              title: "Advanced Stats",
              description:
                "Deep dive into your performance with detailed analytics and insights.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
            >
              <feature.icon className="h-8 w-8 text-purple-400 mb-4" />
              <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-zinc-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Full Comparison */}
      <div className="pt-8">
        <h2 className="text-2xl font-bold text-white text-center mb-8">
          Full Feature Comparison
        </h2>
        <PlanComparison isPremium={isPremium} />
      </div>

      {/* FAQ */}
      <div className="pt-8 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-white text-center mb-8">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {[
            {
              q: "Can I cancel anytime?",
              a: "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.",
            },
            {
              q: "What payment methods do you accept?",
              a: "We accept all major credit cards, debit cards, and some regional payment methods through our secure payment partner, Stripe.",
            },
            {
              q: "Do I keep my cosmetics if I cancel?",
              a: "Premium-exclusive cosmetics will be unequipped when your subscription ends, but any items you've earned through gameplay are yours forever.",
            },
            {
              q: "Is there a free trial?",
              a: `Yes! As part of our launch celebration, all premium features are completely free for every user until ${PROMO_END_LABEL}. No credit card needed — just enjoy!`,
            },
            {
              q: "Do you offer coupon codes or discounts?",
              a: "Yes! We sometimes release coupon codes through our social media and events. Enter your code on this page above the pricing cards to get your discount.",
            },
          ].map((faq) => (
            <div
              key={faq.q}
              className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4"
            >
              <h4 className="font-semibold text-white mb-2">{faq.q}</h4>
              <p className="text-sm text-zinc-400">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
