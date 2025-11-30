/**
 * Retry Handler Service
 *
 * Implements exponential backoff retry logic for failed operations
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number; // milliseconds
  maxDelay?: number; // milliseconds
  backoffMultiplier?: number;
  retryableErrors?: string[];
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'retryableErrors' | 'onRetry'>> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

class RetryHandler {
  /**
   * Execute a function with retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    let lastError: Error | unknown;

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        if (!this.isRetryable(error, opts.retryableErrors)) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt >= opts.maxRetries) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt),
          opts.maxDelay
        );

        // Call onRetry callback if provided
        if (opts.onRetry && error instanceof Error) {
          opts.onRetry(attempt + 1, error);
        }

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(
    error: Error | unknown,
    retryableErrors?: string[]
  ): boolean {
    if (!retryableErrors || retryableErrors.length === 0) {
      // Default: retry on network errors
      return this.isNetworkError(error);
    }

    const errorMessage = this.getErrorMessage(error).toLowerCase();
    return retryableErrors.some(pattern =>
      errorMessage.includes(pattern.toLowerCase())
    );
  }

  /**
   * Check if error is a network error
   */
  private isNetworkError(error: Error | unknown): boolean {
    const message = this.getErrorMessage(error).toLowerCase();
    const name = this.getErrorName(error).toLowerCase();

    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('fetch') ||
      message.includes('failed to fetch') ||
      name.includes('networkerror') ||
      name.includes('timeouterror')
    );
  }

  /**
   * Get error message
   */
  private getErrorMessage(error: Error | unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  /**
   * Get error name
   */
  private getErrorName(error: Error | unknown): string {
    if (error instanceof Error) {
      return error.name;
    }
    return 'Error';
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const retryHandler = new RetryHandler();

export default retryHandler;

