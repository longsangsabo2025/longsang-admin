/**
 * 💡 Suggestion Engine Service
 *
 * Advanced proactive suggestion generation with priority scoring and ranking
 * Enhances existing suggestions with intelligent prioritization
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

const OpenAI = require('openai');
const contextRetrieval = require('./context-retrieval');
const businessContext = require('./business-context');
const { createClient } = require('@supabase/supabase-js');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseUrl = process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_MODEL = 'gpt-4o-mini';

/**
 * Generate proactive suggestions with priority scoring
 * @param {string} userId - User ID
 * @param {object} options - Options
 * @returns {Promise<Array>} Ranked suggestions
 */
async function generateSuggestions(userId, options = {}) {
  try {
    const {
      limit = 10,
      projectId = null,
      includeContext = true,
      filters = {},
    } = options;

    // Step 1: Generate base suggestions (multiple sources)
    const baseSuggestions = await generateBaseSuggestions(userId, {
      projectId,
      includeContext,
      limit: limit * 2, // Generate more for filtering
    });

    // Step 2: Score each suggestion
    const scoredSuggestions = await scoreSuggestions(baseSuggestions, {
      userId,
      projectId,
      context: includeContext ? await businessContext.load() : null,
    });

    // Step 3: Rank suggestions by score
    const rankedSuggestions = rankSuggestions(scoredSuggestions, filters);

    // Step 4: Apply filters and limit
    const filteredSuggestions = applyFilters(rankedSuggestions, filters);

    return filteredSuggestions.slice(0, limit);
  } catch (error) {
    console.error('Error generating suggestions:', error);
    throw error;
  }
}

/**
 * Generate base suggestions from multiple sources
 * @param {string} userId - User ID
 * @param {object} options - Options
 * @returns {Promise<Array>} Base suggestions
 */
async function generateBaseSuggestions(userId, options = {}) {
  const { projectId, includeContext, limit } = options;
  const suggestions = [];

  // Source 1: Context-based suggestions
  if (includeContext) {
    const contextSuggestions = await generateContextBasedSuggestions(userId, {
      projectId,
      limit: Math.floor(limit / 3),
    });
    suggestions.push(...contextSuggestions);
  }

  // Source 2: Pattern-based suggestions
  const patternSuggestions = await generatePatternBasedSuggestions(userId, {
    projectId,
    limit: Math.floor(limit / 3),
  });
  suggestions.push(...patternSuggestions);

  // Source 3: AI-generated suggestions
  const aiSuggestions = await generateAISuggestions(userId, {
    projectId,
    includeContext,
    limit: Math.floor(limit / 3),
  });
  suggestions.push(...aiSuggestions);

  return suggestions;
}

/**
 * Generate context-based suggestions
 * @param {string} userId - User ID
 * @param {object} options - Options
 * @returns {Promise<Array>} Context-based suggestions
 */
async function generateContextBasedSuggestions(userId, options = {}) {
  try {
    const { projectId, limit = 5 } = options;

    // Load business context
    const context = await businessContext.load();
    const suggestions = [];

    // Suggest creating post for recent projects
    if (context.currentProjects && context.currentProjects.length > 0) {
      const recentProject = context.currentProjects[0];
      suggestions.push({
        id: `suggestion-ctx-project-${Date.now()}`,
        type: 'action',
        priority: 'medium',
        reason: `Tạo bài post mới cho dự án "${recentProject.name}"`,
        suggested_action: {
          action: 'create_post',
          parameters: {
            topic: `dự án ${recentProject.name}`,
            platform: 'all',
            project_id: recentProject.id,
          },
        },
        project_id: recentProject.id,
        project_name: recentProject.name,
        estimated_impact: 'Tăng cường marketing cho dự án',
        source: 'context',
        score: 0, // Will be scored later
      });
    }

    // Suggest backup if no recent backup
    const lastBackup = await getLastBackupTime();
    const daysSinceBackup = lastBackup ?
      (Date.now() - new Date(lastBackup).getTime()) / (1000 * 60 * 60 * 24) :
      999;

    if (daysSinceBackup > 7) {
      suggestions.push({
        id: `suggestion-ctx-backup-${Date.now()}`,
        type: 'reminder',
        priority: daysSinceBackup > 14 ? 'high' : 'medium',
        reason: `Chưa backup database ${Math.floor(daysSinceBackup)} ngày`,
        suggested_action: {
          action: 'backup_database',
          parameters: {},
        },
        estimated_impact: 'Bảo vệ dữ liệu quan trọng',
        source: 'context',
        score: 0,
      });
    }

    return suggestions.slice(0, limit);
  } catch (error) {
    console.error('Error generating context-based suggestions:', error);
    return [];
  }
}

