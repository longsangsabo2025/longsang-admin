/**
 * Rate Limiting Middleware
 * Per-user, per-endpoint, and IP-based rate limiting
 */

const rateLimitMap = new Map();
const ipRateLimitMap = new Map();

// Default rate limits
const DEFAULT_LIMITS = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per window
};

// Per-endpoint rate limits
const ENDPOINT_LIMITS = {
  '/api/brain/knowledge/search': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 searches per minute
  },
  '/api/brain/learning/feedback': {
    windowMs: 60 * 1000,
    maxRequests: 10, // 10 feedback submissions per minute
  },
  '/api/brain/analytics/track': {
    windowMs: 60 * 1000,
    maxRequests: 50, // 50 events per minute
  },
  '/api/brain/workflows/:id/test': {
    windowMs: 60 * 1000,
    maxRequests: 5, // 5 workflow tests per minute
  },
};

/**
 * Clean up expired entries
 */
function cleanupExpiredEntries(map, windowMs) {
  const now = Date.now();
  for (const [key, value] of map.entries()) {
    if (now - value.resetTime > windowMs) {
      map.delete(key);
    }
  }
}

/**
 * Get rate limit info
 */
function getRateLimitInfo(key, map, limits) {
  const now = Date.now();
  const entry = map.get(key);

  if (!entry || now - entry.resetTime > limits.windowMs) {
    // Create new entry or reset expired one
    map.set(key, {
      count: 1,
      resetTime: now,
    });
    return {
      remaining: limits.maxRequests - 1,
      reset: new Date(now + limits.windowMs),
      limit: limits.maxRequests,
    };
  }

  if (entry.count >= limits.maxRequests) {
    return {
      remaining: 0,
      reset: new Date(entry.resetTime + limits.windowMs),
      limit: limits.maxRequests,
    };
  }

  entry.count += 1;
  return {
    remaining: limits.maxRequests - entry.count,
    reset: new Date(entry.resetTime + limits.windowMs),
    limit: limits.maxRequests,
  };
}

/**
 * Find matching endpoint limit
 */
function findEndpointLimit(path) {
  for (const [pattern, limits] of Object.entries(ENDPOINT_LIMITS)) {
    // Simple pattern matching (supports :id placeholders)
    const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$');
    if (regex.test(path)) {
      return limits;
    }
  }
  return null;
}

/**
 * Rate limiter middleware
 */
function rateLimiter(req, res, next) {
  const userId = req.headers['x-user-id'] || req.user?.id;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const path = req.path;

  // Get limits for this endpoint
  const endpointLimits = findEndpointLimit(path);
  const limits = endpointLimits || DEFAULT_LIMITS;

  // Cleanup expired entries periodically (every 5 minutes)
  if (Math.random() < 0.01) {
    // 1% chance to cleanup on each request
    cleanupExpiredEntries(rateLimitMap, limits.windowMs);
    cleanupExpiredEntries(ipRateLimitMap, limits.windowMs);
  }

  // Check IP-based rate limit
  const ipKey = `ip:${ip}`;
  const ipLimitInfo = getRateLimitInfo(ipKey, ipRateLimitMap, limits);

  if (ipLimitInfo.remaining < 0) {
    res.setHeader('X-RateLimit-Limit', ipLimitInfo.limit);
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('X-RateLimit-Reset', Math.floor(ipLimitInfo.reset.getTime() / 1000));
    return res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests from this IP address',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((ipLimitInfo.reset.getTime() - Date.now()) / 1000),
      },
    });
  }

  // Check user-based rate limit (if user is authenticated)
  if (userId) {
    const userKey = `user:${userId}:${path}`;
    const userLimitInfo = getRateLimitInfo(userKey, rateLimitMap, limits);

    if (userLimitInfo.remaining < 0) {
      res.setHeader('X-RateLimit-Limit', userLimitInfo.limit);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.floor(userLimitInfo.reset.getTime() / 1000));
      return res.status(429).json({
        success: false,
        error: {
          message: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((userLimitInfo.reset.getTime() - Date.now()) / 1000),
        },
      });
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', userLimitInfo.limit);
    res.setHeader('X-RateLimit-Remaining', userLimitInfo.remaining);
    res.setHeader('X-RateLimit-Reset', Math.floor(userLimitInfo.reset.getTime() / 1000));
  } else {
    // For IP-based limits
    res.setHeader('X-RateLimit-Limit', ipLimitInfo.limit);
    res.setHeader('X-RateLimit-Remaining', ipLimitInfo.remaining);
    res.setHeader('X-RateLimit-Reset', Math.floor(ipLimitInfo.reset.getTime() / 1000));
  }

  next();
}

/**
 * Create custom rate limiter with specific limits
 */
function createRateLimiter(customLimits) {
  return (req, res, next) => {
    const limits = { ...DEFAULT_LIMITS, ...customLimits };
    const userId = req.headers['x-user-id'] || req.user?.id;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    const key = userId ? `user:${userId}` : `ip:${ip}`;
    const map = userId ? rateLimitMap : ipRateLimitMap;

    const limitInfo = getRateLimitInfo(key, map, limits);

    if (limitInfo.remaining < 0) {
      res.setHeader('X-RateLimit-Limit', limitInfo.limit);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.floor(limitInfo.reset.getTime() / 1000));
      return res.status(429).json({
        success: false,
        error: {
          message: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((limitInfo.reset.getTime() - Date.now()) / 1000),
        },
      });
    }

    res.setHeader('X-RateLimit-Limit', limitInfo.limit);
    res.setHeader('X-RateLimit-Remaining', limitInfo.remaining);
    res.setHeader('X-RateLimit-Reset', Math.floor(limitInfo.reset.getTime() / 1000));

    next();
  };
}

module.exports = {
  rateLimiter,
  createRateLimiter,
  DEFAULT_LIMITS,
  ENDPOINT_LIMITS,
};


