/**
 * ⚡ Performance Optimizer Service
 *
 * Optimizes context retrieval speed, implements caching,
 * request batching, and hot path optimization
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

const NodeCache = require('node-cache');
const { createClient } = require('@supabase/supabase-js');

// Lazy require to avoid circular dependency
let contextRetrieval = null;
function getContextRetrieval() {
  if (!contextRetrieval) {
    contextRetrieval = require('./context-retrieval');
  }
  return contextRetrieval;
}

const supabaseUrl = process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Cache configuration
const CACHE_TTL = {
  context: 300, // 5 minutes
  embeddings: 3600, // 1 hour
  suggestions: 600, // 10 minutes
  userPreferences: 1800, // 30 minutes
};

// Initialize caches
const contextCache = new NodeCache({
  stdTTL: CACHE_TTL.context,
  checkperiod: 60,
  useClones: false,
});

const embeddingCache = new NodeCache({
  stdTTL: CACHE_TTL.embeddings,
  checkperiod: 300,
  useClones: false,
});

const suggestionsCache = new NodeCache({
  stdTTL: CACHE_TTL.suggestions,
  checkperiod: 120,
  useClones: false,
});

const userPreferencesCache = new NodeCache({
  stdTTL: CACHE_TTL.userPreferences,
  checkperiod: 300,
  useClones: false,
});

/**
 * Get cached context or retrieve and cache
 * @param {string} query - Search query
 * @param {object} options - Retrieval options
 * @returns {Promise<object>} Context results
 */
async function getCachedContext(query, options = {}) {
  try {
    const cacheKey = generateCacheKey('context', { query, options });

    // Check cache first
    const cached = contextCache.get(cacheKey);
    if (cached) {
      return {
        ...cached,
        fromCache: true,
      };
    }

    // Retrieve from database
    const startTime = Date.now();
    const results = await getContextRetrieval().retrieveEnhancedContext(query, options);
    const retrievalTime = Date.now() - startTime;

    // Cache results
    contextCache.set(cacheKey, {
      ...results,
      retrievalTime,
    });

    return {
      ...results,
      fromCache: false,
      retrievalTime,
    };
  } catch (error) {
    console.error('Error in cached context retrieval:', error);
    // Fallback to non-cached
    return await getContextRetrieval().retrieveEnhancedContext(query, options);
  }
}

/**
 * Batch multiple context queries
 * @param {Array} queries - Array of queries
 * @param {object} options - Shared options
 * @returns {Promise<Array>} Array of results
 */
async function batchContextQueries(queries, options = {}) {
  try {
    // Check cache for all queries first
    const results = [];
    const uncachedQueries = [];
    const cacheKeys = [];

    queries.forEach((query, index) => {
      const cacheKey = generateCacheKey('context', { query, options });
      cacheKeys[index] = cacheKey;
      const cached = contextCache.get(cacheKey);

      if (cached) {
        results[index] = {
          ...cached,
          fromCache: true,
        };
      } else {
        uncachedQueries.push({ query, index });
      }
    });

    // Batch retrieve uncached queries
    if (uncachedQueries.length > 0) {
      const startTime = Date.now();

      // Execute in parallel (limited concurrency)
      const batchSize = 5; // Limit concurrent requests
      const batches = [];
      for (let i = 0; i < uncachedQueries.length; i += batchSize) {
        batches.push(uncachedQueries.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        const batchResults = await Promise.allSettled(
          batch.map(({ query }) => getContextRetrieval().retrieveEnhancedContext(query, options))
        );

        batchResults.forEach((result, batchIndex) => {
          const originalIndex = batch[batchIndex + results.length - uncachedQueries.length].index;
          if (result.status === 'fulfilled') {
            const data = result.value;
            results[originalIndex] = {
              ...data,
              fromCache: false,
            };
            // Cache result
            contextCache.set(cacheKeys[originalIndex], data);
          } else {
            results[originalIndex] = {
              error: result.reason?.message || 'Retrieval failed',
              fromCache: false,
            };
          }
        });
      }

      const batchTime = Date.now() - startTime;
      console.log(`Batch retrieved ${uncachedQueries.length} queries in ${batchTime}ms`);
    }

    return results;
  } catch (error) {
    console.error('Error in batch context queries:', error);
    throw error;
  }
}

/**
 * Cache embeddings
 * @param {string} text - Text to cache
 * @param {Array} embedding - Embedding vector
 */
function cacheEmbedding(text, embedding) {
  const cacheKey = generateCacheKey('embedding', { text });
  embeddingCache.set(cacheKey, embedding);
}

/**
 * Get cached embedding
 * @param {string} text - Text to lookup
 * @returns {Array|null} Cached embedding or null
 */
function getCachedEmbedding(text) {
  const cacheKey = generateCacheKey('embedding', { text });
  return embeddingCache.get(cacheKey) || null;
}

/**
 * Cache user suggestions
 * @param {string} userId - User ID
 * @param {Array} suggestions - Suggestions array
 */
function cacheSuggestions(userId, suggestions) {
  const cacheKey = generateCacheKey('suggestions', { userId });
  suggestionsCache.set(cacheKey, suggestions);
}

/**
 * Get cached suggestions
 * @param {string} userId - User ID
 * @returns {Array|null} Cached suggestions or null
 */
function getCachedSuggestions(userId) {
  const cacheKey = generateCacheKey('suggestions', { userId });
  return suggestionsCache.get(cacheKey) || null;
}

/**
 * Cache user preferences
 * @param {string} userId - User ID
 * @param {object} preferences - Preferences object
 */
function cacheUserPreferences(userId, preferences) {
  const cacheKey = generateCacheKey('preferences', { userId });
  userPreferencesCache.set(cacheKey, preferences);
}

/**
 * Get cached user preferences
 * @param {string} userId - User ID
 * @returns {object|null} Cached preferences or null
 */
function getCachedUserPreferences(userId) {
  const cacheKey = generateCacheKey('preferences', { userId });
  return userPreferencesCache.get(cacheKey) || null;
}

/**
 * Optimize context retrieval with parallel queries
 * @param {string} query - Search query
 * @param {object} options - Options
 * @returns {Promise<object>} Optimized results
 */
async function optimizedContextRetrieval(query, options = {}) {
  try {
    const startTime = Date.now();

    // Use cached retrieval
    const results = await getCachedContext(query, options);

    // Parallel enrichments if needed
    const enrichments = [];

    if (options.includeProjects && !results.projects) {
      enrichments.push(
        supabase
          .from('projects')
          .select('id, name, description')
          .limit(5)
          .then(({ data }) => data || [])
      );
    }

    if (options.includeWorkflows && !results.workflows) {
      enrichments.push(
        supabase
          .from('project_workflows')
          .select('id, name, description')
          .limit(5)
          .then(({ data }) => data || [])
      );
    }

    // Wait for enrichments in parallel
    if (enrichments.length > 0) {
      const enrichmentResults = await Promise.allSettled(enrichments);
      enrichmentResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          if (index === 0) results.projects = result.value;
          if (index === 1) results.workflows = result.value;
        }
      });
    }

    const totalTime = Date.now() - startTime;
    results.optimization = {
      totalTime,
      fromCache: results.fromCache || false,
      enrichments: enrichments.length,
    };

    return results;
  } catch (error) {
    console.error('Error in optimized context retrieval:', error);
    throw error;
  }
}

