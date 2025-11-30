/**
 * Core Logic Query Service
 * Provides query capabilities for core logic
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
 * Search core logic across domains
 * @param {string} query - Search query
 * @param {string} userId - User ID
 * @param {string[]} domainIds - Optional domain IDs to filter
 * @returns {Promise<Array>} - Matching core logic items
 */
async function searchCoreLogic(query, userId, domainIds = []) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  try {
    let queryBuilder = supabase
      .from("brain_core_logic")
      .select("*, brain_domains!inner(name, description)")
      .eq("user_id", userId)
      .eq("is_active", true)
      .or(`first_principles::text.ilike.%${query}%,mental_models::text.ilike.%${query}%,decision_rules::text.ilike.%${query}%,anti_patterns::text.ilike.%${query}%`);

    if (domainIds.length > 0) {
      queryBuilder = queryBuilder.in("domain_id", domainIds);
    }

    const { data, error } = await queryBuilder.order("version", { ascending: false });

    if (error) {
      throw new Error(`Failed to search core logic: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error("[Core Logic Query] Search error:", error);
    throw error;
  }
}

/**
 * Get insights from core logic
 * @param {string} domainId - Domain ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Insights
 */
async function getCoreLogicInsights(domainId, userId) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  try {
    // Get latest core logic
    const { data: coreLogic } = await supabase.rpc("get_latest_core_logic", {
      p_domain_id: domainId,
      p_user_id: userId,
    });

    if (!coreLogic || coreLogic.length === 0) {
      return {
        insights: [],
        summary: "No core logic available",
      };
    }

    const cl = coreLogic[0];

    // Generate insights
    const insights = [];

    if (cl.first_principles && cl.first_principles.length > 0) {
      insights.push({
        type: "first_principles",
        count: cl.first_principles.length,
        message: `Domain has ${cl.first_principles.length} foundational principles`,
      });
    }

    if (cl.mental_models && cl.mental_models.length > 0) {
      insights.push({
        type: "mental_models",
        count: cl.mental_models.length,
        message: `${cl.mental_models.length} mental models identified`,
      });
    }

    if (cl.decision_rules && cl.decision_rules.length > 0) {
      insights.push({
        type: "decision_rules",
        count: cl.decision_rules.length,
        message: `${cl.decision_rules.length} decision rules available`,
      });
    }

    if (cl.anti_patterns && cl.anti_patterns.length > 0) {
      insights.push({
        type: "anti_patterns",
        count: cl.anti_patterns.length,
        message: `${cl.anti_patterns.length} anti-patterns to avoid`,
      });
    }

    if (cl.cross_domain_links && cl.cross_domain_links.length > 0) {
      insights.push({
        type: "cross_domain_links",
        count: cl.cross_domain_links.length,
        message: `${cl.cross_domain_links.length} connections to other domains`,
      });
    }

    return {
      insights,
      summary: `Core logic version ${cl.version} with ${insights.length} insight categories`,
      version: cl.version,
      lastDistilled: cl.last_distilled_at,
    };
  } catch (error) {
    console.error("[Core Logic Query] Insights error:", error);
    throw error;
  }
}

module.exports = {
  searchCoreLogic,
  getCoreLogicInsights,
  isConfigured: !!supabase,
};

