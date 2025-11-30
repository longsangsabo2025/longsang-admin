/**
 * Knowledge Analysis Routes
 * API endpoints for knowledge analysis
 */

const express = require("express");
const router = express.Router();
const knowledgeAnalysisService = require("../services/knowledge-analysis-service");

// Middleware to get user ID (TODO: Replace with actual auth)
const getUserId = (req) => {
  const userId = req.headers["x-user-id"] || req.headers["authorization"];
  return userId || null;
};

/**
 * POST /api/brain/domains/:id/analyze
 * Analyze domain knowledge
 */
router.post("/:id/analyze", async (req, res) => {
  try {
    const { id: domainId } = req.params;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required",
      });
    }

    const analysis = await knowledgeAnalysisService.analyzeDomainKnowledge(domainId, userId);

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("[Knowledge Analysis Route] Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to analyze knowledge",
    });
  }
});

/**
 * GET /api/brain/domains/:id/patterns
 * Get knowledge patterns
 */
router.get("/:id/patterns", async (req, res) => {
  try {
    const { id: domainId } = req.params;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required",
      });
    }

    const patterns = await knowledgeAnalysisService.getKnowledgePatterns(domainId, userId);

    res.json({
      success: true,
      data: patterns,
    });
  } catch (error) {
    console.error("[Knowledge Analysis Route] Patterns error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get patterns",
    });
  }
});

/**
 * GET /api/brain/domains/:id/concepts
 * Get key concepts
 */
router.get("/:id/concepts", async (req, res) => {
  try {
    const { id: domainId } = req.params;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required",
      });
    }

    const concepts = await knowledgeAnalysisService.getKeyConcepts(domainId, userId);

    res.json({
      success: true,
      data: concepts,
    });
  } catch (error) {
    console.error("[Knowledge Analysis Route] Concepts error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get concepts",
    });
  }
});

module.exports = router;

