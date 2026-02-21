import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cachedResponse, CACHE_DURATIONS } from "@/lib/api/cache-headers";

// Fallback plan data when the subscription_plans table doesn't exist or is empty
const FALLBACK_PLANS = [
  {
    id: "default-premium",
    slug: "premium",
    name: "GamerHub Premium",
    description: "Unlock exclusive features and stand out from the crowd",
    stripe_price_id_monthly: null,
    stripe_price_id_yearly: null,
    price_monthly: 9900,
    price_yearly: 99900,
    features: [
      "Exclusive titles, frames, and themes",
      "Create tournaments/giveaways",
      "Create clans",
      "100MB media uploads (vs 20MB)",
      "Advanced stats dashboard (Coming Soon)",
      "See who viewed your profile",
      "Unlimited follows",
      "Early access to new features",
      "Premium badge on profile",
    ],
    is_active: true,
    sort_order: 1,
  },
];

// GET - List available subscription plans
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: plans, error } = await supabase
      .from("subscription_plans" as any)
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching plans:", error);
      // Return fallback plans if table doesn't exist or query fails
      return cachedResponse({ plans: FALLBACK_PLANS }, CACHE_DURATIONS.STATIC);
    }

    // If no plans found in DB, return fallback
    if (!plans || plans.length === 0) {
      return cachedResponse({ plans: FALLBACK_PLANS }, CACHE_DURATIONS.STATIC);
    }

    return cachedResponse({ plans }, CACHE_DURATIONS.STATIC);
  } catch (error) {
    console.error("Get plans error:", error);
    // Return fallback plans instead of 500
    return cachedResponse({ plans: FALLBACK_PLANS }, CACHE_DURATIONS.STATIC);
  }
}
