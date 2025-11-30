/**
 * 🔍 Context Retrieval API Routes
 *
 * API endpoints for retrieving relevant context using semantic search
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const contextRetrieval = require('../services/context-retrieval');

/**
 * GET /api/context/search?q=query
 * Search for relevant context (GET version)
 */
router.get('/search', async (req, res) => {
  try {
    const { q: query, entityType, projectId, similarityThreshold, maxResults, useCache } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
      });
    }

    // Convert query string params to proper types
    const options = {
      entityType: entityType || null,
      projectId: projectId || null,
      similarityThreshold: similarityThreshold ? parseFloat(similarityThreshold) : 0.7,
      maxResults: maxResults ? parseInt(maxResults, 10) : 5,
      useCache: useCache !== 'false', // Default to true
    };

    const context = await contextRetrieval.retrieveContext(query, options);
    
    res.json({
      success: true,
      context,
    });
  } catch (error) {
    console.error('Error in context search (GET):', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search context',
    });
  }
});

/**
 * POST /api/context/search
 * Search for relevant context
 */
router.post('/search', async (req, res) => {
  try {
    const { query, entityType, projectId, similarityThreshold, maxResults, useCache } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query is required and must be a string',
      });
    }

    const context = await contextRetrieval.retrieveContext(query, {
      entityType: entityType || null,
      projectId: projectId || null,
      similarityThreshold: similarityThreshold || 0.7,
      maxResults: maxResults || 10,
      useCache: useCache !== false, // Default true
    });

    res.json({
      success: true,
      context,
    });
  } catch (error) {
    console.error('Error in context search:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve context',
    });
  }
});

/**
 * POST /api/context/search/enhanced
 * Search with enhanced context (includes business context)
 */
router.post('/search/enhanced', async (req, res) => {
  try {
    const { query, entityType, projectId, similarityThreshold, maxResults, useCache } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query is required and must be a string',
      });
    }

    const context = await contextRetrieval.retrieveEnhancedContext(query, {
      entityType: entityType || null,
      projectId: projectId || null,
      similarityThreshold: similarityThreshold || 0.7,
      maxResults: maxResults || 10,
      useCache: useCache !== false,
    });

    res.json({
      success: true,
      context,
    });
  } catch (error) {
    console.error('Error in enhanced context search:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve enhanced context',
    });
  }
});

/**
 * POST /api/context/search/batch
 * Batch search for multiple queries
 */
router.post('/search/batch', async (req, res) => {
  try {
    const { queries, options } = req.body;

    if (!Array.isArray(queries) || queries.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Queries must be a non-empty array',
      });
    }

    const results = await contextRetrieval.retrieveContextBatch(queries, options || {});

    res.json({
      success: true,
      results,
      total: results.length,
    });
  } catch (error) {
    console.error('Error in batch context search:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve batch context',
    });
  }
});

/**
 * GET /api/context/cache/stats
 * Get cache statistics
 */
router.get('/cache/stats', (req, res) => {
  try {
    const stats = contextRetrieval.getCacheStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get cache stats',
    });
  }
});

/**
 * POST /api/context/cache/clear
 * Clear cache
 */
router.post('/cache/clear', (req, res) => {
  try {
    contextRetrieval.clearCache();

    res.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clear cache',
    });
  }
});

module.exports = router;


