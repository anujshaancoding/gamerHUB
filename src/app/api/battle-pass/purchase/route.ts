import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { stripe } from "@/lib/stripe";
import { getUser } from "@/lib/auth/get-user";

// POST - Purchase battle pass (premium upgrade)
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tier = "standard" } = body; // "standard" or "premium"

    // Get active battle pass - eslint-disable for untyped table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: battlePassData } = await (db as any)
      .from("battle_passes")
      .select("id, stripe_price_id_standard, stripe_price_id_premium, price_standard, price_premium")
      .eq("status", "active")
      .single();

    const battlePass = battlePassData as {
      id: string;
      stripe_price_id_standard: string | null;
      stripe_price_id_premium: string | null;
      price_standard: number;
      price_premium: number;
    } | null;

    if (!battlePass) {
      return NextResponse.json(
        { error: "No active battle pass" },
        { status: 404 }
      );
    }

    // Check if user already has premium - eslint-disable for untyped table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingProgress } = await (db as any)
      .from("user_battle_passes")
      .select("is_premium")
      .eq("user_id", user.id)
      .eq("battle_pass_id", battlePass.id)
      .single();

    if (existingProgress?.is_premium) {
      return NextResponse.json(
        { error: "Already have premium battle pass" },
        { status: 400 }
      );
    }

    const priceId =
      tier === "premium"
        ? battlePass.stripe_price_id_premium
        : battlePass.stripe_price_id_standard;

    if (!priceId) {
      return NextResponse.json(
        { error: "Battle pass not available for purchase yet" },
        { status: 400 }
      );
    }

    // Get or create Stripe customer - eslint-disable for untyped table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let { data: stripeCustomerData } = await (db as any)
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    let stripeCustomer = stripeCustomerData as { stripe_customer_id: string } | null;

    if (!stripeCustomer) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any).from("stripe_customers").insert({
        user_id: user.id,
        stripe_customer_id: customer.id,
        email: user.email,
      });

      stripeCustomer = { stripe_customer_id: customer.id };
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer.stripe_customer_id,
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/battle-pass?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/battle-pass?canceled=true`,
      metadata: {
        user_id: user.id,
        battle_pass_id: battlePass.id,
        tier,
        payment_type: "battle_pass",
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Battle pass purchase error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
