/**
 * Workflow Scheduler Job
 * Periodically checks for and triggers scheduled workflows
 */

const { createClient } = require('@supabase/supabase-js');
const workflowEngine = require('../services/workflow-engine-service');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const INTERVAL_MS = parseInt(process.env.WORKFLOW_SCHEDULER_INTERVAL_MS || '60000', 10); // Default 1 minute

let isRunning = false;

async function runWorkflowScheduler() {
  if (isRunning) {
    // eslint-disable-next-line no-console
    console.log('[Workflow Scheduler] Scheduler already running, skipping this interval.');
    return;
  }

  if (!supabase) {
    // eslint-disable-next-line no-console
    console.warn('[Workflow Scheduler] Supabase not configured, skipping scheduler run.');
    return;
  }

  isRunning = true;
  // eslint-disable-next-line no-console
  console.log('[Workflow Scheduler] Checking for scheduled workflows...');
  try {
    // In a real multi-tenant app, you'd iterate through users or have a system-level user for scheduled jobs
    // For simplicity, we'll assume a single user context or a way to get all users.
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id')
      .limit(50);

    if (usersError) {
      throw new Error(`Failed to fetch users for scheduler: ${usersError.message}`);
    }

    const userIds = (users || []).map((u) => u.id);
    let triggeredCount = 0;

    // eslint-disable-next-line no-restricted-syntax
    for (const userId of userIds) {
      // eslint-disable-next-line no-await-in-loop
      const allWorkflows = await workflowEngine.getActiveWorkflows(userId);
      const scheduledWorkflows = allWorkflows.filter(
        (wf) => wf.trigger_type === 'schedule_daily' && wf.is_active,
      );

      const now = new Date();

      // eslint-disable-next-line no-restricted-syntax
      for (const workflow of scheduledWorkflows) {
        const lastTriggered = workflow.last_triggered_at ? new Date(workflow.last_triggered_at) : null;
        // Simple daily schedule: trigger once a day
        if (!lastTriggered || lastTriggered.getDate() !== now.getDate()) {
          // eslint-disable-next-line no-console
          console.log(
            `[Workflow Scheduler] Triggering daily workflow: ${workflow.name} (${workflow.id}) for user ${userId}`,
          );
          // eslint-disable-next-line no-await-in-loop
          await workflowEngine.runWorkflow(workflow, workflow.user_id, {
            eventType: 'schedule_daily',
            timestamp: now.toISOString(),
          });
          triggeredCount += 1;
          // Update last_triggered_at
          // eslint-disable-next-line no-await-in-loop
          await supabase
            .from('brain_workflows')
            .update({ last_triggered_at: now.toISOString() })
            .eq('id', workflow.id);
        }
      }
    }

    if (triggeredCount > 0) {
      // eslint-disable-next-line no-console
      console.log(`[Workflow Scheduler] Triggered ${triggeredCount} scheduled workflows.`);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Workflow Scheduler] Error running scheduler:', error);
  } finally {
    isRunning = false;
  }
}

function startWorkflowScheduler() {
  if (!workflowEngine.getActiveWorkflows) {
    // eslint-disable-next-line no-console
    console.warn('[Workflow Scheduler] Workflow Engine Service not fully configured, skipping scheduler start.');
    return;
  }
  // eslint-disable-next-line no-console
  console.log(`[Workflow Scheduler] Starting scheduler, checking every ${INTERVAL_MS / 1000} seconds.`);
  setInterval(runWorkflowScheduler, INTERVAL_MS);
}

module.exports = {
  startWorkflowScheduler,
  runWorkflowScheduler,
};

