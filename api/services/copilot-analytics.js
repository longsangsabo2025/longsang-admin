/**
 * 📊 Copilot Analytics Service
 *
 * Connects Copilot to analytics, provides insights,
 * and creates data-driven recommendations
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
const workflowMetrics = require('./workflow-metrics');
const suggestionEngine = require('./suggestion-engine');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseUrl = process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_MODEL = 'gpt-4o-mini';

/**
 * Get performance insights for Copilot
 * @param {object} options - Options
 * @returns {Promise<object>} Performance insights
 */
async function getPerformanceInsights(options = {}) {
  try {
    const {
      userId,
      projectId,
      timeRange = '7d',
    } = options;

    // Collect analytics data
    const analyticsData = await collectCopilotAnalytics({
      userId,
      projectId,
      timeRange,
    });

    // Generate insights using AI
    const insights = await generateInsights(analyticsData, options);

    return {
      success: true,
      analytics: analyticsData,
      insights,
      recommendations: insights.recommendations || [],
    };
  } catch (error) {
    console.error('Error getting performance insights:', error);
    throw error;
  }
}

/**
 * Collect Copilot analytics data
 */
async function collectCopilotAnalytics(options = {}) {
  const { userId, projectId, timeRange = '7d' } = options;

  // Calculate date range
  const now = new Date();
  const days = { '24h': 1, '7d': 7, '30d': 30, '90d': 90 };
  const startDate = new Date(now.getTime() - (days[timeRange] || 7) * 24 * 60 * 60 * 1000);

  const analytics = {
    commands: {
      total: 0,
      successful: 0,
      failed: 0,
      byType: {},
    },
    suggestions: {
      total: 0,
      executed: 0,
      dismissed: 0,
      byPriority: {},
    },
    workflows: {
      generated: 0,
      executed: 0,
      successRate: 0,
    },
    performance: {
      averageResponseTime: 0,
      averageExecutionTime: 0,
    },
    usage: {
      peakHours: [],
      commandsPerDay: [],
    },
  };

  // Get command history (would need to query from database or logs)
  // For now, return structure

  // Get suggestion stats
  if (userId) {
    const { data: suggestions } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    if (suggestions) {
      analytics.suggestions.total = suggestions.length;
      analytics.suggestions.executed = suggestions.filter(s => s.executed_at).length;
      analytics.suggestions.dismissed = suggestions.filter(s => s.dismissed_at).length;

      // Group by priority
      suggestions.forEach(s => {
        const priority = s.priority || 'medium';
        analytics.suggestions.byPriority[priority] = (analytics.suggestions.byPriority[priority] || 0) + 1;
      });
    }
  }

  // Get workflow metrics
  if (projectId) {
    // Query workflow executions
    // This is simplified - would need actual workflow execution data
  }

  return analytics;
}

/**
 * Generate insights from analytics data
 */
async function generateInsights(analytics, options = {}) {
  try {
    const insightsSummary = `
Analytics Data:
- Total Commands: ${analytics.commands.total}
- Successful Commands: ${analytics.commands.successful}
- Success Rate: ${analytics.commands.total > 0 ? (analytics.commands.successful / analytics.commands.total * 100).toFixed(1) : 0}%
- Total Suggestions: ${analytics.suggestions.total}
- Suggestions Executed: ${analytics.suggestions.executed}
- Execution Rate: ${analytics.suggestions.total > 0 ? (analytics.suggestions.executed / analytics.suggestions.total * 100).toFixed(1) : 0}%
- Average Response Time: ${analytics.performance.averageResponseTime}ms
`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'Bạn là analytics insights expert. Phân tích data và tạo actionable insights và recommendations.',
        },
        {
          role: 'user',
          content: `${insightsSummary}\n\nTạo insights và recommendations dựa trên data này.`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = JSON.parse(response.choices[0].message.content);

    return {
      summary: content.summary || 'No significant insights',
      insights: content.insights || [],
      recommendations: content.recommendations || [],
      trends: content.trends || [],
    };
  } catch (error) {
    console.error('Error generating insights:', error);
    return {
      summary: 'Analytics data analyzed',
      insights: [],
      recommendations: [],
    };
  }
}

/**
 * Create predictive suggestions based on analytics
 * @param {string} userId - User ID
 * @param {object} options - Options
 * @returns {Promise<Array>} Predictive suggestions
 */
