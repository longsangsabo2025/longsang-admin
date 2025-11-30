/**
 * AI Workspace n8n Integration Routes
 * Manage n8n workflows for AI Workspace
 */

const express = require('express');
const router = express.Router();
const n8nService = require('../services/ai-workspace/n8n-service');

/**
 * GET /api/ai-workspace/n8n/workflows
 * List available AI Workspace workflows
 */
router.get('/workflows', (req, res) => {
  try {
    const workflows = n8nService.listWorkflows();
    res.json({
      success: true,
      workflows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/ai-workspace/n8n/workflows/:name/status
 * Get workflow status
 */
router.get('/workflows/:name/status', async (req, res) => {
  try {
    const { name } = req.params;
    const status = await n8nService.getWorkflowStatus(name);
    res.json({
      success: true,
      workflow: name,
      ...status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/ai-workspace/n8n/workflows/:name/trigger
 * Manually trigger a workflow
 */
router.post('/workflows/:name/trigger', async (req, res) => {
  try {
    const { name } = req.params;
    const { data = {} } = req.body;

    const result = await n8nService.triggerWorkflow(name, data);
    res.json({
      success: true,
      workflow: name,
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;

