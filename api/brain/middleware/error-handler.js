/**
 * Centralized Error Handler Middleware
 * Handles all errors with proper categorization and logging
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Error categories
const ERROR_CATEGORIES = {
  VALIDATION: 'validation',
  DATABASE: 'database',
  EXTERNAL_API: 'external_api',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NOT_FOUND: 'not_found',
  RATE_LIMIT: 'rate_limit',
  INTERNAL: 'internal',
};

/**
 * Categorize error
 */
function categorizeError(error) {
  if (error.name === 'ValidationError' || error.message?.includes('required') || error.message?.includes('invalid')) {
    return ERROR_CATEGORIES.VALIDATION;
  }
  if (error.message?.includes('database') || error.message?.includes('SQL') || error.code?.startsWith('P')) {
    return ERROR_CATEGORIES.DATABASE;
  }
  if (error.message?.includes('API') || error.message?.includes('network') || error.message?.includes('timeout')) {
    return ERROR_CATEGORIES.EXTERNAL_API;
  }
  if (error.message?.includes('unauthorized') || error.message?.includes('authentication')) {
    return ERROR_CATEGORIES.AUTHENTICATION;
  }
  if (error.message?.includes('forbidden') || error.message?.includes('permission')) {
    return ERROR_CATEGORIES.AUTHORIZATION;
  }
  if (error.message?.includes('not found') || error.statusCode === 404) {
    return ERROR_CATEGORIES.NOT_FOUND;
  }
  if (error.message?.includes('rate limit') || error.statusCode === 429) {
    return ERROR_CATEGORIES.RATE_LIMIT;
  }
  return ERROR_CATEGORIES.INTERNAL;
}

/**
 * Log error to database (optional)
 */
async function logErrorToDatabase(error, category, context = {}) {
  if (!supabase) return;

  try {
    await supabase.from('brain_error_logs').insert({
      error_message: error.message || String(error),
      error_stack: error.stack,
      error_category: category,
      context: context,
      user_id: context.userId || null,
      created_at: new Date().toISOString(),
    });
  } catch (logError) {
    // Fallback to console if database logging fails
    console.error('[Error Handler] Failed to log to database:', logError);
  }
}

/**
 * Error handler middleware
 */
function errorHandler(err, req, res, next) {
  const category = categorizeError(err);
  const context = {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    userId: req.headers['x-user-id'] || req.user?.id,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
  };

  // Log error
  console.error(`[Error Handler] ${category.toUpperCase()}:`, {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    context,
  });

  // Log to database (async, don't wait)
  logErrorToDatabase(err, category, context).catch(() => {
    // Silently fail if logging fails
  });

  // Determine status code
  let statusCode = err.statusCode || err.status || 500;
  if (category === ERROR_CATEGORIES.VALIDATION) {
    statusCode = 400;
  } else if (category === ERROR_CATEGORIES.AUTHENTICATION) {
    statusCode = 401;
  } else if (category === ERROR_CATEGORIES.AUTHORIZATION) {
    statusCode = 403;
  } else if (category === ERROR_CATEGORIES.NOT_FOUND) {
    statusCode = 404;
  } else if (category === ERROR_CATEGORIES.RATE_LIMIT) {
    statusCode = 429;
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      message: err.message || 'Internal server error',
      category,
      code: err.code || category.toUpperCase(),
    },
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }

  // Add request ID if available
  if (req.id) {
    errorResponse.requestId = req.id;
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * Async error wrapper for route handlers
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create custom error
 */
function createError(message, statusCode = 500, code = null, category = null) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.status = statusCode;
  error.code = code || category?.toUpperCase();
  error.category = category || categorizeError(error);
  return error;
}

/**
 * Validation error
 */
function validationError(message, details = {}) {
  const error = createError(message, 400, 'VALIDATION_ERROR', ERROR_CATEGORIES.VALIDATION);
  error.details = details;
  return error;
}

/**
 * Not found error
 */
function notFoundError(resource = 'Resource') {
  return createError(`${resource} not found`, 404, 'NOT_FOUND', ERROR_CATEGORIES.NOT_FOUND);
}

/**
 * Unauthorized error
 */
function unauthorizedError(message = 'Unauthorized') {
  return createError(message, 401, 'UNAUTHORIZED', ERROR_CATEGORIES.AUTHENTICATION);
}

/**
 * Forbidden error
 */
function forbiddenError(message = 'Forbidden') {
  return createError(message, 403, 'FORBIDDEN', ERROR_CATEGORIES.AUTHORIZATION);
}

module.exports = {
  errorHandler,
  asyncHandler,
  createError,
  validationError,
  notFoundError,
  unauthorizedError,
  forbiddenError,
  ERROR_CATEGORIES,
};


