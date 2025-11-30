/**
 * 📊 Metrics API Routes
 *
 * Exposes metrics endpoints for monitoring
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const metricsCollector = require('../services/metrics-collector');

/**
 * GET /api/metrics
 * Get all metrics
 */
router.get('/', (req, res) => {
  try {
    const { timeWindow = 3600000 } = req.query; // Default 1 hour
    const windowMs = parseInt(timeWindow, 10);

    const metrics = metricsCollector.getMetrics(windowMs);

    res.json({
      success: true,
      metrics,
    });
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/metrics/endpoint/:endpoint
 * Get metrics for specific endpoint
 */
router.get('/endpoint/:endpoint', (req, res) => {
  try {
    const { endpoint } = req.params;
    const { timeWindow = 3600000 } = req.query;
    const windowMs = parseInt(timeWindow, 10);

    const endpointMetrics = metricsCollector.getEndpointMetrics(endpoint, windowMs);

    if (!endpointMetrics) {
      return res.status(404).json({
        success: false,
        error: 'No metrics found for endpoint',
      });
    }

    res.json({
      success: true,
      endpoint,
      metrics: endpointMetrics,
    });
  } catch (error) {
    console.error('Error getting endpoint metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/metrics/reset
 * Reset metrics (admin only)
 */
router.post('/reset', (req, res) => {
  try {
    // In production, add authentication check here
    metricsCollector.resetMetrics();

    res.json({
      success: true,
      message: 'Metrics reset successfully',
    });
  } catch (error) {
    console.error('Error resetting metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;

