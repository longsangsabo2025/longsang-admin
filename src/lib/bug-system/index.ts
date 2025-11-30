/**
 * Bug Detection & Self-Healing System v2.0
 *
 * Centralized exports for LongSang Admin
 *
 * NOTE: This system runs AUTOMATICALLY - no manual activation needed!
 * - Global error handlers are set up automatically
 * - ErrorBoundary catches React errors automatically
 * - All errors are captured and logged to Supabase and Sentry
 * 
 * NEW in v2.0:
 * - Real-time alerts (Slack/Discord/Telegram)
 * - AI-powered fix suggestions
 * - Predictive error detection
 * - MTTR/MTBF metrics tracking
 */

// Core modules
export * from './errorHandler';
export * from './errorClassifier';
export * from './retryHandler';
export * from './circuitBreaker';
export * from './selfHealing';
export * from './autoSetup';

// v2.0 Enhanced modules
export * from './alertService';
export * from './aiFixService';
export * from './predictiveService';
export * from './metricsService';

// Convenience exports - Core
export { errorHandler, captureError } from './errorHandler';
export { errorClassifier } from './errorClassifier';
export { retryHandler } from './retryHandler';
export { circuitBreaker } from './circuitBreaker';
export { selfHealing } from './selfHealing';
export { initializeBugSystem, setupGlobalErrorHandlers } from './autoSetup';

// Convenience exports - v2.0 Enhanced
export { alertService } from './alertService';
export { aiFixService } from './aiFixService';
export { predictiveService } from './predictiveService';
export { metricsService } from './metricsService';
