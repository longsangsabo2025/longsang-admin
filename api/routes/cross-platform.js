/**
 * Cross-Platform Publisher API Routes
 * 
 * Endpoints for publishing to multiple social platforms
 * 
 * @author LongSang Admin
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const crossPlatformPublisher = require('../services/cross-platform-publisher');
const smartPostComposer = require('../services/smart-post-composer');

/**
 * POST /api/cross-platform/publish
 * Publish to multiple platforms at once
 */
router.post('/publish', async (req, res) => {
  try {
    const { topic, content, imageUrl, platforms, pageId, composeContent } = req.body;

    if (!content && !topic) {
      return res.status(400).json({
        success: false,
        error: 'Either content or topic is required',
      });
    }

    let finalContent = content;
    let finalImageUrl = imageUrl;

    // If only topic provided, compose content first
    if (!content && topic) {
      const composed = await smartPostComposer.composePost(topic, {
        page: pageId || 'sabo_arena',
        includeImage: true,
      });
      finalContent = composed.content;
      finalImageUrl = finalImageUrl || composed.imageUrl;
    }

    const results = await crossPlatformPublisher.publishToAll({
      content: finalContent,
      imageUrl: finalImageUrl,
      platforms: platforms || ['facebook'],
      pageId: pageId || 'sabo_arena',
    });

    res.json({
      success: true,
      publishedTo: results.filter(r => r.success).map(r => r.platform),
      failed: results.filter(r => !r.success).map(r => ({
        platform: r.platform,
        error: r.error,
      })),
      results,
    });
  } catch (error) {
    console.error('❌ Cross-platform publish error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/cross-platform/adapt
 * Adapt content for a specific platform
 */
router.post('/adapt', async (req, res) => {
  try {
    const { content, platform, pageId } = req.body;

    if (!content || !platform) {
      return res.status(400).json({
        success: false,
        error: 'content and platform are required',
      });
    }

    const adapted = await crossPlatformPublisher.adaptContentForPlatform(
      content,
      platform,
      pageId || 'sabo_arena'
    );

    res.json({
      success: true,
      platform,
      originalLength: content.length,
      adaptedLength: adapted.length,
      adapted,
    });
  } catch (error) {
    console.error('❌ Adapt content error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/cross-platform/platforms
 * Get available platforms and their status
 */
router.get('/platforms', async (req, res) => {
  try {
    const platforms = await crossPlatformPublisher.getAvailablePlatforms();
    res.json({
      success: true,
      platforms,
    });
  } catch (error) {
    console.error('❌ Get platforms error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/cross-platform/stats
 * Get cross-platform publishing statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const { pageId, days } = req.query;
    const stats = await crossPlatformPublisher.getPlatformStats(
      pageId,
      parseInt(days) || 30
    );
    res.json({
      success: true,
      ...stats,
    });
  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/cross-platform/preview
 * Preview how content will look on each platform
 */
router.post('/preview', async (req, res) => {
  try {
    const { content, platforms, pageId } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'content is required',
      });
    }

    const targetPlatforms = platforms || ['facebook', 'instagram', 'threads', 'linkedin'];
    const previews = {};

    for (const platform of targetPlatforms) {
      try {
        previews[platform] = await crossPlatformPublisher.adaptContentForPlatform(
          content,
          platform,
          pageId || 'sabo_arena'
        );
      } catch (err) {
        previews[platform] = { error: err.message };
      }
    }

    res.json({
      success: true,
      original: content,
      previews,
    });
  } catch (error) {
    console.error('❌ Preview error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/cross-platform/sync-accounts
 * Sync connected social accounts
 */
router.post('/sync-accounts', async (req, res) => {
  try {
    const result = await crossPlatformPublisher.syncConnectedAccounts();
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('❌ Sync accounts error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/cross-platform/character-limits
 * Get character limits for each platform
 */
router.get('/character-limits', (req, res) => {
  res.json({
    success: true,
    limits: {
      facebook: {
        post: 63206,
        recommended: 250,
        hashtags: 30,
      },
      instagram: {
        caption: 2200,
        recommended: 150,
        hashtags: 30,
      },
      threads: {
        post: 500,
        recommended: 280,
        hashtags: 5,
      },
      linkedin: {
        post: 3000,
        recommended: 200,
        hashtags: 5,
      },
      twitter: {
        post: 280,
        recommended: 240,
        hashtags: 3,
      },
    },
  });
});

module.exports = router;
