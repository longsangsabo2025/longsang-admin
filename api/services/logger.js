/**
 * 📝 Structured Logging Service
 *
 * Provides structured logging with levels, context, and formatting
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const LOG_LEVEL_NAMES = {
  0: 'ERROR',
  1: 'WARN',
  2: 'INFO',
  3: 'DEBUG',
};

// Get log level from environment
const getLogLevel = () => {
  const envLevel = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
  return LOG_LEVELS[envLevel] ?? LOG_LEVELS.INFO;
};

const currentLogLevel = getLogLevel();

/**
 * Format log entry
 */
function formatLog(level, message, context = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: LOG_LEVEL_NAMES[level],
    message,
    ...context,
  };

  // In production, output as JSON
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(logEntry);
  }

  // In development, output formatted
  const levelColors = {
    ERROR: '\x1b[31m', // Red
    WARN: '\x1b[33m', // Yellow
    INFO: '\x1b[36m', // Cyan
    DEBUG: '\x1b[90m', // Gray
  };
  const resetColor = '\x1b[0m';
  const color = levelColors[LOG_LEVEL_NAMES[level]] || '';

  const contextStr = Object.keys(context).length > 0
    ? ` ${JSON.stringify(context)}`
    : '';

  return `${color}[${LOG_LEVEL_NAMES[level]}]${resetColor} ${timestamp} ${message}${contextStr}`;
}

/**
 * Base logging function
 */
function log(level, message, context = {}) {
  if (level <= currentLogLevel) {
    const formatted = formatLog(level, message, context);
    const output = level === LOG_LEVELS.ERROR ? console.error : console.log;
    output(formatted);
  }
}

/**
 * Error logging
 */
function error(message, context = {}) {
  log(LOG_LEVELS.ERROR, message, context);

  // Include stack trace for errors
  if (context.error instanceof Error) {
    log(LOG_LEVELS.DEBUG, 'Stack trace', {
      stack: context.error.stack,
    });
  }
}

/**
 * Warning logging
 */
function warn(message, context = {}) {
  log(LOG_LEVELS.WARN, message, context);
}

/**
 * Info logging
 */
function info(message, context = {}) {
  log(LOG_LEVELS.INFO, message, context);
}

/**
 * Debug logging
 */
function debug(message, context = {}) {
  log(LOG_LEVELS.DEBUG, message, context);
}

/**
 * Log with operation context
 */
function withContext(baseContext) {
  return {
    error: (message, context = {}) => error(message, { ...baseContext, ...context }),
    warn: (message, context = {}) => warn(message, { ...baseContext, ...context }),
    info: (message, context = {}) => info(message, { ...baseContext, ...context }),
    debug: (message, context = {}) => debug(message, { ...baseContext, ...context }),
  };
}

/**
 * Log request/response
 */
function logRequest(req, res, responseTime = null) {
  const context = {
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    userAgent: req.get('user-agent'),
    ip: req.ip || req.connection.remoteAddress,
  };

  if (responseTime !== null) {
    context.responseTime = `${responseTime}ms`;
  }

  if (res.statusCode >= 500) {
    error(`${req.method} ${req.path} - ${res.statusCode}`, context);
  } else if (res.statusCode >= 400) {
    warn(`${req.method} ${req.path} - ${res.statusCode}`, context);
  } else {
    info(`${req.method} ${req.path} - ${res.statusCode}`, context);
  }
}

/**
 * Log API call
 */
function logAPICall(service, endpoint, method, duration = null, success = true) {
  const context = {
    service,
    endpoint,
    method,
    success,
  };

  if (duration !== null) {
    context.duration = `${duration}ms`;
  }

  if (success) {
    info(`API call: ${service} ${method} ${endpoint}`, context);
  } else {
    warn(`API call failed: ${service} ${method} ${endpoint}`, context);
  }
}

/**
 * Log database operation
 */
function logDatabase(operation, table, duration = null, success = true, error = null) {
  const context = {
    operation,
    table,
    success,
  };

  if (duration !== null) {
    context.duration = `${duration}ms`;
  }

  if (error) {
    context.error = error.message;
  }

  if (success) {
    debug(`Database: ${operation} on ${table}`, context);
  } else {
    error(`Database error: ${operation} on ${table}`, context);
  }
}

/**
 * Log performance metric
 */
function logPerformance(operation, duration, metadata = {}) {
  const context = {
    operation,
    duration: `${duration}ms`,
    ...metadata,
  };

  if (duration > 1000) {
    warn(`Slow operation: ${operation}`, context);
  } else {
    debug(`Performance: ${operation}`, context);
  }
}

module.exports = {
  error,
  warn,
  info,
  debug,
  withContext,
  logRequest,
  logAPICall,
  logDatabase,
  logPerformance,
  LOG_LEVELS,
};

