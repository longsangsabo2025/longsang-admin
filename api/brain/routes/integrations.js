/**
 * Integrations Routes
 * API endpoints for external integrations
 */

const express = require('express');
const router = express.Router();
const integrationService = require('../services/integration-service');
const { getUserId } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error-handler');

/**
 * POST /api/brain/integrations
 * Create or update integration
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID is required', code: 'AUTHENTICATION_REQUIRED' },
      });
    }

    const { integrationType, config, isActive } = req.body;

    if (!integrationType) {
      return res.status(400).json({
        success: false,
        error: { message: 'Integration type is required', code: 'VALIDATION_ERROR' },
      });
    }

    // Check if integration exists
    const { data: existing } = await integrationService.supabase
      .from('brain_integrations')
      .select('id')
      .eq('user_id', userId)
      .eq('integration_type', integrationType)
      .single();

    let integration;
    if (existing) {
      // Update existing
      const { data, error } = await integrationService.supabase
        .from('brain_integrations')
        .update({
          config: config || {},
          is_active: isActive !== undefined ? isActive : true,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw new Error(`Failed to update integration: ${error.message}`);
      integration = data;
    } else {
      // Create new
      const { data, error } = await integrationService.supabase
        .from('brain_integrations')
        .insert({
          user_id: userId,
          integration_type: integrationType,
          config: config || {},
          is_active: isActive !== undefined ? isActive : true,
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to create integration: ${error.message}`);
      integration = data;
    }

    return res.json({
      success: true,
      data: integration,
    });
  })
);

/**
 * GET /api/brain/integrations
 * List user's integrations
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID is required', code: 'AUTHENTICATION_REQUIRED' },
      });
    }

    const { data, error } = await integrationService.supabase
      .from('brain_integrations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to get integrations: ${error.message}`);

    return res.json({
      success: true,
      data: data || [],
    });
  })
);

/**
 * PUT /api/brain/integrations/:id
 * Update integration
 */
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID is required', code: 'AUTHENTICATION_REQUIRED' },
      });
    }

    const { id } = req.params;
    const { config, isActive } = req.body;

    const { data, error } = await integrationService.supabase
      .from('brain_integrations')
      .update({
        config: config !== undefined ? config : undefined,
        is_active: isActive !== undefined ? isActive : undefined,
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update integration: ${error.message}`);

    return res.json({
      success: true,
      data,
    });
  })
);

/**
 * DELETE /api/brain/integrations/:id
 * Delete integration
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID is required', code: 'AUTHENTICATION_REQUIRED' },
      });
    }

    const { id } = req.params;

    const { error } = await integrationService.supabase
      .from('brain_integrations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to delete integration: ${error.message}`);

    return res.json({
      success: true,
      message: 'Integration deleted successfully',
    });
  })
);

/**
 * POST /api/brain/integrations/slack/test
 * Test Slack integration
 */
router.post(
  '/slack/test',
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID is required', code: 'AUTHENTICATION_REQUIRED' },
      });
    }

    const result = await integrationService.sendSlackNotification(userId, 'Test notification from AI Second Brain');

    return res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * POST /api/brain/integrations/import/notion
 * Import from Notion
 */
router.post(
  '/import/notion',
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID is required', code: 'AUTHENTICATION_REQUIRED' },
      });
    }

    const { notionData } = req.body;
    const result = await integrationService.importFromNotion(userId, notionData);

    return res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * GET /api/brain/integrations/export/:knowledgeId/markdown
 * Export knowledge to Markdown
 */
router.get(
  '/export/:knowledgeId/markdown',
  asyncHandler(async (req, res) => {
    const { knowledgeId } = req.params;
    const result = await integrationService.exportToMarkdown(knowledgeId);

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.content);
  })
);

/**
 * GET /api/brain/integrations/export/:knowledgeId/pdf
 * Export knowledge to PDF
 */
router.get(
  '/export/:knowledgeId/pdf',
  asyncHandler(async (req, res) => {
    const { knowledgeId } = req.params;
    const result = await integrationService.exportToPDF(knowledgeId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.content);
  })
);

module.exports = router;

