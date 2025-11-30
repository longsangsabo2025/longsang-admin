/**
 * A/B Testing API Routes
 * 
 * Endpoints for creating and managing A/B tests
 * 
 * @author LongSang Admin
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const abTesting = require('../services/ab-testing');

/**
 * POST /api/ab-testing/create
 * Create a new A/B test
 */
router.post('/create', async (req, res) => {
  try {
    const { name, pageId, topic, variantCount, strategy, duration } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'topic is required',
      });
    }

    const test = await abTesting.createTest({
      name: name || `A/B: ${topic.substring(0, 50)}`,
      pageId: pageId || 'sabo_arena',
      topic,
      variantCount: variantCount || 3,
      strategy: strategy || 'mixed',
      duration: duration || 24,
    });

    res.json({
      success: true,
      test: {
        id: test.id,
        name: test.name,
        status: test.status,
        variantCount: test.variants?.length || 0,
        variants: test.variants?.map(v => ({
          id: v.id,
          name: v.name,
          preview: v.content?.substring(0, 150) + '...',
          imageUrl: v.imageUrl,
        })),
      },
    });
  } catch (error) {
    console.error('❌ Create A/B test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/ab-testing/list
 * List all A/B tests
 */
router.get('/list', async (req, res) => {
  try {
    const { pageId, status, limit } = req.query;

    const tests = await abTesting.getTests(pageId, {
      status,
      limit: parseInt(limit) || 50,
    });

    res.json({
      success: true,
      count: tests.length,
      tests: tests.map(t => ({
        id: t.id,
        name: t.name,
        pageId: t.page_id,
        status: t.status,
        variantCount: t.variants?.length || 0,
        winner: t.winner_variant_id,
        createdAt: t.created_at,
        endsAt: t.ends_at,
      })),
    });
  } catch (error) {
    console.error('❌ List A/B tests error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/ab-testing/:testId
 * Get A/B test details
 */
router.get('/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    const test = await abTesting.getTest(testId);

    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found',
      });
    }

    res.json({
      success: true,
      test,
    });
  } catch (error) {
    console.error('❌ Get A/B test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/ab-testing/:testId/results
 * Get A/B test results and analysis
 */
router.get('/:testId/results', async (req, res) => {
  try {
    const { testId } = req.params;
    const results = await abTesting.analyzeResults(testId);

    res.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('❌ Get A/B results error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/ab-testing/:testId/track
 * Track impression or engagement for a variant
 */
router.post('/:testId/track', async (req, res) => {
  try {
    const { testId } = req.params;
    const { variantId, event, postId } = req.body;

    if (!variantId || !event) {
      return res.status(400).json({
        success: false,
        error: 'variantId and event are required',
      });
    }

    let result;
    if (event === 'impression') {
      result = await abTesting.trackImpression(testId, variantId, postId);
    } else if (event === 'engagement') {
      result = await abTesting.trackEngagement(testId, variantId, req.body.metrics);
    } else {
      return res.status(400).json({
        success: false,
        error: 'event must be "impression" or "engagement"',
      });
    }

    res.json(result);
  } catch (error) {
    console.error('❌ Track A/B event error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/ab-testing/:testId/publish
 * Publish a variant from the test
 */
router.post('/:testId/publish', async (req, res) => {
  try {
    const { testId } = req.params;
    const { variantId } = req.body;

    if (!variantId) {
      return res.status(400).json({
        success: false,
        error: 'variantId is required',
      });
    }

    const result = await abTesting.publishVariant(testId, variantId);
    res.json(result);
  } catch (error) {
    console.error('❌ Publish variant error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/ab-testing/:testId/end
 * End an A/B test and optionally select winner
 */
router.post('/:testId/end', async (req, res) => {
  try {
    const { testId } = req.params;
    const { selectWinner = true } = req.body;

    const result = await abTesting.endTest(testId, { selectWinner });
    res.json(result);
  } catch (error) {
    console.error('❌ End A/B test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/ab-testing/:testId
 * Delete an A/B test
 */
router.delete('/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    const result = await abTesting.deleteTest(testId);
    res.json(result);
  } catch (error) {
    console.error('❌ Delete A/B test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