/**
 * Clear specific cache
 * @param {string} cacheType - Cache type (context, embedding, suggestions, preferences)
 * @param {string} key - Optional specific key
 */
function clearCache(cacheType, key = null) {
  const caches = {
    context: contextCache,
    embedding: embeddingCache,
    suggestions: suggestionsCache,
    preferences: userPreferencesCache,
  };

  const cache = caches[cacheType];
  if (!cache) {
    throw new Error(`Unknown cache type: ${cacheType}`);
  }

  if (key) {
    cache.del(key);
  } else {
    cache.flushAll();
  }
}

/**
 * Get cache statistics
 * @returns {object} Cache stats
 */
function getCacheStats() {
  return {
    context: {
      keys: contextCache.keys().length,
      hits: contextCache.getStats().hits || 0,
      misses: contextCache.getStats().misses || 0,
    },
    embedding: {
      keys: embeddingCache.keys().length,
      hits: embeddingCache.getStats().hits || 0,
      misses: embeddingCache.getStats().misses || 0,
    },
    suggestions: {
      keys: suggestionsCache.keys().length,
      hits: suggestionsCache.getStats().hits || 0,
      misses: suggestionsCache.getStats().misses || 0,
    },
    preferences: {
      keys: userPreferencesCache.keys().length,
      hits: userPreferencesCache.getStats().hits || 0,
      misses: userPreferencesCache.getStats().misses || 0,
    },
  };
}

/**
 * Generate cache key from parameters
 */
function generateCacheKey(type, params) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${JSON.stringify(params[key])}`)
    .join('|');
  return `${type}:${Buffer.from(sortedParams).toString('base64')}`;
}

/**
 * Profile hot paths and identify bottlenecks
 * @param {Function} fn - Function to profile
 * @param {string} name - Function name
 * @returns {Function} Profiled function
 */
function profileHotPath(fn, name) {
  return async (...args) => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    try {
      const result = await fn(...args);
      const endTime = Date.now();
      const endMemory = process.memoryUsage();

      const metrics = {
        name,
        executionTime: endTime - startTime,
        memoryDelta: endMemory.heapUsed - startMemory.heapUsed,
        timestamp: new Date().toISOString(),
      };

      // Log if slow (> 1 second) or high memory (> 10MB)
      if (metrics.executionTime > 1000 || metrics.memoryDelta > 10 * 1024 * 1024) {
        console.warn(`⚠️ Slow/high-memory operation detected:`, metrics);
      }

      return result;
    } catch (error) {
      const endTime = Date.now();
      console.error(`❌ Error in profiled function ${name}:`, {
        executionTime: endTime - startTime,
        error: error.message,
      });
      throw error;
    }
  };
}

/**
 * Optimize database queries with connection pooling hints
 */
async function optimizedDatabaseQuery(table, filters, options = {}) {
  try {
    const { select = '*', limit = 100, orderBy = 'created_at', orderAsc = false } = options;

    let query = supabase.from(table).select(select);

    // Apply filters efficiently
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      }
    });

    // Apply ordering
    query = query.order(orderBy, { ascending: orderAsc });

    // Apply limit
    query = query.limit(limit);

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error(`Error in optimized database query for ${table}:`, error);
    throw error;
  }
}

module.exports = {
  getCachedContext,
  batchContextQueries,
  cacheEmbedding,
  getCachedEmbedding,
  cacheSuggestions,
  getCachedSuggestions,
  cacheUserPreferences,
  getCachedUserPreferences,
  optimizedContextRetrieval,
  clearCache,
  getCacheStats,
  profileHotPath,
  optimizedDatabaseQuery,
  CACHE_TTL,
};

