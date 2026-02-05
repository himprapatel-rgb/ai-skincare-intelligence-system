/**
 * Shared error handling utilities
 * Reduces code duplication across components
 */

import axios from 'axios';

export interface ApiError {
  message: string;
  statusCode?: number;
  detail?: string;
}

/**
 * Extract error message from various error types
 * @param error - Error object (axios, Error, or unknown)
 * @param fallback - Fallback message if no specific error found
 * @returns User-friendly error message
 */
export function getErrorMessage(error: unknown, fallback = 'An unexpected error occurred'): string {
  // Axios error with response
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { detail?: string; message?: string } | undefined;
    
    // API-specific error detail
    if (data?.detail) {
      return typeof data.detail === 'string' ? data.detail : fallback;
    }
    
    // Generic message from API
    if (data?.message) {
      return data.message;
    }
    
    // HTTP status-based messages
    if (error.response?.status) {
      return getHttpStatusMessage(error.response.status, fallback);
    }
    
    // Network error (no response)
    if (error.message === 'Network Error') {
      return 'Network error. Please check your connection.';
    }
    
    return error.message || fallback;
  }
  
  // Standard Error object
  if (error instanceof Error) {
    return error.message || fallback;
  }
  
  // String error
  if (typeof error === 'string') {
    return error;
  }
  
  // Object with message property
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message: unknown }).message;
    if (typeof msg === 'string') {
      return msg;
    }
  }
  
  return fallback;
}

/**
 * Get user-friendly message for HTTP status codes
 */
function getHttpStatusMessage(status: number, fallback: string): string {
  const messages: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'Please log in to continue.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'This action conflicts with existing data.',
    422: 'Invalid data provided. Please check your input.',
    429: 'Too many requests. Please try again later.',
    500: 'Server error. Please try again later.',
    502: 'Service temporarily unavailable.',
    503: 'Service temporarily unavailable.',
  };
  
  return messages[status] || fallback;
}

/**
 * Parse API error into structured format
 */
export function parseApiError(error: unknown): ApiError {
  const message = getErrorMessage(error);
  
  if (axios.isAxiosError(error)) {
    return {
      message,
      statusCode: error.response?.status,
      detail: error.response?.data?.detail,
    };
  }
  
  return { message };
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return error.message === 'Network Error' || !error.response;
  }
  return false;
}

/**
 * Check if error is an authentication error (401 or 403)
 */
export function isAuthError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    return status === 401 || status === 403;
  }
  return false;
}

/**
 * Check if error is a validation error (400 or 422)
 */
export function isValidationError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    return status === 400 || status === 422;
  }
  return false;
}

/**
 * Retry an async function with exponential backoff
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retries
 * @param initialDelay - Initial delay in ms (doubles each retry)
 * @returns Result of the function or throws last error
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on auth or validation errors
      if (isAuthError(error) || isValidationError(error)) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait with exponential backoff
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Create a toast message from an error
 * Compatible with ToastContext
 */
export function createErrorToast(error: unknown, title = 'Error') {
  return {
    title,
    message: getErrorMessage(error),
    type: 'error' as const,
  };
}
