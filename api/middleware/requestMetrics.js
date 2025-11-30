/**
 * 📊 Request Metrics Middleware
 * 
 * Automatically collects metrics for all API requests
 * 
 * @author LongSang Admin
 * @version 1.0.0
 */

const metricsCollector = require('../services/metrics-collector');

/**
 * Middleware to track request metrics
 */
function requestMetricsMiddleware(req, res, next) {
  const startTime = Date.now();
  const originalEnd = res.end;
  
  // Get clean endpoint (remove query params and IDs)
  const cleanEndpoint = req.path
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
    .replace(/\/\d+/g, '/:id');

  res.end = function (...args) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Record to metrics collector
    metricsCollector.recordRequest(cleanEndpoint, req.method, statusCode, duration);

    return originalEnd.apply(this, args);
  };

  next();
}

module.exports = requestMetricsMiddleware;
