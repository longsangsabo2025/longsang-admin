/**
 * Knowledge Graph Routes
 * API endpoints for knowledge graph operations
 */

const express = require('express');
const router = express.Router();
const knowledgeGraphService = require('../services/knowledge-graph-service');

// Middleware to get user ID (TODO: Replace with actual auth)
const getUserId = (req) => {
  const userId = req.headers['x-user-id'] || req.headers['authorization'];
  return userId || null;
};

/**
 * POST /api/brain/graph/build
 * Build knowledge graph from domain
 */
router.post('/build', async (req, res) => {
  try {
    const { domainId } = req.body;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    if (!domainId) {
      return res.status(400).json({
        success: false,
        error: 'Domain ID is required',
      });
    }

    const result = await knowledgeGraphService.buildGraph(domainId, userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Knowledge Graph Route] Build error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to build graph',
    });
  }
});

/**
 * GET /api/brain/graph/paths
 * Find paths between concepts
 */
router.get('/paths', async (req, res) => {
  try {
    const { sourceNodeId, targetNodeId, maxDepth } = req.query;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    if (!sourceNodeId || !targetNodeId) {
      return res.status(400).json({
        success: false,
        error: 'Both sourceNodeId and targetNodeId are required',
      });
    }

    const paths = await knowledgeGraphService.findPaths(sourceNodeId, targetNodeId, userId, {
      maxDepth: maxDepth ? Number.parseInt(maxDepth, 10) : 5,
    });

    res.json({
      success: true,
      data: paths,
    });
  } catch (error) {
    console.error('[Knowledge Graph Route] Find paths error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to find paths',
    });
  }
});

/**
 * GET /api/brain/graph/related
 * Get related concepts
 */
router.get('/related', async (req, res) => {
  try {
    const { nodeId, maxResults } = req.query;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    if (!nodeId) {
      return res.status(400).json({
        success: false,
        error: 'nodeId is required',
      });
    }

    const concepts = await knowledgeGraphService.getRelatedConcepts(nodeId, userId, {
      maxResults: maxResults ? Number.parseInt(maxResults, 10) : 10,
    });

    res.json({
      success: true,
      data: concepts,
    });
  } catch (error) {
    console.error('[Knowledge Graph Route] Get related error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get related concepts',
    });
  }
});

/**
 * POST /api/brain/graph/traverse
 * Traverse graph from a node
 */
router.post('/traverse', async (req, res) => {
  try {
    const { startNodeId, maxDepth } = req.body;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    if (!startNodeId) {
      return res.status(400).json({
        success: false,
        error: 'startNodeId is required',
      });
    }

    const traversal = await knowledgeGraphService.traverseGraph(startNodeId, userId, {
      maxDepth: maxDepth || 3,
    });

    res.json({
      success: true,
      data: traversal,
    });
  } catch (error) {
    console.error('[Knowledge Graph Route] Traverse error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to traverse graph',
    });
  }
});

/**
 * GET /api/brain/graph/statistics
 * Get graph statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const { domainId } = req.query;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const statistics = await knowledgeGraphService.getGraphStatistics(domainId, userId);

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error('[Knowledge Graph Route] Statistics error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get statistics',
    });
  }
});

module.exports = router;
