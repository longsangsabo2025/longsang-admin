/**
 * Custom Error Types for LongSang Forge
 * Provides type-safe error handling throughout the application
 */

// Base error class
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Authentication errors
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHZ_ERROR', 403);
  }
}

// Validation errors
export class ValidationError extends AppError {
  constructor(
    message: string,
    public fields?: Record<string, string>
  ) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

// API errors
export class APIError extends AppError {
  constructor(
    message: string,
    statusCode: number = 500,
    public endpoint?: string
  ) {
    super(message, 'API_ERROR', statusCode);
  }
}

// Database errors
export class DatabaseError extends AppError {
  constructor(
    message: string,
    public query?: string
  ) {
    super(message, 'DB_ERROR', 500);
  }
}

// Not found errors
export class NotFoundError extends AppError {
  constructor(
    resource: string = 'Resource'
  ) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

// Rate limit errors
export class RateLimitError extends AppError {
  constructor(
    message: string = 'Too many requests',
    public retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT', 429);
  }
}

// Network errors
export class NetworkError extends AppError {
  constructor(
    message: string = 'Network request failed',
    public url?: string
  ) {
    super(message, 'NETWORK_ERROR', 503);
  }
}

// Type guard to check if error is AppError
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

// Error handler utility
export function handleError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR');
  }

  return new AppError('An unknown error occurred', 'UNKNOWN_ERROR');
}

// Error response type
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    statusCode: number;
    fields?: Record<string, string>;
    stack?: string;
  };
}

// Convert AppError to ErrorResponse
export function toErrorResponse(error: AppError, includeStack: boolean = false): ErrorResponse {
  return {
    error: {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      ...(error instanceof ValidationError && error.fields ? { fields: error.fields } : {}),
      ...(includeStack ? { stack: error.stack } : {}),
    },
  };
}
