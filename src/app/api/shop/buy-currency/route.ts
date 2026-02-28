import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { stripe } from "@/lib/stripe";
import { getUser } from "@/lib/auth/get-user";

// POST - Create checkout for buying currency pack
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { packId } = body;

    if (!packId) {
      return NextResponse.json(
        { error: "Pack ID is required" },
        { status: 400 }
      );
    }

    // Get currency pack details
    const { data: pack, error: packError } = await db
      .from("currency_packs")
      .select("*")
      .eq("id", packId)
      .eq("is_active", true)
      .single();

    if (packError || !pack) {
      return NextResponse.json(
        { error: "Currency pack not found" },
        { status: 404 }
      );
    }

    // Get or create Stripe customer
    let { data: stripeCustomer } = await db
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (!stripeCustomer) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });

      await db.from("stripe_customers").insert({
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
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: pack.name,
              description: `${pack.amount + (pack.bonus_amount || 0)} ${pack.currency_type}`,
            },
            unit_amount: pack.price_cents,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/shop?success=true&gems=${pack.amount + (pack.bonus_amount || 0)}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/shop?canceled=true`,
      metadata: {
        user_id: user.id,
        pack_id: pack.id,
        currency_type: pack.currency_type,
        amount: pack.amount + (pack.bonus_amount || 0),
        payment_type: "currency_pack",
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Buy currency error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
