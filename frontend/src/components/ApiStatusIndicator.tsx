/**
 * Task 44: Health-check endpoint or status indicator
 * Shows API connection status in footer.
 */
import React, { useState, useEffect } from 'react';

import { API_BASE_URL } from '../config';
const API_BASE = API_BASE_URL;

// Health check URL - use /api/health instead of /api/v1 which returns 404
function getHealthUrl(): string {
  const base = API_BASE.replace(/\/$/, '');
  // Convert /api/v1 to /api/health
  if (base.endsWith('/api/v1')) {
    return base.replace('/api/v1', '/api/health');
  }
  return base + '/health';
}

type ApiStatusIndicatorProps = {
  /** When true, hide the indicator when API is up (e.g. in footer for end users) */
  hideWhenConnected?: boolean;
};

export const ApiStatusIndicator = React.memo(function ApiStatusIndicator({ hideWhenConnected = false }: ApiStatusIndicatorProps) {
  const [status, setStatus] = useState<'checking' | 'up' | 'down'>('checking');

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    fetch(getHealthUrl(), { signal: controller.signal, method: 'GET' })
      .then((res) => {
        if (cancelled) return;
        setStatus(res.ok || res.status === 401 ? 'up' : 'down');
      })
      .catch(() => {
        if (!cancelled) setStatus('down');
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  if (status === 'checking') return null;
  if (hideWhenConnected && status === 'up') return null;
  return (
    <span className="api-status" aria-live="polite" aria-label={status === 'up' ? 'API connected' : 'API offline'}>
      <span className={`api-status-dot api-status-dot--${status}`} aria-hidden="true" />
      {status === 'up' ? 'API connected' : 'API offline'}
    </span>
  );
});
