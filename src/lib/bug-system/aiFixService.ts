/**
 * AI-Powered Fix Suggestions Service
 * 
 * Uses OpenAI GPT-4 to analyze errors and suggest real code fixes
 * "ESLint fixes syntax. AI fixes logic." - Elon
 */

import { supabase } from '../supabase';
import { logger } from '../utils/logger';
import type { ErrorSeverity } from './errorHandler';

export interface ErrorAnalysis {
  errorId: string;
  errorType: string;
  errorMessage: string;
  errorStack?: string;
  context?: Record<string, any>;
}

export interface FixSuggestion {
  id: string;
  errorId: string;
  confidence: number; // 0-100
  category: 'code_fix' | 'config_fix' | 'dependency_fix' | 'infra_fix' | 'manual_required';
  title: string;
  description: string;
  suggestedCode?: string;
  originalCode?: string;
  filePath?: string;
  lineNumber?: number;
  steps: string[];
  risks: string[];
  estimatedTime: string;
  autoApplicable: boolean;
  createdAt: string;
}

export interface AIAnalysisResult {
  rootCause: string;
  impact: string;
  suggestions: FixSuggestion[];
  similarErrors: string[];
  preventionTips: string[];
}

class AIFixService {
  private readonly apiUrl: string;
  private readonly model = 'gpt-4';

  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }

  /**
   * Analyze error and generate AI-powered fix suggestions
   */
  async analyzeError(error: ErrorAnalysis): Promise<AIAnalysisResult | null> {
    try {
      const response = await fetch(`${this.apiUrl}/api/bug-system/ai-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errorType: error.errorType,
          errorMessage: error.errorMessage,
          errorStack: error.errorStack,
          context: error.context,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Save suggestions to database
      await this.saveSuggestions(error.errorId, result.suggestions);

      return result;
    } catch (err) {
      logger.warn('AI analysis failed, using fallback', err as Error, 'AIFixService');
      return this.fallbackAnalysis(error);
    }
  }

  /**
   * Fallback analysis when AI API is unavailable
   */
  private fallbackAnalysis(error: ErrorAnalysis): AIAnalysisResult {
    const suggestions: FixSuggestion[] = [];
    const errorMessage = error.errorMessage.toLowerCase();
    const errorType = error.errorType.toLowerCase();

    // Pattern-based suggestions
    if (errorMessage.includes('cannot read property') || errorMessage.includes('undefined')) {
      suggestions.push({
        id: `fallback-${Date.now()}-1`,
        errorId: error.errorId,
        confidence: 75,
        category: 'code_fix',
        title: 'Add Null/Undefined Check',
        description: 'The error indicates accessing a property on null or undefined. Add optional chaining or null checks.',
        suggestedCode: `// Before
obj.property.value

// After (Option 1: Optional Chaining)
obj?.property?.value

// After (Option 2: Null Check)
if (obj && obj.property) {
  obj.property.value
}`,
        steps: [
          'Identify the variable that is null/undefined',
          'Add optional chaining (?.) operator',
          'Or add explicit null check before accessing',
          'Consider adding default values with ?? operator',
        ],
        risks: ['May hide actual bugs if null is unexpected'],
        estimatedTime: '5-10 minutes',
        autoApplicable: false,
        createdAt: new Date().toISOString(),
      });
    }

    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('timeout')) {
      suggestions.push({
        id: `fallback-${Date.now()}-2`,
        errorId: error.errorId,
        confidence: 80,
        category: 'code_fix',
        title: 'Add Retry Logic with Exponential Backoff',
        description: 'Network errors can be transient. Implement retry logic with exponential backoff.',
        suggestedCode: `import { selfHealing } from '@/lib/bug-system';

// Wrap your API call with self-healing
const result = await selfHealing.execute(
  () => fetch('/api/data'),
  {
    enableRetry: true,
    retryOptions: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
    },
    enableCircuitBreaker: true,
  }
);`,
        steps: [
          'Import selfHealing from bug-system',
          'Wrap the failing fetch/API call',
          'Configure retry options as needed',
          'Add error handling for final failure',
        ],
        risks: ['May cause delays if server is down', 'Could mask persistent issues'],
        estimatedTime: '10-15 minutes',
        autoApplicable: true,
        createdAt: new Date().toISOString(),
      });
    }

    if (errorMessage.includes('unauthorized') || errorMessage.includes('401') || errorMessage.includes('forbidden')) {
      suggestions.push({
        id: `fallback-${Date.now()}-3`,
        errorId: error.errorId,
        confidence: 85,
        category: 'code_fix',
        title: 'Handle Authentication Error',
        description: 'The request was rejected due to authentication issues. Implement token refresh or redirect to login.',
        suggestedCode: `// Add auth error handler
async function handleAuthError(error: Error) {
  // Try to refresh token
  const { data, error: refreshError } = await supabase.auth.refreshSession();
  
  if (refreshError) {
    // Redirect to login
    window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
    return;
  }
  
  // Retry original request
  return retryOriginalRequest();
}`,
        steps: [
          'Check if token has expired',
          'Attempt to refresh the token',
          'If refresh fails, redirect to login',
          'Store return URL for post-login redirect',
        ],
        risks: ['User experience interruption', 'Data loss if form not saved'],
        estimatedTime: '15-20 minutes',
        autoApplicable: false,
        createdAt: new Date().toISOString(),
      });
    }

    if (errorType.includes('typeerror') || errorMessage.includes('type')) {
      suggestions.push({
        id: `fallback-${Date.now()}-4`,
        errorId: error.errorId,
        confidence: 70,
        category: 'code_fix',
        title: 'Fix Type Mismatch',
        description: 'There is a type mismatch in the code. Check TypeScript types and add proper type guards.',
        suggestedCode: `// Add type guard
function isValidData(data: unknown): data is ExpectedType {
  return (
    typeof data === 'object' &&
    data !== null &&
    'requiredField' in data
  );
}

// Use type guard
if (isValidData(response)) {
  // TypeScript now knows the correct type
  console.log(response.requiredField);
}`,
        steps: [
          'Identify the expected type',
          'Create a type guard function',
          'Use the type guard before accessing properties',
          'Add proper TypeScript types to function parameters',
        ],
        risks: ['May need to refactor multiple files'],
        estimatedTime: '10-30 minutes',
        autoApplicable: false,
        createdAt: new Date().toISOString(),
      });
    }

    // Default suggestion if no patterns match
    if (suggestions.length === 0) {
      suggestions.push({
        id: `fallback-${Date.now()}-default`,
        errorId: error.errorId,
        confidence: 50,
        category: 'manual_required',
        title: 'Manual Investigation Required',
        description: 'This error requires manual investigation. Check the stack trace for more context.',
        steps: [
          'Review the full stack trace',
          'Check recent code changes',
          'Look for similar errors in the logs',
          'Test in development environment',
          'Consider adding more logging for debugging',
        ],
        risks: ['May take longer to diagnose'],
        estimatedTime: '30-60 minutes',
        autoApplicable: false,
        createdAt: new Date().toISOString(),
      });
    }

    return {
      rootCause: this.inferRootCause(error),
      impact: this.assessImpact(error),
      suggestions,
      similarErrors: [],
      preventionTips: this.getPreventionTips(error),
    };
  }

  /**
   * Infer root cause from error
   */
  private inferRootCause(error: ErrorAnalysis): string {
    const message = error.errorMessage.toLowerCase();

    if (message.includes('undefined') || message.includes('null')) {
      return 'Attempting to access a property on a null or undefined value. This typically occurs when data is not properly initialized or an API response is empty.';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network connectivity issue or API server unavailable. Could be due to server downtime, network timeout, or CORS issues.';
    }
    if (message.includes('unauthorized') || message.includes('401')) {
      return 'Authentication token expired or invalid. User session may have timed out or token was not properly stored.';
    }
    if (message.includes('syntax')) {
      return 'JavaScript syntax error, likely due to malformed code or import issues.';
    }

    return 'Root cause requires further investigation. Check the stack trace and recent code changes.';
  }

  /**
   * Assess error impact
   */
  private assessImpact(error: ErrorAnalysis): string {
    const message = error.errorMessage.toLowerCase();

    if (message.includes('render') || message.includes('component')) {
      return 'HIGH: This error prevents UI from rendering correctly. Users will see broken interface.';
    }
    if (message.includes('network') || message.includes('api')) {
      return 'MEDIUM-HIGH: API operations are failing. Data may not be saved or loaded correctly.';
    }
    if (message.includes('unauthorized')) {
      return 'MEDIUM: Authentication issues. Users may be logged out unexpectedly.';
    }

    return 'MEDIUM: Error impact depends on affected functionality. Monitor for user reports.';
  }

  /**
   * Get prevention tips
   */
  private getPreventionTips(error: ErrorAnalysis): string[] {
    const tips: string[] = [];
    const message = error.errorMessage.toLowerCase();

    tips.push('Add comprehensive error boundaries around critical components');
    tips.push('Implement proper loading and error states in UI');

    if (message.includes('undefined') || message.includes('null')) {
      tips.push('Use TypeScript strict mode to catch null issues at compile time');
      tips.push('Add data validation before processing API responses');
    }

    if (message.includes('network')) {
      tips.push('Implement offline-first architecture with local caching');
      tips.push('Add request timeouts and retry logic');
    }

    if (message.includes('unauthorized')) {
      tips.push('Implement proactive token refresh before expiration');
      tips.push('Add session monitoring and user notifications');
    }

    return tips;
  }

  /**
   * Save suggestions to database
   */
  private async saveSuggestions(errorId: string, suggestions: FixSuggestion[]): Promise<void> {
    try {
      const records = suggestions.map(s => ({
        error_id: errorId,
        suggestion_id: s.id,
        confidence: s.confidence,
        category: s.category,
        title: s.title,
        description: s.description,
        suggested_code: s.suggestedCode,
        steps: s.steps,
        risks: s.risks,
        estimated_time: s.estimatedTime,
        auto_applicable: s.autoApplicable,
      }));

      await supabase.from('fix_suggestions').insert(records);
    } catch (error) {
      logger.debug('Failed to save suggestions', error as Error, 'AIFixService');
    }
  }

  /**
   * Get suggestions for an error from database
   */
  async getSuggestions(errorId: string): Promise<FixSuggestion[]> {
    try {
      const { data, error } = await supabase
        .from('fix_suggestions')
        .select('*')
        .eq('error_id', errorId)
        .order('confidence', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.warn('Failed to get suggestions', error as Error, 'AIFixService');
      return [];
    }
  }

  /**
   * Apply an auto-applicable fix
   */
  async applyFix(suggestionId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/api/bug-system/apply-fix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ suggestionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to apply fix');
      }

      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const aiFixService = new AIFixService();
export default aiFixService;
