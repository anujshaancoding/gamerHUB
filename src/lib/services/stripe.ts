import Stripe from "stripe";

// Lazily initialize Stripe to avoid build errors when API key is not set
let stripeClient: Stripe | null = null;

// Server-side Stripe instance (lazy initialization)
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop: string | symbol) {
    if (!stripeClient) {
      const apiKey = process.env.STRIPE_SECRET_KEY;
      if (!apiKey) {
        throw new Error("STRIPE_SECRET_KEY environment variable is required");
      }
      stripeClient = new Stripe(apiKey, {
        apiVersion: "2024-12-18.acacia",
        typescript: true,
      });
    }
    return stripeClient[prop as keyof Stripe];
  },
});

// Helper to format amount for display
export function formatAmount(amount: number, currency: string = "inr"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

// Convert paise to rupees
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

// Convert rupees to paise
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

// Subscription status helpers
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "paused";

export function isActiveSubscription(status: SubscriptionStatus): boolean {
  return status === "active" || status === "trialing";
}

export function getSubscriptionStatusLabel(status: SubscriptionStatus): string {
  const labels: Record<SubscriptionStatus, string> = {
    trialing: "Trial",
    active: "Active",
    past_due: "Past Due",
    canceled: "Canceled",
    unpaid: "Unpaid",
    paused: "Paused",
  };
  return labels[status] || status;
}

export function getSubscriptionStatusColor(status: SubscriptionStatus): string {
  const colors: Record<SubscriptionStatus, string> = {
    trialing: "text-blue-500",
    active: "text-green-500",
    past_due: "text-yellow-500",
    canceled: "text-gray-500",
    unpaid: "text-red-500",
    paused: "text-gray-400",
  };
  return colors[status] || "text-gray-500";
}

// Payment type helpers
export type PaymentType = "subscription" | "battle_pass" | "currency_pack" | "one_time";

export function getPaymentTypeLabel(type: PaymentType): string {
  const labels: Record<PaymentType, string> = {
    subscription: "Subscription",
    battle_pass: "Battle Pass",
    currency_pack: "Currency Pack",
    one_time: "One-time Purchase",
  };
  return labels[type] || type;
}
