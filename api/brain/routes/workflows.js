/**
 * Workflows Routes
 * API endpoints for managing brain_workflows
 */

const express = require('express');
const router = express.Router();
const workflowEngine = require('../services/workflow-engine-service');

// Middleware to get user ID (TODO: Replace with actual auth)
const getUserId = (req) => {
  const userId = req.headers['x-user-id'] || req.headers.authorization;
  return userId || null;
};

/**
 * POST /api/brain/workflows
 * Create a new workflow
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, triggerType, triggerConfig, actions, isActive } = req.body;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }
    if (!name || !triggerType || !Array.isArray(actions)) {
      return res.status(400).json({
        success: false,
        error: 'Name, triggerType, and actions array are required',
      });
    }

    const { data, error } = await workflowEngine.supabase
      .from('brain_workflows')
      .insert({
        user_id: userId,
        name,
        description,
        trigger_type: triggerType,
        trigger_config: triggerConfig || {},
        actions,
        is_active: isActive !== undefined ? isActive : true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create workflow: ${error.message}`);
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Workflows Route] Create workflow error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create workflow',
    });
  }
});

/**
 * PUT /api/brain/workflows/:id
 * Update an existing workflow
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, triggerType, triggerConfig, actions, isActive } = req.body;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const updateData = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (triggerType !== undefined) updateData.trigger_type = triggerType;
    if (triggerConfig !== undefined) updateData.trigger_config = triggerConfig;
    if (actions !== undefined) updateData.actions = actions;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data, error } = await workflowEngine.supabase
      .from('brain_workflows')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update workflow: ${error.message}`);
    }
    if (!data) {
      return res.status(404).json({ success: false, error: 'Workflow not found or unauthorized' });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Workflows Route] Update workflow error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update workflow',
    });
  }
});

/**
 * DELETE /api/brain/workflows/:id
 * Delete a workflow
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const { error, count } = await workflowEngine.supabase
      .from('brain_workflows')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete workflow: ${error.message}`);
    }
    if (count === 0) {
      return res.status(404).json({ success: false, error: 'Workflow not found or unauthorized' });
    }

    return res.json({
      success: true,
      message: 'Workflow deleted successfully',
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Workflows Route] Delete workflow error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete workflow',
    });
  }
});

/**
 * GET /api/brain/workflows
 * Get all workflows for the user
 */
router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const { data, error } = await workflowEngine.supabase
      .from('brain_workflows')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch workflows: ${error.message}`);
    }

    return res.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Workflows Route] Get workflows error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch workflows',
    });
  }
});

/**
 * GET /api/brain/workflows/:id
 * Get a single workflow by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const { data, error } = await workflowEngine.supabase
      .from('brain_workflows')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch workflow: ${error.message}`);
    }
    if (!data) {
      return res.status(404).json({ success: false, error: 'Workflow not found or unauthorized' });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Workflows Route] Get single workflow error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch workflow',
    });
  }
});

/**
 * POST /api/brain/workflows/:id/test
 * Test a workflow by simulating an event and running its actions
 */
router.post('/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const { eventType = 'manual_test', context = {} } = req.body; // Default eventType for testing
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const { data: workflow, error } = await workflowEngine.supabase
      .from('brain_workflows')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch workflow: ${error.message}`);
    }
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found or unauthorized' });
    }

    // Simulate event evaluation and run workflow
    const matchedWorkflows = await workflowEngine.evaluateEvent(userId, eventType, context);
    let actionsQueued = 0;
    if (matchedWorkflows.some((wf) => wf.id === id)) {
      actionsQueued = await workflowEngine.runWorkflow(workflow, userId, context);
    }

    return res.json({
      success: true,
      message: `Test run for workflow ${workflow.name} completed. ${actionsQueued} actions queued.`,
      data: {
        actionsQueued,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Workflows Route] Test workflow error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to test workflow',
    });
  }
});

module.exports = router;
