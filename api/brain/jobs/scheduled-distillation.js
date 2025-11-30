/**
 * Scheduled Distillation Job
 * Automatically triggers distillation for domains that need it
 */

const { createClient } = require("@supabase/supabase-js");
const coreLogicService = require("../services/core-logic-service");
require("dotenv").config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Configuration
const DISTILLATION_INTERVAL_HOURS = 24; // Distill once per day
const MIN_KNOWLEDGE_ITEMS = 5; // Minimum knowledge items to trigger distillation

/**
 * Check if domain needs distillation
 */
async function shouldDistillDomain(domainId, userId) {
  if (!supabase) return false;

  try {
    // Get knowledge count
    const { data: knowledge, error } = await supabase
      .from("brain_knowledge")
      .select("id", { count: "exact" })
      .eq("domain_id", domainId)
      .eq("user_id", userId);

    if (error || !knowledge || knowledge.length < MIN_KNOWLEDGE_ITEMS) {
      return false;
    }

    // Get last distillation time
    const { data: lastCoreLogic } = await supabase
      .from("brain_core_logic")
      .select("last_distilled_at")
      .eq("domain_id", domainId)
      .eq("user_id", userId)
      .order("last_distilled_at", { ascending: false })
      .limit(1)
      .single();

    if (!lastCoreLogic || !lastCoreLogic.last_distilled_at) {
      // Never distilled, should distill
      return true;
    }

    // Check if enough time has passed
    const lastDistilled = new Date(lastCoreLogic.last_distilled_at);
    const now = new Date();
    const hoursSinceLastDistill = (now - lastDistilled) / (1000 * 60 * 60);

    return hoursSinceLastDistill >= DISTILLATION_INTERVAL_HOURS;
  } catch (error) {
    console.error("[Scheduled Distillation] Error checking domain:", error);
    return false;
  }
}

/**
 * Queue distillation for a domain
 */
async function queueDistillation(domainId, userId, triggeredBy = "scheduled") {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("brain_core_logic_queue")
      .insert({
        domain_id: domainId,
        user_id: userId,
        status: "pending",
        priority: 5, // Normal priority
        triggered_by: triggeredBy,
        config: {},
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to queue distillation: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("[Scheduled Distillation] Error queueing:", error);
    return null;
  }
}

/**
 * Run scheduled distillation check
 */
async function runScheduledDistillation() {
  if (!supabase) {
    console.error("[Scheduled Distillation] Supabase not configured");
    return;
  }

  console.log("[Scheduled Distillation] Running scheduled check...");

  try {
    // Get all domains
    const { data: domains, error } = await supabase
      .from("brain_domains")
      .select("id, user_id");

    if (error) {
      throw new Error(`Failed to get domains: ${error.message}`);
    }

    if (!domains || domains.length === 0) {
      console.log("[Scheduled Distillation] No domains found");
      return;
    }

    let queuedCount = 0;

    // Check each domain
    for (const domain of domains) {
      const shouldDistill = await shouldDistillDomain(domain.id, domain.user_id);

      if (shouldDistill) {
        const queued = await queueDistillation(domain.id, domain.user_id, "scheduled");
        if (queued) {
          queuedCount++;
          console.log(`[Scheduled Distillation] Queued distillation for domain ${domain.id}`);
        }
      }
    }

    console.log(`[Scheduled Distillation] Completed. Queued ${queuedCount} distillations.`);
  } catch (error) {
    console.error("[Scheduled Distillation] Error:", error);
  }
}

/**
 * Start scheduled job (runs every hour)
 */
function startScheduledJob() {
  console.log("[Scheduled Distillation] Starting scheduled job...");

  // Run immediately
  runScheduledDistillation();

  // Then run every hour
  const interval = setInterval(() => {
    runScheduledDistillation();
  }, 60 * 60 * 1000); // 1 hour

  console.log("[Scheduled Distillation] Scheduled job started (runs every hour)");

  // Return cleanup function
  return () => {
    clearInterval(interval);
    console.log("[Scheduled Distillation] Scheduled job stopped");
  };
}

module.exports = {
  runScheduledDistillation,
  shouldDistillDomain,
  queueDistillation,
  startScheduledJob,
  isConfigured: !!supabase && coreLogicService.isConfigured,
};

// Auto-start if running as main module
if (require.main === module) {
  startScheduledJob();
}

