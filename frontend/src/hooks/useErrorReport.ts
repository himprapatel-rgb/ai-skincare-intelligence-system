/**
 * Optional error-reporting hook (Task 43).
 * Call reportError(error, context) to log and optionally send to Sentry when VITE_SENTRY_DSN is set.
 * To enable Sentry: set VITE_SENTRY_DSN in .env and add @sentry/react; then init Sentry in main.tsx.
 */

import { useCallback } from 'react';

export type ErrorContext = Record<string, unknown>;

export function useErrorReport() {
  const reportError = useCallback((error: unknown, context?: ErrorContext) => {
    if (import.meta.env.DEV) {
      console.error('[ErrorReport]', error, context);
    }
    // When VITE_SENTRY_DSN is set and @sentry/react is installed, capture here:
    // if (import.meta.env.VITE_SENTRY_DSN && typeof window !== 'undefined' && (window as unknown as { Sentry?: { captureException: (e: unknown, o?: { extra?: ErrorContext }) => void } }).Sentry) {
    //   (window as unknown as { Sentry: { captureException: (e: unknown, o?: { extra?: ErrorContext }) => void } }).Sentry.captureException(error, { extra: context });
    // }
  }, []);

  return { reportError };
}
