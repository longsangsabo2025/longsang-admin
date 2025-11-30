/**
 * AI Feedback API Routes
 * 
 * Endpoints for collecting user feedback and learning
 * 
 * @author LongSang Admin
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const copilotLearner = require('../services/copilot-learner');

/**
 * POST /api/ai/feedback
 * Submit feedback for an AI interaction
 */
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      feedbackType,
      interactionType,
      referenceId,
      referenceType,
      rating,
      comment,
      originalMessage,
      aiResponse,
      correctedResponse,
      context,
    } = req.body;

    if (!feedbackType || !interactionType) {
      return res.status(400).json({
        success: false,
        error: 'feedbackType and interactionType are required',
      });
    }

    const result = await copilotLearner.collectFeedback({
      userId: userId || 'anonymous',
      feedbackType,
      interactionType,
      referenceId,
      referenceType,
      rating,
      comment,
      originalMessage,
      aiResponse,
      correctedResponse,
      context: context || {},
    });

    res.json({
      success: true,
      feedbackId: result.id,
      message: 'Feedback recorded successfully',
    });
  } catch (error) {
    console.error('❌ Feedback error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/ai/feedback/rate
 * Quick rating endpoint (1-5 stars)
 */
router.post('/rate', async (req, res) => {
  try {
    const { interactionId, rating, userId } = req.body;

    if (!interactionId || !rating) {
      return res.status(400).json({
        success: false,
        error: 'interactionId and rating are required',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'rating must be between 1 and 5',
      });
    }

    const feedbackType = rating >= 4 ? 'positive' : rating <= 2 ? 'negative' : 'neutral';

    const result = await copilotLearner.collectFeedback({
      userId: userId || 'anonymous',
      feedbackType,
      interactionType: 'rating',
      referenceId: interactionId,
      referenceType: 'interaction',
      rating,
    });

    res.json({
      success: true,
      feedbackId: result.id,
      feedbackType,
    });
  } catch (error) {
    console.error('❌ Rating error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/ai/feedback/correction
 * Submit a correction for an AI response
 */
router.post('/correction', async (req, res) => {
  try {
    const {
      interactionId,
      originalMessage,
      aiResponse,
      correctedResponse,
      userId,
      context,
    } = req.body;

    if (!correctedResponse) {
      return res.status(400).json({
        success: false,
        error: 'correctedResponse is required',
      });
    }

    const result = await copilotLearner.collectFeedback({
      userId: userId || 'anonymous',
      feedbackType: 'correction',
      interactionType: 'correction',
      referenceId: interactionId,
      referenceType: 'interaction',
      originalMessage,
      aiResponse,
      correctedResponse,
      context: context || {},
    });

    res.json({
      success: true,
      feedbackId: result.id,
      message: 'Correction recorded for learning',
    });
  } catch (error) {
    console.error('❌ Correction error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/ai/feedback/patterns/:userId
 * Get learned patterns for a user
 */
router.get('/patterns/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { patternType } = req.query;

    const patterns = await copilotLearner.getUserPatterns(userId, patternType);

    res.json({
      success: true,
      userId,
      patternCount: patterns.length,
      patterns,
    });
  } catch (error) {
    console.error('❌ Get patterns error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/ai/feedback/preferences/:userId
 * Get user preferences
 */
router.get('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { preferenceType } = req.query;

    const preferences = await copilotLearner.getUserPreferences(userId, preferenceType);

    res.json({
      success: true,
      userId,
      preferences,
    });
  } catch (error) {
    console.error('❌ Get preferences error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/ai/feedback/learn
 * Trigger batch learning for a user
 */
router.post('/learn/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await copilotLearner.learnFromBatch(userId);

    res.json({
      success: true,
      userId,
      ...result,
    });
  } catch (error) {
    console.error('❌ Learn error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/ai/feedback/stats
 * Get feedback statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co',
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
    );

    // Get feedback counts by type
    const { data: feedbackCounts } = await supabase
      .from('copilot_feedback')
      .select('feedback_type')
      .limit(1000);

    const stats = {
      total: feedbackCounts?.length || 0,
      byType: {},
    };

    feedbackCounts?.forEach(f => {
      stats.byType[f.feedback_type] = (stats.byType[f.feedback_type] || 0) + 1;
    });

    // Get pattern counts
    const { data: patterns } = await supabase
      .from('copilot_patterns')
      .select('pattern_type')
      .eq('is_active', true);

    stats.patterns = {
      total: patterns?.length || 0,
      byType: {},
    };

    patterns?.forEach(p => {
      stats.patterns.byType[p.pattern_type] = (stats.patterns.byType[p.pattern_type] || 0) + 1;
    });

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('❌ Stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
