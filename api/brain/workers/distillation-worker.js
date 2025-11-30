/**
 * Distillation Worker
 * Background job processor for core logic distillation
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

// Worker configuration
const WORKER_INTERVAL = 30000; // 30 seconds
const MAX_CONCURRENT_JOBS = 3;
let isRunning = false;
let activeJobs = 0;

/**
 * Process a single distillation job
 */
async function processJob(job) {
  const { id, domain_id, user_id, config } = job;

  try {
    console.log(`[Distillation Worker] Processing job ${id} for domain ${domain_id}`);

    // Perform distillation
    const result = await coreLogicService.distillCoreLogic(domain_id, user_id, config);

    // Mark job as complete
    await supabase.rpc("mark_distillation_job_complete", {
      p_job_id: id,
      p_core_logic_id: result.id,
      p_summary: {
        version: result.version,
        knowledgeItemsProcessed: result.knowledgeItemsProcessed,
        tokensUsed: result.tokensUsed,
      },
    });

    console.log(`[Distillation Worker] Job ${id} completed successfully`);
    return true;
  } catch (error) {
    console.error(`[Distillation Worker] Job ${id} failed:`, error);

    // Mark job as failed (with retry logic)
    await supabase.rpc("mark_distillation_job_failed", {
      p_job_id: id,
      p_error: error.message || "Unknown error",
    });

    return false;
  }
}

/**
 * Process pending jobs
 */
async function processPendingJobs() {
  if (isRunning || activeJobs >= MAX_CONCURRENT_JOBS) {
    return;
  }

  isRunning = true;

  try {
    // Get next pending job
    const { data: jobs, error } = await supabase.rpc("get_next_distillation_job");

    if (error) {
      console.error("[Distillation Worker] Error getting jobs:", error);
      return;
    }

    if (!jobs || jobs.length === 0) {
      // No pending jobs
      return;
    }

    const job = jobs[0];
    activeJobs++;

    // Process job asynchronously
    processJob(job)
      .finally(() => {
        activeJobs--;
      });
  } catch (error) {
    console.error("[Distillation Worker] Error:", error);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the worker
 */
function startWorker() {
  console.log("[Distillation Worker] Starting worker...");

  // Process immediately
  processPendingJobs();

  // Then process every interval
  setInterval(() => {
    processPendingJobs();
  }, WORKER_INTERVAL);

  console.log(`[Distillation Worker] Worker started (interval: ${WORKER_INTERVAL}ms)`);
}

/**
 * Stop the worker
 */
function stopWorker() {
  console.log("[Distillation Worker] Stopping worker...");
  // In a real implementation, we'd clear the interval
  // For now, this is a placeholder
}

// Export for use in scheduled jobs or manual execution
module.exports = {
  processPendingJobs,
  processJob,
  startWorker,
  stopWorker,
  isConfigured: !!supabase && coreLogicService.isConfigured,
};

// Auto-start if running as main module
if (require.main === module) {
  startWorker();
}

