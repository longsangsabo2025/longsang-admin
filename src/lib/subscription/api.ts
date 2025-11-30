export { supabase } from "../supabase";

// ================================================
// SUBSCRIPTION TYPES
// ================================================

export interface SubscriptionPlan {
  id: string;
  name: "free" | "pro" | "enterprise";
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: Record<string, string>;
  max_agents: number;
  max_workflows: number;
  max_api_calls: number;
  max_storage_mb: number;
  max_credentials: number;
  max_seo_websites: number;
  max_team_members: number;
  has_google_drive: boolean;
  has_webhooks: boolean;
  has_priority_support: boolean;
  has_advanced_analytics: boolean;
  has_custom_branding: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: "active" | "cancelled" | "expired" | "trial" | "past_due";
  billing_cycle: "monthly" | "yearly" | "lifetime";
  trial_ends_at?: string;
  current_period_start: string;
  current_period_end?: string;
  cancelled_at?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  created_at: string;
  updated_at: string;
}

export interface UsageTracking {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  api_calls_count: number;
  workflows_executed: number;
  storage_used_mb: number;
  agents_created: number;
  credentials_stored: number;
}

// ================================================
// SUBSCRIPTION API
// ================================================

/**
 * Get all available subscription plans
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw error;
  return data || [];
}

/**
 * Get user's current subscription
 */
export async function getUserSubscription(userId?: string): Promise<{
  subscription: UserSubscription;
  plan: SubscriptionPlan;
} | null> {
  const uid = userId || (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return null;

  const { data, error } = await supabase
    .from("user_subscriptions")
    .select(
      `
      *,
      plan:subscription_plans(*)
    `
    )
    .eq("user_id", uid)
    .eq("status", "active")
    .single();

  if (error) {
    console.error("Error fetching subscription:", error);
    return null;
  }

  return {
    subscription: data,
    plan: data.plan as SubscriptionPlan,
  };
}

/**
 * Get user's usage statistics
 */
export async function getUserUsage(userId?: string): Promise<UsageTracking | null> {
  const uid = userId || (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return null;

  // Get current month's usage
  const periodStart = new Date();
  periodStart.setDate(1);
  periodStart.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("usage_tracking")
    .select("*")
    .eq("user_id", uid)
    .gte("period_start", periodStart.toISOString())
    .single();

  if (error) {
    console.error("Error fetching usage:", error);
    return null;
  }

  return data;
}

/**
 * Check if user has access to a specific feature
 */
export async function hasFeatureAccess(featureKey: string, userId?: string): Promise<boolean> {
  const uid = userId || (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return false;

  const { data, error } = await supabase.rpc("has_feature_access", {
    p_user_id: uid,
    p_feature_key: featureKey,
  });

  if (error) {
    console.error("Error checking feature access:", error);
    return false;
  }

  return data || false;
}

/**
 * Get user's plan details
 */
export async function getUserPlanDetails(userId?: string) {
  const uid = userId || (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return null;

  const { data, error } = await supabase.rpc("get_user_plan", {
    p_user_id: uid,
  });

  if (error) {
    console.error("Error fetching plan details:", error);
    return null;
  }

  return data && data.length > 0 ? data[0] : null;
}

/**
 * Track usage metric
 */
export async function trackUsage(
  metric: "api_calls" | "workflows" | "agents",
  increment: number = 1,
  userId?: string
): Promise<void> {
  const uid = userId || (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return;

  const { error } = await supabase.rpc("track_usage", {
    p_user_id: uid,
    p_metric: metric,
    p_increment: increment,
  });

  if (error) {
    console.error("Error tracking usage:", error);
  }
}

/**
 * Check if user has exceeded their plan limits
 */
export async function checkUsageLimits(userId?: string): Promise<{
  withinLimits: boolean;
  exceeded: string[];
  usage: UsageTracking | null;
  limits: Record<string, number> | null;
}> {
  const uid = userId || (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return { withinLimits: true, exceeded: [], usage: null, limits: null };

  const [subscription, usage] = await Promise.all([getUserSubscription(uid), getUserUsage(uid)]);

  if (!subscription || !usage) {
    return { withinLimits: true, exceeded: [], usage: null, limits: null };
  }

  const exceeded: string[] = [];
  const plan = subscription.plan;

  if (usage.api_calls_count >= plan.max_api_calls) {
    exceeded.push("API calls");
  }
  if (usage.workflows_executed >= plan.max_workflows) {
    exceeded.push("Workflows");
  }
  if (usage.agents_created >= plan.max_agents) {
    exceeded.push("AI Agents");
  }
  if (usage.storage_used_mb >= plan.max_storage_mb) {
    exceeded.push("Storage");
  }
  if (usage.credentials_stored >= plan.max_credentials) {
    exceeded.push("Credentials");
  }

  return {
    withinLimits: exceeded.length === 0,
    exceeded,
    usage,
    limits: {
      max_api_calls: plan.max_api_calls,
      max_workflows: plan.max_workflows,
      max_agents: plan.max_agents,
      max_storage_mb: plan.max_storage_mb,
      max_credentials: plan.max_credentials,
    },
  };
}

/**
 * Upgrade user subscription
 */
export async function upgradeSubscription(planName: "pro" | "enterprise", userId?: string) {
  const uid = userId || (await supabase.auth.getUser()).data.user?.id;
  if (!uid) throw new Error("User not authenticated");

  // Get target plan
  const { data: plan, error: planError } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("name", planName)
    .single();

  if (planError) throw planError;

  // Update subscription
  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      plan_id: plan.id,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", uid);

  if (error) throw error;
}
