/**
 * Tasks Routes
 * API endpoints for managing brain_tasks
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Middleware to get user ID (TODO: Replace with actual auth)
const getUserId = (req) => {
  const userId = req.headers['x-user-id'] || req.headers.authorization;
  return userId || null;
};

/**
 * POST /api/brain/tasks
 * Create a new task
 */
router.post('/', async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, relatedDomainId, relatedSessionId, source, metadata } =
      req.body;
    const userId = getUserId(req);

    if (!supabase) throw new Error('Supabase not configured');
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }
    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Task title is required',
      });
    }

    const { data, error } = await supabase
      .from('brain_tasks')
      .insert({
        user_id: userId,
        title,
        description,
        status: status || 'open',
        priority: priority || 'medium',
        due_date: dueDate,
        related_domain_id: relatedDomainId,
        related_session_id: relatedSessionId,
        source: source || 'manual',
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
     
    console.error('[Tasks Route] Create task error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create task',
    });
  }
});

/**
 * PUT /api/brain/tasks/:id
 * Update an existing task
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, relatedDomainId, relatedSessionId, source, metadata } =
      req.body;
    const userId = getUserId(req);

    if (!supabase) throw new Error('Supabase not configured');
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const updateData = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.due_date = dueDate;
    if (relatedDomainId !== undefined) updateData.related_domain_id = relatedDomainId;
    if (relatedSessionId !== undefined) updateData.related_session_id = relatedSessionId;
    if (source !== undefined) updateData.source = source;
    if (metadata !== undefined) updateData.metadata = metadata;

    const { data, error } = await supabase
      .from('brain_tasks')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update task: ${error.message}`);
    }
    if (!data) {
      return res.status(404).json({ success: false, error: 'Task not found or unauthorized' });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
     
    console.error('[Tasks Route] Update task error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update task',
    });
  }
});

/**
 * DELETE /api/brain/tasks/:id
 * Delete a task
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    if (!supabase) throw new Error('Supabase not configured');
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const { error, count } = await supabase
      .from('brain_tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete task: ${error.message}`);
    }
    if (count === 0) {
      return res.status(404).json({ success: false, error: 'Task not found or unauthorized' });
    }

    return res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
     
    console.error('[Tasks Route] Delete task error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete task',
    });
  }
});

/**
 * GET /api/brain/tasks
 * Get all tasks for the user (with filters)
 */
router.get('/', async (req, res) => {
  try {
    const { status, priority, limit = 50 } = req.query;
    const userId = getUserId(req);

    if (!supabase) throw new Error('Supabase not configured');
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    let query = supabase
      .from('brain_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    query = query.limit(parseInt(limit, 10));

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }

    return res.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
     
    console.error('[Tasks Route] Get tasks error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tasks',
    });
  }
});

/**
 * GET /api/brain/tasks/:id
 * Get a single task by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    if (!supabase) throw new Error('Supabase not configured');
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const { data, error } = await supabase
      .from('brain_tasks')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch task: ${error.message}`);
    }
    if (!data) {
      return res.status(404).json({ success: false, error: 'Task not found or unauthorized' });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
     
    console.error('[Tasks Route] Get single task error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch task',
    });
  }
});

module.exports = router;
