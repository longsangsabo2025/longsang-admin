/**
 * Bulk Operations Routes
 * API endpoints for bulk import, export, delete, and update
 */

const express = require("express");
const router = express.Router();
const bulkOperationsService = require("../services/bulk-operations-service");

// Middleware to get user ID (TODO: Replace with actual auth)
const getUserId = (req) => {
  const userId = req.headers["x-user-id"] || req.headers["authorization"];
  return userId || null;
};

/**
 * POST /api/brain/knowledge/bulk-ingest
 * Bulk import knowledge
 */
router.post("/bulk-ingest", async (req, res) => {
  try {
    const { knowledge } = req.body;
    const userId = getUserId(req);

    if (!Array.isArray(knowledge) || knowledge.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Knowledge array is required and must not be empty",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required",
      });
    }

    // Progress tracking (simplified - in production, use WebSocket or SSE)
    const progressCallback = (progress) => {
      // Could emit via WebSocket here
      console.log(`[Bulk Ingest] Progress: ${progress.processed}/${progress.total}`);
    };

    const results = await bulkOperationsService.bulkIngestKnowledge(
      knowledge,
      userId,
      progressCallback
    );

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("[Bulk Operations Route] Bulk ingest error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to bulk ingest knowledge",
    });
  }
});

/**
 * GET /api/brain/domains/:id/export
 * Export domain data
 */
router.get("/domains/:id/export", async (req, res) => {
  try {
    const { id: domainId } = req.params;
    const { format = "json" } = req.query;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required",
      });
    }

    const exportData = await bulkOperationsService.exportDomain(
      domainId,
      userId,
      format
    );

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="domain-${domainId}.csv"`);
      return res.send(exportData);
    }

    res.json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    console.error("[Bulk Operations Route] Export error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to export domain",
    });
  }
});

/**
 * DELETE /api/brain/knowledge/bulk
 * Bulk delete knowledge
 */
router.delete("/bulk", async (req, res) => {
  try {
    const { ids } = req.body;
    const userId = getUserId(req);

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: "IDs array is required and must not be empty",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required",
      });
    }

    const results = await bulkOperationsService.bulkDeleteKnowledge(ids, userId);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("[Bulk Operations Route] Bulk delete error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to bulk delete knowledge",
    });
  }
});

/**
 * PUT /api/brain/knowledge/bulk
 * Bulk update knowledge
 */
router.put("/bulk", async (req, res) => {
  try {
    const { updates } = req.body;
    const userId = getUserId(req);

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Updates array is required and must not be empty",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required",
      });
    }

    const results = await bulkOperationsService.bulkUpdateKnowledge(updates, userId);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("[Bulk Operations Route] Bulk update error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to bulk update knowledge",
    });
  }
});

module.exports = router;

