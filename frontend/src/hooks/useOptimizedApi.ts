/**
 * Optimized API Hook with Loading States
 * Provides better UX for slow API calls
 */

import { useState, useEffect, useCallback } from 'react';
import { optimizedApi } from '../services/apiOptimized';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: unknown) => void;
  immediate?: boolean;
  showLoadingAfter?: number; // ms delay before showing loading
}

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const maybeError = err as { message?: unknown; response?: { data?: { detail?: unknown } } };
    if (typeof maybeError.response?.data?.detail === 'string') {
      return maybeError.response.data.detail;
    }
    if (typeof maybeError.message === 'string') {
      return maybeError.message;
    }
  }
  return 'Request failed';
}

export function useOptimizedApi<T = unknown>(
  url: string,
  options: UseApiOptions<T> = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { onSuccess, onError, immediate = true, showLoadingAfter = 300 } = options;

  const execute = useCallback(async () => {
    setError(null);
    
    // Delay showing loading indicator to prevent flashing
    const loadingTimeout = setTimeout(() => setLoading(true), showLoadingAfter);

    try {
      const result = await optimizedApi.get<T>(url);
      clearTimeout(loadingTimeout);
      setData(result);
      setLoading(false);
      onSuccess?.(result);
      return result;
    } catch (err: unknown) {
      clearTimeout(loadingTimeout);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      setLoading(false);
      onError?.(err);
      throw err;
    }
  }, [url, onSuccess, onError, showLoadingAfter]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  const refetch = useCallback(() => execute(), [execute]);

  return { data, loading, error, refetch };
}

/**
 * Hook for mutations (POST/PUT/DELETE)
 */
export function useOptimizedMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onSuccess?: (data: TData) => void;
    onError?: (error: unknown) => void;
  } = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (variables: TVariables) => {
      setLoading(true);
      setError(null);

      try {
        const result = await mutationFn(variables);
        setLoading(false);
        options.onSuccess?.(result);
        return result;
      } catch (err: unknown) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        setLoading(false);
        options.onError?.(err);
        throw err;
      }
    },
    [mutationFn, options]
  );

  return { mutate, loading, error };
}
