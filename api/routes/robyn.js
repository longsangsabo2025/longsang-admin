/**
 * Robyn Marketing Mix Modeling Routes
 * Phase 3: Robyn MMM integration
 */

const express = require('express');
const router = express.Router();
const robynService = require('../services/robyn-service');

/**
 * POST /api/robyn/optimize-budget
 * Optimize budget allocation using Robyn MMM
 */
router.post('/optimize-budget', async (req, res) => {
  try {
    const {
      historical_data,
      total_budget,
      channels
    } = req.body;

    if (!historical_data || !total_budget || !channels) {
      return res.status(400).json({
        success: false,
        error: 'historical_data, total_budget, and channels are required'
      });
    }

    const result = await robynService.optimizeBudgetAllocation({
      historical_data,
      total_budget,
      channels
    });

    res.json(result);
  } catch (error) {
    console.error('Robyn optimization error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Robyn optimization failed'
    });
  }
});

/**
 * POST /api/robyn/attribution
 * Calculate channel attribution using Robyn
 */
router.post('/attribution', async (req, res) => {
  try {
    const {
      historical_data,
      channels
    } = req.body;

    if (!historical_data || !channels) {
      return res.status(400).json({
        success: false,
        error: 'historical_data and channels are required'
      });
    }

    const result = await robynService.calculateChannelAttribution({
      historical_data,
      channels
    });

    res.json(result);
  } catch (error) {
    console.error('Robyn attribution error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Robyn attribution failed'
    });
  }
});

module.exports = router;

