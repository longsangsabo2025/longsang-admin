/**
 * Cache Service
 * Redis caching for frequent queries and computed results
 */

const redis = require('redis');
require('dotenv').config();

const redisUrl = process.env.REDIS_URL || process.env.REDISCLOUD_URL;
let redisClient = null;

// Initialize Redis client if available
if (redisUrl) {
  redisClient = redis.createClient({
    url: redisUrl,
  });

  redisClient.on('error', (err) => {
    console.error('[Cache Service] Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('[Cache Service] Redis connected');
  });

  redisClient.connect().catch((err) => {
    console.error('[Cache Service] Failed to connect to Redis:', err);
    redisClient = null;
  });
} else {
  console.warn('[Cache Service] Redis URL not configured, caching disabled');
}

/**
 * Get value from cache
 */
async function get(key) {
  if (!redisClient) return null;
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`[Cache Service] Error getting key ${key}:`, error);
    return null;
  }
}

/**
 * Set value in cache with TTL
 */
async function set(key, value, ttlSeconds = 300) {
  if (!redisClient) return false;
  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`[Cache Service] Error setting key ${key}:`, error);
    return false;
  }
}

/**
 * Delete key from cache
 */
async function del(key) {
  if (!redisClient) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error(`[Cache Service] Error deleting key ${key}:`, error);
    return false;
  }
}

/**
 * Delete multiple keys matching pattern
 */
async function delPattern(pattern) {
  if (!redisClient) return false;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    console.error(`[Cache Service] Error deleting pattern ${pattern}:`, error);
    return false;
  }
}

/**
 * Cache domain statistics
 */
async function getDomainStats(domainId) {
  const key = `domain:stats:${domainId}`;
  return get(key);
}

async function setDomainStats(domainId, stats, ttlSeconds = 300) {
  const key = `domain:stats:${domainId}`;
  return set(key, stats, ttlSeconds);
}

async function invalidateDomainStats(domainId) {
  const key = `domain:stats:${domainId}`;
  return del(key);
}

/**
 * Cache knowledge search results
 */
async function getKnowledgeSearch(query, domainId, limit) {
  const key = `knowledge:search:${domainId}:${Buffer.from(query).toString('base64')}:${limit}`;
  return get(key);
}

async function setKnowledgeSearch(query, domainId, limit, results, ttlSeconds = 300) {
  const key = `knowledge:search:${domainId}:${Buffer.from(query).toString('base64')}:${limit}`;
  return set(key, results, ttlSeconds);
}

async function invalidateKnowledgeSearch(domainId) {
  const pattern = `knowledge:search:${domainId}:*`;
  return delPattern(pattern);
}

/**
 * Cache core logic queries
 */
async function getCoreLogicQuery(domainId, query) {
  const key = `core_logic:query:${domainId}:${Buffer.from(query).toString('base64')}`;
  return get(key);
}

async function setCoreLogicQuery(domainId, query, results, ttlSeconds = 600) {
  const key = `core_logic:query:${domainId}:${Buffer.from(query).toString('base64')}`;
  return set(key, results, ttlSeconds);
}

async function invalidateCoreLogicQuery(domainId) {
  const pattern = `core_logic:query:${domainId}:*`;
  return delPattern(pattern);
}

/**
 * Cache user-specific data
 */
async function getUserCache(userId, cacheType, key) {
  const cacheKey = `user:${userId}:${cacheType}:${key}`;
  return get(cacheKey);
}

async function setUserCache(userId, cacheType, key, value, ttlSeconds = 300) {
  const cacheKey = `user:${userId}:${cacheType}:${key}`;
  return set(cacheKey, value, ttlSeconds);
}

async function invalidateUserCache(userId, cacheType) {
  const pattern = `user:${userId}:${cacheType}:*`;
  return delPattern(pattern);
}

/**
 * Check if cache is available
 */
function isAvailable() {
  return redisClient !== null;
}

module.exports = {
  get,
  set,
  del,
  delPattern,
  getDomainStats,
  setDomainStats,
  invalidateDomainStats,
  getKnowledgeSearch,
  setKnowledgeSearch,
  invalidateKnowledgeSearch,
  getCoreLogicQuery,
  setCoreLogicQuery,
  invalidateCoreLogicQuery,
  getUserCache,
  setUserCache,
  invalidateUserCache,
  isAvailable,
};


