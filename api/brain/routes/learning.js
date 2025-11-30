/**
 * Learning Routes
 * API endpoints for learning system: feedback, metrics, routing accuracy
 */

const express = require('express');
const router = express.Router();
const learningService = require('../services/learning-service');
const knowledgeQualityService = require('../services/knowledge-quality-service');
const { getUserId } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error-handler');

/**
 * POST /api/brain/learning/feedback
 * Submit user feedback
 */
router.post(
  '/feedback',
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID is required', code: 'AUTHENTICATION_REQUIRED' },
      });
    }

    const { queryId, feedbackType, rating, comment, context } = req.body;

    if (!feedbackType) {
      return res.status(400).json({
        success: false,
        error: { message: 'Feedback type is required', code: 'VALIDATION_ERROR' },
      });
    }

    const feedback = await learningService.recordFeedback(userId, queryId, {
      feedbackType,
      rating,
      comment,
      context,
    });

    return res.json({
      success: true,
      data: feedback,
    });
  })
);

/**
 * GET /api/brain/learning/metrics
 * Get learning metrics for the user
 */
router.get(
  '/metrics',
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID is required', code: 'AUTHENTICATION_REQUIRED' },
      });
    }

    const { metricType, limit = 50 } = req.query;

    let query = learningService.supabase
      .from('brain_learning_metrics')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit, 10));

    if (metricType) {
      query = query.eq('metric_type', metricType);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch learning metrics: ${error.message}`);
    }

    return res.json({
      success: true,
      data: data || [],
    });
  })
);

/**
 * GET /api/brain/learning/routing-accuracy
 * Get routing accuracy for the user
 */
router.get(
  '/routing-accuracy',
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID is required', code: 'AUTHENTICATION_REQUIRED' },
      });
    }

    const timeRangeHours = parseInt(req.query.timeRangeHours || '24', 10);
    const accuracy = await learningService.calculateRoutingAccuracy(userId, timeRangeHours);

    return res.json({
      success: true,
      data: {
        accuracy,
        timeRangeHours,
      },
    });
  })
);

/**
 * GET /api/brain/learning/routing-weights
 * Get routing weights for the user
 */
router.get(
  '/routing-weights',
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID is required', code: 'AUTHENTICATION_REQUIRED' },
      });
    }

    const { data, error } = await learningService.supabase
      .from('brain_routing_weights')
      .select('domain_id, weight, success_count, failure_count, last_updated')
      .eq('user_id', userId)
      .order('weight', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch routing weights: ${error.message}`);
    }

    return res.json({
      success: true,
      data: data || [],
    });
  })
);

/**
 * POST /api/brain/knowledge/:id/score
 * Score a knowledge item
 */
router.post(
  '/knowledge/:id/score',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const score = await knowledgeQualityService.scoreKnowledgeItem(id);

    return res.json({
      success: true,
      data: score,
    });
  })
);

/**
 * GET /api/brain/knowledge/quality/low-quality
 * Get low-quality knowledge items
 */
router.get(
  '/knowledge/quality/low-quality',
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID is required', code: 'AUTHENTICATION_REQUIRED' },
      });
    }

    const { domainId, threshold = 30 } = req.query;
    const lowQuality = await knowledgeQualityService.identifyLowQualityKnowledge(domainId, parseInt(threshold, 10));

    return res.json({
      success: true,
      data: lowQuality,
    });
  })
);

/**
 * GET /api/brain/knowledge/:id/improvements
 * Get improvement suggestions for a knowledge item
 */
router.get(
  '/knowledge/:id/improvements',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const suggestions = await knowledgeQualityService.suggestImprovements(id);

    return res.json({
      success: true,
      data: suggestions,
    });
  })
);

module.exports = router;


