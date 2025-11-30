/**
 * Actions Routes
 * API endpoints for managing brain_actions
 */

const express = require('express');
const router = express.Router();
const actionExecutor = require('../services/action-executor-service');

// Middleware to get user ID (TODO: Replace with actual auth)
const getUserId = (req) => {
  const userId = req.headers['x-user-id'] || req.headers.authorization;
  return userId || null;
};

/**
 * POST /api/brain/actions
 * Queue a new action
 */
router.post('/', async (req, res) => {
  try {
    const { actionType, payload, sessionId } = req.body;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    if (!actionType) {
      return res.status(400).json({
        success: false,
        error: 'Action type is required',
      });
    }

    const action = await actionExecutor.queueAction(userId, actionType, payload, sessionId);

    return res.json({
      success: true,
      data: action,
    });
  } catch (error) {
     
    console.error('[Actions Route] Queue action error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to queue action',
    });
  }
});

/**
 * GET /api/brain/actions
 * Get action history (filtered by status, type, etc.)
 */
router.get('/', async (req, res) => {
  try {
    const { status, actionType, limit = 50 } = req.query;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    let query = actionExecutor.supabase
      .from('brain_actions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (actionType) {
      query = query.eq('action_type', actionType);
    }

    query = query.limit(parseInt(limit, 10));

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch actions: ${error.message}`);
    }

    return res.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
     
    console.error('[Actions Route] Get actions error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch actions',
    });
  }
});

/**
 * POST /api/brain/actions/execute-pending
 * Manually trigger execution of pending actions (for testing/debugging)
 */
router.post('/execute-pending', async (req, res) => {
  try {
    const executedCount = await actionExecutor.executePendingActions();
    return res.json({
      success: true,
      message: `Attempted to execute ${executedCount} pending actions.`,
    });
  } catch (error) {
     
    console.error('[Actions Route] Manual execute pending error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to manually execute pending actions',
    });
  }
});

module.exports = router;
