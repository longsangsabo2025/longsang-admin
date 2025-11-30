/**
 * Graph Builder Worker
 * Background worker to build knowledge graphs from domains
 */

const knowledgeGraphService = require("../services/knowledge-graph-service");
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
 * Process graph building jobs
 * This would typically be called by a queue system or scheduled job
 */
async function processGraphBuildingJobs() {
  if (!supabase) {
    console.error("[Graph Builder Worker] Supabase not configured");
    return;
  }

  try {
    // In a real implementation, you'd have a queue table for graph building jobs
    // For now, this is a placeholder that can be enhanced
    console.log("[Graph Builder Worker] Checking for graph building jobs...");

    // Example: Build graphs for all active domains
    // This would typically be triggered by:
    // 1. Scheduled job (e.g., daily)
    // 2. Event trigger (e.g., when new knowledge is added)
    // 3. Manual trigger via API

    // Placeholder implementation
    // In production, implement a proper queue system
  } catch (error) {
    console.error("[Graph Builder Worker] Error:", error);
  }
}

/**
 * Build graph for a specific domain
 * @param {string} domainId - Domain ID
 * @param {string} userId - User ID
 */
async function buildGraphForDomain(domainId, userId) {
  try {
    console.log(`[Graph Builder Worker] Building graph for domain ${domainId}`);
    const result = await knowledgeGraphService.buildGraph(domainId, userId);
    console.log(`[Graph Builder Worker] Graph built: ${result.nodesCreated} nodes, ${result.edgesCreated} edges`);
    return result;
  } catch (error) {
    console.error(`[Graph Builder Worker] Error building graph for domain ${domainId}:`, error);
    throw error;
  }
}

// Start worker if run directly
if (require.main === module) {
  console.log("[Graph Builder Worker] Starting...");
  // Run every 5 minutes
  setInterval(processGraphBuildingJobs, 5 * 60 * 1000);
  processGraphBuildingJobs(); // Run immediately
}

module.exports = {
  processGraphBuildingJobs,
  buildGraphForDomain,
};

