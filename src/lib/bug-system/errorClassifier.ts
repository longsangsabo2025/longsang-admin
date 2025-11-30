/**
 * Error Classifier Service
 *
 * Classifies errors into categories for better organization and handling
 */

export type ErrorCategory =
  | 'network'
  | 'auth'
  | 'validation'
  | 'database'
  | 'ui'
  | 'api'
  | 'unknown';

export interface ClassifiedError {
  category: ErrorCategory;
  subcategory?: string;
  isRetryable: boolean;
  suggestedAction?: string;
}

class ErrorClassifier {
  /**
   * Classify an error into a category
   */
  classify(error: Error | unknown): ClassifiedError {
    const errorMessage = this.getErrorMessage(error).toLowerCase();
    const errorName = this.getErrorName(error).toLowerCase();
    const errorStack = this.getErrorStack(error)?.toLowerCase() || '';

    // Network errors
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('axios') ||
      errorMessage.includes('request failed') ||
      errorMessage.includes('failed to fetch') ||
      errorName.includes('networkerror') ||
      errorName.includes('timeouterror')
    ) {
      return {
        category: 'network',
        subcategory: this.getNetworkSubcategory(errorMessage),
        isRetryable: true,
        suggestedAction: 'Retry the request with exponential backoff',
      };
    }

    // Authentication errors
    if (
      errorMessage.includes('auth') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('forbidden') ||
      errorMessage.includes('401') ||
      errorMessage.includes('403') ||
      errorMessage.includes('token') ||
      errorMessage.includes('login') ||
      errorMessage.includes('session') ||
      errorMessage.includes('expired')
    ) {
      return {
        category: 'auth',
        subcategory: this.getAuthSubcategory(errorMessage),
        isRetryable: errorMessage.includes('expired') || errorMessage.includes('token'),
        suggestedAction: 'Refresh authentication token or re-login',
      };
    }

    // Validation errors
    if (
      errorMessage.includes('validation') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('required') ||
      errorMessage.includes('format') ||
      errorMessage.includes('400') ||
      errorMessage.includes('zod') ||
      errorMessage.includes('schema') ||
      errorMessage.includes('type') ||
      errorStack.includes('zod')
    ) {
      return {
        category: 'validation',
        subcategory: 'input_validation',
        isRetryable: false,
        suggestedAction: 'Check input data and fix validation errors',
      };
    }

    // Database errors
    if (
      errorMessage.includes('database') ||
      errorMessage.includes('sql') ||
      errorMessage.includes('postgres') ||
      errorMessage.includes('supabase') ||
      errorMessage.includes('foreign key') ||
      errorMessage.includes('constraint') ||
      errorMessage.includes('duplicate') ||
      errorMessage.includes('null') ||
      errorMessage.includes('rls') ||
      errorMessage.includes('row level security') ||
      errorStack.includes('supabase')
    ) {
      return {
        category: 'database',
        subcategory: this.getDatabaseSubcategory(errorMessage),
        isRetryable: !errorMessage.includes('constraint') && !errorMessage.includes('duplicate'),
        suggestedAction: 'Check database constraints and data integrity',
      };
    }

    // API errors
    if (
      errorMessage.includes('api') ||
      errorMessage.includes('endpoint') ||
      errorMessage.includes('500') ||
      errorMessage.includes('502') ||
      errorMessage.includes('503') ||
      errorMessage.includes('504') ||
      errorMessage.includes('server error')
    ) {
      return {
        category: 'api',
        subcategory: this.getApiSubcategory(errorMessage),
        isRetryable: true,
        suggestedAction: 'Retry after a delay or contact API provider',
      };
    }

    // UI errors
    if (
      errorMessage.includes('render') ||
      errorMessage.includes('component') ||
      errorMessage.includes('react') ||
      errorMessage.includes('dom') ||
      errorMessage.includes('cannot read') ||
      errorMessage.includes('undefined') ||
      errorMessage.includes('null') ||
      errorName.includes('typeerror') ||
      errorName.includes('referenceerror')
    ) {
      return {
        category: 'ui',
        subcategory: 'rendering',
        isRetryable: false,
        suggestedAction: 'Check component props and state management',
      };
    }

    // Unknown category
    return {
      category: 'unknown',
      isRetryable: false,
      suggestedAction: 'Review error details and investigate',
    };
  }

  /**
   * Get error message
   */
  private getErrorMessage(error: Error | unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
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
   * Get error stack
   */
  private getErrorStack(error: Error | unknown): string | undefined {
    if (error instanceof Error) {
      return error.stack;
    }
    return undefined;
  }

  /**
   * Get network error subcategory
   */
  private getNetworkSubcategory(message: string): string {
    if (message.includes('timeout')) return 'timeout';
    if (message.includes('connection')) return 'connection';
    if (message.includes('fetch')) return 'fetch';
    return 'network';
  }

  /**
   * Get auth error subcategory
   */
  private getAuthSubcategory(message: string): string {
    if (message.includes('token') || message.includes('expired')) return 'token';
    if (message.includes('unauthorized')) return 'unauthorized';
    if (message.includes('forbidden')) return 'forbidden';
    return 'authentication';
  }

  /**
   * Get database error subcategory
   */
  private getDatabaseSubcategory(message: string): string {
    if (message.includes('foreign key')) return 'foreign_key';
    if (message.includes('constraint')) return 'constraint';
    if (message.includes('duplicate')) return 'duplicate';
    if (message.includes('rls') || message.includes('row level security')) return 'rls';
    return 'database';
  }

  /**
   * Get API error subcategory
   */
  private getApiSubcategory(message: string): string {
    if (message.includes('500')) return 'server_error';
    if (message.includes('502')) return 'bad_gateway';
    if (message.includes('503')) return 'service_unavailable';
    if (message.includes('504')) return 'gateway_timeout';
    return 'api';
  }
}

// Export singleton instance
export const errorClassifier = new ErrorClassifier();

export default errorClassifier;

