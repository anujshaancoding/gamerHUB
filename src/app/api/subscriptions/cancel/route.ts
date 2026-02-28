import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { stripe } from "@/lib/stripe";
import { getUser } from "@/lib/auth/get-user";

// POST - Cancel subscription
export async function POST() {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's active subscription
    const { data: subscription } = await db
      .from("user_subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .single();

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Cancel at period end (user keeps access until period ends)
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    // Update local record
    await db
      .from("user_subscriptions")
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscription.stripe_subscription_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
