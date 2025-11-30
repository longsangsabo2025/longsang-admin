/**
 * Multi-Domain Routes
 * API endpoints for multi-domain query routing
 */

const express = require('express');
const router = express.Router();
const multiDomainRouter = require('../services/multi-domain-router');
const advancedRAGService = require('../services/advanced-rag-service');

// Middleware to get user ID (TODO: Replace with actual auth)
const getUserId = (req) => {
  const userId = req.headers['x-user-id'] || req.headers['authorization'];
  return userId || null;
};

/**
 * POST /api/brain/query
 * Query across multiple domains
 */
router.post('/query', async (req, res) => {
  try {
    const { query, domainIds, options } = req.body;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    // Use advanced RAG pipeline
    const result = await advancedRAGService.ragPipeline(query, domainIds, userId, options || {});

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Multi-Domain Route] Query error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process query',
    });
  }
});

/**
 * POST /api/brain/route
 * Route query to domains
 */
router.post('/route', async (req, res) => {
  try {
    const { query, options } = req.body;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    const routing = await multiDomainRouter.routeQuery(query, userId, options || {});

    res.json({
      success: true,
      data: routing,
    });
  } catch (error) {
    console.error('[Multi-Domain Route] Route error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to route query',
    });
  }
});

/**
 * GET /api/brain/domains/relevant
 * Get relevant domains for query
 */
router.get('/domains/relevant', async (req, res) => {
  try {
    const { q: query, maxDomains, minScore } = req.query;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        error: "Query parameter 'q' is required",
      });
    }

    const domains = await multiDomainRouter.selectDomains(query, userId, {
      maxDomains: maxDomains ? Number.parseInt(maxDomains, 10) : 5,
      minScore: minScore ? Number.parseFloat(minScore) : 0.3,
    });

    res.json({
      success: true,
      data: domains,
    });
  } catch (error) {
    console.error('[Multi-Domain Route] Relevant domains error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get relevant domains',
    });
  }
});

/**
 * POST /api/brain/synthesize
 * Synthesize multi-domain response
 */
router.post('/synthesize', async (req, res) => {
  try {
    const { query, domainIds, results, options } = req.body;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    // Combine results if provided
    let combinedResults = results;
    if (!combinedResults && domainIds) {
      // Perform search if results not provided
      combinedResults = await advancedRAGService.hybridSearch(
        query,
        domainIds,
        userId,
        options || {}
      );
    }

    // Extract context and generate response
    const context = await advancedRAGService.extractContext(
      combinedResults || [],
      query,
      options || {}
    );
    const response = await advancedRAGService.generateResponse(context, query, options || {});

    res.json({
      success: true,
      data: {
        query,
        response: response.text,
        context,
        results: combinedResults || [],
        tokensUsed: response.tokensUsed,
      },
    });
  } catch (error) {
    console.error('[Multi-Domain Route] Synthesize error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to synthesize response',
    });
  }
});

/**
 * GET /api/brain/routing/history
 * Get routing history
 */
router.get('/routing/history', async (req, res) => {
  try {
    const { limit } = req.query;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const history = await multiDomainRouter.getRoutingHistory(userId, {
      limit: limit ? Number.parseInt(limit, 10) : 50,
    });

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('[Multi-Domain Route] History error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get routing history',
    });
  }
});

module.exports = router;
