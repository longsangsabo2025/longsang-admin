/**
 * Notifications Routes
 * API endpoints for managing brain_notifications
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
 * GET /api/brain/notifications
 * Get all notifications for the user (with filters)
 */
router.get('/', async (req, res) => {
  try {
    const { isRead, type, limit = 50 } = req.query;
    const userId = getUserId(req);

    if (!supabase) throw new Error('Supabase not configured');
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    let query = supabase
      .from('brain_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (isRead !== undefined) {
      query = query.eq('is_read', isRead === 'true');
    }
    if (type) {
      query = query.eq('type', type);
    }

    query = query.limit(parseInt(limit, 10));

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }

    return res.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
     
    console.error('[Notifications Route] Get notifications error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch notifications',
    });
  }
});

/**
 * POST /api/brain/notifications
 * Create a new notification
 */
router.post('/', async (req, res) => {
  try {
    const { type, message, metadata } = req.body;
    const userId = getUserId(req);

    if (!supabase) throw new Error('Supabase not configured');
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    if (!type || !message) {
      return res.status(400).json({
        success: false,
        error: 'type and message are required',
      });
    }

    const { data, error } = await supabase
      .from('brain_notifications')
      .insert({
        user_id: userId,
        type,
        message,
        metadata: metadata || {},
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    return res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
     
    console.error('[Notifications Route] Create notification error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create notification',
    });
  }
});

/**
 * PUT /api/brain/notifications/:id/read
 * Mark a notification as read
 */
router.put('/:id/read', async (req, res) => {
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
      .from('brain_notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
    if (!data) {
      return res.status(404).json({ success: false, error: 'Notification not found or unauthorized' });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
     
    console.error('[Notifications Route] Mark read error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to mark notification as read',
    });
  }
});

/**
 * DELETE /api/brain/notifications/:id
 * Delete a notification
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
      .from('brain_notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
    if (count === 0) {
      return res.status(404).json({ success: false, error: 'Notification not found or unauthorized' });
    }

    return res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
     
    console.error('[Notifications Route] Delete notification error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete notification',
    });
  }
});

module.exports = router;
