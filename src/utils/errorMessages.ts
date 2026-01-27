/**
 * Error message handling utilities
 * Provides structured error parsing and user-friendly error messages
 */

export const ErrorType = {
  NETWORK: 'network',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  VALIDATION: 'validation',
  NOT_FOUND: 'not_found',
  SERVER: 'server',
  UNKNOWN: 'unknown',
} as const;

export type ErrorType = (typeof ErrorType)[keyof typeof ErrorType];

export interface ErrorDetails {
  type: ErrorType;
  message: string;
  userMessage: string;
  canRetry: boolean;
  statusCode?: number;
}

/**
 * Parses API errors and returns structured error details
 * @param error - The error object from API or fetch
 * @param defaultMessage - Optional default message if error parsing fails
 * @returns ErrorDetails object with type, messages, and retry capability
 */
export function parseApiError(error: any, defaultMessage?: string): ErrorDetails {
  // Handle network errors (fetch failures)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: ErrorType.NETWORK,
      message: error.message,
      userMessage: 'Unable to connect to the server. Please check your internet connection and try again.',
      canRetry: true
    };
  }

  // Handle HTTP errors with status codes
  const statusCode = error.statusCode || error.status;
  
  if (statusCode) {
    switch (statusCode) {
      case 401:
        return {
          type: ErrorType.AUTHENTICATION,
          message: error.message || 'Unauthorized',
          userMessage: 'Your session has expired. Please log in again.',
          canRetry: false,
          statusCode: 401
        };
      
      case 403:
        return {
          type: ErrorType.AUTHORIZATION,
          message: error.message || 'Forbidden',
          userMessage: 'You do not have permission to perform this action.',
          canRetry: false,
          statusCode: 403
        };
      
      case 404:
        return {
          type: ErrorType.NOT_FOUND,
          message: error.message || 'Not found',
          userMessage: 'The requested resource was not found.',
          canRetry: false,
          statusCode: 404
        };
      
      case 422:
        // Validation errors - use server message if available, otherwise generic
        const validationMessage = error.message || error.error || 'Please check your input and try again.';
        return {
          type: ErrorType.VALIDATION,
          message: validationMessage,
          userMessage: validationMessage,
          canRetry: false,
          statusCode: 422
        };
      
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: ErrorType.SERVER,
          message: error.message || 'Server error',
          userMessage: 'The server encountered an error. Please try again later.',
          canRetry: true,
          statusCode: statusCode
        };
      
      default:
        // Other HTTP errors (4xx, 5xx)
        if (statusCode >= 400 && statusCode < 500) {
          return {
            type: ErrorType.UNKNOWN,
            message: error.message || `Client error (${statusCode})`,
            userMessage: error.message || defaultMessage || 'An error occurred. Please check your input and try again.',
            canRetry: false,
            statusCode: statusCode
          };
        } else if (statusCode >= 500) {
          return {
            type: ErrorType.SERVER,
            message: error.message || `Server error (${statusCode})`,
            userMessage: 'The server encountered an error. Please try again later.',
            canRetry: true,
            statusCode: statusCode
          };
        }
    }
  }

  // Handle error objects with message property
  if (error && typeof error === 'object' && error.message) {
    return {
      type: ErrorType.UNKNOWN,
      message: error.message,
      userMessage: error.message || defaultMessage || 'An unexpected error occurred. Please try again.',
      canRetry: true
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      type: ErrorType.UNKNOWN,
      message: error,
      userMessage: error || defaultMessage || 'An unexpected error occurred. Please try again.',
      canRetry: true
    };
  }

  // Default fallback
  return {
    type: ErrorType.UNKNOWN,
    message: defaultMessage || 'An unexpected error occurred',
    userMessage: defaultMessage || 'Something went wrong. Please try again.',
    canRetry: true
  };
}
