/**
 * Task 44: Health-check endpoint or status indicator
 * Shows API connection status in footer.
 */
import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://pellicura-api.fly.dev/api/v1';

// Health check URL - use /api/health instead of /api/v1 which returns 404
function getHealthUrl(): string {
  const base = API_BASE.replace(/\/$/, '');
  // Convert /api/v1 to /api/health
  if (base.endsWith('/api/v1')) {
    return base.replace('/api/v1', '/api/health');
  }
  return base + '/health';
}

export function ApiStatusIndicator() {
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
  return (
    <span className="api-status" aria-live="polite" aria-label={status === 'up' ? 'API connected' : 'API offline'}>
      <span className={`api-status-dot api-status-dot--${status}`} aria-hidden="true" />
      {status === 'up' ? 'API connected' : 'API offline'}
    </span>
  );
}
