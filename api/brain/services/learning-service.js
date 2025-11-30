/**
 * Learning Service
 * Reinforcement learning for routing, feedback tracking, and knowledge quality scoring
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
 * Record user feedback
 */
async function recordFeedback(userId, queryId, feedback) {
  if (!supabase) throw new Error('Supabase not configured');

  const { feedbackType, rating, comment, context } = feedback;

  const { data, error } = await supabase
    .from('brain_user_feedback')
    .insert({
      user_id: userId,
      query_id: queryId,
      feedback_type: feedbackType,
      rating: rating || null,
      comment: comment || null,
      context: context || {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to record feedback: ${error.message}`);

  // Update routing weights if feedback is related to a query
  if (queryId && (feedbackType === 'thumbs_up' || feedbackType === 'thumbs_down' || (feedbackType === 'rating' && rating))) {
    // Get query to find domain
    const { data: query } = await supabase
      .from('brain_query_history')
      .select('domain_id')
      .eq('id', queryId)
      .single();

    if (query && query.domain_id) {
      const isSuccess = feedbackType === 'thumbs_up' || (feedbackType === 'rating' && rating >= 4);
      await updateRoutingWeights(userId, query.domain_id, isSuccess);
    }
  }

  return data;
}

/**
 * Update routing weights based on feedback
 */
async function updateRoutingWeights(userId, domainId, success) {
  if (!supabase) throw new Error('Supabase not configured');

  // Use database function to update routing weight
  const { error } = await supabase.rpc('update_routing_weight', {
    p_user_id: userId,
    p_domain_id: domainId,
    p_success: success,
  });

  if (error) {
    console.error('[Learning Service] Error updating routing weight:', error);
    // Don't throw, just log - this is not critical
  }
}

/**
 * Calculate routing accuracy for a user
 */
async function calculateRoutingAccuracy(userId, timeRangeHours = 24) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase.rpc('calculate_routing_accuracy', {
    p_user_id: userId,
    p_time_range_hours: timeRangeHours,
  });

  if (error) throw new Error(`Failed to calculate routing accuracy: ${error.message}`);

  // Store metric
  await supabase.from('brain_learning_metrics').insert({
    user_id: userId,
    metric_type: 'routing_accuracy',
    metric_value: data || 0,
    context: { time_range_hours: timeRangeHours },
  });

  return data || 0;
}

/**
 * Get optimal domains for a query based on learning
 */
async function getOptimalDomains(query, userId) {
  if (!supabase) throw new Error('Supabase not configured');

  // Get user's routing weights
  const { data: weights, error } = await supabase
    .from('brain_routing_weights')
    .select('domain_id, weight')
    .eq('user_id', userId)
    .order('weight', { ascending: false });

  if (error) {
    console.error('[Learning Service] Error getting routing weights:', error);
    return [];
  }

  // Return domains sorted by weight
  return (weights || []).map((w) => ({
    domainId: w.domain_id,
    weight: w.weight,
  }));
}

/**
 * Score knowledge item based on usage, feedback, and recency
 */
async function scoreKnowledgeItem(knowledgeId) {
  if (!supabase) throw new Error('Supabase not configured');

  // Get knowledge item
  const { data: knowledge, error: knowledgeError } = await supabase
    .from('brain_knowledge')
    .select('*')
    .eq('id', knowledgeId)
    .single();

  if (knowledgeError || !knowledge) {
    throw new Error(`Knowledge item not found: ${knowledgeId}`);
  }

  // Calculate score components
  const now = new Date();
  const createdAt = new Date(knowledge.created_at);
  const updatedAt = new Date(knowledge.updated_at || knowledge.created_at);

  // Recency score (0-40 points): More recent = higher score
  const daysSinceUpdate = (now - updatedAt) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 40 - daysSinceUpdate * 2);

  // Usage score (0-30 points): Based on query history
  const { count: usageCount } = await supabase
    .from('brain_query_history')
    .select('id', { count: 'exact', head: true })
    .contains('retrieved_knowledge_ids', [knowledgeId]);

  const usageScore = Math.min(30, (usageCount || 0) * 2);

  // Feedback score (0-30 points): Based on positive feedback
  const { count: positiveFeedback } = await supabase
    .from('brain_user_feedback')
    .select('id', { count: 'exact', head: true })
    .eq('feedback_type', 'thumbs_up')
    .contains('context', { knowledge_id: knowledgeId });

  const feedbackScore = Math.min(30, (positiveFeedback || 0) * 5);

  // Total score
  const totalScore = recencyScore + usageScore + feedbackScore;

  // Store score
  await supabase
    .from('brain_knowledge_quality_scores')
    .upsert({
      knowledge_id: knowledgeId,
      quality_score: totalScore,
      score_components: {
        recency: recencyScore,
        usage: usageScore,
        feedback: feedbackScore,
      },
      last_calculated_at: now.toISOString(),
    }, {
      onConflict: 'knowledge_id',
    });

  return {
    knowledgeId,
    score: totalScore,
    components: {
      recency: recencyScore,
      usage: usageScore,
      feedback: feedbackScore,
    },
  };
}

/**
 * Identify low-quality knowledge items
 */
async function identifyLowQualityKnowledge(domainId, threshold = 30) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('brain_knowledge_quality_scores')
    .select('knowledge_id, quality_score')
    .lt('quality_score', threshold)
    .order('quality_score', { ascending: true });

  if (error) throw new Error(`Failed to identify low-quality knowledge: ${error.message}`);

  // Filter by domain if provided
  if (domainId) {
    const knowledgeIds = (data || []).map((s) => s.knowledge_id);
    const { data: knowledge } = await supabase
      .from('brain_knowledge')
      .select('id')
      .in('id', knowledgeIds)
      .eq('domain_id', domainId);

    const domainKnowledgeIds = new Set((knowledge || []).map((k) => k.id));
    return (data || []).filter((s) => domainKnowledgeIds.has(s.knowledge_id));
  }

  return data || [];
}

/**
 * Suggest improvements for knowledge item (placeholder - would use AI)
 */
async function suggestImprovements(knowledgeId) {
  // This would use AI to analyze and suggest improvements
  // For now, return basic suggestions based on score components
  const scoreResult = await scoreKnowledgeItem(knowledgeId);

  const suggestions = [];

  if (scoreResult.components.recency < 20) {
    suggestions.push({
      type: 'recency',
      message: 'This knowledge item is outdated. Consider updating it.',
    });
  }

  if (scoreResult.components.usage < 10) {
    suggestions.push({
      type: 'usage',
      message: 'This knowledge item is rarely accessed. Consider improving relevance or tags.',
    });
  }

  if (scoreResult.components.feedback < 10) {
    suggestions.push({
      type: 'feedback',
      message: 'This knowledge item has received little positive feedback. Consider improving clarity or accuracy.',
    });
  }

  return suggestions;
}

/**
 * Auto-archive outdated knowledge
 */
async function autoArchiveOutdated(thresholdDays = 365, minScore = 20) {
  if (!supabase) throw new Error('Supabase not configured');

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - thresholdDays);

  // Find knowledge items that are old and have low scores
  const { data: lowQuality, error } = await supabase
    .from('brain_knowledge_quality_scores')
    .select('knowledge_id, quality_score')
    .lt('quality_score', minScore);

  if (error) throw new Error(`Failed to find outdated knowledge: ${error.message}`);

  const knowledgeIds = (lowQuality || []).map((s) => s.knowledge_id);

  if (knowledgeIds.length === 0) return { archived: 0 };

  // Update status to archived
  const { count } = await supabase
    .from('brain_knowledge')
    .update({ status: 'archived' })
    .in('id', knowledgeIds)
    .lt('updated_at', cutoffDate.toISOString())
    .eq('status', 'active');

  return { archived: count || 0 };
}

module.exports = {
  supabase,
  recordFeedback,
  updateRoutingWeights,
  calculateRoutingAccuracy,
  getOptimalDomains,
  scoreKnowledgeItem,
  identifyLowQualityKnowledge,
  suggestImprovements,
  autoArchiveOutdated,
};