/**
 * Generate pattern-based suggestions
 * @param {string} userId - User ID
 * @param {object} options - Options
 * @returns {Promise<Array>} Pattern-based suggestions
 */
async function generatePatternBasedSuggestions(userId, options = {}) {
  try {
    const { projectId, limit = 5 } = options;
    const suggestions = [];

    // Analyze user patterns (recent commands, workflows, etc.)
    const patterns = await analyzeUserPatterns(userId, projectId);

    // Generate suggestions based on patterns
    if (patterns.frequentActions) {
      for (const action of patterns.frequentActions.slice(0, 3)) {
        suggestions.push({
          id: `suggestion-pattern-${action.type}-${Date.now()}`,
          type: 'action',
          priority: 'medium',
          reason: `Bạn thường ${action.description} vào thời gian này`,
          suggested_action: {
            action: action.action,
            parameters: action.parameters || {},
          },
          estimated_impact: 'Dựa trên thói quen của bạn',
          source: 'pattern',
          score: 0,
        });
      }
    }

    return suggestions.slice(0, limit);
  } catch (error) {
    console.error('Error generating pattern-based suggestions:', error);
    return [];
  }
}

/**
 * Generate AI-powered suggestions
 * @param {string} userId - User ID
 * @param {object} options - Options
 * @returns {Promise<Array>} AI-generated suggestions
 */
