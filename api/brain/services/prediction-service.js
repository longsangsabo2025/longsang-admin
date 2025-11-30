/**
 * Prediction Service
 * Predictive features: anticipate needs, identify gaps, forecast growth
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
 * Predict user needs
 */
async function predictUserNeeds(userId) {
  if (!supabase) throw new Error('Supabase not configured');

  const predictions = [];

  // Analyze query history to predict likely next queries
  const { data: recentQueries } = await supabase
    .from('brain_query_history')
    .select('query, domain_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (recentQueries && recentQueries.length > 0) {
    // Find common query patterns
    const queryWords = {};
    recentQueries.forEach((q) => {
      const words = q.query.toLowerCase().split(/\s+/);
      words.forEach((word) => {
        if (word.length > 3) {
          // Filter out common words
          queryWords[word] = (queryWords[word] || 0) + 1;
        }
      });
    });

    const topWords = Object.entries(queryWords)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);

    if (topWords.length > 0) {
      predictions.push({
        type: 'likely_query',
        message: `You might want to query about: ${topWords.join(', ')}`,
        confidence: 0.7,
      });
    }
  }

  // Predict based on time patterns
  const hour = new Date().getHours();
  const { data: timeBasedQueries } = await supabase
    .from('brain_query_history')
    .select('query, domain_id')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (timeBasedQueries && timeBasedQueries.length > 0) {
    const hourQueries = timeBasedQueries.filter((q) => {
      const queryHour = new Date(q.created_at).getHours();
      return Math.abs(queryHour - hour) <= 1;
    });

    if (hourQueries.length > 0) {
      const commonDomain = hourQueries[0].domain_id;
      predictions.push({
        type: 'time_based',
        message: `You often query domain ${commonDomain} around this time`,
        confidence: 0.6,
        data: { domainId: commonDomain },
      });
    }
  }

  return predictions;
}

/**
 * Anticipate likely queries
 */
async function anticipateQueries(userId) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data: recentQueries } = await supabase
    .from('brain_query_history')
    .select('query, domain_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!recentQueries || recentQueries.length === 0) {
    return [];
  }

  // Simple pattern: suggest follow-up queries based on recent queries
  const suggestions = recentQueries.slice(0, 3).map((q) => ({
    query: `More about: ${q.query}`,
    domainId: q.domain_id,
    confidence: 0.5,
  }));

  return suggestions;
}

/**
 * Identify knowledge gaps in a domain
 */
async function identifyKnowledgeGaps(domainId) {
  if (!supabase) throw new Error('Supabase not configured');

  const gaps = [];

  // Get all knowledge in domain
  const { data: knowledge, error } = await supabase
    .from('brain_knowledge')
    .select('id, title, tags, content')
    .eq('domain_id', domainId)
    .eq('status', 'active');

  if (error) throw new Error(`Failed to fetch knowledge: ${error.message}`);

  // Analyze tags to find gaps
  const tagCounts = {};
  (knowledge || []).forEach((k) => {
    const tags = k.tags || [];
    tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  // Find underrepresented tags (potential gaps)
  const avgTagCount = Object.values(tagCounts).reduce((a, b) => a + b, 0) / Object.keys(tagCounts).length;
  const underrepresentedTags = Object.entries(tagCounts)
    .filter(([, count]) => count < avgTagCount * 0.5)
    .map(([tag]) => tag);

  if (underrepresentedTags.length > 0) {
    gaps.push({
      type: 'tag_coverage',
      message: `Low coverage for tags: ${underrepresentedTags.slice(0, 3).join(', ')}`,
      tags: underrepresentedTags,
    });
  }

  // Check for outdated knowledge
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const outdated = (knowledge || []).filter(
    (k) => new Date(k.updated_at || k.created_at) < sixMonthsAgo
  );

  if (outdated.length > 0) {
    gaps.push({
      type: 'outdated_knowledge',
      message: `${outdated.length} knowledge item(s) haven't been updated in 6+ months`,
      count: outdated.length,
    });
  }

  return gaps;
}

/**
 * Forecast domain growth
 */
async function forecastDomainGrowth(domainId) {
  if (!supabase) throw new Error('Supabase not configured');

  // Get knowledge creation history
  const { data: knowledge } = await supabase
    .from('brain_knowledge')
    .select('created_at')
    .eq('domain_id', domainId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (!knowledge || knowledge.length < 2) {
    return {
      forecast: 'insufficient_data',
      message: 'Not enough data to forecast',
    };
  }

  // Simple linear forecast based on recent growth rate
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const recentCount = knowledge.filter((k) => new Date(k.created_at) > thirtyDaysAgo).length;
  const previousCount = knowledge.filter(
    (k) => new Date(k.created_at) > sixtyDaysAgo && new Date(k.created_at) <= thirtyDaysAgo
  ).length;

  const growthRate = previousCount > 0 ? (recentCount - previousCount) / previousCount : 0;
  const projectedNextMonth = Math.round(recentCount * (1 + growthRate));

  return {
    forecast: 'growth',
    currentMonth: recentCount,
    previousMonth: previousCount,
    growthRate: (growthRate * 100).toFixed(1),
    projectedNextMonth,
    trend: growthRate > 0 ? 'increasing' : growthRate < 0 ? 'decreasing' : 'stable',
  };
}

module.exports = {
  supabase,
  predictUserNeeds,
  anticipateQueries,
  identifyKnowledgeGaps,
  forecastDomainGrowth,
};


