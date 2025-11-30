/**
 * Knowledge Management API Routes
 * Handles knowledge ingestion and search operations
 */

const express = require("express");
const router = express.Router();
const brainService = require("../services/brain-service");

/**
 * POST /api/brain/knowledge/ingest
 * Add new knowledge to the brain
 */
router.post("/ingest", async (req, res) => {
  try {
    const {
      domainId,
      title,
      content,
      contentType = "document",
      tags = [],
      sourceUrl = null,
      sourceFile = null,
      metadata = {},
    } = req.body;

    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required. Please authenticate.",
      });
    }

    // Validate required fields
    if (!domainId) {
      return res.status(400).json({
        success: false,
        error: "domainId is required",
      });
    }

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "title is required",
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "content is required",
      });
    }

    const knowledge = await brainService.ingestKnowledge(
      {
        domainId,
        title: title.trim(),
        content: content.trim(),
        contentType,
        tags: Array.isArray(tags) ? tags : [],
        sourceUrl,
        sourceFile,
        metadata,
      },
      userId
    );

    res.status(201).json({
      success: true,
      data: knowledge,
    });
  } catch (error) {
    console.error("[Knowledge API] Error ingesting knowledge:", error);

    // Handle specific errors
    if (error.message.includes("not configured")) {
      return res.status(503).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Failed to ingest knowledge",
    });
  }
});

/**
 * GET /api/brain/knowledge/search
 * Search knowledge using vector similarity
 */
router.get("/search", async (req, res) => {
  try {
    const { q, domainId, domainIds, matchThreshold, matchCount } = req.query;
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required. Please authenticate.",
      });
    }

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Query parameter 'q' is required",
      });
    }

    // Build domain IDs array
    let domainIdsArray = null;
    if (domainId) {
      domainIdsArray = [domainId];
    } else if (domainIds) {
      // Support comma-separated domain IDs
      domainIdsArray = Array.isArray(domainIds)
        ? domainIds
        : domainIds.split(",").map((id) => id.trim());
    }

    // Parse options
    const options = {
      domainIds: domainIdsArray,
      matchThreshold: matchThreshold ? Number.parseFloat(matchThreshold) : 0.7,
      matchCount: matchCount ? Number.parseInt(matchCount, 10) : 10,
    };

    // Validate options
    if (options.matchThreshold < 0 || options.matchThreshold > 1) {
      return res.status(400).json({
        success: false,
        error: "matchThreshold must be between 0 and 1",
      });
    }

    if (options.matchCount < 1 || options.matchCount > 100) {
      return res.status(400).json({
        success: false,
        error: "matchCount must be between 1 and 100",
      });
    }

    const results = await brainService.searchKnowledge(q.trim(), options, userId);

    res.json({
      success: true,
      data: results,
      count: results.length,
      query: q,
      options,
    });
  } catch (error) {
    console.error("[Knowledge API] Error searching knowledge:", error);

    if (error.message.includes("not configured")) {
      return res.status(503).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Failed to search knowledge",
    });
  }
});

/**
 * GET /api/brain/knowledge
 * List all knowledge items for a user (with optional filtering)
 */
router.get("/", async (req, res) => {
  try {
    const { domainId, contentType, tag, limit = 50, offset = 0, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
    const userId = req.user?.id || req.query.userId || req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required. Please authenticate.",
      });
    }

    const supabase = require('../services/brain-service').getSupabase();
    
    // Build query
    let query = supabase
      .from('brain_knowledge')
      .select('id, domain_id, title, content, content_type, tags, source_url, metadata, created_at, updated_at', { count: 'exact' })
      .eq('user_id', userId);

    // Apply filters
    if (domainId) {
      query = query.eq('domain_id', domainId);
    }
    if (contentType) {
      query = query.eq('content_type', contentType);
    }
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    // Apply sorting
    const validSortFields = ['created_at', 'updated_at', 'title'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const limitNum = Math.min(Math.max(1, parseInt(limit)), 100);
    const offsetNum = Math.max(0, parseInt(offset));
    query = query.range(offsetNum, offsetNum + limitNum - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[Knowledge API] Error listing knowledge:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    // Transform to camelCase
    const transformedData = data.map(item => ({
      id: item.id,
      domainId: item.domain_id,
      title: item.title,
      content: item.content,
      contentType: item.content_type,
      tags: item.tags || [],
      sourceUrl: item.source_url,
      metadata: item.metadata || {},
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    res.json({
      success: true,
      data: transformedData,
      count: transformedData.length,
      total: count,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < count,
      },
    });
  } catch (error) {
    console.error("[Knowledge API] Error listing knowledge:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to list knowledge",
    });
  }
});

/**
 * PUT /api/brain/knowledge/:id
 * Update a knowledge item
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, contentType, tags, metadata } = req.body;
    const userId = req.user?.id || req.body.userId || req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required. Please authenticate.",
      });
    }

    const supabase = require('../services/brain-service').getSupabase();

    // Build update object
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (contentType !== undefined) updateData.content_type = contentType;
    if (tags !== undefined) updateData.tags = tags;
    if (metadata !== undefined) updateData.metadata = metadata;
    updateData.updated_at = new Date().toISOString();

    // If content changed, regenerate embedding
    if (content !== undefined) {
      try {
        const brainService = require('../services/brain-service');
        const embedding = await brainService.generateEmbedding(`${title || ''}\n\n${content}`);
        if (embedding) {
          updateData.embedding = embedding;
        }
      } catch (embError) {
        console.warn('[Knowledge API] Failed to regenerate embedding:', embError.message);
      }
    }

    const { data, error } = await supabase
      .from('brain_knowledge')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[Knowledge API] Error updating knowledge:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: "Knowledge not found or access denied",
      });
    }

    res.json({
      success: true,
      data: {
        id: data.id,
        domainId: data.domain_id,
        title: data.title,
        content: data.content,
        contentType: data.content_type,
        tags: data.tags || [],
        metadata: data.metadata || {},
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    console.error("[Knowledge API] Error updating knowledge:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update knowledge",
    });
  }
});

/**
 * DELETE /api/brain/knowledge/:id
 * Delete a knowledge item
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.query.userId || req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required. Please authenticate.",
      });
    }

    const supabase = require('../services/brain-service').getSupabase();

    const { data, error } = await supabase
      .from('brain_knowledge')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')
      .single();

    if (error) {
      console.error('[Knowledge API] Error deleting knowledge:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: "Knowledge not found or access denied",
      });
    }

    res.json({
      success: true,
      message: "Knowledge deleted successfully",
      deletedId: id,
    });
  } catch (error) {
    console.error("[Knowledge API] Error deleting knowledge:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete knowledge",
    });
  }
});

/**
 * GET /api/brain/knowledge/:id
 * Get a specific knowledge item by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const retrievalService = require("../services/retrieval-service");
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID is required. Please authenticate.",
      });
    }

    const knowledge = await retrievalService.getKnowledgeById(id);

    if (!knowledge) {
      return res.status(404).json({
        success: false,
        error: "Knowledge not found",
      });
    }

    // Note: RLS will handle user isolation, but we can add explicit check if needed

    res.json({
      success: true,
      data: knowledge,
    });
  } catch (error) {
    console.error("[Knowledge API] Error getting knowledge:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get knowledge",
    });
  }
});

module.exports = router;
