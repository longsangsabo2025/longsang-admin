/**
 * Domain Statistics Routes
 * API endpoints for domain statistics and analytics
 */

const express = require("express");
const router = express.Router();
const domainStatsService = require("../services/domain-stats-service");

// Middleware to get user ID (TODO: Replace with actual auth)
const getUserId = (req) => {
  const userId = req.headers["x-user-id"] || req.headers["authorization"];
  return userId || null;
};

/**
 * GET /api/brain/domains/:id/stats
 * Get domain statistics
 */
router.get("/:id/stats", async (req, res) => {
  try {
    const { id: domainId } = req.params;
    const { refresh } = req.query;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required",
      });
    }

    const stats = await domainStatsService.getDomainStats(
      domainId,
      userId,
      refresh === "true"
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("[Domain Stats Route] Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get domain statistics",
    });
  }
});

/**
 * GET /api/brain/domains/:id/analytics
 * Get domain analytics (trends and patterns)
 */
router.get("/:id/analytics", async (req, res) => {
  try {
    const { id: domainId } = req.params;
    const { days = 30 } = req.query;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required",
      });
    }

    const analytics = await domainStatsService.getDomainAnalytics(
      domainId,
      userId,
      Number.parseInt(days, 10)
    );

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("[Domain Stats Route] Analytics error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get domain analytics",
    });
  }
});

/**
 * GET /api/brain/domains/:id/trends
 * Get domain trends
 */
router.get("/:id/trends", async (req, res) => {
  try {
    const { id: domainId } = req.params;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required",
      });
    }

    const trends = await domainStatsService.getDomainTrends(domainId, userId);

    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    console.error("[Domain Stats Route] Trends error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get domain trends",
    });
  }
});

module.exports = router;

