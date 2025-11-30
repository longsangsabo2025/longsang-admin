/**
 * 📊 Metrics Collector Service
 *
 * Collects and aggregates performance metrics, usage statistics,
 * and system health metrics
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

// In-memory metrics storage (can be replaced with database or external service)
const metrics = {
  requests: {
    total: 0,
    byEndpoint: {},
    byMethod: {},
    byStatus: {},
  },
  responseTimes: [],
  errors: [],
  cache: {
    hits: 0,
    misses: 0,
  },
  performance: {
    operations: {},
  },
  timestamps: {
    start: Date.now(),
    lastReset: Date.now(),
  },
};

const MAX_METRICS_HISTORY = 1000;

/**
 * Record API request metric
 */
function recordRequest(endpoint, method, statusCode, responseTime) {
  metrics.requests.total++;

  // By endpoint
  if (!metrics.requests.byEndpoint[endpoint]) {
    metrics.requests.byEndpoint[endpoint] = {
      count: 0,
      totalTime: 0,
      errors: 0,
    };
  }
  metrics.requests.byEndpoint[endpoint].count++;
  metrics.requests.byEndpoint[endpoint].totalTime += responseTime;
  if (statusCode >= 400) {
    metrics.requests.byEndpoint[endpoint].errors++;
  }

  // By method
  if (!metrics.requests.byMethod[method]) {
    metrics.requests.byMethod[method] = 0;
  }
  metrics.requests.byMethod[method]++;

  // By status
  const statusGroup = `${Math.floor(statusCode / 100)}xx`;
  if (!metrics.requests.byStatus[statusGroup]) {
    metrics.requests.byStatus[statusGroup] = 0;
  }
  metrics.requests.byStatus[statusGroup]++;

  // Response time
  metrics.responseTimes.push({
    endpoint,
    method,
    responseTime,
    timestamp: Date.now(),
  });

  // Limit history
  if (metrics.responseTimes.length > MAX_METRICS_HISTORY) {
    metrics.responseTimes.shift();
  }

  // Track errors
  if (statusCode >= 400) {
    metrics.errors.push({
      endpoint,
      method,
      statusCode,
      timestamp: Date.now(),
    });

    if (metrics.errors.length > MAX_METRICS_HISTORY) {
      metrics.errors.shift();
    }
  }
}

/**
 * Record cache hit/miss
 */
function recordCache(type, hit) {
  if (!metrics.cache[type]) {
    metrics.cache[type] = { hits: 0, misses: 0 };
  }

  if (hit) {
    metrics.cache[type].hits++;
    metrics.cache.hits++;
  } else {
    metrics.cache[type].misses++;
    metrics.cache.misses++;
  }
}

/**
 * Record performance operation
 */
function recordPerformance(operation, duration, metadata = {}) {
  if (!metrics.performance.operations[operation]) {
    metrics.performance.operations[operation] = {
      count: 0,
      totalTime: 0,
      min: Infinity,
      max: 0,
      avg: 0,
    };
  }

  const opMetrics = metrics.performance.operations[operation];
  opMetrics.count++;
  opMetrics.totalTime += duration;
  opMetrics.min = Math.min(opMetrics.min, duration);
  opMetrics.max = Math.max(opMetrics.max, duration);
  opMetrics.avg = opMetrics.totalTime / opMetrics.count;
  opMetrics.lastDuration = duration;
  opMetrics.lastTimestamp = Date.now();
  opMetrics.metadata = metadata;
}

/**
 * Record error
 */
function recordError(endpoint, error, context = {}) {
  metrics.errors.push({
    endpoint,
    error: error.message || error,
    stack: error.stack,
    context,
    timestamp: Date.now(),
  });

  if (metrics.errors.length > MAX_METRICS_HISTORY) {
    metrics.errors.shift();
  }
}

/**
 * Get metrics summary
 */
function getMetrics(timeWindow = 3600000) {
  const now = Date.now();
  const windowStart = now - timeWindow;

  // Filter recent metrics
  const recentResponseTimes = metrics.responseTimes.filter(
    (m) => m.timestamp >= windowStart
  );
  const recentErrors = metrics.errors.filter((e) => e.timestamp >= windowStart);

  // Calculate statistics
  const responseTimeStats = recentResponseTimes.length > 0
    ? {
        count: recentResponseTimes.length,
        avg: recentResponseTimes.reduce((sum, m) => sum + m.responseTime, 0) /
          recentResponseTimes.length,
        min: Math.min(...recentResponseTimes.map((m) => m.responseTime)),
        max: Math.max(...recentResponseTimes.map((m) => m.responseTime)),
        p50: percentile(recentResponseTimes.map((m) => m.responseTime), 50),
        p95: percentile(recentResponseTimes.map((m) => m.responseTime), 95),
        p99: percentile(recentResponseTimes.map((m) => m.responseTime), 99),
      }
    : null;

  // Cache statistics
  const totalCacheOps = metrics.cache.hits + metrics.cache.misses;
  const cacheHitRate = totalCacheOps > 0
    ? (metrics.cache.hits / totalCacheOps) * 100
    : 0;

  return {
    requests: {
      total: metrics.requests.total,
      byEndpoint: Object.entries(metrics.requests.byEndpoint).reduce(
        (acc, [endpoint, data]) => {
          acc[endpoint] = {
            count: data.count,
            avgTime: data.count > 0 ? data.totalTime / data.count : 0,
            errorRate: data.count > 0 ? (data.errors / data.count) * 100 : 0,
          };
          return acc;
        },
        {}
      ),
      byMethod: metrics.requests.byMethod,
      byStatus: metrics.requests.byStatus,
    },
    responseTimes: responseTimeStats,
    errors: {
      total: metrics.errors.length,
      recent: recentErrors.length,
      recentErrors: recentErrors.slice(-10), // Last 10 errors
    },
    cache: {
      hits: metrics.cache.hits,
      misses: metrics.cache.misses,
      hitRate: cacheHitRate,
    },
    performance: metrics.performance.operations,
    uptime: {
      start: metrics.timestamps.start,
      duration: now - metrics.timestamps.start,
      lastReset: metrics.timestamps.lastReset,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Calculate percentile
 */
function percentile(sortedArray, percentile) {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, index)];
}

/**
 * Reset metrics
 */
function resetMetrics() {
  Object.keys(metrics).forEach((key) => {
    if (key === 'timestamps') {
      metrics.timestamps.lastReset = Date.now();
    } else if (typeof metrics[key] === 'object' && metrics[key] !== null) {
      if (Array.isArray(metrics[key])) {
        metrics[key] = [];
      } else {
        metrics[key] = {};
      }
    } else if (typeof metrics[key] === 'number') {
      metrics[key] = 0;
    }
  });
}

/**
 * Get endpoint-specific metrics
 */
function getEndpointMetrics(endpoint, timeWindow = 3600000) {
  const now = Date.now();
  const windowStart = now - timeWindow;

  const endpointRequests = metrics.responseTimes.filter(
    (m) => m.endpoint === endpoint && m.timestamp >= windowStart
  );

  if (endpointRequests.length === 0) {
    return null;
  }

  return {
    count: endpointRequests.length,
    avgResponseTime: endpointRequests.reduce((sum, m) => sum + m.responseTime, 0) /
      endpointRequests.length,
    minResponseTime: Math.min(...endpointRequests.map((m) => m.responseTime)),
    maxResponseTime: Math.max(...endpointRequests.map((m) => m.responseTime)),
  };
}

module.exports = {
  recordRequest,
  recordCache,
  recordPerformance,
  recordError,
  getMetrics,
  getEndpointMetrics,
  resetMetrics,
};

