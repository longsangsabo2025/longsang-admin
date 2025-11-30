/**
 * AI Usage API Routes
 * Track and report AI API usage and costs
 */

const express = require('express');
const router = express.Router();
const aiUsageTracker = require('../services/ai-usage-tracker');

/**
 * GET /api/ai-usage/summary
 * Get usage summary for a time period
 */
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate, groupBy } = req.query;
    
    const options = {};
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);
    if (groupBy) options.groupBy = groupBy;
    
    const summary = await aiUsageTracker.getUsageSummary(options);
    res.json(summary);
  } catch (error) {
    console.error('❌ Error getting usage summary:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/ai-usage/monthly/:year/:month
 * Get monthly report
 */
router.get('/monthly/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const report = await aiUsageTracker.getMonthlyReport(
      parseInt(year),
      parseInt(month)
    );
    res.json(report);
  } catch (error) {
    console.error('❌ Error getting monthly report:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/ai-usage/projection
 * Get cost projection
 */
router.get('/projection', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const projection = await aiUsageTracker.getCostProjection(days);
    res.json(projection);
  } catch (error) {
    console.error('❌ Error getting projection:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/ai-usage/pricing
 * Get model pricing info
 */
router.get('/pricing', (req, res) => {
  res.json({
    success: true,
    pricing: aiUsageTracker.MODEL_PRICING,
    notes: {
      'gpt-4o-mini': 'Best value for most tasks',
      'gpt-4o': 'Most capable, higher cost',
      'dall-e-3': 'Per image pricing',
    },
  });
});

/**
 * POST /api/ai-usage/flush
 * Force flush usage buffer to database
 */
router.post('/flush', async (req, res) => {
  try {
    await aiUsageTracker.flushUsageBuffer();
    res.json({
      success: true,
      message: 'Usage buffer flushed to database',
    });
  } catch (error) {
    console.error('❌ Error flushing buffer:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
