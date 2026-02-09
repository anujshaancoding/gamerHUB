"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStripe } from "@/lib/stripe-client";

interface SubscriptionPlan {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "paused";
  billing_cycle: "monthly" | "yearly" | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  plan: SubscriptionPlan | null;
}

interface SubscriptionData {
  subscription: UserSubscription | null;
  isPremium: boolean;
  premiumUntil: string | null;
}

// Fetch subscription plans
async function fetchPlans(): Promise<SubscriptionPlan[]> {
  const res = await fetch("/api/subscriptions/plans");
  if (!res.ok) throw new Error("Failed to fetch plans");
  const data = await res.json();
  return data.plans;
}

// Fetch user's subscription
async function fetchSubscription(): Promise<SubscriptionData> {
  const res = await fetch("/api/subscriptions");
  if (res.status === 401) {
    // User not authenticated - return default state instead of throwing
    return { subscription: null, isPremium: false, premiumUntil: null };
  }
  if (!res.ok) throw new Error("Failed to fetch subscription");
  return res.json();
}

// Create checkout session
async function createCheckoutSession(params: {
  priceId: string;
  mode?: "subscription" | "payment";
  successUrl?: string;
  cancelUrl?: string;
}): Promise<{ sessionId: string; url: string }> {
  const res = await fetch("/api/stripe/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to create checkout session");
  return res.json();
}

// Create portal session
async function createPortalSession(returnUrl?: string): Promise<{ url: string }> {
  const res = await fetch("/api/stripe/create-portal-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnUrl }),
  });
  if (!res.ok) throw new Error("Failed to create portal session");
  return res.json();
}

// Cancel subscription
async function cancelSubscription(): Promise<void> {
  const res = await fetch("/api/subscriptions/cancel", { method: "POST" });
  if (!res.ok) throw new Error("Failed to cancel subscription");
}

// Resume subscription
async function resumeSubscription(): Promise<void> {
  const res = await fetch("/api/subscriptions/resume", { method: "POST" });
  if (!res.ok) throw new Error("Failed to resume subscription");
}

export function useSubscription() {
  const queryClient = useQueryClient();

  // Query for subscription plans
  const plansQuery = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: fetchPlans,
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 2,
  });

  // Query for user's subscription
  const subscriptionQuery = useQuery({
    queryKey: ["user-subscription"],
    queryFn: fetchSubscription,
    staleTime: 1000 * 60, // 1 minute
    retry: 1,
  });

  // Mutation for subscribing
  const subscribeMutation = useMutation({
    mutationFn: async ({
      priceId,
      billingCycle,
    }: {
      priceId: string;
      billingCycle: "monthly" | "yearly";
    }) => {
      const { url } = await createCheckoutSession({
        priceId,
        mode: "subscription",
      });

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      } else {
        // Fallback to client-side redirect
        const stripe = await getStripe();
        if (stripe) {
          const { sessionId } = await createCheckoutSession({
            priceId,
            mode: "subscription",
          });
          await stripe.redirectToCheckout({ sessionId });
        }
      }
    },
  });

  // Mutation for managing billing (portal)
  const manageBillingMutation = useMutation({
    mutationFn: async (returnUrl?: string) => {
      const { url } = await createPortalSession(returnUrl);
      window.location.href = url;
    },
  });

  // Mutation for canceling
  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
    },
  });

  // Mutation for resuming
  const resumeMutation = useMutation({
    mutationFn: resumeSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
    },
  });

  return {
    // Data
    plans: plansQuery.data || [],
    subscription: subscriptionQuery.data?.subscription || null,
    isPremium: subscriptionQuery.data?.isPremium || false,
    premiumUntil: subscriptionQuery.data?.premiumUntil || null,

    // Loading states
    isLoadingPlans: plansQuery.isLoading,
    isLoadingSubscription: subscriptionQuery.isLoading,

    // Error states
    plansError: plansQuery.error,
    subscriptionError: subscriptionQuery.error,

    // Actions
    subscribe: subscribeMutation.mutate,
    manageBilling: manageBillingMutation.mutate,
    cancel: cancelMutation.mutate,
    resume: resumeMutation.mutate,

    // Mutation states
    isSubscribing: subscribeMutation.isPending,
    isCanceling: cancelMutation.isPending,
    isResuming: resumeMutation.isPending,
    isManagingBilling: manageBillingMutation.isPending,

    // Refetch
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
    },
    refetchPlans: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
    },
  };
}

// Hook for checking if user has premium access
export function usePremiumFeature() {
  const { isPremium } = useSubscription();
  return isPremium;
}
