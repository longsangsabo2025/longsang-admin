/**
 * 🔍 Context Retrieval Service
 *
 * Retrieves relevant context using semantic search
 * Implements relevance scoring, context summarization, and caching
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

const embeddingService = require('./embedding-service');
const businessContext = require('./business-context');
const { createClient } = require('@supabase/supabase-js');
const performanceOptimizer = require('./performance-optimizer');

const supabaseUrl = process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// In-memory cache (simple implementation, can be replaced with Redis later)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cache key for a query
 */
function getCacheKey(query, options) {
  return JSON.stringify({ query, options });
}

/**
 * Get cached result if available and not expired
 */
function getCached(query, options) {
  const key = getCacheKey(query, options);
  const cached = cache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  if (cached) {
    cache.delete(key); // Expired
  }

  return null;
}

/**
 * Set cache value
 */
function setCache(query, options, data) {
  const key = getCacheKey(query, options);
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });

  // Limit cache size (keep last 100 entries)
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

/**
 * Retrieve relevant context for a query
 * @param {string} query - Search query
 * @param {object} options - Retrieval options
 * @returns {Promise<object>} Relevant context with scores
 */
async function retrieveContext(query, options = {}) {
  try {
    const {
      entityType = null,
      projectId = null,
      similarityThreshold = 0.7,
      maxResults = 10,
      useCache = true,
      useOptimizer = false, // Disabled by default to avoid circular dependency
    } = options;

    // Use performance optimizer for better caching (only if explicitly enabled)
    if (useOptimizer && useCache) {
      return await performanceOptimizer.getCachedContext(query, { ...options, useOptimizer: false });
    }

    // Check cache
    if (useCache) {
      const cached = getCached(query, { entityType, projectId, similarityThreshold, maxResults });
      if (cached) {
        return cached;
      }
    }

    // Perform semantic search
    const results = await embeddingService.semanticSearch(query, {
      entityType,
      projectId,
      similarityThreshold,
      maxResults,
    });

    // Enhance results with relevance scoring
    const enhancedResults = await enhanceWithRelevanceScoring(results, query);

    // Summarize context
    const summary = summarizeContext(enhancedResults, query);

    const context = {
      query,
      results: enhancedResults,
      summary,
      totalResults: enhancedResults.length,
      retrievedAt: new Date().toISOString(),
    };

    // Cache result
    if (useCache) {
      setCache(query, { entityType, projectId, similarityThreshold, maxResults }, context);
    }

    return context;
  } catch (error) {
    console.error('Error retrieving context:', error);
    throw error;
  }
}

/**
 * Enhance results with additional relevance scoring
 * @param {Array} results - Search results
 * @param {string} query - Original query
 * @returns {Promise<Array>} Enhanced results with scores
 */
