/**
 * Budget Reallocation API Routes
 * Phase 3: Automated budget reallocation
 */

const express = require('express');
const router = express.Router();
const BudgetReallocationService = require('../services/budget-reallocation-service');

const reallocationService = new BudgetReallocationService();

/**
 * POST /api/budget-reallocation/analyze
 * Analyze and get budget reallocation recommendations
 */
router.post('/analyze', async (req, res) => {
  try {
    const {
      campaign_data,
      total_budget,
      min_budget_per_variant = 50,
      max_budget_per_variant = null,
      method = "thompson_sampling",
      auto_apply = false
    } = req.body;

    if (!campaign_data || !total_budget) {
      return res.status(400).json({
        success: false,
        error: 'campaign_data and total_budget are required'
      });
    }

    const result = await reallocationService.analyzeAndReallocate({
      campaign_data,
      total_budget,
      min_budget_per_variant,
      max_budget_per_variant,
      method,
      auto_apply
    });

    res.json(result);
  } catch (error) {
    console.error('Budget reallocation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Budget reallocation failed'
    });
  }
});

/**
 * POST /api/budget-reallocation/forecast
 * Forecast campaign performance
 */
router.post('/forecast', async (req, res) => {
  try {
    const {
      historical_data,
      days_ahead = 7
    } = req.body;

    if (!historical_data || !Array.isArray(historical_data)) {
      return res.status(400).json({
        success: false,
        error: 'historical_data array is required'
      });
    }

    const result = await reallocationService.forecastPerformance({
      historical_data,
      days_ahead
    });

    res.json(result);
  } catch (error) {
    console.error('Forecasting error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Forecasting failed'
    });
  }
});

/**
 * GET /api/budget-reallocation/history
 * Get reallocation history
 */
router.get('/history', (req, res) => {
  try {
    const { campaign_id } = req.query;
    const history = reallocationService.getHistory(campaign_id);

    res.json({
      success: true,
      history,
      count: history.length
    });
  } catch (error) {
    console.error('History retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get history'
    });
  }
});

module.exports = router;

