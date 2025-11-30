/**
 * n8n Service for AI Workspace
 * Trigger n8n workflows from AI Workspace
 */

const { getAPIKeys } = require('./env-loader');

const keys = getAPIKeys();
const N8N_URL = process.env.N8N_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY;

/**
 * Trigger n8n workflow by webhook
 */
async function triggerWorkflow(workflowName, data = {}) {
  try {
    // Get workflow webhook URL from n8n
    // For now, we'll use direct webhook URLs
    const webhookUrls = {
      'daily-news-digest': `${N8N_URL}/webhook/daily-news-digest`,
      'weekly-financial-summary': `${N8N_URL}/webhook/weekly-financial-summary`,
    };

    const webhookUrl = webhookUrls[workflowName];
    if (!webhookUrl) {
      throw new Error(`Workflow ${workflowName} not found`);
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(N8N_API_KEY && { 'X-N8N-API-KEY': N8N_API_KEY }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[n8n Service] Error triggering ${workflowName}:`, error);
    throw error;
  }
}

/**
 * Get n8n workflow status
 */
async function getWorkflowStatus(workflowName) {
  try {
    if (!N8N_API_KEY) {
      return { available: false, reason: 'N8N_API_KEY not configured' };
    }

    const response = await fetch(`${N8N_URL}/api/v1/workflows`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
      },
    });

    if (!response.ok) {
      return { available: false, reason: 'Cannot connect to n8n' };
    }

    const workflows = await response.json();
    const workflow = workflows.data?.find((w) => w.name === workflowName);

    return {
      available: !!workflow,
      active: workflow?.active || false,
      workflow,
    };
  } catch (error) {
    console.error('[n8n Service] Error getting workflow status:', error);
    return { available: false, reason: error.message };
  }
}

/**
 * List available AI Workspace workflows
 */
function listWorkflows() {
  return [
    {
      name: 'daily-news-digest',
      description: 'Daily news digest từ News Assistant',
      schedule: 'Daily at 7:00 AM',
      file: 'n8n/workflows/ai-workspace-daily-news-digest.json',
    },
    {
      name: 'weekly-financial-summary',
      description: 'Weekly financial summary từ Financial Assistant',
      schedule: 'Weekly on Sunday at 6:00 PM',
      file: 'n8n/workflows/ai-workspace-weekly-financial-summary.json',
    },
  ];
}

module.exports = {
  triggerWorkflow,
  getWorkflowStatus,
  listWorkflows,
};

