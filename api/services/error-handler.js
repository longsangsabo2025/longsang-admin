/**
 * 🛡️ Comprehensive Error Handler Service
 *
 * Provides graceful degradation, retry strategies,
 * and user-friendly error messages
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

/**
 * Error categories
 */
const ERROR_CATEGORIES = {
  NETWORK: 'network',
  AUTHENTICATION: 'authentication',
  VALIDATION: 'validation',
  DATABASE: 'database',
  AI_SERVICE: 'ai_service',
  RATE_LIMIT: 'rate_limit',
  TIMEOUT: 'timeout',
  UNKNOWN: 'unknown',
};

/**
 * Error severity levels
 */
const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

/**
 * Classify error by type and category
 */
function classifyError(error) {
  const errorMessage = error?.message || '';
  const errorCode = error?.code || '';
  const statusCode = error?.status || error?.statusCode || 500;

  // Network errors
  if (
    errorCode === 'ECONNREFUSED' ||
    errorCode === 'ENOTFOUND' ||
    errorCode === 'ETIMEDOUT' ||
    errorMessage.includes('network') ||
    errorMessage.includes('connection')
  ) {
    return {
      category: ERROR_CATEGORIES.NETWORK,
      severity: ERROR_SEVERITY.MEDIUM,
      retryable: true,
      userMessage: 'Kết nối mạng không ổn định. Vui lòng thử lại sau.',
    };
  }

  // Authentication errors
  if (statusCode === 401 || statusCode === 403 || errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
    return {
      category: ERROR_CATEGORIES.AUTHENTICATION,
      severity: ERROR_SEVERITY.HIGH,
      retryable: false,
      userMessage: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    };
  }

  // Validation errors
  if (statusCode === 400 || errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    return {
      category: ERROR_CATEGORIES.VALIDATION,
      severity: ERROR_SEVERITY.LOW,
      retryable: false,
      userMessage: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.',
    };
  }

  // Rate limit errors
  if (statusCode === 429 || errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    return {
      category: ERROR_CATEGORIES.RATE_LIMIT,
      severity: ERROR_SEVERITY.MEDIUM,
      retryable: true,
      retryAfter: 60, // 1 minute
      userMessage: 'Quá nhiều yêu cầu. Vui lòng đợi một chút và thử lại.',
    };
  }

  // Timeout errors
  if (errorCode === 'ETIMEDOUT' || errorMessage.includes('timeout')) {
    return {
      category: ERROR_CATEGORIES.TIMEOUT,
      severity: ERROR_SEVERITY.MEDIUM,
      retryable: true,
      userMessage: 'Yêu cầu quá lâu. Vui lòng thử lại.',
    };
  }

  // Database errors
  if (errorMessage.includes('database') || errorMessage.includes('SQL') || errorCode?.startsWith('PGSQL')) {
    return {
      category: ERROR_CATEGORIES.DATABASE,
      severity: ERROR_SEVERITY.HIGH,
      retryable: true,
      userMessage: 'Lỗi cơ sở dữ liệu. Vui lòng thử lại sau.',
    };
  }

  // AI service errors
  if (errorMessage.includes('openai') || errorMessage.includes('anthropic') || errorMessage.includes('api key')) {
    return {
      category: ERROR_CATEGORIES.AI_SERVICE,
      severity: ERROR_SEVERITY.HIGH,
      retryable: true,
      userMessage: 'Lỗi dịch vụ AI. Vui lòng thử lại sau.',
    };
  }

  // Default unknown error
  return {
    category: ERROR_CATEGORIES.UNKNOWN,
    severity: ERROR_SEVERITY.MEDIUM,
    retryable: false,
    userMessage: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
  };
}

/**
 * Create user-friendly error response
 */
