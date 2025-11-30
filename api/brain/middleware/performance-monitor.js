/**
 * Performance Monitoring Middleware
 * Tracks request timing, slow queries, and API performance
 */

const SLOW_QUERY_THRESHOLD_MS = parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || '1000', 10);
const SLOW_REQUEST_THRESHOLD_MS = parseInt(process.env.SLOW_REQUEST_THRESHOLD_MS || '500', 10);

/**
 * Request timing middleware
 */
function performanceMonitor(req, res, next) {
  const startTime = Date.now();
  const requestId = req.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.id = requestId;
  req.startTime = startTime;

  // Track response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const isSlow = duration > SLOW_REQUEST_THRESHOLD_MS;

    // Log slow requests
    if (isSlow) {
      console.warn(`[Performance Monitor] Slow request detected:`, {
        requestId,
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        threshold: `${SLOW_REQUEST_THRESHOLD_MS}ms`,
        userId: req.headers['x-user-id'] || req.user?.id,
      });
    }

    // Log all requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance Monitor] ${req.method} ${req.path} - ${duration}ms`);
    }

    // Add performance headers
    res.setHeader('X-Response-Time', `${duration}ms`);
    res.setHeader('X-Request-ID', requestId);
  });

  next();
}

/**
 * Database query performance logger
 */
function logSlowQuery(query, duration, context = {}) {
  if (duration > SLOW_QUERY_THRESHOLD_MS) {
    console.warn(`[Performance Monitor] Slow query detected:`, {
      query: query.substring(0, 200), // Truncate long queries
      duration: `${duration}ms`,
      threshold: `${SLOW_QUERY_THRESHOLD_MS}ms`,
      context,
    });
  }
}

/**
 * Track API endpoint performance
 */
const endpointStats = new Map();

function trackEndpoint(method, path, duration, statusCode) {
  const key = `${method}:${path}`;
  if (!endpointStats.has(key)) {
    endpointStats.set(key, {
      count: 0,
      totalDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      errors: 0,
    });
  }

  const stats = endpointStats.get(key);
  stats.count += 1;
  stats.totalDuration += duration;
  stats.minDuration = Math.min(stats.minDuration, duration);
  stats.maxDuration = Math.max(stats.maxDuration, duration);

  if (statusCode >= 400) {
    stats.errors += 1;
  }
}

/**
 * Get endpoint statistics
 */
function getEndpointStats() {
  const stats = {};
  endpointStats.forEach((value, key) => {
    stats[key] = {
      ...value,
      avgDuration: value.totalDuration / value.count,
      errorRate: value.errors / value.count,
    };
  });
  return stats;
}

/**
 * Reset endpoint statistics
 */
function resetEndpointStats() {
  endpointStats.clear();
}

/**
 * Enhanced performance monitor with endpoint tracking
 */
function enhancedPerformanceMonitor(req, res, next) {
  const startTime = Date.now();
  const requestId = req.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.id = requestId;
  req.startTime = startTime;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const isSlow = duration > SLOW_REQUEST_THRESHOLD_MS;

    // Track endpoint performance
    trackEndpoint(req.method, req.path, duration, res.statusCode);

    if (isSlow) {
      console.warn(`[Performance Monitor] Slow request:`, {
        requestId,
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
      });
    }

    res.setHeader('X-Response-Time', `${duration}ms`);
    res.setHeader('X-Request-ID', requestId);
  });

  next();
}

module.exports = {
  performanceMonitor,
  enhancedPerformanceMonitor,
  logSlowQuery,
  trackEndpoint,
  getEndpointStats,
  resetEndpointStats,
  SLOW_QUERY_THRESHOLD_MS,
  SLOW_REQUEST_THRESHOLD_MS,
};


