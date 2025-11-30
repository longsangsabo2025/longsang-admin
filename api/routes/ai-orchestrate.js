/**
 * AI Orchestrator API Route
 * Multi-agent orchestration endpoint
 */

const express = require('express');
const router = express.Router();
const { executeOrchestrator } = require('../services/ai-workspace/orchestrator');
const { validateKeys } = require('../services/ai-workspace/env-loader');

/**
 * POST /api/orchestrate
 * Orchestrate multi-agent workflow
 */
router.post('/', async (req, res) => {
  try {
    // Validate API keys
    const validation = validateKeys();
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'API keys not configured',
        details: validation.errors,
      });
    }

    const { query, userId, conversationHistory = [], stream = false } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query is required and must be a string',
      });
    }

    const actualUserId = userId || req.user?.id || req.headers['x-user-id'];
    if (!actualUserId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    // Execute orchestrator
    const result = await executeOrchestrator({
      userQuery: query,
      userId: actualUserId,
      conversationHistory,
    });

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Stream response word by word
      const words = result.response.split(' ');
      for (let i = 0; i < words.length; i++) {
        const word = words[i] + (i < words.length - 1 ? ' ' : '');
        res.write(`data: ${JSON.stringify({ content: word })}\n\n`);
        await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for streaming effect
      }
      res.write(`data: [DONE]\n\n`);
      res.end();
    } else {
      res.json({
        success: result.success,
        response: result.response,
        intent: result.intent,
        selectedAgents: result.selectedAgents,
        agentResponses: result.agentResponses,
      });
    }
  } catch (error) {
    console.error('[Orchestrator API] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

module.exports = router;
