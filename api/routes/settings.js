/**
 * User Settings API Routes
 * Save/Load AI settings to/from Supabase database
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { getAPIKeys } = require('../services/ai-workspace/env-loader');

const keys = getAPIKeys();
const supabase = createClient(
  keys.supabaseUrl,
  keys.supabaseServiceKey || keys.supabaseAnonKey
);

/**
 * GET /api/settings/:key
 * Get user settings by key
 */
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const userId = req.user?.id || req.headers['x-user-id'] || 'default-longsang-user';

    const { data, error } = await supabase
      .from('user_settings')
      .select('settings_value, updated_at')
      .eq('user_id', userId)
      .eq('settings_key', key)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (not an error)
      throw error;
    }

    res.json({
      success: true,
      data: data?.settings_value || null,
      updatedAt: data?.updated_at || null,
      source: data ? 'database' : 'default',
    });
  } catch (error) {
    console.error('[Settings] Error getting settings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get settings',
    });
  }
});

/**
 * PUT /api/settings/:key
 * Save user settings by key (upsert)
 */
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const userId = req.user?.id || req.headers['x-user-id'] || 'default-longsang-user';

    if (!value) {
      return res.status(400).json({
        success: false,
        error: 'Settings value is required',
      });
    }

    // Upsert: Insert or update
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        settings_key: key,
        settings_value: value,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,settings_key',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log(`[Settings] Saved settings for user ${userId}, key: ${key}`);

    res.json({
      success: true,
      message: 'Settings saved successfully',
      data: data?.settings_value,
      updatedAt: data?.updated_at,
    });
  } catch (error) {
    console.error('[Settings] Error saving settings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save settings',
    });
  }
});

/**
 * DELETE /api/settings/:key
 * Delete user settings by key (reset to defaults)
 */
router.delete('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const userId = req.user?.id || req.headers['x-user-id'] || 'default-longsang-user';

    const { error } = await supabase
      .from('user_settings')
      .delete()
      .eq('user_id', userId)
      .eq('settings_key', key);

    if (error) {
      throw error;
    }

    console.log(`[Settings] Deleted settings for user ${userId}, key: ${key}`);

    res.json({
      success: true,
      message: 'Settings reset to defaults',
    });
  } catch (error) {
    console.error('[Settings] Error deleting settings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reset settings',
    });
  }
});

/**
 * GET /api/settings
 * Get all user settings
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id'] || 'default-longsang-user';

    const { data, error } = await supabase
      .from('user_settings')
      .select('settings_key, settings_value, updated_at')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    // Convert array to object keyed by settings_key
    const settings = {};
    (data || []).forEach(item => {
      settings[item.settings_key] = {
        value: item.settings_value,
        updatedAt: item.updated_at,
      };
    });

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('[Settings] Error getting all settings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get settings',
    });
  }
});

module.exports = router;
