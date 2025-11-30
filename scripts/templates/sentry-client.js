// ================================================
// 🔴 SENTRY CLIENT - Error Tracking to longsang-admin
// ================================================
// This file sends errors to longsang-admin Error Collector API
// which then triggers GitHub Auto-Fix workflow
// ================================================

const LONGSANG_ADMIN_URL = 'https://longsang-admin.vercel.app';
const PROJECT_NAME = '{{PROJECT_NAME}}'; // Will be replaced by setup script

class SentryClient {
  constructor() {
    this.errors = [];
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    
    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureException({
        type: 'Error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack || ''
      });
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.captureException({
        type: 'UnhandledRejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack || ''
      });
    });

    // Console error interceptor
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.captureMessage('ConsoleError', args.map(a => 
        typeof a === 'object' ? JSON.stringify(a) : String(a)
      ).join(' '));
      originalConsoleError.apply(console, args);
    };

    this.initialized = true;
    console.log(`🔴 Sentry Client initialized for ${PROJECT_NAME}`);
  }

  captureException(error) {
    const errorData = {
      project: PROJECT_NAME,
      environment: import.meta?.env?.MODE || 'production',
      level: 'error',
      message: error.message,
      type: error.type || 'Error',
      stack: error.stack,
      filename: error.filename,
      lineno: error.lineno,
      colno: error.colno,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      extra: {}
    };

    this.sendError(errorData);
  }

  captureMessage(level, message) {
    const errorData = {
      project: PROJECT_NAME,
      environment: import.meta?.env?.MODE || 'production',
      level: level.toLowerCase(),
      message: message,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    this.sendError(errorData);
  }

  async sendError(errorData) {
    // Store locally first
    this.errors.push(errorData);

    // Send to longsang-admin
    try {
      const response = await fetch(`${LONGSANG_ADMIN_URL}/api/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData)
      });

      if (!response.ok) {
        console.warn('Failed to send error to longsang-admin:', response.status);
      } else {
        const result = await response.json();
        if (result.autoFixTriggered) {
          console.log('🤖 Auto-fix triggered for this error!');
        }
      }
    } catch (err) {
      console.warn('Could not reach longsang-admin:', err.message);
      // Store for retry later
      this.storeForRetry(errorData);
    }
  }

  storeForRetry(errorData) {
    try {
      const stored = JSON.parse(localStorage.getItem('sentry_retry_queue') || '[]');
      stored.push(errorData);
      localStorage.setItem('sentry_retry_queue', JSON.stringify(stored.slice(-50))); // Keep last 50
    } catch (e) {
      // localStorage might be full
    }
  }

  async retryStoredErrors() {
    try {
      const stored = JSON.parse(localStorage.getItem('sentry_retry_queue') || '[]');
      if (stored.length === 0) return;

      for (const error of stored) {
        await this.sendError(error);
      }
      localStorage.removeItem('sentry_retry_queue');
    } catch (e) {
      // Ignore
    }
  }

  // Manual error reporting
  report(message, extra = {}) {
    this.captureException({
      type: 'ManualReport',
      message: message,
      extra: extra
    });
  }
}

// Create singleton instance
export const sentry = new SentryClient();

// Auto-init on load
if (typeof window !== 'undefined') {
  sentry.init();
  // Retry stored errors after 5 seconds
  setTimeout(() => sentry.retryStoredErrors(), 5000);
}

export default sentry;
