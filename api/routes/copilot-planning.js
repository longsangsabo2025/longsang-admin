/**
 * 🧠 Copilot Planning API Routes
 *
 * API endpoints for execution planning
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const copilotPlanner = require('../services/copilot-planner');
const commandParser = require('../services/command-parser');

/**
 * POST /api/copilot/plan
 * Create execution plan from command
 */
router.post('/plan', async (req, res) => {
  try {
    const { command, context, userId, projectId } = req.body;

    if (!command || typeof command !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Command is required and must be a string',
      });
    }

    // Step 1: Parse command
    const AVAILABLE_FUNCTIONS = require('./ai-command').AVAILABLE_FUNCTIONS || [];

    const parseResult = await commandParser.parseCommand(command, AVAILABLE_FUNCTIONS, {
      projectId,
      userContext: { userId: userId || req.user?.id || req.headers['x-user-id'] },
    });

    if (!parseResult.success || !parseResult.toolCalls || parseResult.toolCalls.length === 0) {
      return res.status(400).json({
        success: false,
        error: parseResult.error || 'Failed to parse command',
        suggestion: parseResult.suggestion,
      });
    }

    // Step 2: Create plan
    const planResult = await copilotPlanner.createPlan(parseResult, {
      command,
      context,
      userId: userId || req.user?.id || req.headers['x-user-id'],
      projectId,
    });

    if (!planResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to create valid plan',
        validation: planResult.validation,
      });
    }

    res.json({
      success: true,
      command,
      plan: planResult.plan,
      validation: planResult.validation,
      metadata: planResult.metadata,
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create execution plan',
    });
  }
});

/**
 * POST /api/copilot/plan/preview
 * Preview plan without creating
 */
router.post('/plan/preview', async (req, res) => {
  try {
    const { command, projectId } = req.body;

    if (!command) {
      return res.status(400).json({
        success: false,
        error: 'Command is required',
      });
    }

    // Parse and plan
    const AVAILABLE_FUNCTIONS = require('./ai-command').AVAILABLE_FUNCTIONS || [];

    const parseResult = await commandParser.parseCommand(command, AVAILABLE_FUNCTIONS, {
      projectId,
    });

    if (!parseResult.success) {
      return res.json({
        success: false,
        preview: {
          canPlan: false,
          error: parseResult.error,
        },
      });
    }

    const planResult = await copilotPlanner.createPlan(parseResult, {
      command,
      projectId,
    });

    // Return simplified preview
    res.json({
      success: true,
      preview: {
        canPlan: planResult.success,
        stepCount: planResult.plan?.totalSteps || 0,
        estimatedDuration: planResult.plan?.estimatedDuration || '~0s',
        hasParallelSteps: (planResult.plan?.parallelSteps || 0) > 0,
        validationErrors: planResult.validation?.errors || [],
        validationWarnings: planResult.validation?.warnings || [],
      },
    });
  } catch (error) {
    console.error('Error previewing plan:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to preview plan',
    });
  }
});

module.exports = router;

