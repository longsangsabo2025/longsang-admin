/**
 * Campaign Management Routes
 * List, get, update, delete campaigns
 */

const express = require('express');
const router = express.Router();

// Mock campaigns data (replace with database)
let campaigns = [
  {
    id: 'camp_001',
    name: 'Summer Sale Campaign',
    platforms: ['facebook', 'google'],
    status: 'active',
    budget: 5000,
    spend: 2340.50,
    impressions: 125000,
    clicks: 3420,
    conversions: 89,
    created_at: '2025-01-15T10:00:00Z'
  },
  {
    id: 'camp_002',
    name: 'Product Launch',
    platforms: ['facebook', 'tiktok'],
    status: 'active',
    budget: 3000,
    spend: 1890.25,
    impressions: 98000,
    clicks: 2100,
    conversions: 45,
    created_at: '2025-01-20T14:30:00Z'
  }
];

/**
 * GET /api/campaigns
 * List all campaigns with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const { status, platform, search, page = 1, limit = 20 } = req.query;

    let filtered = [...campaigns];

    // Filter by status
    if (status && status !== 'all') {
      filtered = filtered.filter(c => c.status === status);
    }

    // Filter by platform
    if (platform) {
      filtered = filtered.filter(c => c.platforms.includes(platform));
    }

    // Search by name
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const start = (parseInt(page) - 1) * parseInt(limit);
    const end = start + parseInt(limit);
    const paginated = filtered.slice(start, end);

    res.json({
      success: true,
      campaigns: paginated,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/campaigns/:id
 * Get campaign details
 */
router.get('/:id', async (req, res) => {
  try {
    const campaign = campaigns.find(c => c.id === req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    res.json({
      success: true,
      campaign
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/campaigns/stats/summary
 * Get campaign statistics summary
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
    const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);

    const avgROI = totalSpend > 0
      ? ((totalConversions * 50 - totalSpend) / totalSpend * 100) // Assuming $50 per conversion
      : 0;

    res.json({
      success: true,
      stats: {
        activeCampaigns,
        totalSpend: parseFloat(totalSpend.toFixed(2)),
        totalImpressions,
        totalClicks,
        totalConversions,
        avgROI: parseFloat(avgROI.toFixed(2)),
        avgCTR: totalImpressions > 0
          ? parseFloat((totalClicks / totalImpressions * 100).toFixed(2))
          : 0,
        avgCPA: totalConversions > 0
          ? parseFloat((totalSpend / totalConversions).toFixed(2))
          : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/campaigns/:id/status
 * Update campaign status
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const campaign = campaigns.find(c => c.id === req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    if (!['active', 'paused', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    campaign.status = status;

    res.json({
      success: true,
      campaign
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/campaigns/:id
 * Delete campaign
 */
router.delete('/:id', async (req, res) => {
  try {
    const index = campaigns.findIndex(c => c.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    campaigns.splice(index, 1);

    res.json({
      success: true,
      message: 'Campaign deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

