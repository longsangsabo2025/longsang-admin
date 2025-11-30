/**
 * Domain Agent Routes
 * API endpoints for domain-specific AI agents
 */

const express = require("express");
const router = express.Router();
const domainAgentService = require("../services/domain-agent-service");

// Middleware to get user ID (TODO: Replace with actual auth)
const getUserId = (req) => {
  // Try to get from header first
  const userId = req.headers["x-user-id"] || req.headers["authorization"];
  if (userId) return userId;

  // Fallback: return null (will be handled by service)
  return null;
};

/**
 * POST /api/brain/domains/:id/query
 * Query domain agent
 */
router.post("/:id/query", async (req, res) => {
  try {
    const { id: domainId } = req.params;
    const { question } = req.body;
    const userId = getUserId(req);

    if (!question || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Question is required",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required",
      });
    }

    const result = await domainAgentService.queryDomainAgent(question, domainId, userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[Domain Agent Route] Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to query domain agent",
    });
  }
});

/**
 * POST /api/brain/domains/:id/auto-tag
 * Auto-tag knowledge based on domain rules
 */
router.post("/:id/auto-tag", async (req, res) => {
  try {
    const { id: domainId } = req.params;
    const { knowledge } = req.body;
    const userId = getUserId(req);

    if (!knowledge) {
      return res.status(400).json({
        success: false,
        error: "Knowledge object is required",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required",
      });
    }

    const tags = await domainAgentService.autoTagKnowledge(knowledge, domainId, userId);

    res.json({
      success: true,
      data: { tags },
    });
  } catch (error) {
    console.error("[Domain Agent Route] Auto-tag error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to auto-tag knowledge",
    });
  }
});

/**
 * GET /api/brain/domains/:id/suggestions
 * Get domain-specific suggestions
 */
router.get("/:id/suggestions", async (req, res) => {
  try {
    const { id: domainId } = req.params;
    const { limit = 5 } = req.query;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required",
      });
    }

    const suggestions = await domainAgentService.getDomainSuggestions(
      domainId,
      userId,
      Number.parseInt(limit, 10)
    );

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error("[Domain Agent Route] Suggestions error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get suggestions",
    });
  }
});

/**
 * POST /api/brain/domains/:id/summarize
 * Generate domain summary
 */
router.post("/:id/summarize", async (req, res) => {
  try {
    const { id: domainId } = req.params;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required",
      });
    }

    const summary = await domainAgentService.generateDomainSummary(domainId, userId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("[Domain Agent Route] Summarize error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate summary",
    });
  }
});

module.exports = router;

