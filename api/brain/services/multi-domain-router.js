/**
 * Multi-Domain Query Router
 * Routes queries to relevant domains and combines results
 */

const { createClient } = require('@supabase/supabase-js');
const embeddingService = require('./embedding-service');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Route query to relevant domains
 * @param {string} query - Query text
 * @param {string} userId - User ID
 * @param {Object} options - Routing options
 * @returns {Promise<Object>} - Routing decision
 */
async function routeQuery(query, userId, options = {}) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  if (!embeddingService.isConfigured) {
    throw new Error('Embedding service not configured');
  }

  try {
    // Generate query embedding
    const queryEmbedding = await embeddingService.generateEmbedding(query);

    // Select relevant domains
    const maxDomains = options.maxDomains || 3;
    const minScore = options.minScore || 0.3;

    const { data: relevantDomains, error } = await supabase.rpc('select_relevant_domains', {
      p_query_text: query,
      p_query_embedding: queryEmbedding,
      p_user_id: userId,
      p_max_domains: maxDomains,
      p_min_score: minScore,
    });

    if (error) {
      throw new Error(`Failed to select domains: ${error.message}`);
    }

    if (!relevantDomains || relevantDomains.length === 0) {
      return {
        query,
        selectedDomains: [],
        routingConfidence: 0.0,
        message: 'No relevant domains found',
      };
    }

    // Calculate routing confidence
    const avgScore =
      relevantDomains.reduce((sum, d) => sum + d.relevance_score, 0) / relevantDomains.length;
    const routingConfidence = Math.min(avgScore * 1.2, 1.0); // Boost confidence slightly

    // Build domain scores object
    const domainScores = {};
    relevantDomains.forEach((d) => {
      domainScores[d.domain_id] = d.relevance_score;
    });

    // Log routing decision
    const { data: routingLog } = await supabase
      .from('brain_query_routing')
      .insert({
        query_text: query,
        query_embedding: queryEmbedding,
        selected_domain_ids: relevantDomains.map((d) => d.domain_id),
        routing_strategy: options.strategy || 'auto',
        routing_confidence: routingConfidence,
        domain_scores: domainScores,
        user_id: userId,
      })
      .select()
      .single();

    return {
      query,
      selectedDomains: relevantDomains,
      routingConfidence,
      routingId: routingLog?.id,
      domainScores,
    };
  } catch (error) {
    console.error('[Multi-Domain Router] Error:', error);
    throw error;
  }
}

/**
 * Select best domains for query
 * @param {string} query - Query text
 * @param {string} userId - User ID
 * @param {Object} options - Selection options
 * @returns {Promise<Array>} - Array of selected domains
 */
async function selectDomains(query, userId, options = {}) {
  const routing = await routeQuery(query, userId, options);
  return routing.selectedDomains;
}

/**
 * Score domain relevance
 * @param {string} query - Query text
 * @param {string} domainId - Domain ID
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Relevance score (0-1)
 */
async function scoreDomainRelevance(query, domainId, userId) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  if (!embeddingService.isConfigured) {
    throw new Error('Embedding service not configured');
  }

  try {
    const queryEmbedding = await embeddingService.generateEmbedding(query);

    const { data: score, error } = await supabase.rpc('score_domain_relevance', {
      p_query_text: query,
      p_query_embedding: queryEmbedding,
      p_domain_id: domainId,
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`Failed to score domain: ${error.message}`);
    }

    return score || 0.0;
  } catch (error) {
    console.error('[Multi-Domain Router] Score error:', error);
    throw error;
  }
}

/**
 * Combine results from multiple domains
 * @param {Array} results - Array of results from different domains
 * @param {Object} options - Combination options
 * @returns {Promise<Array>} - Combined and ranked results
 */
async function combineResults(results, options = {}) {
  if (!results || results.length === 0) {
    return [];
  }

  // Flatten results from all domains
  const allResults = [];
  results.forEach((domainResult) => {
    if (domainResult.results && Array.isArray(domainResult.results)) {
      domainResult.results.forEach((result) => {
        allResults.push({
          ...result,
          domainId: domainResult.domainId,
          domainName: domainResult.domainName,
          domainRelevance: domainResult.relevanceScore,
        });
      });
    }
  });

  // Calculate combined score
  allResults.forEach((result) => {
    const similarityScore = result.similarity || 0.0;
    const domainRelevance = result.domainRelevance || 0.5;
    result.combinedScore = similarityScore * 0.7 + domainRelevance * 0.3;
  });

  // Sort by combined score
  allResults.sort((a, b) => b.combinedScore - a.combinedScore);

  // Apply deduplication if enabled
  if (options.deduplicate !== false) {
    const seen = new Set();
    const deduplicated = [];
    for (const result of allResults) {
      const key = result.id || result.title;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(result);
      }
    }
    return deduplicated;
  }

  // Limit results
  const limit = options.limit || 20;
  return allResults.slice(0, limit);
}

/**
 * Get routing history
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Routing history
 */
async function getRoutingHistory(userId, options = {}) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    let query = supabase
      .from('brain_query_routing')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get routing history: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('[Multi-Domain Router] History error:', error);
    throw error;
  }
}

module.exports = {
  routeQuery,
  selectDomains,
  scoreDomainRelevance,
  combineResults,
  getRoutingHistory,
  isConfigured: !!supabase && embeddingService.isConfigured,
};
