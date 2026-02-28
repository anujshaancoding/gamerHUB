import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { stripe } from "@/lib/stripe";
import { getUser } from "@/lib/auth/get-user";

export async function POST() {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if customer already exists
    const { data: existingCustomer } = await db
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (existingCustomer) {
      return NextResponse.json({
        customerId: existingCustomer.stripe_customer_id,
      });
    }

    // Get user profile for name and email
    const { data: profile } = await db
      .from("profiles")
      .select("username, display_name")
      .eq("id", user.id)
      .single();

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: profile?.display_name || profile?.username || undefined,
      metadata: {
        user_id: user.id,
        username: profile?.username || "",
      },
    });

    // Save to database
    const { error: insertError } = await db
      .from("stripe_customers")
      .insert({
        user_id: user.id,
        stripe_customer_id: customer.id,
        email: user.email,
      });

    if (insertError) {
      console.error("Error saving Stripe customer:", insertError);
      // Try to delete the Stripe customer since we couldn't save it
      await stripe.customers.del(customer.id);
      return NextResponse.json(
        { error: "Failed to create customer" },
        { status: 500 }
      );
    }

    return NextResponse.json({ customerId: customer.id }, { status: 201 });
  } catch (error) {
    console.error("Create customer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
