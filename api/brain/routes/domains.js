/**
 * Domain Management API Routes
 * Handles CRUD operations for brain domains
 */

const express = require("express");
const router = express.Router();
const brainService = require("../services/brain-service");

/**
 * GET /api/brain/domains
 * Get all domains for the authenticated user
 */
router.get("/", async (req, res) => {
  try {
    // Get user ID from request (should be set by auth middleware)
    // For now, we'll get it from query or body, but in production use proper auth
    const userId = req.user?.id || req.query.userId || req.body.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required. Please authenticate.",
      });
    }

    const domains = await brainService.getDomains(userId);

    res.json({
      success: true,
      data: domains,
      count: domains.length,
    });
  } catch (error) {
    console.error("[Domains API] Error getting domains:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get domains",
    });
  }
});

/**
 * GET /api/brain/domains/:id
 * Get a specific domain by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.query.userId || req.body.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required. Please authenticate.",
      });
    }

    const domain = await brainService.getDomainById(id, userId);

    if (!domain) {
      return res.status(404).json({
        success: false,
        error: "Domain not found",
      });
    }

    res.json({
      success: true,
      data: domain,
    });
  } catch (error) {
    console.error("[Domains API] Error getting domain:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get domain",
    });
  }
});

/**
 * POST /api/brain/domains
 * Create a new domain
 */
router.post("/", async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required. Please authenticate.",
      });
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Domain name is required",
      });
    }

    const domain = await brainService.createDomain({ name, description, color, icon }, userId);

    res.status(201).json({
      success: true,
      data: domain,
    });
  } catch (error) {
    console.error("[Domains API] Error creating domain:", error);

    // Handle duplicate name error
    if (error.message.includes("already exists")) {
      return res.status(409).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Failed to create domain",
    });
  }
});

/**
 * PUT /api/brain/domains/:id
 * Update a domain
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, icon } = req.body;
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required. Please authenticate.",
      });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (color !== undefined) updates.color = color;
    if (icon !== undefined) updates.icon = icon;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: "No fields to update",
      });
    }

    const domain = await brainService.updateDomain(id, updates, userId);

    res.json({
      success: true,
      data: domain,
    });
  } catch (error) {
    console.error("[Domains API] Error updating domain:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Failed to update domain",
    });
  }
});

/**
 * DELETE /api/brain/domains/:id
 * Delete a domain
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.query.userId || req.body.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required. Please authenticate.",
      });
    }

    await brainService.deleteDomain(id, userId);

    res.json({
      success: true,
      message: "Domain deleted successfully",
    });
  } catch (error) {
    console.error("[Domains API] Error deleting domain:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete domain",
    });
  }
});

module.exports = router;
