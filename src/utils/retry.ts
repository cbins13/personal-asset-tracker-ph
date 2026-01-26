/**
 * Retry utility with exponential backoff
 * Provides automatic retry logic for failed network requests
 */

import { ErrorType } from './errorMessages';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error, delay: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

const IS_DEV = import.meta.env.DEV;

/**
 * Determines if an error is retryable based on error type
 * @param error - The error to check
 * @returns true if the error is retryable, false otherwise
 */
function isRetryableError(error: any): boolean {
  // Network errors (TypeError with 'fetch' in message) are always retryable
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  // Check if error has errorType property (from parseApiError)
  if (error.errorType) {
    return error.errorType === ErrorType.NETWORK || error.errorType === ErrorType.SERVER;
  }

  // Check status code for server errors (5xx)
  const statusCode = error.statusCode || error.status;
  if (statusCode) {
    // Retry server errors (5xx)
    if (statusCode >= 500 && statusCode < 600) {
      return true;
    }
    // Don't retry client errors (4xx) except for specific cases
    if (statusCode >= 400 && statusCode < 500) {
      // Don't retry auth errors, validation errors, etc.
      return false;
    }
  }

  // Default: retry unknown errors (might be transient)
  return true;
}

/**
 * Wraps an async function with retry logic using exponential backoff
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns Promise that resolves with the function result or rejects after max attempts
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts: Required<Omit<RetryOptions, 'onRetry'>> & { onRetry?: RetryOptions['onRetry'] } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      const result = await fn();
      
      // Log successful retry if this wasn't the first attempt
      if (attempt > 1 && IS_DEV) {
        console.log(`[Retry] Success on attempt ${attempt}`);
      }
      
      return result;
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt
      if (attempt === opts.maxAttempts) {
        if (IS_DEV) {
          console.error(`[Retry] Failed after ${attempt} attempts:`, lastError.message);
        }
        break;
      }

      // Check if error is retryable
      if (!isRetryableError(error)) {
        if (IS_DEV) {
          console.log(`[Retry] Error not retryable (attempt ${attempt}):`, lastError.message);
        }
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelay
      );

      if (IS_DEV) {
        console.log(
          `[Retry] Attempt ${attempt}/${opts.maxAttempts} failed, retrying in ${delay}ms...`,
          lastError.message
        );
      }

      // Call onRetry callback if provided
      if (opts.onRetry) {
        opts.onRetry(attempt, lastError, delay);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Throw the last error if all retries failed
  throw lastError || new Error('Retry failed: unknown error');
}
