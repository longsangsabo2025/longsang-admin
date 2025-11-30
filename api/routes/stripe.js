/**
 * Stripe Payment Integration Routes
 * Handles checkout, subscriptions, and webhooks
 */

const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

// Initialize Stripe
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Create Checkout Session
 * POST /api/stripe/create-checkout-session
 */
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { planId, userId, billingCycle = "monthly" } = req.body;

    // Get plan details from database
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .single();

    if (userError) {
      return res.status(404).json({ error: "User not found" });
    }

    // Determine price based on billing cycle
    const priceId =
      billingCycle === "yearly" ? plan.stripe_price_id_yearly : plan.stripe_price_id_monthly;

    if (!priceId) {
      return res.status(400).json({ error: "Price ID not configured for this plan" });
    }

    // Create or retrieve Stripe customer
    let customerId;
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    if (subscription?.stripe_customer_id) {
      customerId = subscription.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          supabase_user_id: userId,
        },
      });
      customerId = customer.id;

      // Save customer ID to database
      await supabase.from("user_subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: customerId,
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${
        process.env.VITE_APP_URL || "http://localhost:5173"
      }/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VITE_APP_URL || "http://localhost:5173"}/pricing`,
      metadata: {
        user_id: userId,
        plan_id: planId,
        billing_cycle: billingCycle,
      },
    });

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    res.status(500).json({
      error: "Failed to create checkout session",
      message: error.message,
    });
  }
});

/**
 * Get Customer Portal URL
 * POST /api/stripe/customer-portal
 */
router.post("/customer-portal", async (req, res) => {
  try {
    const { userId } = req.body;

    // Get customer ID
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    if (!subscription?.stripe_customer_id) {
      return res.status(404).json({ error: "No Stripe customer found" });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.VITE_APP_URL || "http://localhost:5173"}/admin/subscription`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Customer portal error:", error);
    res.status(500).json({
      error: "Failed to create portal session",
      message: error.message,
    });
  }
});

/**
 * Stripe Webhook Handler
 * POST /api/stripe/webhook
 */
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
});

/**
 * Handle successful checkout
 */
