/**
 * Multi-Platform Deployment API Routes
 * Phase 3: Deploy campaigns to multiple platforms
 */

const express = require('express');
const router = express.Router();
const MultiPlatformDeploymentService = require('../services/multi-platform-deployment');

const deploymentService = new MultiPlatformDeploymentService();

/**
 * POST /api/multi-platform/deploy
 * Deploy campaign to multiple platforms
 */
router.post('/deploy', async (req, res) => {
  try {
    const {
      campaign_name,
      product_info,
      platforms = ['facebook'],
      budget,
      start_date,
      end_date,
      targeting = {},
      creatives = []
    } = req.body;

    if (!campaign_name || !product_info) {
      return res.status(400).json({
        success: false,
        error: 'campaign_name and product_info are required'
      });
    }

    const result = await deploymentService.deployCampaign({
      campaign_name,
      product_info,
      platforms,
      budget,
      start_date,
      end_date,
      targeting,
      creatives
    });

    res.json(result);
  } catch (error) {
    console.error('Multi-platform deployment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Deployment failed'
    });
  }
});

/**
 * GET /api/multi-platform/metrics
 * Get unified metrics across platforms
 */
router.get('/metrics', async (req, res) => {
  try {
    const {
      campaign_ids, // { facebook: 'xxx', google: 'yyy' }
      start_date,
      end_date
    } = req.query;

    if (!campaign_ids) {
      return res.status(400).json({
        success: false,
        error: 'campaign_ids is required'
      });
    }

    const parsedIds = typeof campaign_ids === 'string'
      ? JSON.parse(campaign_ids)
      : campaign_ids;

    const metrics = await deploymentService.getUnifiedMetrics({
      campaign_ids: parsedIds,
      start_date,
      end_date
    });

    res.json({
      success: true,
      ...metrics
    });
  } catch (error) {
    console.error('Metrics retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve metrics'
    });
  }
});

/**
 * GET /api/multi-platform/platforms
 * Get supported platforms
 */
router.get('/platforms', (req, res) => {
  try {
    const platforms = deploymentService.getSupportedPlatforms();
    const platformDetails = platforms.map(platform => {
      const details = {
        name: platform,
        status: 'available'
      };

      // Add platform-specific info
      if (platform === 'facebook') {
        details.sdk = 'Facebook Business SDK (Official)';
        details.api_version = 'v24.0';
        details.features = ['Campaign creation', 'Multi-page support', 'Insights & metrics'];
      } else if (platform === 'google') {
        details.sdk = 'Google Ads API (Official)';
        details.api_version = 'v15.0.0';
        details.features = ['Campaign management', 'Responsive ads', 'Performance metrics'];
      } else if (platform === 'tiktok') {
        details.sdk = 'TikTok Marketing API (Community)';
        details.api_version = 'v1.3';
        details.features = ['Campaign creation', 'Image upload', 'Campaign insights'];
      }

      return details;
    });

    res.json({
      success: true,
      platforms: platforms,
      platform_details: platformDetails,
      total_platforms: platforms.length
    });
  } catch (error) {
    console.error('Platforms retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get platforms'
    });
  }
});

module.exports = router;

