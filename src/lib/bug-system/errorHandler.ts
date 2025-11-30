/**
 * Centralized Error Handler Service for LongSang Admin
 *
 * Captures, logs, and reports errors to Sentry and Supabase
 * Integrates with existing logger service
 *
 * Enhanced with:
 * - Real-time alerts (Slack/Discord/Telegram)
 * - AI-powered fix suggestions
 */

import * as Sentry from '@sentry/react';
import { supabase } from '../supabase';
import { logger } from '../utils/logger';
import { alertService } from './alertService';
import { aiFixService } from './aiFixService';

export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface ErrorContext {
  [key: string]: any;
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  pageUrl?: string;
  userAgent?: string;
}

export interface ErrorLog {
  id?: string;
  error_type: string;
  error_message: string;
  error_stack?: string;
  severity: ErrorSeverity;
  user_id?: string;
  session_id?: string;
  page_url?: string;
  user_agent?: string;
  context?: Record<string, any>;
  sentry_event_id?: string;
  created_at?: string;
  project_name?: string; // 'longsang-admin'
}

class ErrorHandler {
  private sessionId: string;
  private isInitialized: boolean = false;
  private readonly projectName = 'longsang-admin';

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  /**
   * Initialize error handler
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Get current user if authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        Sentry.setUser({ id: user.id, email: user.email || undefined });
      }

      this.isInitialized = true;
      logger.info('Error handler initialized', { project: this.projectName });
    } catch (error) {
      logger.warn('Failed to initialize error handler', error, 'ErrorHandler');
      // Continue anyway - error handler should work even if init fails
      this.isInitialized = true;
    }
  }

  /**
   * Capture and handle an error
   */
  async capture(error: Error | unknown, context: ErrorContext = {}): Promise<string | null> {
    try {
      // Ensure initialized
      await this.initialize();

      // Normalize error
      const normalizedError = this.normalizeError(error);
      const severity = this.determineSeverity(normalizedError, context);

      // Log to existing logger (for backward compatibility)
      logger.error(
        `[${context.component || 'Unknown'}] ${normalizedError.message}`,
        normalizedError,
        context.component || 'ErrorHandler'
      );

      // Capture in Sentry
      const sentryEventId = await this.captureToSentry(normalizedError, context, severity);

      // Capture in Supabase
      const errorLogId = await this.captureToDatabase(
        normalizedError,
        context,
        severity,
        sentryEventId
      );

      // Send real-time alert for critical/high severity errors
      if (severity === 'critical' || severity === 'high') {
        this.sendAlert(normalizedError, severity, errorLogId, context).catch((err) =>
          logger.debug('Failed to send alert', err, 'ErrorHandler')
        );
      }

      // Get AI fix suggestions for errors (async, don't wait)
      if (errorLogId) {
        this.getAISuggestions(errorLogId, normalizedError, context).catch((err) =>
          logger.debug('Failed to get AI suggestions', err, 'ErrorHandler')
        );
      }

      return errorLogId;
    } catch (captureError) {
      // Fallback: at least log to console and logger
      logger.error('ErrorHandler.capture failed', captureError as Error, 'ErrorHandler');
      console.error('Original error:', error);
      return null;
    }
  }

  /**
   * Capture error to Sentry
   */
  private async captureToSentry(
    error: Error,
    context: ErrorContext,
    severity: ErrorSeverity
  ): Promise<string | undefined> {
    try {
      const sentrySeverity: Sentry.SeverityLevel =
        severity === 'critical'
          ? 'fatal'
          : severity === 'high'
            ? 'error'
            : severity === 'medium'
              ? 'warning'
              : 'info';

      const eventId = Sentry.captureException(error, {
        level: sentrySeverity,
        tags: {
          severity,
          component: context.component,
          action: context.action,
          project: this.projectName,
        },
        contexts: {
          custom: context,
        },
        extra: {
          sessionId: this.sessionId,
          pageUrl: context.pageUrl || window.location.href,
          userAgent: context.userAgent || navigator.userAgent,
        },
      });

      return eventId;
    } catch (sentryError) {
      logger.warn('Failed to capture error to Sentry', sentryError as Error, 'ErrorHandler');
      return undefined;
    }
  }