async function handleCheckoutCompleted(session) {
  const userId = session.metadata.user_id;
  const planId = session.metadata.plan_id;
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  console.log(`Checkout completed for user ${userId}, plan ${planId}`);

  // Get plan details
  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("name, display_name")
    .eq("id", planId)
    .single();

  // Get user details
  const { data: user } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .single();

  // Update user subscription
  await supabase.from("user_subscriptions").upsert({
    user_id: userId,
    plan_id: planId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    status: "active",
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    updated_at: new Date().toISOString(),
  });

  // Record payment
  await supabase.from("payment_history").insert({
    user_id: userId,
    plan_id: planId,
    amount: session.amount_total / 100, // Convert from cents
    currency: session.currency,
    status: "succeeded",
    stripe_payment_intent_id: session.payment_intent,
    stripe_invoice_id: session.invoice,
    payment_method: "card",
    created_at: new Date().toISOString(),
  });

  // Send welcome/upgrade email
  try {
    await sendEmail(user?.email, "invoice", {
      name: user?.full_name || "User",
      planName: plan?.display_name || "Premium",
      amount: (session.amount_total / 100).toFixed(2),
      invoiceNumber: session.invoice || session.id,
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      receiptUrl: session.payment_intent_url,
      dashboardUrl: `${process.env.VITE_APP_URL || "http://localhost:5173"}/admin/subscription`,
    });
  } catch (emailError) {
    console.error("Failed to send welcome email:", emailError);
  }

  console.log(`User ${userId} upgraded to ${plan?.display_name} plan`);
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription) {
  const customerId = subscription.customer;

  // Find user by customer ID
  const { data: userSub } = await supabase
    .from("user_subscriptions")
    .select("user_id, plan_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!userSub) {
    console.error(`No user found for customer ${customerId}`);
    return;
  }

  // Update subscription status
  await supabase
    .from("user_subscriptions")
    .update({
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userSub.user_id);

  console.log(`Subscription updated for user ${userSub.user_id}: ${subscription.status}`);
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;

  // Find user by customer ID
  const { data: userSub } = await supabase
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!userSub) {
    console.error(`No user found for customer ${customerId}`);
    return;
  }

  // Downgrade to free plan
  const { data: freePlan } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("name", "free")
    .single();

  await supabase
    .from("user_subscriptions")
    .update({
      plan_id: freePlan.id,
      status: "canceled",
      stripe_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userSub.user_id);

  console.log(`User ${userSub.user_id} downgraded to Free plan`);
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice) {
  const customerId = invoice.customer;

  // Find user by customer ID
  const { data: userSub } = await supabase
    .from("user_subscriptions")
    .select("user_id, plan_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!userSub) return;

  // Get user and plan details
  const { data: user } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", userSub.user_id)
    .single();

  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("display_name")
    .eq("id", userSub.plan_id)
    .single();

  // Record payment
  await supabase.from("payment_history").insert({
    user_id: userSub.user_id,
    plan_id: userSub.plan_id,
    amount: invoice.amount_paid / 100,
    currency: invoice.currency,
    status: "succeeded",
    stripe_payment_intent_id: invoice.payment_intent,
    stripe_invoice_id: invoice.id,
    stripe_receipt_url: invoice.hosted_invoice_url,
    payment_method: "card",
    created_at: new Date().toISOString(),
  });

  // Send invoice email
  try {
    await sendEmail(user?.email, "invoice", {
      name: user?.full_name || "User",
      planName: plan?.display_name || "Premium",
      amount: (invoice.amount_paid / 100).toFixed(2),
      invoiceNumber: invoice.number || invoice.id,
      receiptUrl: invoice.hosted_invoice_url,
      renewalDate: new Date(invoice.period_end * 1000).toLocaleDateString(),
      dashboardUrl: `${process.env.VITE_APP_URL || "http://localhost:5173"}/admin/subscription`,
    });
  } catch (emailError) {
    console.error("Failed to send invoice email:", emailError);
  }

  console.log(`Payment succeeded for user ${userSub.user_id}: $${invoice.amount_paid / 100}`);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;

  // Find user by customer ID
  const { data: userSub } = await supabase
    .from("user_subscriptions")
    .select("user_id, plan_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!userSub) return;

  // Get user and plan details
  const { data: user } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", userSub.user_id)
    .single();

  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("display_name")
    .eq("id", userSub.plan_id)
    .single();

  // Record failed payment
  await supabase.from("payment_history").insert({
    user_id: userSub.user_id,
    plan_id: userSub.plan_id,
    amount: invoice.amount_due / 100,
    currency: invoice.currency,
    status: "failed",
    stripe_invoice_id: invoice.id,
    payment_method: "card",
    created_at: new Date().toISOString(),
  });

  // Send payment failed email
  try {
    await sendEmail(user?.email, "paymentFailed", {
      name: user?.full_name || "User",
      planName: plan?.display_name || "Premium",
      reason: invoice.last_payment_error?.message || "Payment method declined",
      updatePaymentUrl: `${process.env.VITE_APP_URL || "http://localhost:5173"}/admin/subscription`,
      downgradeDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    });
  } catch (emailError) {
    console.error("Failed to send payment failed email:", emailError);
  }

  console.log(`Payment failed for user ${userSub.user_id}`);
}

/**
 * Send email helper function
 */
async function sendEmail(to, template, data) {
  try {
    const response = await fetch(`http://localhost:3001/api/email/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to, template, data }),
    });

    if (!response.ok) {
      throw new Error("Email API error");
    }

    console.log(`Email sent: ${template} to ${to}`);
  } catch (error) {
    console.error("Email send error:", error);
    throw error;
  }
}

module.exports = router;
