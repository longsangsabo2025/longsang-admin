/**
 * Auto-Setup Bug System
 *
 * Automatically initializes error handlers and sets up global error catching
 * This runs automatically when imported - no manual activation needed
 */

import { errorHandler } from './errorHandler';
import { logger } from '../utils/logger';

/**
 * Setup global error handlers
 * This captures:
 * - Unhandled JavaScript errors
 * - Unhandled promise rejections
 * - Resource loading errors
 */
export function setupGlobalErrorHandlers(): void {
  // Handle unhandled JavaScript errors
  window.addEventListener('error', (event) => {
    const error = event.error || new Error(event.message || 'Unknown error');

    errorHandler.capture(error, {
      component: 'GlobalErrorHandler',
      action: 'window.onerror',
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
      errorInfo: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    }).catch(err => {
      logger.warn('Failed to capture global error', err, 'AutoSetup');
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason || 'Unhandled promise rejection'));

    errorHandler.capture(error, {
      component: 'GlobalErrorHandler',
      action: 'unhandledrejection',
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
      errorInfo: {
        reason: event.reason,
      },
    }).catch(err => {
      logger.warn('Failed to capture unhandled rejection', err, 'AutoSetup');
    });
  });

  logger.info('Global error handlers initialized', 'AutoSetup');
}

/**
 * Initialize bug system
 * Call this once when app starts
 */
export async function initializeBugSystem(): Promise<void> {
  try {
    // Initialize error handler
    await errorHandler.initialize();

    // Setup global error handlers
    setupGlobalErrorHandlers();

    logger.info('Bug system initialized successfully', 'AutoSetup');
  } catch (error) {
    logger.error('Failed to initialize bug system', error as Error, 'AutoSetup');
    // Continue anyway - error handler should work even if init fails
  }
}

// Auto-initialize when this module is imported
// This ensures the bug system is always active
if (typeof window !== 'undefined') {
  // Only run in browser environment
  initializeBugSystem().catch(err => {
    console.error('Failed to auto-initialize bug system:', err);
  });
}

