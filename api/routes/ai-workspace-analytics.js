/**
 * AI Workspace Analytics API Routes
 * Track and retrieve analytics data
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
 * GET /api/ai-workspace/analytics
 * Get user analytics
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id'];
    const { timeRange = 'month' } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (timeRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startDate = new Date(0);
        break;
    }

    // Get executions
    const { data: executions, error } = await supabase
      .from('agent_executions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist, return empty analytics
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        return res.json({
          success: true,
          analytics: {
            totalMessages: 0,
            totalTokens: 0,
            totalCost: 0,
            avgResponseTime: 0,
            assistantUsage: {},
            messagesPerDay: [],
            costOverTime: [],
          },
          message: 'Analytics table not found. Please run migration first.',
        });
      }
      throw error;
    }

    // Calculate stats
    const totalMessages = executions?.length || 0;
    const totalTokens = executions?.reduce((sum, e) => sum + (e.tokens_used || 0), 0) || 0;
    const totalCost = executions?.reduce((sum, e) => sum + (e.cost_estimate || 0), 0) || 0;
    const avgResponseTime =
      executions?.length > 0
        ? executions.reduce((sum, e) => sum + (e.response_time_ms || 0), 0) / executions.length
        : 0;

    // Assistant usage
    const assistantUsage = {};
    executions?.forEach((e) => {
      const type = e.assistant_type || 'unknown';
      assistantUsage[type] = (assistantUsage[type] || 0) + 1;
    });

    // Messages per day
    const messagesPerDay = {};
    executions?.forEach((e) => {
      const date = new Date(e.created_at).toISOString().split('T')[0];
      messagesPerDay[date] = (messagesPerDay[date] || 0) + 1;
    });

    // Cost over time
    const costOverTime = {};
    executions?.forEach((e) => {
      const date = new Date(e.created_at).toISOString().split('T')[0];
      costOverTime[date] = (costOverTime[date] || 0) + (e.cost_estimate || 0);
    });

    res.json({
      success: true,
      analytics: {
        totalMessages,
        totalTokens,
        totalCost,
        avgResponseTime: Math.round(avgResponseTime),
        assistantUsage,
        messagesPerDay: Object.entries(messagesPerDay).map(([date, count]) => ({ date, count })),
        costOverTime: Object.entries(costOverTime).map(([date, cost]) => ({ date, cost })),
      },
    });
  } catch (error) {
    console.error('[Analytics] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

module.exports = router;

