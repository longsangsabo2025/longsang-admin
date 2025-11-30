import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/utils/logger';
import { errorHandler, ErrorContext } from '@/lib/bug-system/errorHandler';
import * as Sentry from '@sentry/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to existing logger (backward compatibility)
    logger.error('React Error Boundary caught an error', error, 'ErrorBoundary');

    // Send to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      tags: {
        component: 'ErrorBoundary',
      },
    });

    // Send to error handler (for database logging)
    const context: ErrorContext = {
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
    };

    errorHandler.capture(error, context).catch(err => {
      logger.warn('Failed to capture error in ErrorBoundary', err as Error, 'ErrorBoundary');
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle>Oops! Something went wrong</CardTitle>
              </div>
              <CardDescription>
                An unexpected error occurred. Our team has been notified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {import.meta.env.DEV && this.state.error && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Error Details (Development Only):</p>
                  <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={this.handleReset}>Try Again</Button>
                <Button variant="outline" onClick={() => globalThis.location.href = '/'}>
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
