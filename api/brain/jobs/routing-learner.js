/**
 * Routing Learner Job
 * Learns from routing history to improve future routing decisions
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Learn from routing history
 * Analyzes past routing decisions and user feedback to improve routing
 */
async function learnFromRoutingHistory() {
  if (!supabase) {
    console.error("[Routing Learner] Supabase not configured");
    return;
  }

  try {
    console.log("[Routing Learner] Starting learning process...");

    // Get recent routing history with feedback
    const { data: routingHistory, error } = await supabase
      .from("brain_query_routing")
      .select("*")
      .not("user_rating", "is", null)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      throw new Error(`Failed to fetch routing history: ${error.message}`);
    }

    if (!routingHistory || routingHistory.length === 0) {
      console.log("[Routing Learner] No routing history with feedback found");
      return;
    }

    // Analyze patterns
    const domainPerformance = {};
    routingHistory.forEach((entry) => {
      const selectedDomains = entry.selected_domain_ids || [];
      const rating = entry.user_rating || 0;
      const wasHelpful = entry.was_helpful || false;

      selectedDomains.forEach((domainId) => {
        if (!domainPerformance[domainId]) {
          domainPerformance[domainId] = {
            totalQueries: 0,
            totalRating: 0,
            helpfulCount: 0,
            avgRating: 0,
            helpfulRate: 0,
          };
        }

        domainPerformance[domainId].totalQueries += 1;
        domainPerformance[domainId].totalRating += rating;
        if (wasHelpful) {
          domainPerformance[domainId].helpfulCount += 1;
        }
      });
    });

    // Calculate metrics
    Object.keys(domainPerformance).forEach((domainId) => {
      const perf = domainPerformance[domainId];
      perf.avgRating = perf.totalRating / perf.totalQueries;
      perf.helpfulRate = perf.helpfulCount / perf.totalQueries;
    });

    // Update routing performance metrics
    for (const [domainId, perf] of Object.entries(domainPerformance)) {
      await supabase.rpc("update_routing_performance", {
        p_domain_id: domainId,
        p_user_id: null, // Would need to be passed or determined
        p_period_type: "daily",
      });
    }

    console.log(`[Routing Learner] Analyzed ${routingHistory.length} routing decisions`);
    console.log(`[Routing Learner] Updated performance for ${Object.keys(domainPerformance).length} domains`);
  } catch (error) {
    console.error("[Routing Learner] Error:", error);
  }
}

/**
 * Scheduled job to run learning
 * This would typically be called by a cron job or scheduled task
 */
async function scheduledRoutingLearning() {
  console.log("[Routing Learner] Scheduled learning job started");
  await learnFromRoutingHistory();
  console.log("[Routing Learner] Scheduled learning job completed");
}

// Run if called directly
if (require.main === module) {
  scheduledRoutingLearning();
}

module.exports = {
  learnFromRoutingHistory,
  scheduledRoutingLearning,
};

