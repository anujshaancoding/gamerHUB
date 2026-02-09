import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if customer already exists
    const { data: existingCustomer } = await supabase
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
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", user.id)
      .single();

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: profile?.display_name || profile?.username || undefined,
      metadata: {
        supabase_user_id: user.id,
        username: profile?.username || "",
      },
    });

    // Save to database
    const { error: insertError } = await supabase
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