async function enhanceWithRelevanceScoring(results, query) {
  try {
    return results.map((result) => {
      // Base similarity score from vector search
      const similarityScore = result.similarity || 0;

      // Boost score based on recency
      const recencyBoost = calculateRecencyBoost(result.metadata?.created_at);

      // Boost score based on entity type relevance
      const typeBoost = calculateTypeBoost(result.entity_type, query);

      // Combined relevance score
      const relevanceScore = (
        similarityScore * 0.7 + // Vector similarity (70%)
        recencyBoost * 0.2 +    // Recency (20%)
        typeBoost * 0.1         // Type relevance (10%)
      );

      return {
        ...result,
        similarity: similarityScore,
        relevanceScore,
        boosts: {
          recency: recencyBoost,
          type: typeBoost,
        },
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore); // Sort by relevance
  } catch (error) {
    console.error('Error enhancing relevance:', error);
    return results; // Return original if enhancement fails
  }
}

/**
 * Calculate recency boost (0-1)
 * More recent items get higher boost
 */
function calculateRecencyBoost(createdAt) {
  if (!createdAt) return 0.5; // Neutral if no date

  const ageInDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);

  // Decay function: items from last 7 days get full boost, then decay
  if (ageInDays <= 7) return 1.0;
  if (ageInDays <= 30) return 0.8;
  if (ageInDays <= 90) return 0.6;
  return 0.4;
}

/**
 * Calculate type boost based on query keywords
 */
function calculateTypeBoost(entityType, query) {
  const queryLower = query.toLowerCase();

  // Keywords that suggest entity types
  const typeKeywords = {
    project: ['dự án', 'project', 'proyecto'],
    workflow: ['workflow', 'quy trình', 'automation', 'tự động'],
    execution: ['execution', 'thực thi', 'chạy', 'run', 'kết quả', 'result'],
  };

  if (typeKeywords[entityType]) {
    for (const keyword of typeKeywords[entityType]) {
      if (queryLower.includes(keyword)) {
        return 1.0; // Full boost if keyword matches
      }
    }
  }

  return 0.5; // Neutral
}

/**
 * Summarize retrieved context into a concise description
 * @param {Array} results - Enhanced search results
 * @param {string} query - Original query
 * @returns {string} Context summary
 */
function summarizeContext(results, query) {
  if (!results || results.length === 0) {
    return 'No relevant context found.';
  }

  const topResults = results.slice(0, 3); // Top 3 most relevant

  const summaries = topResults.map((result, index) => {
    const typeLabel = {
      project: 'Dự án',
      workflow: 'Workflow',
      execution: 'Execution',
      agent: 'Agent',
      post: 'Post',
      keyword: 'Keyword',
    }[result.entity_type] || result.entity_type;

    return `${index + 1}. ${typeLabel}: ${result.entity_name}${result.entity_description ? ` - ${result.entity_description.substring(0, 100)}` : ''}`;
  });

  return `Found ${results.length} relevant results:\n${summaries.join('\n')}`;
}

/**
 * Retrieve context for multiple queries in batch
 * @param {string[]} queries - Array of queries
 * @param {object} options - Retrieval options
 * @returns {Promise<Array>} Array of context results
 */
async function retrieveContextBatch(queries, options = {}) {
  try {
    const results = await Promise.all(
      queries.map(query => retrieveContext(query, options))
    );

    return results;
  } catch (error) {
    console.error('Error in batch context retrieval:', error);
    throw error;
  }
}

/**
 * Retrieve context with additional business context
 * Combines semantic search with business context service
 * @param {string} query - Search query
 * @param {object} options - Retrieval options
 * @returns {Promise<object>} Combined context
 */
async function retrieveEnhancedContext(query, options = {}) {
  try {
    // Get business context first (always works)
    const businessContextData = await businessContext.load();

    // Try semantic search, but gracefully handle failures
    let semanticContext = { results: [], error: null };
    try {
      semanticContext = await retrieveContext(query, { ...options, useOptimizer: false });
    } catch (semanticError) {
      console.warn('[Context] Semantic search unavailable:', semanticError.message);
      semanticContext = { 
        results: [], 
        error: semanticError.message,
        fallback: true,
      };
    }

    // Combine contexts
    return {
      semantic: semanticContext,
      business: {
        currentProjects: businessContextData.currentProjects || [],
        recentWorkflows: businessContextData.recentWorkflows || [],
        domain: businessContextData.domain || 'longsang',
      },
      combined: {
        projects: [
          ...(semanticContext.results || []).filter(r => r.entity_type === 'project'),
          ...(businessContextData.currentProjects || []).map(p => ({
            entity_type: 'project',
            entity_id: p.id,
            entity_name: p.name,
            source: 'business_context',
          })),
        ],
        workflows: [
          ...(semanticContext.results || []).filter(r => r.entity_type === 'workflow'),
          ...(businessContextData.recentWorkflows || []).map(w => ({
            entity_type: 'workflow',
            entity_id: w.id,
            entity_name: w.name,
            source: 'business_context',
          })),
        ],
      },
    };
  } catch (error) {
    console.error('Error retrieving enhanced context:', error);
    // Return minimal context on error instead of throwing
    return {
      semantic: { results: [], error: error.message },
      business: { currentProjects: [], recentWorkflows: [], domain: 'longsang' },
      combined: { projects: [], workflows: [] },
    };
  }
}

/**
 * Clear cache
 */
function clearCache() {
  cache.clear();
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  return {
    size: cache.size,
    entries: Array.from(cache.keys()),
  };
}

module.exports = {
  retrieveContext,
  retrieveContextBatch,
  retrieveEnhancedContext,
  enhanceWithRelevanceScoring,
  summarizeContext,
  clearCache,
  getCacheStats,
};


