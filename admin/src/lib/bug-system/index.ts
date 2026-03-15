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

export * from './aiFixService';
export { aiFixService } from './aiFixService';
// v2.0 Enhanced modules
export * from './alertService';
// Convenience exports - v2.0 Enhanced
export { alertService } from './alertService';
export * from './autoSetup';
export { initializeBugSystem, setupGlobalErrorHandlers } from './autoSetup';
export * from './circuitBreaker';
export { circuitBreaker } from './circuitBreaker';
export * from './errorClassifier';
export { errorClassifier } from './errorClassifier';
// Core modules
export * from './errorHandler';
// Convenience exports - Core
export { captureError, errorHandler } from './errorHandler';
export * from './metricsService';
export { metricsService } from './metricsService';
export * from './predictiveService';
export { predictiveService } from './predictiveService';
export * from './retryHandler';
export { retryHandler } from './retryHandler';
export * from './selfHealing';
export { selfHealing } from './selfHealing';
