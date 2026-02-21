import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { noCacheResponse } from "@/lib/api/cache-headers";
import { isPromoPeriodActive, PROMO_END_DATE } from "@/lib/promo";

// GET - Get user's current subscription
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try to get subscription from database
    let subscription = null;
    const { data: subData, error: subError } = await supabase
      .from("user_subscriptions" as any)
      .select(`*, plan:subscription_plans(*)`)
      .eq("user_id", user.id)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!subError) {
      subscription = subData;
    }
    // Silently handle table-not-found (PGRST205) and no-rows (PGRST116)

    // Launch promo: all users get premium free for the first 3 months
    if (isPromoPeriodActive()) {
      return noCacheResponse({
        subscription,
        isPremium: true,
        premiumUntil: PROMO_END_DATE.toISOString(),
        isPromo: true,
      });
    }

    // Try to get premium status from profiles table
    let isPremium = false;
    let premiumUntil: string | null = null;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_premium, premium_until")
      .eq("id", user.id)
      .single() as any;

    if (!profileError && profile?.is_premium) {
      isPremium = true;
      premiumUntil = profile.premium_until || null;
    }

    // Fallback: check auth app_metadata for premium status (set by coupon redemption)
    if (!isPremium && user.app_metadata?.is_premium) {
      const metaPremiumUntil = user.app_metadata.premium_until;
      if (metaPremiumUntil && new Date(metaPremiumUntil) > new Date()) {
        isPremium = true;
        premiumUntil = metaPremiumUntil;
      }
    }

    return noCacheResponse({
      subscription,
      isPremium,
      premiumUntil,
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    return noCacheResponse({
      subscription: null,
      isPremium: false,
      premiumUntil: null,
    });
  }
}