async function createPredictiveSuggestions(userId, options = {}) {
  try {
    const { projectId, timeRange = '7d' } = options;

    // Get analytics
    const analytics = await collectCopilotAnalytics({ userId, projectId, timeRange });

    // Identify patterns
    const patterns = identifyUsagePatterns(analytics);

    // Generate predictive suggestions
    const suggestions = [];

    // Example: If user usually creates posts on Monday, suggest creating post
    if (patterns.frequentDays) {
      const today = new Date().getDay();
      if (patterns.frequentDays.includes(today)) {
        suggestions.push({
          type: 'action',
          priority: 'medium',
          reason: `Bạn thường tạo posts vào ngày này trong tuần`,
          suggested_action: {
            action: 'create_post',
            parameters: {},
          },
          estimated_impact: 'Dựa trên thói quen của bạn',
          source: 'analytics',
          confidence: patterns.frequentDaysConfidence || 0.7,
        });
      }
    }

    // Example: If success rate is low, suggest reviewing workflows
    if (analytics.commands.total > 10 && analytics.commands.successful / analytics.commands.total < 0.7) {
      suggestions.push({
        type: 'insight',
        priority: 'high',
        reason: `Tỷ lệ thành công của commands thấp (${((analytics.commands.successful / analytics.commands.total) * 100).toFixed(1)}%)`,
        suggested_action: {
          action: 'review_workflows',
          parameters: {},
        },
        estimated_impact: 'Cải thiện success rate',
        source: 'analytics',
        confidence: 0.9,
      });
    }

    return suggestions;
  } catch (error) {
    console.error('Error creating predictive suggestions:', error);
    return [];
  }
}

/**
 * Identify usage patterns from analytics
 */
function identifyUsagePatterns(analytics) {
  const patterns = {
    frequentDays: [],
    frequentHours: [],
    frequentCommands: [],
    frequentDaysConfidence: 0,
  };

  // Analyze usage patterns
  // This would analyze actual usage data
  // For now, return structure

  return patterns;
}

/**
 * Get recommendation engine based on data
 * @param {string} userId - User ID
 * @param {object} options - Options
 * @returns {Promise<Array>} Data-driven recommendations
 */
async function getDataDrivenRecommendations(userId, options = {}) {
  try {
    const { projectId } = options;

    // Get analytics
    const insights = await getPerformanceInsights({ userId, projectId });

    // Combine with predictive suggestions
    const predictive = await createPredictiveSuggestions(userId, { projectId });

    // Get regular suggestions
    const regular = await suggestionEngine.generateSuggestions(userId, {
      projectId,
      limit: 5,
    });

    // Combine and rank
    const allRecommendations = [
      ...(insights.recommendations || []).map(r => ({
        ...r,
        source: 'analytics',
        type: 'insight',
      })),
      ...predictive.map(s => ({
        ...s,
        source: 'predictive',
      })),
      ...regular.map(s => ({
        ...s,
        source: 'context',
      })),
    ];

    // Rank by confidence and priority
    return allRecommendations.sort((a, b) => {
      const aScore = (a.confidence || 0.5) * (a.priority === 'high' ? 3 : a.priority === 'medium' ? 2 : 1);
      const bScore = (b.confidence || 0.5) * (b.priority === 'high' ? 3 : b.priority === 'medium' ? 2 : 1);
      return bScore - aScore;
    });
  } catch (error) {
    console.error('Error getting data-driven recommendations:', error);
    return [];
  }
}

/**
 * Track Copilot usage for analytics
 * @param {object} usageData - Usage data
 * @returns {Promise<boolean>} Success status
 */
async function trackUsage(usageData) {
  try {
    const {
      userId,
      action, // 'command', 'suggestion', 'chat', etc.
      details = {},
      timestamp = new Date(),
    } = usageData;

    // Store in analytics table (would need to create this)
    // For now, log it
    console.log('Copilot usage tracked:', { userId, action, details, timestamp });

    return true;
  } catch (error) {
    console.error('Error tracking usage:', error);
    return false;
  }
}

module.exports = {
  getPerformanceInsights,
  createPredictiveSuggestions,
  getDataDrivenRecommendations,
  trackUsage,
  collectCopilotAnalytics,
  generateInsights,
};

