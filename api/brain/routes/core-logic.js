/**
 * Core Logic Routes
 * API endpoints for core logic distillation and management
 */

const express = require("express");
const router = express.Router();
const coreLogicService = require("../services/core-logic-service");

// Middleware to get user ID (TODO: Replace with actual auth)
const getUserId = (req) => {
  const userId = req.headers["x-user-id"] || req.headers["authorization"];
  return userId || null;
};

/**
 * POST /api/brain/domains/:id/core-logic/distill
 * Trigger core logic distillation
 */
router.post("/:id/core-logic/distill", async (req, res) => {
  try {
    const { id: domainId } = req.params;
    const { options = {} } = req.body;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required",
      });
    }

    const result = await coreLogicService.distillCoreLogic(domainId, userId, options);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[Core Logic Route] Distill error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to distill core logic",
    });
  }
});

/**
 * GET /api/brain/domains/:id/core-logic
 * Get core logic for domain
 */
router.get("/:id/core-logic", async (req, res) => {
  try {
    const { id: domainId } = req.params;
    const { version } = req.query;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required",
      });
    }

    const coreLogic = await coreLogicService.getCoreLogic(
      domainId,
      userId,
      version ? Number.parseInt(version, 10) : null
    );

    if (!coreLogic) {
      return res.status(404).json({
        success: false,
        error: "Core logic not found",
      });
    }

    res.json({
      success: true,
      data: coreLogic,
    });
  } catch (error) {
    console.error("[Core Logic Route] Get error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get core logic",
    });
  }
});

/**
 * GET /api/brain/domains/:id/core-logic/versions
 * Get all versions for domain
 */
router.get("/:id/core-logic/versions", async (req, res) => {
  try {
    const { id: domainId } = req.params;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required",
      });
    }

    const versions = await coreLogicService.getCoreLogicVersions(domainId, userId);

    res.json({
      success: true,
      data: versions,
    });
  } catch (error) {
    console.error("[Core Logic Route] Versions error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get versions",
    });
  }
});

/**
 * POST /api/brain/domains/:id/core-logic/compare
 * Compare two versions
 */
router.post("/:id/core-logic/compare", async (req, res) => {
  try {
    const { version1Id, version2Id } = req.body;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required",
      });
    }

    if (!version1Id || !version2Id) {
      return res.status(400).json({
        success: false,
        error: "Both version1Id and version2Id are required",
      });
    }

    const comparison = await coreLogicService.compareVersions(version1Id, version2Id, userId);

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    console.error("[Core Logic Route] Compare error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to compare versions",
    });
  }
});

/**
 * POST /api/brain/domains/:id/core-logic/rollback
 * Rollback to previous version
 */
router.post("/:id/core-logic/rollback", async (req, res) => {
  try {
    const { id: domainId } = req.params;
    const { targetVersion, reason } = req.body;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required",
      });
    }

    if (!targetVersion) {
      return res.status(400).json({
        success: false,
        error: "targetVersion is required",
      });
    }

    const newVersion = await coreLogicService.rollbackVersion(
      domainId,
      targetVersion,
      userId,
      reason
    );

    res.json({
      success: true,
      data: newVersion,
    });
  } catch (error) {
    console.error("[Core Logic Route] Rollback error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to rollback version",
    });
  }
});

module.exports = router;

