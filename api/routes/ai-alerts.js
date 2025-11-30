/**
 * 🔔 AI Alerts API
 *
 * Manages intelligent alerts
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const alertDetector = require('../services/alert-detector');

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * GET /api/ai/alerts
 * Get unresolved alerts
 */
router.get('/alerts', async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id'];

    // Get unresolved alerts
    // Service role can read all, so we don't need to filter by user_id
    const { data: alerts, error } = await supabase
      .from('intelligent_alerts')
      .select('*')
      .is('resolved_at', null)
      .order('severity', { ascending: false })
      .order('detected_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({
      success: true,
      alerts: alerts || [],
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/ai/alerts/:id/resolve
 * Resolve an alert
 */
router.post('/alerts/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.headers['x-user-id'];

    const { error } = await supabase
      .from('intelligent_alerts')
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: userId || '00000000-0000-0000-0000-000000000000',
      })
      .eq('id', id)
      .eq('user_id', userId || '00000000-0000-0000-0000-000000000000');

    if (error) throw error;

    res.json({
      success: true,
      message: 'Alert resolved',
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/ai/alerts/detect
 * Manually trigger alert detection
 */
router.post('/alerts/detect', async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id'];
    const alerts = await alertDetector.runDetection(userId);

    res.json({
      success: true,
      detected: alerts.length,
      alerts,
    });
  } catch (error) {
    console.error('Error detecting alerts:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
