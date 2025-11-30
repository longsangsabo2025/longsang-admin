/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse
 */

const rateLimit = require("express-rate-limit");

// Check if in development mode
const isDev = process.env.NODE_ENV !== 'production';

// General API rate limiter - RELAXED for single-user app
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute (shorter window)
  max: isDev ? 500 : 200, // 500 in dev, 200 in production
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for conversation fetches
    if (req.path.includes('/conversations/')) return true;
    return false;
  },
});

// Strict rate limiter for sensitive endpoints (auth, payments)
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 50 : 10, // More relaxed in dev
  message: "Too many attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Very strict for login/signup
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDev ? 20 : 5, // More relaxed in dev
  message: "Too many authentication attempts, please try again in an hour.",
  standardHeaders: true,
  legacyHeaders: false,
});

// AI endpoints (expensive operations) - RELAXED for better UX
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isDev ? 100 : 50, // 100 in dev, 50 in production
  message: "AI rate limit exceeded, please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Document upload limiter
const documentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isDev ? 200 : 100, // Very relaxed for dev
  message: "Too many document requests, please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  strictLimiter,
  authLimiter,
  aiLimiter,
  documentLimiter,
};
