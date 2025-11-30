/**
 * Action Runner Worker
 * Periodically checks for and executes pending actions
 */

const actionExecutor = require('../services/action-executor-service');
require('dotenv').config();

const INTERVAL_MS = parseInt(process.env.ACTION_RUNNER_INTERVAL_MS || '10000', 10); // Default 10 seconds
const BATCH_SIZE = parseInt(process.env.ACTION_RUNNER_BATCH_SIZE || '50', 10); // Default 50 actions per run

let isRunning = false;

async function runActionWorker() {
  if (isRunning) {
    console.log('[Action Runner] Worker already running, skipping this interval.');
    return;
  }

  isRunning = true;

  console.log('[Action Runner] Checking for pending actions...');
  try {
    const executedCount = await actionExecutor.executePendingActions(BATCH_SIZE);
    if (executedCount > 0) {
      console.log(`[Action Runner] Executed ${executedCount} pending actions.`);
    }
  } catch (error) {
    console.error('[Action Runner] Error executing actions:', error);
  } finally {
    isRunning = false;
  }
}

function startActionRunner() {
  if (!actionExecutor.queueAction) {
    console.warn(
      '[Action Runner] Action Executor Service not fully configured, skipping worker start.'
    );
    return;
  }

  console.log(`[Action Runner] Starting worker, checking every ${INTERVAL_MS / 1000} seconds.`);
  setInterval(runActionWorker, INTERVAL_MS);
}

module.exports = {
  startActionRunner,
  runActionWorker,
};