async function generateAISuggestions(userId, options = {}) {
  try {
    const { projectId, includeContext, limit = 5 } = options;

    // Load context
    const contextData = includeContext ? await businessContext.load() : null;

    const systemPrompt = `Bạn là AI assistant chuyên tạo proactive suggestions cho người dùng hệ thống LongSang Admin.

Nhiệm vụ: Tạo ${limit} suggestions hữu ích, cụ thể và có thể thực hiện ngay.

Context:
${contextData ? `
- Projects: ${contextData.currentProjects?.map(p => p.name).join(', ') || 'None'}
- Recent workflows: ${contextData.recentWorkflows?.length || 0}
` : 'No context available'}

Mỗi suggestion phải có:
- type: 'action' | 'reminder' | 'insight'
- priority: 'high' | 'medium' | 'low'
- reason: Lý do rõ ràng
- suggested_action: Object với action và parameters
- estimated_impact: Tác động ước tính

Trả về JSON array.`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Tạo suggestions dựa vào context hiện tại.' },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const content = JSON.parse(response.choices[0].message.content);
    const aiSuggestions = Array.isArray(content.suggestions) ? content.suggestions : [];

    return aiSuggestions.slice(0, limit).map((suggestion, index) => ({
      id: `suggestion-ai-${Date.now()}-${index}`,
      ...suggestion,
      source: 'ai',
      score: 0,
      created_at: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    return [];
  }
}

/**
 * Score suggestions based on multiple factors
 * @param {Array} suggestions - Suggestions to score
 * @param {object} options - Scoring options
 * @returns {Promise<Array>} Scored suggestions
 */
async function scoreSuggestions(suggestions, options = {}) {
  const { userId, projectId, context } = options;

  return suggestions.map(suggestion => {
    let score = 0;

    // Base priority score
    const priorityScores = { high: 100, medium: 50, low: 25 };
    score += priorityScores[suggestion.priority] || 50;

    // Recency score (newer is better)
    if (suggestion.created_at) {
      const ageInHours = (Date.now() - new Date(suggestion.created_at).getTime()) / (1000 * 60 * 60);
      score += Math.max(0, 50 - ageInHours * 2); // Decay over time
    } else {
      score += 50; // New suggestions get bonus
    }

    // Context relevance score
    if (suggestion.project_id === projectId) {
      score += 30; // Current project bonus
    }

    if (suggestion.project_name) {
      score += 20; // Project-specific bonus
    }

    // Type score
    const typeScores = { action: 40, reminder: 30, insight: 20 };
    score += typeScores[suggestion.type] || 20;

    // Source score
    const sourceScores = { context: 40, pattern: 35, ai: 30 };
    score += sourceScores[suggestion.source] || 30;

    // Impact score (if available)
    if (suggestion.estimated_impact) {
      const impactKeywords = ['quan trọng', 'tăng', 'giảm', 'cải thiện'];
      const hasHighImpact = impactKeywords.some(keyword =>
        suggestion.estimated_impact.toLowerCase().includes(keyword)
      );
      if (hasHighImpact) {
        score += 20;
      }
    }

    // Check if previously dismissed
    if (suggestion.dismissed_at) {
      score -= 100; // Heavily penalize dismissed suggestions
    }

    return {
      ...suggestion,
      score: Math.max(0, score), // Ensure non-negative
      scoring: {
        priority: priorityScores[suggestion.priority] || 50,
        recency: suggestion.created_at ? Math.max(0, 50 - ((Date.now() - new Date(suggestion.created_at).getTime()) / (1000 * 60 * 60)) * 2) : 50,
        context: (suggestion.project_id === projectId ? 30 : 0) + (suggestion.project_name ? 20 : 0),
        type: typeScores[suggestion.type] || 20,
        source: sourceScores[suggestion.source] || 30,
      },
    };
  });
}

/**
 * Rank suggestions by score
 * @param {Array} scoredSuggestions - Scored suggestions
 * @param {object} filters - Filter options
 * @returns {Array} Ranked suggestions
 */
function rankSuggestions(scoredSuggestions, filters = {}) {
  // Sort by score descending
  const ranked = [...scoredSuggestions].sort((a, b) => b.score - a.score);

  // Apply priority filters
  if (filters.priority) {
    return ranked.filter(s => s.priority === filters.priority);
  }

  // Apply type filters
  if (filters.type) {
    return ranked.filter(s => s.type === filters.type);
  }

  return ranked;
}

/**
 * Apply filters to suggestions
 * @param {Array} suggestions - Suggestions
 * @param {object} filters - Filter criteria
 * @returns {Array} Filtered suggestions
 */
function applyFilters(suggestions, filters = {}) {
  let filtered = [...suggestions];

  // Filter by priority
  if (filters.minPriority) {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const minPriorityValue = priorityOrder[filters.minPriority] || 1;
    filtered = filtered.filter(s =>
      (priorityOrder[s.priority] || 1) >= minPriorityValue
    );
  }

  // Filter by project
  if (filters.projectId) {
    filtered = filtered.filter(s =>
      s.project_id === filters.projectId || !s.project_id
    );
  }

  // Filter dismissed (unless explicitly included)
  if (!filters.includeDismissed) {
    filtered = filtered.filter(s => !s.dismissed_at);
  }

  // Filter by date range
  if (filters.since) {
    const sinceDate = new Date(filters.since);
    filtered = filtered.filter(s => {
      if (!s.created_at) return true;
      return new Date(s.created_at) >= sinceDate;
    });
  }

  return filtered;
}

/**
 * Track suggestion dismissal
 * @param {string} suggestionId - Suggestion ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
async function dismissSuggestion(suggestionId, userId) {
  try {
    const { error } = await supabase
      .from('ai_suggestions')
      .update({
        dismissed_at: new Date().toISOString(),
        dismissed_by: userId,
      })
      .eq('id', suggestionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error dismissing suggestion:', error);
    return false;
  }
}

/**
 * Get last backup time
 */
async function getLastBackupTime() {
  try {
    const { data, error } = await supabase
      .from('backup_logs')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return data.created_at;
  } catch (error) {
    return null;
  }
}

/**
 * Analyze user patterns
 */
async function analyzeUserPatterns(userId, projectId) {
  try {
    // Analyze recent commands from localStorage or database
    // This is a simplified version - can be enhanced with actual pattern analysis

    const patterns = {
      frequentActions: [],
      timePatterns: {},
      projectPreferences: {},
    };

    // Could analyze:
    // - Recent command history
    // - Workflow execution patterns
    // - Time of day patterns
    // - Project preferences

    return patterns;
  } catch (error) {
    console.error('Error analyzing user patterns:', error);
    return { frequentActions: [] };
  }
}

module.exports = {
  generateSuggestions,
  generateBaseSuggestions,
  scoreSuggestions,
  rankSuggestions,
  applyFilters,
  dismissSuggestion,
  generateContextBasedSuggestions,
  generatePatternBasedSuggestions,
  generateAISuggestions,
};

