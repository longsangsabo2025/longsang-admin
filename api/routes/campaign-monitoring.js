/**
 * Campaign Monitoring API Routes
 * Phase 3: Real-time campaign monitoring
 */

const express = require('express');
const router = express.Router();
const CampaignMonitoringService = require('../services/campaign-monitoring-service');

const monitoringService = new CampaignMonitoringService();

/**
 * POST /api/campaign-monitoring/start
 * Start monitoring a campaign
 */
router.post('/start', async (req, res) => {
  try {
    const {
      campaign_id,
      platforms = ['facebook'],
      update_interval = 30000,
      metrics = ['impressions', 'clicks', 'spend', 'conversions']
    } = req.body;

    if (!campaign_id) {
      return res.status(400).json({
        success: false,
        error: 'campaign_id is required'
      });
    }

    const result = await monitoringService.startMonitoring({
      campaign_id,
      platforms,
      update_interval,
      metrics
    });

    res.json(result);
  } catch (error) {
    console.error('Campaign monitoring start error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start monitoring'
    });
  }
});

/**
 * POST /api/campaign-monitoring/stop
 * Stop monitoring a campaign
 */
router.post('/stop', (req, res) => {
  try {
    const { campaign_id } = req.body;

    if (!campaign_id) {
      return res.status(400).json({
        success: false,
        error: 'campaign_id is required'
      });
    }

    const result = monitoringService.stopMonitoring(campaign_id);

    res.json(result);
  } catch (error) {
    console.error('Campaign monitoring stop error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to stop monitoring'
    });
  }
});

/**
 * GET /api/campaign-monitoring/metrics/:campaign_id
 * Get latest metrics for a campaign
 */
router.get('/metrics/:campaign_id', (req, res) => {
  try {
    const { campaign_id } = req.params;
    const metrics = monitoringService.getLatestMetrics(campaign_id);

    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not being monitored or no metrics available'
      });
    }

    res.json({
      success: true,
      ...metrics
    });
  } catch (error) {
    console.error('Metrics retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get metrics'
    });
  }
});

/**
 * GET /api/campaign-monitoring/status
 * Get monitoring status
 */
router.get('/status', (req, res) => {
  try {
    const status = monitoringService.getStatus();
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('Status retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get status'
    });
  }
});

module.exports = router;

