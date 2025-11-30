/**
 * 🤖 Copilot API Routes
 *
 * API endpoints for AI Copilot functionality
 * Chat, suggestions, feedback
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const copilotCore = require('../services/copilot-core');
const copilotLearner = require('../services/copilot-learner');

/**
 * POST /api/copilot/chat
 * Chat with AI Copilot
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, userId, projectId, conversationHistory, useContext, stream } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a string',
      });
    }

    // Handle streaming
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const response = await copilotCore.chat(message, {
        userId: userId || req.user?.id || req.headers['x-user-id'],
        projectId,
        conversationHistory: conversationHistory || [],
        useContext: useContext !== false,
        stream: true,
      });

      // Stream response
      for await (const chunk of response) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // Non-streaming response
    const response = await copilotCore.chat(message, {
      userId: userId || req.user?.id || req.headers['x-user-id'],
      projectId,
      conversationHistory: conversationHistory || [],
      useContext: useContext !== false,
      stream: false,
    });

    res.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error('Error in copilot chat:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process chat message',
    });
  }
});

/**
 * POST /api/copilot/suggestions
 * Generate proactive suggestions
 */
router.post('/suggestions', async (req, res) => {
  try {
    const { userId, limit, projectId, includeContext } = req.body;

    const actualUserId = userId || req.user?.id || req.headers['x-user-id'];

    if (!actualUserId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const suggestions = await copilotCore.generateSuggestions(actualUserId, {
      limit: limit || 5,
      projectId: projectId || null,
      includeContext: includeContext !== false,
    });

    res.json({
      success: true,
      suggestions,
      count: suggestions.length,
    });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate suggestions',
    });
  }
});

/**
 * POST /api/copilot/feedback
 * Submit feedback for learning (Enhanced with learner service)
 */
router.post('/feedback', async (req, res) => {
  try {
    const { type, userId, message, response, rating, comment, context, interactionType, referenceId, referenceType, correctedResponse } = req.body;

    if (!type || !['positive', 'negative', 'neutral', 'correction'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Feedback type must be: positive, negative, neutral, or correction',
      });
    }

    const actualUserId = userId || req.user?.id || req.headers['x-user-id'];

    // Store feedback using learner service
    const feedback = await copilotLearner.collectFeedback({
      userId: actualUserId,
      feedbackType: type,
      interactionType: interactionType || 'chat',
      referenceId: referenceId || null,
      referenceType: referenceType || null,
      rating: rating || null,
      comment: comment || null,
      originalMessage: message || null,
      aiResponse: response || null,
      correctedResponse: correctedResponse || null,
      context: context || {},
    });

    res.json({
      success: true,
      message: 'Feedback received and stored successfully',
      feedbackId: feedback.id,
    });
  } catch (error) {
    console.error('Error processing feedback:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process feedback',
    });
  }
});

/**
 * POST /api/copilot/parse-command
 * Parse user command with context
 */
router.post('/parse-command', async (req, res) => {
  try {
    const { command, userId, projectId } = req.body;

    if (!command || typeof command !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Command is required and must be a string',
      });
    }

    const result = await copilotCore.parseCommand(command, {
      userId: userId || req.user?.id || req.headers['x-user-id'],
      projectId,
    });

    res.json({
      success: result.success,
      parsed: result.toolCalls || [],
      contextUsed: result.contextUsed,
      error: result.error,
      suggestion: result.suggestion,
    });
  } catch (error) {
    console.error('Error parsing command:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to parse command',
    });
  }
});

module.exports = router;


