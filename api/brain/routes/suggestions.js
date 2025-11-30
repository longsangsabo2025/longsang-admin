/**
 * Suggestions Routes
 * API endpoints for smart suggestions and predictions
 */

const express = require('express');
const router = express.Router();
const suggestionService = require('../services/suggestion-service');
const predictionService = require('../services/prediction-service');
const { getUserId } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error-handler');

/**
 * GET /api/brain/suggestions/related/:knowledgeId
 * Get related knowledge suggestions
 */
router.get(
  '/related/:knowledgeId',
  asyncHandler(async (req, res) => {
    const { knowledgeId } = req.params;
    const related = await suggestionService.suggestRelatedKnowledge(knowledgeId);

    return res.json({
      success: true,
      data: related,
    });
  })
);

/**
 * GET /api/brain/suggestions/tasks
 * Get task suggestions
 */
router.get(
  '/tasks',
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID is required', code: 'AUTHENTICATION_REQUIRED' },
      });
    }

    const context = req.query.context ? JSON.parse(req.query.context) : {};
    const suggestions = await suggestionService.suggestTasks(userId, context);

    return res.json({
      success: true,
      data: suggestions,
    });
  })
);

/**
 * GET /api/brain/suggestions/patterns
 * Get detected usage patterns
 */
router.get(
  '/patterns',
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID is required', code: 'AUTHENTICATION_REQUIRED' },
      });
    }

    const patterns = await suggestionService.detectPatterns(userId);

    return res.json({
      success: true,
      data: patterns,
    });
  })
);

/**
 * GET /api/brain/suggestions/reminders
 * Get smart reminders
 */
router.get(
  '/reminders',
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID is required', code: 'AUTHENTICATION_REQUIRED' },
      });
    }

    const reminders = await suggestionService.generateReminders(userId);

    return res.json({
      success: true,
      data: reminders,
    });
  })
);

/**
 * GET /api/brain/predictions/user-needs
 * Get predicted user needs
 */
router.get(
  '/user-needs',
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID is required', code: 'AUTHENTICATION_REQUIRED' },
      });
    }

    const predictions = await predictionService.predictUserNeeds(userId);

    return res.json({
      success: true,
      data: predictions,
    });
  })
);

/**
 * GET /api/brain/predictions/queries
 * Get anticipated queries
 */
router.get(
  '/queries',
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID is required', code: 'AUTHENTICATION_REQUIRED' },
      });
    }

    const queries = await predictionService.anticipateQueries(userId);

    return res.json({
      success: true,
      data: queries,
    });
  })
);

/**
 * GET /api/brain/predictions/knowledge-gaps/:domainId
 * Get knowledge gaps for a domain
 */
router.get(
  '/knowledge-gaps/:domainId',
  asyncHandler(async (req, res) => {
    const { domainId } = req.params;
    const gaps = await predictionService.identifyKnowledgeGaps(domainId);

    return res.json({
      success: true,
      data: gaps,
    });
  })
);

/**
 * GET /api/brain/predictions/domain-growth/:domainId
 * Forecast domain growth
 */
router.get(
  '/domain-growth/:domainId',
  asyncHandler(async (req, res) => {
    const { domainId } = req.params;
    const forecast = await predictionService.forecastDomainGrowth(domainId);

    return res.json({
      success: true,
      data: forecast,
    });
  })
);

module.exports = router;


