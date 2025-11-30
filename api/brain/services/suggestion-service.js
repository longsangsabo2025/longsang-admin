/**
 * Suggestion Service
 * Smart suggestions and proactive intelligence
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
 * Suggest related knowledge
 */
async function suggestRelatedKnowledge(knowledgeId) {
  if (!supabase) throw new Error('Supabase not configured');

  // Get the knowledge item
  const { data: knowledge, error } = await supabase
    .from('brain_knowledge')
    .select('*')
    .eq('id', knowledgeId)
    .single();

  if (error || !knowledge) {
    throw new Error(`Knowledge item not found: ${knowledgeId}`);
  }

  // Find related knowledge by:
  // 1. Same domain
  // 2. Similar tags
  // 3. Similar content (vector similarity)

  const { data: related, error: relatedError } = await supabase
    .from('brain_knowledge')
    .select('id, title, content, domain_id, tags')
    .eq('domain_id', knowledge.domain_id)
    .neq('id', knowledgeId)
    .eq('status', 'active')
    .limit(5);

  if (relatedError) {
    console.error('[Suggestion Service] Error finding related knowledge:', relatedError);
    return [];
  }

  return related || [];
}

/**
 * Suggest tasks based on context
 */
async function suggestTasks(userId, context = {}) {
  if (!supabase) throw new Error('Supabase not configured');

  const suggestions = [];

  // Suggest based on query history
  const { data: recentQueries } = await supabase
    .from('brain_query_history')
    .select('query, domain_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (recentQueries && recentQueries.length > 0) {
    // Analyze queries for task-worthy patterns
    const taskKeywords = ['review', 'check', 'follow up', 'analyze', 'update', 'create'];
    const taskQueries = recentQueries.filter((q) =>
      taskKeywords.some((keyword) => q.query.toLowerCase().includes(keyword))
    );

    for (const query of taskQueries.slice(0, 3)) {
      suggestions.push({
        title: `Follow up on: ${query.query.substring(0, 50)}`,
        description: `Based on your recent query about "${query.query}"`,
        priority: 'medium',
        source: 'master_brain_suggestion',
      });
    }
  }

  // Suggest based on due tasks
  const { data: overdueTasks } = await supabase
    .from('brain_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'open')
    .lt('due_date', new Date().toISOString())
    .limit(5);

  if (overdueTasks && overdueTasks.length > 0) {
    suggestions.push({
      title: `You have ${overdueTasks.length} overdue task(s)`,
      description: 'Consider reviewing and updating your overdue tasks',
      priority: 'high',
      source: 'master_brain_suggestion',
    });
  }

  return suggestions;
}

/**
 * Detect usage patterns
 */
async function detectPatterns(userId) {
  if (!supabase) throw new Error('Supabase not configured');

  const patterns = [];

  // Analyze query patterns
  const { data: queries } = await supabase
    .from('brain_query_history')
    .select('query, domain_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (queries && queries.length > 0) {
    // Find most queried domains
    const domainCounts = {};
    queries.forEach((q) => {
      if (q.domain_id) {
        domainCounts[q.domain_id] = (domainCounts[q.domain_id] || 0) + 1;
      }
    });

    const topDomain = Object.entries(domainCounts)
      .sort(([, a], [, b]) => b - a)[0];

    if (topDomain) {
      patterns.push({
        type: 'domain_focus',
        message: `You frequently query domain ${topDomain[0]}`,
        data: { domainId: topDomain[0], count: topDomain[1] },
      });
    }

    // Find time patterns
    const hourCounts = {};
    queries.forEach((q) => {
      const hour = new Date(q.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0];

    if (peakHour) {
      patterns.push({
        type: 'time_pattern',
        message: `You are most active around ${peakHour[0]}:00`,
        data: { hour: peakHour[0], count: peakHour[1] },
      });
    }
  }

  return patterns;
}

/**
 * Generate smart reminders
 */
async function generateReminders(userId) {
  if (!supabase) throw new Error('Supabase not configured');

  const reminders = [];

  // Check for upcoming due tasks
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: upcomingTasks } = await supabase
    .from('brain_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'open')
    .gte('due_date', new Date().toISOString())
    .lte('due_date', tomorrow.toISOString())
    .limit(10);

  if (upcomingTasks && upcomingTasks.length > 0) {
    reminders.push({
      type: 'task_reminder',
      message: `You have ${upcomingTasks.length} task(s) due soon`,
      data: { tasks: upcomingTasks },
    });
  }

  // Check for unread notifications
  const { count: unreadCount } = await supabase
    .from('brain_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (unreadCount > 0) {
    reminders.push({
      type: 'notification_reminder',
      message: `You have ${unreadCount} unread notification(s)`,
      data: { count: unreadCount },
    });
  }

  return reminders;
}

module.exports = {
  supabase,
  suggestRelatedKnowledge,
  suggestTasks,
  detectPatterns,
  generateReminders,
};


