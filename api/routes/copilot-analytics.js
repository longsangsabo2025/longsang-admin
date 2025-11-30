/**
 * 📊 Copilot Analytics API Routes
 *
 * Analytics endpoints for Copilot
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const copilotAnalytics = require('../services/copilot-analytics');

/**
 * GET /api/copilot/analytics/insights
 * Get performance insights
 */
router.get('/analytics/insights', async (req, res) => {
  try {
    const { userId, projectId, timeRange } = req.query;

    const actualUserId = userId || req.user?.id || req.headers['x-user-id'];

    if (!actualUserId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const insights = await copilotAnalytics.getPerformanceInsights({
      userId: actualUserId,
      projectId: projectId || null,
      timeRange: timeRange || '7d',
    });

    res.json({
      success: true,
      insights,
    });
  } catch (error) {
    console.error('Error getting insights:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get insights',
    });
  }
});

/**
 * GET /api/copilot/analytics/recommendations
 * Get data-driven recommendations
 */
router.get('/analytics/recommendations', async (req, res) => {
  try {
    const { userId, projectId } = req.query;

    const actualUserId = userId || req.user?.id || req.headers['x-user-id'];

    if (!actualUserId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const recommendations = await copilotAnalytics.getDataDrivenRecommendations(actualUserId, {
      projectId: projectId || null,
    });

    res.json({
      success: true,
      recommendations,
      count: recommendations.length,
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recommendations',
    });
  }
});

/**
 * POST /api/copilot/analytics/track
 * Track Copilot usage
 */
router.post('/analytics/track', async (req, res) => {
  try {
    const { userId, action, details } = req.body;

    const actualUserId = userId || req.user?.id || req.headers['x-user-id'];

    if (!actualUserId || !action) {
      return res.status(400).json({
        success: false,
        error: 'User ID and action are required',
      });
    }

    const success = await copilotAnalytics.trackUsage({
      userId: actualUserId,
      action,
      details: details || {},
    });

    res.json({
      success,
      message: 'Usage tracked successfully',
    });
  } catch (error) {
    console.error('Error tracking usage:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to track usage',
    });
  }
});

module.exports = router;

