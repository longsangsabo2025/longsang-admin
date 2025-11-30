/**
 * Campaign Optimizer API Routes
 * Phase 2: Campaign optimization endpoints
 */

const express = require('express');
const router = express.Router();
const CampaignOptimizerService = require('../services/campaign-optimizer-service');

const optimizerService = new CampaignOptimizerService();

/**
 * POST /api/campaign-optimizer/analyze
 * Analyze campaign and get optimization recommendations
 */
router.post('/analyze', async (req, res) => {
  try {
    const {
      campaign_data,
      min_impressions = 1000,
      confidence_level = 0.95
    } = req.body;

    if (!campaign_data) {
      return res.status(400).json({
        success: false,
        error: 'campaign_data is required'
      });
    }

    const result = await optimizerService.analyzeCampaign({
      campaign_data,
      min_impressions,
      confidence_level
    });

    // Format recommendations
    const formatted = optimizerService.formatRecommendations(result);

    res.json({
      ...result,
      formatted_recommendations: formatted
    });
  } catch (error) {
    console.error('Campaign optimization error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Campaign optimization failed'
    });
  }
});

module.exports = router;

