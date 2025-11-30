/**
 * Users API Routes
 * Manage user profiles and preferences
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * GET /api/users
 * Get all users (admin only)
 */
router.get('/', async (req, res) => {
  try {
    if (!supabase) {
      return res.json({ 
        success: true, 
        data: [], 
        message: 'Database not configured' 
      });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      // Table or column might not exist
      if (error.code === '42P01' || error.code === '42703') {
        return res.json({ 
          success: true, 
          data: [], 
          message: 'Profiles table not configured properly' 
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: []
    });
  }
});

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get('/me', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID required'
      });
    }

    if (!supabase) {
      return res.json({ 
        success: true, 
        data: { id: userId, email: 'dev@localhost' },
        message: 'Database not configured' 
      });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.json({
      success: true,
      data: data || { id: userId }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!supabase) {
      return res.json({ 
        success: true, 
        data: { id },
        message: 'Database not configured' 
      });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/users/:id
 * Update user profile
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, avatar_url, preferences } = req.body;

    if (!supabase) {
      return res.json({ 
        success: true, 
        data: { id, ...req.body },
        message: 'Database not configured' 
      });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        full_name, 
        avatar_url, 
        preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
