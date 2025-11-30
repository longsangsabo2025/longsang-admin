/**
 * Professional Logging Service
 * Replaces console.log/error with structured logging
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
  error?: Error;
  context?: string;
}

class Logger {
  private readonly isDevelopment = import.meta.env.DEV;
  private readonly isProduction = import.meta.env.PROD;

  /**
   * Debug level - only in development
   */
  debug(message: string, data?: unknown, context?: string): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, data, undefined, context);
    }
  }

  /**
   * Info level - general information
   */
  info(message: string, data?: unknown, context?: string): void {
    this.log(LogLevel.INFO, message, data, undefined, context);
  }

  /**
   * Warning level - something unexpected but handled
   */
  warn(message: string, data?: unknown, context?: string): void {
    this.log(LogLevel.WARN, message, data, undefined, context);
  }

  /**
   * Error level - something went wrong
   */
  error(message: string, error?: Error, context?: string): void;
  error(message: string, error?: unknown, context?: string): void;
  error(message: string, error?: Error | unknown, context?: string): void {
    const errorObj = error instanceof Error ? error : undefined;
    const errorData = error instanceof Error ? undefined : error;
    
    this.log(LogLevel.ERROR, message, errorData, errorObj, context);
    
    // In production, send to error tracking service (Sentry, LogRocket, etc.)
    if (this.isProduction) {
      this.sendToErrorTracking(message, errorObj, context);
    }
  }

  /**
   * Internal logging method
   */
  private log(
    level: LogLevel,
    message: string,
    data?: unknown,
    error?: Error,
    context?: string
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      error,
      context,
    };

    // Format for console in development
    if (this.isDevelopment) {
      const contextPart = context ? ` [${context}]` : '';
      const prefix = `[${entry.timestamp}] [${level}]${contextPart}`;
      
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(prefix, message, data || '');
          break;
        case LogLevel.INFO:
          console.info(prefix, message, data || '');
          break;
        case LogLevel.WARN:
          console.warn(prefix, message, data || '');
          break;
        case LogLevel.ERROR:
          console.error(prefix, message, error || data || '');
          if (error?.stack) {
            console.error('Stack trace:', error.stack);
          }
          break;
      }
    }

    // In production, only log errors and warnings
    if (this.isProduction && (level === LogLevel.ERROR || level === LogLevel.WARN)) {
      // Send to logging service (e.g., CloudWatch, Datadog)
      this.sendToLoggingService(entry);
    }
  }

  /**
   * Send error to tracking service
   * Future: Integrate with Sentry, LogRocket, or similar error tracking
   */
  private sendToErrorTracking(_message: string, _error?: Error, _context?: string): void {
    // Placeholder for future error tracking integration
    // When ready, uncomment and configure:
    // Sentry.captureException(_error, {
    //   tags: { context: _context },
    //   extra: { message: _message }
    // });
  }

  /**
   * Send log to logging service
   * Future: Send to centralized logging (CloudWatch, Datadog, etc.)
   */
  private sendToLoggingService(entry: LogEntry): void {
    // For now, keep in localStorage for debugging
    try {
      const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      logs.push(entry);
      // Keep last 100 logs
      if (logs.length > 100) {
        logs.shift();
      }
      localStorage.setItem('app_logs', JSON.stringify(logs));
    } catch (e) {
      // Silent fail - localStorage may be disabled in some browsers
      if (this.isDevelopment) {
        console.warn('Failed to store logs:', e);
      }
    }
  }

  /**
   * Get stored logs (for debugging)
   */
  getLogs(): LogEntry[] {
    try {
      return JSON.parse(localStorage.getItem('app_logs') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Clear stored logs
   */
  clearLogs(): void {
    localStorage.removeItem('app_logs');
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing
export { Logger };
