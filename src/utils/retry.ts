/**
 * Retry utility for handling transient errors like connection resets
 * Implements exponential backoff with jitter for optimal retry behavior
 */

// Types of errors that are typically considered transient and can be retried
const RETRYABLE_ERROR_CODES = [
  'ECONNRESET',    // Connection reset by peer
  'ECONNREFUSED',  // Connection refused
  'ETIMEDOUT',     // Connection timed out
  'EPIPE',         // Broken pipe
  'EAGAIN',        // Resource temporarily unavailable
  'ENOTFOUND',     // DNS lookup failed
  'ENETUNREACH',   // Network unreachable
];

/**
 * Options for the retry function
 */
export interface RetryOptions {
  // Maximum number of retry attempts
  maxRetries?: number;
  
  // Initial delay in milliseconds before the first retry
  initialDelayMs?: number;
  
  // Maximum delay in milliseconds between retries
  maxDelayMs?: number;
  
  // Factor by which the delay increases with each retry attempt (exponential backoff)
  backoffFactor?: number;
  
  // Whether to add jitter to prevent retry storms
  jitter?: boolean;
  
  // Optional function to determine if an error is retryable
  retryableErrorCheck?: (error: any) => boolean;
  
  // Optional logging function
  onRetry?: (error: any, attempt: number, delay: number) => void;
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 10000,
  backoffFactor: 2,
  jitter: true,
  retryableErrorCheck: (error: any) => {
    // Check if the error has a code property that matches our retryable error codes
    if (error && error.code && RETRYABLE_ERROR_CODES.includes(error.code)) {
      return true;
    }
    return false;
  },
  onRetry: (error, attempt, delay) => {
    console.warn(
      `Retry attempt ${attempt} after ${delay}ms due to error: ${error.code || error.message}`
    );
  },
};

/**
 * Sleep for a specified number of milliseconds
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Calculate the delay for the next retry attempt with exponential backoff
 * Adds jitter to prevent retry storms when many clients are retrying simultaneously
 */
export const calculateBackoffDelay = (
  attempt: number,
  options: Required<RetryOptions>
): number => {
  const { initialDelayMs, maxDelayMs, backoffFactor, jitter } = options;
  
  // Calculate exponential backoff: initialDelay * (backoffFactor^attempt)
  let delay = initialDelayMs * Math.pow(backoffFactor, attempt);
  
  // Apply jitter if enabled (adds a random factor between 0.5 and 1.5)
  if (jitter) {
    const jitterFactor = 0.5 + Math.random();
    delay *= jitterFactor;
  }
  
  // Cap at maximum delay
  return Math.min(delay, maxDelayMs);
};

/**
 * Retry a function with exponential backoff
 * 
 * @param fn The async function to retry
 * @param options Retry options
 * @returns A promise that resolves with the result of the function or rejects after all retries fail
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  // Merge provided options with defaults
  const mergedOptions: Required<RetryOptions> = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options,
  };
  
  const { maxRetries, retryableErrorCheck, onRetry } = mergedOptions;
  
  let lastError: any;
  
  // Try the operation up to maxRetries + 1 times (initial attempt + retries)
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Attempt the operation
      return await fn();
    } catch (error) {
      lastError = error;
      
      // If this was the last attempt, or the error isn't retryable, rethrow
      if (
        attempt >= maxRetries || 
        !retryableErrorCheck(error)
      ) {
        throw error;
      }
      
      // Calculate delay for next attempt
      const delay = calculateBackoffDelay(attempt, mergedOptions);
      
      // Call the onRetry callback if provided
      if (onRetry) {
        onRetry(error, attempt + 1, delay);
      }
      
      // Wait before the next attempt
      await sleep(delay);
    }
  }
  
  // This should never be reached due to the throw in the loop, but TypeScript requires it
  throw lastError;
}