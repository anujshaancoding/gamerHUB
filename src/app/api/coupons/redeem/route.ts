import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Must match the coupons in validate/route.ts
const REDEEMABLE_COUPONS: Record<
  string,
  {
    discount_percent: number;
    premium_days: number; // How many days of premium to grant
    is_active: boolean;
  }
> = {
  GAMERHUB100: {
    discount_percent: 100,
    premium_days: 30, // 30 days of premium
    is_active: true,
  },
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be logged in to redeem a coupon" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 }
      );
    }

    const coupon = REDEEMABLE_COUPONS[code.toUpperCase()];

    if (!coupon || !coupon.is_active || coupon.discount_percent !== 100) {
      return NextResponse.json(
        { error: "This coupon cannot be redeemed directly" },
        { status: 400 }
      );
    }

    // Check if user is already premium (via auth metadata)
    if (user.app_metadata?.is_premium) {
      const premiumUntil = user.app_metadata?.premium_until;
      if (premiumUntil && new Date(premiumUntil) > new Date()) {
        return NextResponse.json(
          { error: "You already have active premium access" },
          { status: 400 }
        );
      }
    }

    // Calculate premium end date
    const premiumUntil = new Date();
    premiumUntil.setDate(premiumUntil.getDate() + coupon.premium_days);

    // Use admin client to update user's app_metadata with premium status
    const adminClient = createAdminClient();
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      user.id,
      {
        app_metadata: {
          ...user.app_metadata,
          is_premium: true,
          premium_until: premiumUntil.toISOString(),
          coupon_redeemed: code.toUpperCase(),
          coupon_redeemed_at: new Date().toISOString(),
        },
      }
    );

    if (updateError) {
      console.error("Failed to activate premium via auth:", updateError);
      return NextResponse.json(
        { error: "Failed to activate premium. Please try again." },
        { status: 500 }
      );
    }

    // Also try to update the profiles table (if columns exist)
    try {
      await (supabase.from("profiles") as any)
        .update({
          is_premium: true,
          premium_until: premiumUntil.toISOString(),
        })
        .eq("id", user.id);
    } catch {
      // Columns may not exist yet - that's fine, auth metadata is the source of truth
    }

    return NextResponse.json({
      success: true,
      premium_until: premiumUntil.toISOString(),
      message: `Premium activated for ${coupon.premium_days} days!`,
    });
  } catch (error) {
    console.error("Coupon redeem error:", error);
    return NextResponse.json(
      { error: "Failed to redeem coupon" },
      { status: 500 }
    );
  }
}
