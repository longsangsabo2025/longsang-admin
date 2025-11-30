/**
 * Master Brain Routes
 * API endpoints for Master Brain orchestrator
 */

const express = require('express');
const router = express.Router();
const masterBrainOrchestrator = require('../services/master-brain-orchestrator');

// Middleware to get user ID (TODO: Replace with actual auth)
const getUserId = (req) => {
  const userId = req.headers['x-user-id'] || req.headers['authorization'];
  return userId || null;
};

/**
 * POST /api/brain/master/query
 * Master brain query
 */
router.post('/query', async (req, res) => {
  try {
    const { query, options } = req.body;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    const result = await masterBrainOrchestrator.orchestrateQuery(query, userId, options || {});

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Master Brain Route] Query error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to orchestrate query',
    });
  }
});

/**
 * POST /api/brain/master/session
 * Create new session
 */
router.post('/session', async (req, res) => {
  try {
    const { sessionName, domainIds, options } = req.body;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    if (!sessionName) {
      return res.status(400).json({
        success: false,
        error: 'Session name is required',
      });
    }

    if (!domainIds || !Array.isArray(domainIds) || domainIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Domain IDs array is required',
      });
    }

    const sessionId = await masterBrainOrchestrator.createSession(
      sessionName,
      domainIds,
      userId,
      options || {}
    );

    res.json({
      success: true,
      data: { sessionId },
    });
  } catch (error) {
    console.error('[Master Brain Route] Create session error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create session',
    });
  }
});

/**
 * GET /api/brain/master/session/:id
 * Get session state
 */
router.get('/session/:id', async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const state = await masterBrainOrchestrator.getSessionState(sessionId, userId);

    res.json({
      success: true,
      data: state,
    });
  } catch (error) {
    console.error('[Master Brain Route] Get session error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get session',
    });
  }
});

/**
 * POST /api/brain/master/session/:id/end
 * End session
 */
router.post('/session/:id/end', async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const { rating, feedback } = req.body;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const { createClient } = require('@supabase/supabase-js');
    require('dotenv').config();

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY;

    const supabase =
      supabaseUrl && supabaseKey
        ? require('@supabase/supabase-js').createClient(supabaseUrl, supabaseKey)
        : null;

    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase.rpc('end_master_session', {
      p_session_id: sessionId,
      p_rating: rating,
      p_feedback: feedback,
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`Failed to end session: ${error.message}`);
    }

    res.json({
      success: true,
      message: 'Session ended successfully',
    });
  } catch (error) {
    console.error('[Master Brain Route] End session error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to end session',
    });
  }
});

/**
 * GET /api/brain/master/sessions
 * Get all Master Brain sessions
 */
router.get('/sessions', async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const { createClient } = require('@supabase/supabase-js');
    require('dotenv').config();

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY;

    const supabase =
      supabaseUrl && supabaseKey
        ? require('@supabase/supabase-js').createClient(supabaseUrl, supabaseKey)
        : null;

    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data: sessions, error } = await supabase
      .from('brain_master_session')
      .select('*')
      .eq('user_id', userId)
      .order('last_activity_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get sessions: ${error.message}`);
    }

    res.json({
      success: true,
      data: sessions || [],
    });
  } catch (error) {
    console.error('[Master Brain Route] Get sessions error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get sessions',
    });
  }
});

/**
 * POST /api/brain/master/context
 * Update orchestration context (internal use)
 */
router.post('/context', async (req, res) => {
  try {
    const { sessionId, step, progress, gatheredContext, analysisResults, synthesisData } = req.body;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
    }

    const { createClient } = require('@supabase/supabase-js');
    require('dotenv').config();

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY;

    const supabase =
      supabaseUrl && supabaseKey
        ? require('@supabase/supabase-js').createClient(supabaseUrl, supabaseKey)
        : null;

    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase.rpc('update_orchestration_state', {
      p_session_id: sessionId,
      p_current_step: step,
      p_step_progress: progress,
      p_gathered_context: gatheredContext,
      p_analysis_results: analysisResults,
      p_synthesis_data: synthesisData,
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`Failed to update context: ${error.message}`);
    }

    res.json({
      success: true,
      message: 'Context updated successfully',
    });
  } catch (error) {
    console.error('[Master Brain Route] Update context error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update context',
    });
  }
});

module.exports = router;
