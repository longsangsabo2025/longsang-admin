/**
 * 🧠 Memory API Routes
 * 
 * Endpoints for intelligent memory management
 */

const express = require('express');
const router = express.Router();
const memoryService = require('../services/ai-workspace/memory-service');

/**
 * POST /api/memory/summarize
 * Summarize conversation history
 */
router.post('/summarize', async (req, res) => {
  try {
    const { messages, language = 'vi', maxTokens = 500 } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required',
      });
    }
    
    const result = await memoryService.summarizeConversation(messages, {
      language,
      maxTokens,
    });
    
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Memory API] Summarization error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/memory/generate-title
 * Generate conversation title from first message
 */
router.post('/generate-title', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }
    
    const title = await memoryService.generateTitle(message);
    
    res.json({
      success: true,
      title,
    });
  } catch (error) {
    console.error('[Memory API] Title generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/memory/optimize-context
 * Get optimized context for API call
 */
router.post('/optimize-context', async (req, res) => {
  try {
    const { session, systemPrompt, maxTokens = 128000 } = req.body;
    
    if (!session || !systemPrompt) {
      return res.status(400).json({
        success: false,
        error: 'Session and systemPrompt are required',
      });
    }
    
    const result = memoryService.buildOptimizedContext(session, systemPrompt, maxTokens);
    
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Memory API] Context optimization error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/memory/token-count
 * Count tokens for text or messages
 */
router.post('/token-count', async (req, res) => {
  try {
    const { text, messages } = req.body;
    
    let tokens = 0;
    
    if (text) {
      tokens = memoryService.TokenCounter.estimate(text);
    } else if (messages && Array.isArray(messages)) {
      tokens = memoryService.TokenCounter.estimateMessages(messages);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either text or messages is required',
      });
    }
    
    res.json({
      success: true,
      tokens,
    });
  } catch (error) {
    console.error('[Memory API] Token count error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/memory/check-summarization
 * Check if summarization is needed
 */
router.post('/check-summarization', async (req, res) => {
  try {
    const { session, threshold = 30 } = req.body;
    
    if (!session) {
      return res.status(400).json({
        success: false,
        error: 'Session is required',
      });
    }
    
    const needsSummarization = memoryService.needsSummarization(session, threshold);
    const messagesToSummarize = memoryService.getMessagesToSummarize(session);
    
    res.json({
      success: true,
      needsSummarization,
      messageCount: messagesToSummarize.length,
    });
  } catch (error) {
    console.error('[Memory API] Check summarization error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