function createErrorResponse(error, context = {}) {
  const classification = classifyError(error);
  const { operation, userId, requestId } = context;

  return {
    success: false,
    error: {
      message: classification.userMessage,
      category: classification.category,
      severity: classification.severity,
      retryable: classification.retryable,
      retryAfter: classification.retryAfter || null,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      operation: operation || null,
      requestId: requestId || null,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Retry strategy with exponential backoff
 */
async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = (error) => classifyError(error).retryable,
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      if (attempt > 0) {
        console.log(`✅ Retry successful on attempt ${attempt + 1}`);
      }
      return result;
    } catch (error) {
      lastError = error;
      const classification = classifyError(error);

      // Check if error is retryable
      if (!retryCondition(error) || attempt >= maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const waitTime = Math.min(delay, maxDelay);
      console.warn(`⚠️ Attempt ${attempt + 1} failed. Retrying in ${waitTime}ms...`, {
        category: classification.category,
        message: error.message,
      });

      await new Promise((resolve) => setTimeout(resolve, waitTime));
      delay *= backoffFactor;
    }
  }

  throw lastError;
}

/**
 * Graceful degradation - provide fallback response
 */
function gracefulDegradation(error, fallbackData = null) {
  const classification = classifyError(error);

  // For non-critical errors, return partial data
  if (classification.severity === ERROR_SEVERITY.LOW || classification.severity === ERROR_SEVERITY.MEDIUM) {
    return {
      success: true,
      data: fallbackData || {},
      degraded: true,
      warning: classification.userMessage,
      originalError: error.message,
    };
  }

  // For critical errors, return error response
  return createErrorResponse(error);
}

/**
 * Handle error with appropriate strategy
 */
function handleError(error, options = {}) {
  const {
    operation = null,
    userId = null,
    requestId = null,
    fallbackData = null,
    useGracefulDegradation = true,
  } = options;

  const classification = classifyError(error);

  // Log error
  console.error('❌ Error occurred:', {
    category: classification.category,
    severity: classification.severity,
    message: error.message,
    operation,
    userId,
    requestId,
    stack: error.stack,
  });

  // Use graceful degradation if enabled and error is not critical
  if (useGracefulDegradation && classification.severity !== ERROR_SEVERITY.CRITICAL) {
    return gracefulDegradation(error, fallbackData);
  }

  // Return error response
  return createErrorResponse(error, { operation, userId, requestId });
}

/**
 * Wrap async function with error handling
 */
function withErrorHandling(fn, options = {}) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      return handleError(error, {
        ...options,
        operation: options.operation || fn.name || 'unknown',
      });
    }
  };
}

/**
 * Safe async wrapper with timeout
 */
async function withTimeout(fn, timeoutMs = 30000, errorMessage = 'Operation timed out') {
  return Promise.race([
    fn(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

/**
 * Validate and sanitize error before sending to client
 */
function sanitizeError(error) {
  // Remove sensitive information
  const sanitized = {
    message: error.message || 'An error occurred',
    category: classifyError(error).category,
  };

  // Only include stack in development
  if (process.env.NODE_ENV === 'development') {
    sanitized.stack = error.stack;
  }

  // Remove sensitive paths
  if (sanitized.stack) {
    sanitized.stack = sanitized.stack.replace(/\/[^\s]+/g, '[path]');
  }

  return sanitized;
}

/**
 * Express error middleware
 */
function expressErrorMiddleware(err, req, res, next) {
  const errorResponse = createErrorResponse(err, {
    operation: `${req.method} ${req.path}`,
    requestId: req.id || null,
  });

  const classification = classifyError(err);
  const statusCode = getStatusCode(classification);

  res.status(statusCode).json(errorResponse);
}

/**
 * Get HTTP status code from error classification
 */
function getStatusCode(classification) {
  switch (classification.category) {
    case ERROR_CATEGORIES.AUTHENTICATION:
      return 401;
    case ERROR_CATEGORIES.VALIDATION:
      return 400;
    case ERROR_CATEGORIES.RATE_LIMIT:
      return 429;
    case ERROR_CATEGORIES.NOT_FOUND:
      return 404;
    default:
      return 500;
  }
}

module.exports = {
  classifyError,
  createErrorResponse,
  retryWithBackoff,
  gracefulDegradation,
  handleError,
  withErrorHandling,
  withTimeout,
  sanitizeError,
  expressErrorMiddleware,
  ERROR_CATEGORIES,
  ERROR_SEVERITY,
};

