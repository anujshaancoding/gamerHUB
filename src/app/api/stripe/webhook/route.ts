import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/db/admin";
import type Stripe from "stripe";

// Create admin client for webhook (bypasses RLS)
const adminDb = createAdminClient();

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // Log the webhook event
  await adminDb.from("stripe_webhook_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
    payload: event.data.object as unknown as Record<string, unknown>,
  });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await adminDb
      .from("stripe_webhook_events")
      .update({ processed: true })
      .eq("stripe_event_id", event.id);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);

    // Log error
    await adminDb
      .from("stripe_webhook_events")
      .update({
        processed: false,
        error_message: error instanceof Error ? error.message : "Unknown error",
      })
      .eq("stripe_event_id", event.id);

    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  if (!userId) return;

  // Record the transaction
  if (session.payment_intent && typeof session.payment_intent === "string") {
    await adminDb.from("payment_transactions").insert({
      user_id: userId,
      stripe_customer_id: session.customer as string,
      stripe_payment_intent_id: session.payment_intent,
      amount: session.amount_total || 0,
      currency: session.currency || "usd",
      status: "succeeded",
      payment_type: session.mode === "subscription" ? "subscription" : "one_time",
      metadata: session.metadata || {},
    });
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  // Get user from Stripe customer
  const { data: stripeCustomer } = await adminDb
    .from("stripe_customers")
    .select("user_id")
    .eq("stripe_customer_id", subscription.customer as string)
    .single();

  if (!stripeCustomer) {
    console.error("No user found for Stripe customer:", subscription.customer);
    return;
  }

  const userId = stripeCustomer.user_id;
  const priceId = subscription.items.data[0]?.price.id;

  // Get plan from price ID
  const { data: plan } = await adminDb
    .from("subscription_plans")
    .select("id")
    .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
    .single();

  // Determine billing cycle
  const billingCycle = subscription.items.data[0]?.price.recurring?.interval === "year"
    ? "yearly"
    : "monthly";

  // Upsert subscription
  await adminDb.from("user_subscriptions").upsert(
    {
      user_id: userId,
      plan_id: plan?.id || null,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      status: subscription.status as "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "paused",
      billing_cycle: billingCycle,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      trial_start: subscription.trial_start
        ? new Date(subscription.trial_start * 1000).toISOString()
        : null,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" }
  );
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await adminDb
    .from("user_subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  // Get user from Stripe customer
  const { data: stripeCustomer } = await adminDb
    .from("stripe_customers")
    .select("user_id")
    .eq("stripe_customer_id", invoice.customer as string)
    .single();

  if (!stripeCustomer) return;

  // Record successful payment
  await adminDb.from("payment_transactions").insert({
    user_id: stripeCustomer.user_id,
    stripe_customer_id: invoice.customer as string,
    stripe_payment_intent_id: invoice.payment_intent as string,
    stripe_charge_id: invoice.charge as string,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    status: "succeeded",
    payment_type: "subscription",
    metadata: {
      invoice_id: invoice.id,
      subscription_id: invoice.subscription,
    },
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Get user from Stripe customer
  const { data: stripeCustomer } = await adminDb
    .from("stripe_customers")
    .select("user_id")
    .eq("stripe_customer_id", invoice.customer as string)
    .single();

  if (!stripeCustomer) return;

  // Record failed payment
  await adminDb.from("payment_transactions").insert({
    user_id: stripeCustomer.user_id,
    stripe_customer_id: invoice.customer as string,
    stripe_payment_intent_id: invoice.payment_intent as string,
    amount: invoice.amount_due,
    currency: invoice.currency,
    status: "failed",
    payment_type: "subscription",
    metadata: {
      invoice_id: invoice.id,
      subscription_id: invoice.subscription,
      failure_message: invoice.last_finalization_error?.message,
    },
  });

  // Update subscription status to past_due
  if (invoice.subscription) {
    await adminDb
      .from("user_subscriptions")
      .update({ status: "past_due", updated_at: new Date().toISOString() })
      .eq("stripe_subscription_id", invoice.subscription as string);
  }
}
