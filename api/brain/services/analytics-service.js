/**
 * Analytics Service
 * Track events, analyze user behavior, and generate metrics
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Track analytics event
 */
async function trackEvent(userId, eventType, eventData = {}, metadata = {}) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('brain_analytics_events')
    .insert({
      user_id: userId,
      event_type: eventType,
      event_data: eventData,
      metadata,
      timestamp: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[Analytics Service] Error tracking event:', error);
    // Don't throw - analytics should not break the main flow
    return null;
  }

  return data;
}

/**
 * Get user behavior analytics
 */
async function getUserBehaviorAnalytics(userId, timeRange = { hours: 24 }) {
  if (!supabase) throw new Error('Supabase not configured');

  const endDate = new Date();
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - (timeRange.hours || 24));

  const { data, error } = await supabase.rpc('get_user_behavior_analytics', {
    p_user_id: userId,
    p_start_date: startDate.toISOString(),
    p_end_date: endDate.toISOString(),
  });

  if (error) throw new Error(`Failed to get user behavior analytics: ${error.message}`);

  return data || [];
}

/**
 * Get system performance metrics
 */
async function getSystemPerformanceMetrics(timeRange = { hours: 24 }) {
  if (!supabase) throw new Error('Supabase not configured');

  const endDate = new Date();
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - (timeRange.hours || 24));

  const { data, error } = await supabase.rpc('get_system_performance_metrics', {
    p_start_date: startDate.toISOString(),
    p_end_date: endDate.toISOString(),
  });

  if (error) throw new Error(`Failed to get system performance metrics: ${error.message}`);

  // Convert to object for easier access
  const metrics = {};
  (data || []).forEach((m) => {
    metrics[m.metric_name] = {
      value: m.metric_value,
      unit: m.unit,
    };
  });

  return metrics;
}

/**
 * Get domain usage statistics
 */
async function getDomainUsageStatistics(domainId, timeRange = { days: 7 }) {
  if (!supabase) throw new Error('Supabase not configured');

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (timeRange.days || 7));

  const { data, error } = await supabase
    .from('brain_analytics_domain_usage')
    .select('*')
    .eq('domain_id', domainId)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (error) throw new Error(`Failed to get domain usage statistics: ${error.message}`);

  return data || [];
}

/**
 * Get query patterns for a user
 */
async function getQueryPatterns(userId, timeRange = { days: 7 }) {
  if (!supabase) throw new Error('Supabase not configured');

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (timeRange.days || 7));

  const { data, error } = await supabase
    .from('brain_analytics_query_patterns')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (error) throw new Error(`Failed to get query patterns: ${error.message}`);

  return data || [];
}

/**
 * Get daily user activity
 */
async function getDailyUserActivity(userId, days = 7) {
  if (!supabase) throw new Error('Supabase not configured');

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('brain_analytics_daily_user_activity')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (error) throw new Error(`Failed to get daily user activity: ${error.message}`);

  return data || [];
}

/**
 * Refresh analytics materialized views
 */
async function refreshAnalyticsViews() {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.rpc('refresh_analytics_views');

  if (error) throw new Error(`Failed to refresh analytics views: ${error.message}`);
}

module.exports = {
  supabase,
  trackEvent,
  getUserBehaviorAnalytics,
  getSystemPerformanceMetrics,
  getDomainUsageStatistics,
  getQueryPatterns,
  getDailyUserActivity,
  refreshAnalyticsViews,
};


