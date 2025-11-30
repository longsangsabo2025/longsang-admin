/**
 * Self-Healing Service for LongSang Admin
 *
 * Orchestrates automatic error recovery using retry, circuit breakers, and fallbacks
 */

import { retryHandler, RetryOptions } from './retryHandler';
import { circuitBreaker } from './circuitBreaker';
import { errorClassifier, ErrorCategory } from './errorClassifier';
import { supabase } from '../supabase';
import { logger } from '../utils/logger';

export interface SelfHealingOptions {
  enableRetry?: boolean;
  enableCircuitBreaker?: boolean;
  enableFallback?: boolean;
  circuitKey?: string;
  retryOptions?: RetryOptions;
  fallbackValue?: any;
  onHealingAction?: (action: string, result: 'success' | 'failed') => void;
}

const DEFAULT_OPTIONS: Required<Omit<SelfHealingOptions, 'retryOptions' | 'fallbackValue' | 'onHealingAction'>> = {
  enableRetry: true,
  enableCircuitBreaker: true,
  enableFallback: false,
  circuitKey: 'default',
};

class SelfHealing {
  /**
   * Execute a function with self-healing capabilities
   */
  async execute<T>(
    fn: () => Promise<T>,
    options: SelfHealingOptions = {}
  ): Promise<T> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const startTime = Date.now();

    try {
      let result: T;

      if (opts.enableCircuitBreaker) {
        // Execute with circuit breaker
        result = await circuitBreaker.execute(opts.circuitKey, async () => {
          if (opts.enableRetry) {
            // Execute with retry
            return await retryHandler.execute(fn, opts.retryOptions);
          }
          return await fn();
        });
      } else if (opts.enableRetry) {
        // Execute with retry only
        result = await retryHandler.execute(fn, opts.retryOptions);
      } else {
        // Execute without any healing
        result = await fn();
      }

      // Log successful healing action if retry was used
      if (opts.enableRetry && opts.onHealingAction) {
        opts.onHealingAction('retry', 'success');
      }

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const classified = errorClassifier.classify(error);

      // Log healing action attempt
      await this.logHealingAction(
        error,
        classified,
        executionTime,
        opts.circuitKey
      );

      // Try fallback if enabled
      if (opts.enableFallback && opts.fallbackValue !== undefined) {
        if (opts.onHealingAction) {
          opts.onHealingAction('fallback', 'success');
        }
        return opts.fallbackValue as T;
      }

      // Call onHealingAction callback
      if (opts.onHealingAction) {
        opts.onHealingAction('retry', 'failed');
      }

      // Re-throw error if no fallback
      throw error;
    }
  }

  /**
   * Log healing action to database
   */
  private async logHealingAction(
    error: Error | unknown,
    classified: { category: ErrorCategory; isRetryable: boolean },
    executionTime: number,
    circuitKey: string
  ): Promise<void> {
    try {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const actionType = classified.isRetryable ? 'retry' : 'skip';
      const actionResult = 'failed'; // If we're here, healing failed

      await supabase.from('healing_actions').insert({
        action_type: actionType,
        action_result: actionResult,
        retry_count: 0,
        execution_time_ms: executionTime,
        details: {
          circuit_key: circuitKey,
          error_category: classified.category,
          error_message: errorMessage.substring(0, 500),
          project_name: 'longsang-admin',
        },
      });
    } catch (logError) {
      // Silently fail - logging healing actions is not critical
      logger.debug('Failed to log healing action', logError, 'SelfHealing');
    }
  }

  /**
   * Execute Supabase query with self-healing
   */
  async executeSupabaseQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    options: SelfHealingOptions = {}
  ): Promise<{ data: T | null; error: any }> {
    return await this.execute(
      async () => {
        const result = await queryFn();
        if (result.error) {
          throw new Error(result.error.message || 'Supabase query failed');
        }
        return result;
      },
      {
        ...options,
        circuitKey: options.circuitKey || 'supabase',
        retryOptions: {
          ...options.retryOptions,
          retryableErrors: ['network', 'timeout', 'connection', 'fetch'],
        },
      }
    );
  }
}

// Export singleton instance
export const selfHealing = new SelfHealing();

export default selfHealing;

