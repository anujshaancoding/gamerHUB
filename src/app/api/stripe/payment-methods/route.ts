import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { stripe } from "@/lib/stripe";
import { getUser } from "@/lib/auth/get-user";

// GET - List payment methods
export async function GET() {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Stripe customer
    const { data: stripeCustomer } = await db
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (!stripeCustomer) {
      return NextResponse.json({ paymentMethods: [] });
    }

    // Get payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomer.stripe_customer_id,
      type: "card",
    });

    // Get default payment method
    const customer = await stripe.customers.retrieve(
      stripeCustomer.stripe_customer_id
    );
    const defaultPaymentMethodId =
      typeof customer !== "string" && !customer.deleted
        ? customer.invoice_settings?.default_payment_method
        : null;

    const methods = paymentMethods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
      isDefault: pm.id === defaultPaymentMethodId,
    }));

    return NextResponse.json({ paymentMethods: methods });
  } catch (error) {
    console.error("List payment methods error:", error);
    return NextResponse.json(
      { error: "Failed to list payment methods" },
      { status: 500 }
    );
  }
}

// POST - Add payment method (create setup intent)
export async function POST() {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create Stripe customer
    let { data: stripeCustomer } = await db
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (!stripeCustomer) {
      const { data: profile } = await db
        .from("profiles")
        .select("username, display_name")
        .eq("id", user.id)
        .single();

      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.display_name || profile?.username || undefined,
        metadata: {
          user_id: user.id,
        },
      });

      await db.from("stripe_customers").insert({
        user_id: user.id,
        stripe_customer_id: customer.id,
        email: user.email,
      });

      stripeCustomer = { stripe_customer_id: customer.id };
    }

    // Create setup intent
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomer.stripe_customer_id,
      payment_method_types: ["card"],
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
    });
  } catch (error) {
    console.error("Create setup intent error:", error);
    return NextResponse.json(
      { error: "Failed to create setup intent" },
      { status: 500 }
    );
  }
}

// DELETE - Remove payment method
export async function DELETE(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get("id");

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: "Payment method ID is required" },
        { status: 400 }
      );
    }

    // Get Stripe customer to verify ownership
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

    // Verify the payment method belongs to this customer
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (paymentMethod.customer !== stripeCustomer.stripe_customer_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Detach payment method
    await stripe.paymentMethods.detach(paymentMethodId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete payment method error:", error);
    return NextResponse.json(
      { error: "Failed to delete payment method" },
      { status: 500 }
    );
  }
}
