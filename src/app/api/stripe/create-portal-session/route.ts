import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { stripe } from "@/lib/stripe";
import { getUser } from "@/lib/auth/get-user";

export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { returnUrl } = body;

    // Get Stripe customer
    const { data: stripeCustomer } = await db
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (!stripeCustomer) {
      return NextResponse.json(
        { error: "No billing account found" },
        { status: 404 }
      );
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomer.stripe_customer_id,
      return_url:
        returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Create portal session error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
