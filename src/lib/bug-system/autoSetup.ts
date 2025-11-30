/**
 * Auto-Setup Bug System v2.0
 *
 * Automatically initializes error handlers and sets up global error catching
 * This runs automatically when imported - no manual activation needed
 * 
 * Enhanced to capture:
 * - Unhandled JavaScript errors
 * - Unhandled promise rejections
 * - Console.error calls
 * - Console.warn calls (React warnings)
 * - Network/fetch errors
 * - Resource loading errors (images, scripts, CSS)
 * - Performance issues (long tasks)
 */

import { errorHandler } from './errorHandler';
import { logger } from '../utils/logger';

// Store original console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalFetch = window.fetch;

/**
 * Setup global error handlers
 * This captures ALL types of errors
 */
export function setupGlobalErrorHandlers(): void {
  // 1. Handle unhandled JavaScript errors
  window.addEventListener('error', (event) => {
    const error = event.error || new Error(event.message || 'Unknown error');

    errorHandler
      .capture(error, {
        component: 'GlobalErrorHandler',
        action: 'window.onerror',
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        errorInfo: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      })
      .catch((err) => {
        logger.warn('Failed to capture global error', err, 'AutoSetup');
      });
  });

  // 2. Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error =
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason || 'Unhandled promise rejection'));

    errorHandler
      .capture(error, {
        component: 'GlobalErrorHandler',
        action: 'unhandledrejection',
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        errorInfo: {
          reason: event.reason,
        },
      })
      .catch((err) => {
        logger.warn('Failed to capture unhandled rejection', err, 'AutoSetup');
      });
  });

  // 3. Intercept console.error - Many libraries use this!
  console.error = (...args: any[]) => {
    // Call original first
    originalConsoleError.apply(console, args);
    
    // Skip if it's from our own error handler (prevent loops)
    const errorString = args.map(a => String(a)).join(' ');
    if (errorString.includes('[ErrorHandler]') || errorString.includes('[AutoSetup]')) {
      return;
    }

    // Capture console.error
    const error = args[0] instanceof Error 
      ? args[0] 
      : new Error(errorString.slice(0, 500));
    
    errorHandler.capture(error, {
      component: 'Console',
      action: 'console.error',
      pageUrl: window.location.href,
      severity: 'medium',
      consoleArgs: args.slice(0, 3).map(a => {
        try { return JSON.stringify(a).slice(0, 200); } 
        catch { return String(a).slice(0, 200); }
      }),
    }).catch(() => {}); // Silent fail
  };

  // 4. Intercept console.warn - Catch React warnings!
  console.warn = (...args: any[]) => {
    // Call original first
    originalConsoleWarn.apply(console, args);
    
    const warnString = args.map(a => String(a)).join(' ');
    
    // Only capture important warnings (React, deprecation, etc.)
    const importantPatterns = [
      'Warning:',           // React warnings
      'Deprecation',        // Deprecation warnings
      'deprecated',
      'Failed prop type',   // PropTypes warnings
      'Invalid prop',
      'Each child',         // React key warnings
      'Cannot update',      // State update warnings
      'Memory leak',
    ];
    
    if (importantPatterns.some(p => warnString.includes(p))) {
      const error = new Error(warnString.slice(0, 500));
      error.name = 'ConsoleWarning';
      
      errorHandler.capture(error, {
        component: 'Console',
        action: 'console.warn',
        pageUrl: window.location.href,
        severity: 'low',
      }).catch(() => {});
    }
  };

  // 5. Intercept fetch to capture network errors
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || 'unknown';
    const method = (args[1]?.method || 'GET').toUpperCase();
    
    try {
      const response = await originalFetch.apply(window, args);
      
      // Capture HTTP errors (4xx, 5xx)
      if (!response.ok && response.status >= 400) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.name = 'HTTPError';
        
        errorHandler.capture(error, {
          component: 'Network',
          action: 'fetch',
          pageUrl: window.location.href,
          severity: response.status >= 500 ? 'high' : 'medium',
          httpInfo: {
            url: url.slice(0, 200),
            method,
            status: response.status,
            statusText: response.statusText,
          },
        }).catch(() => {});
      }
      
      return response;
    } catch (networkError) {
      // Capture network failures (no internet, CORS, etc.)
      const error = networkError instanceof Error 
        ? networkError 
        : new Error('Network request failed');
      error.name = 'NetworkError';
      
      errorHandler.capture(error, {
        component: 'Network',
        action: 'fetch',
        pageUrl: window.location.href,
        severity: 'high',
        httpInfo: {
          url: url.slice(0, 200),
          method,
        },
      }).catch(() => {});
      
      throw networkError; // Re-throw to not break app logic
    }
  };

  // 6. Capture resource loading errors (images, scripts, CSS)
  document.addEventListener('error', (event) => {
    const target = event.target as HTMLElement;
    if (target && (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
      const src = (target as any).src || (target as any).href || 'unknown';
      const error = new Error(`Failed to load ${target.tagName.toLowerCase()}: ${src}`);
      error.name = 'ResourceLoadError';
      
      errorHandler.capture(error, {
        component: 'Resource',
        action: 'load',
        pageUrl: window.location.href,
        severity: target.tagName === 'SCRIPT' ? 'high' : 'low',
        resourceInfo: {
          tagName: target.tagName,
          src: src.slice(0, 200),
        },
      }).catch(() => {});
    }
  }, true); // Use capture phase

  // 7. Monitor long tasks (performance issues)
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 100) { // Tasks > 100ms
            const error = new Error(`Long task detected: ${Math.round(entry.duration)}ms`);
            error.name = 'PerformanceWarning';
            
            errorHandler.capture(error, {
              component: 'Performance',
              action: 'longtask',
              pageUrl: window.location.href,
              severity: entry.duration > 500 ? 'high' : 'low',
              performanceInfo: {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name,
              },
            }).catch(() => {});
          }
        }
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // PerformanceObserver not supported for longtask
    }
  }

  logger.info('Enhanced global error handlers initialized (v2.0)', 'AutoSetup');
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

    logger.info('Bug system v2.0 initialized successfully', 'AutoSetup');
  } catch (error) {
    logger.error('Failed to initialize bug system', error as Error, 'AutoSetup');
    // Continue anyway - error handler should work even if init fails
  }
}

// Auto-initialize when this module is imported
// This ensures the bug system is always active
if (typeof window !== 'undefined') {
  // Only run in browser environment
  initializeBugSystem().catch((err) => {
    console.error('Failed to auto-initialize bug system:', err);
  });
}
