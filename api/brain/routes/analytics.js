/**
 * Analytics Routes
 * API endpoints for analytics and metrics
 */

const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analytics-service');
const { getUserId } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error-handler');

/**
 * POST /api/brain/analytics/track
 * Track an analytics event
 */
router.post(
  '/track',
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID is required', code: 'AUTHENTICATION_REQUIRED' },
      });
    }

    const { eventType, eventData, metadata, sessionId } = req.body;

    if (!eventType) {
      return res.status(400).json({
        success: false,
        error: { message: 'Event type is required', code: 'VALIDATION_ERROR' },
      });
    }

    const event = await analyticsService.trackEvent(userId, eventType, eventData || {}, {
      ...metadata,
      sessionId,
    });

    return res.json({
      success: true,
      data: event,
    });
  })
);

/**
 * GET /api/brain/analytics/user-behavior
 * Get user behavior analytics
 */
router.get(
  '/user-behavior',
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID is required', code: 'AUTHENTICATION_REQUIRED' },
      });
    }

    const hours = parseInt(req.query.hours || '24', 10);
    const analytics = await analyticsService.getUserBehaviorAnalytics(userId, { hours });

    return res.json({
      success: true,
      data: analytics,
    });
  })
);

/**
 * GET /api/brain/analytics/system-performance
 * Get system performance metrics
 */
router.get(
  '/system-performance',
  asyncHandler(async (req, res) => {
    const hours = parseInt(req.query.hours || '24', 10);
    const metrics = await analyticsService.getSystemPerformanceMetrics({ hours });

    return res.json({
      success: true,
      data: metrics,
    });
  })
);

/**
 * GET /api/brain/analytics/domain-usage/:domainId
 * Get domain usage statistics
 */
router.get(
  '/domain-usage/:domainId',
  asyncHandler(async (req, res) => {
    const { domainId } = req.params;
    const days = parseInt(req.query.days || '7', 10);
    const stats = await analyticsService.getDomainUsageStatistics(domainId, { days });

    return res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * GET /api/brain/analytics/query-patterns
 * Get query patterns for the user
 */
router.get(
  '/query-patterns',
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID is required', code: 'AUTHENTICATION_REQUIRED' },
      });
    }

    const days = parseInt(req.query.days || '7', 10);
    const patterns = await analyticsService.getQueryPatterns(userId, { days });

    return res.json({
      success: true,
      data: patterns,
    });
  })
);

/**
 * GET /api/brain/analytics/daily-activity
 * Get daily user activity
 */
router.get(
  '/daily-activity',
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID is required', code: 'AUTHENTICATION_REQUIRED' },
      });
    }

    const days = parseInt(req.query.days || '7', 10);
    const activity = await analyticsService.getDailyUserActivity(userId, days);

    return res.json({
      success: true,
      data: activity,
    });
  })
);

/**
 * POST /api/brain/analytics/refresh-views
 * Refresh analytics materialized views (admin only)
 */
router.post(
  '/refresh-views',
  asyncHandler(async (req, res) => {
    await analyticsService.refreshAnalyticsViews();

    return res.json({
      success: true,
      message: 'Analytics views refreshed successfully',
    });
  })
);

module.exports = router;


