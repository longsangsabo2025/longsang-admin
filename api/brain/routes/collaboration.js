/**
 * Collaboration Routes
 * API endpoints for knowledge sharing, comments, and team workspaces
 */

const express = require('express');
const router = express.Router();
const collaborationService = require('../services/collaboration-service');
const { getUserId } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error-handler');

/**
 * POST /api/brain/collaboration/share
 * Share knowledge with another user
 */
router.post(
  '/share',
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID is required', code: 'AUTHENTICATION_REQUIRED' },
      });
    }

    const { knowledgeId, sharedWithUserId, permission } = req.body;

    if (!knowledgeId || !sharedWithUserId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Knowledge ID and shared with user ID are required', code: 'VALIDATION_ERROR' },
      });
    }

    // Verify user owns the knowledge
    const { data: knowledge } = await collaborationService.supabase
      .from('brain_knowledge')
      .select('user_id')
      .eq('id', knowledgeId)
      .single();

    if (!knowledge || knowledge.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'You do not own this knowledge item', code: 'FORBIDDEN' },
      });
    }

    const share = await collaborationService.shareKnowledge(knowledgeId, sharedWithUserId, permission || 'read');

    return res.json({
      success: true,
      data: share,
    });
  })
);

/**
 * GET /api/brain/collaboration/shared
 * Get shared knowledge for the user
 */
router.get(
  '/shared',
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID is required', code: 'AUTHENTICATION_REQUIRED' },
      });
    }

    const shared = await collaborationService.getSharedKnowledge(userId);

    return res.json({
      success: true,
      data: shared,
    });
  })
);

/**
 * POST /api/brain/collaboration/comments
 * Add a comment to knowledge
 */
router.post(
  '/comments',
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID is required', code: 'AUTHENTICATION_REQUIRED' },
      });
    }

    const { knowledgeId, comment, parentCommentId } = req.body;

    if (!knowledgeId || !comment) {
      return res.status(400).json({
        success: false,
        error: { message: 'Knowledge ID and comment are required', code: 'VALIDATION_ERROR' },
      });
    }

    const commentData = await collaborationService.addComment(knowledgeId, userId, comment, parentCommentId || null);

    return res.json({
      success: true,
      data: commentData,
    });
  })
);

/**
 * GET /api/brain/collaboration/comments/:knowledgeId
 * Get comments for a knowledge item
 */
router.get(
  '/comments/:knowledgeId',
  asyncHandler(async (req, res) => {
    const { knowledgeId } = req.params;
    const comments = await collaborationService.getComments(knowledgeId);

    return res.json({
      success: true,
      data: comments,
    });
  })
);

/**
 * POST /api/brain/collaboration/teams
 * Create a team workspace
 */
router.post(
  '/teams',
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID is required', code: 'AUTHENTICATION_REQUIRED' },
      });
    }

    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: { message: 'Team name is required', code: 'VALIDATION_ERROR' },
      });
    }

    const team = await collaborationService.createTeamWorkspace(name, description, userId);

    return res.json({
      success: true,
      data: team,
    });
  })
);

/**
 * GET /api/brain/collaboration/teams
 * Get teams for the user
 */
router.get(
  '/teams',
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID is required', code: 'AUTHENTICATION_REQUIRED' },
      });
    }

    const teams = await collaborationService.getTeams(userId);

    return res.json({
      success: true,
      data: teams,
    });
  })
);

/**
 * POST /api/brain/collaboration/teams/:teamId/members
 * Add a member to a team
 */
router.post(
  '/teams/:teamId/members',
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User ID is required', code: 'AUTHENTICATION_REQUIRED' },
      });
    }

    const { teamId } = req.params;
    const { memberUserId, role } = req.body;

    if (!memberUserId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Member user ID is required', code: 'VALIDATION_ERROR' },
      });
    }

    const member = await collaborationService.addTeamMember(teamId, memberUserId, role || 'member');

    return res.json({
      success: true,
      data: member,
    });
  })
);

module.exports = router;