  /**
   * Capture error to Supabase database
   */
  private async captureToDatabase(
    error: Error,
    context: ErrorContext,
    severity: ErrorSeverity,
    sentryEventId?: string
  ): Promise<string | null> {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const errorLog: Omit<ErrorLog, 'id' | 'created_at'> = {
        error_type: error.name || 'Error',
        error_message: error.message || String(error),
        error_stack: error.stack,
        severity,
        user_id: user?.id || context.userId,
        session_id: context.sessionId || this.sessionId,
        page_url: context.pageUrl || window.location.href,
        user_agent: context.userAgent || navigator.userAgent,
        context: this.sanitizeContext(context),
        sentry_event_id: sentryEventId,
        project_name: this.projectName,
      };

      const { data, error: dbError } = await supabase
        .from('error_logs')
        .insert(errorLog)
        .select('id')
        .single();

      if (dbError) {
        logger.warn('Failed to save error to database', dbError, 'ErrorHandler');
        return null;
      }

      // Trigger bug report creation (async, don't wait)
      this.createBugReport(data.id).catch((err) =>
        logger.debug('Failed to create bug report', err, 'ErrorHandler')
      );

      return data.id;
    } catch (dbError) {
      logger.warn('Failed to capture error to database', dbError as Error, 'ErrorHandler');
      return null;
    }
  }

  /**
   * Create or update bug report for error
   */
  private async createBugReport(errorLogId: string): Promise<void> {
    try {
      await supabase.rpc('create_or_update_bug_report', {
        p_error_log_id: errorLogId,
      });
    } catch (error) {
      // Silently fail - bug report creation is not critical
      logger.debug('Bug report creation failed', error as Error, 'ErrorHandler');
    }
  }

  /**
   * Normalize error to Error object
   */
  private normalizeError(error: Error | unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    if (typeof error === 'string') {
      return new Error(error);
    }

    return new Error(String(error));
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error, context: ErrorContext): ErrorSeverity {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Critical errors
    if (
      name.includes('chunk') ||
      name.includes('loading') ||
      message.includes('network error') ||
      message.includes('failed to fetch') ||
      context.severity === 'critical'
    ) {
      return 'critical';
    }

    // High severity errors
    if (
      name.includes('typeerror') ||
      name.includes('referenceerror') ||
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      context.severity === 'high'
    ) {
      return 'high';
    }

    // Low severity errors
    if (name.includes('warning') || message.includes('validation') || context.severity === 'low') {
      return 'low';
    }

    // Default to medium
    return 'medium';
  }

  /**
   * Sanitize context to remove sensitive data
   */
  private sanitizeContext(context: ErrorContext): Record<string, any> {
    const sanitized: Record<string, any> = { ...context };

    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.apiKey;
    delete sanitized.secret;
    delete sanitized.privateKey;

    // Remove nested sensitive data
    if (sanitized.data && typeof sanitized.data === 'object') {
      const data = { ...sanitized.data };
      delete data.password;
      delete data.token;
      delete data.apiKey;
      sanitized.data = data;
    }

    return sanitized;
  }

  /**
   * Get or create session ID
   */
  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('error_handler_session_id');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      sessionStorage.setItem('error_handler_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Send real-time alert for error
   */
  private async sendAlert(
    error: Error,
    severity: ErrorSeverity,
    errorId: string | null,
    context: ErrorContext
  ): Promise<void> {
    await alertService.sendAlert({
      title: `${error.name}: ${error.message.slice(0, 100)}`,
      message: error.message,
      severity,
      errorId: errorId || undefined,
      timestamp: new Date().toISOString(),
      projectName: this.projectName,
      pageUrl: context.pageUrl || globalThis.location?.href,
      stackTrace: error.stack,
      context,
    });
  }

  /**
   * Get AI-powered fix suggestions
   */
  private async getAISuggestions(
    errorId: string,
    error: Error,
    context: ErrorContext
  ): Promise<void> {
    await aiFixService.analyzeError({
      errorId,
      errorType: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      context,
    });
  }

  /**
   * Set user context for Sentry
   */
  async setUser(userId: string, email?: string): Promise<void> {
    Sentry.setUser({ id: userId, email });
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    Sentry.setUser(null);
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Export convenience function
export const captureError = (error: unknown, context?: ErrorContext) =>
  errorHandler.capture(error, context);

export default errorHandler;
