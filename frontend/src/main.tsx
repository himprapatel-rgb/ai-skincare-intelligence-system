import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App.tsx'
import './index.css'  // index.css imports design-system, responsive-*, mobile-redesign, etc. via @import

// Sentry error tracking (only init if DSN is configured)
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
  })
}

// Register service worker for PWA support
import { unregisterServiceWorker } from './utils/registerServiceWorker'

// In production, aggressively clear legacy service workers/caches to avoid stale chunk preload failures.
if (import.meta.env.PROD) {
  void (async () => {
    try {
      await unregisterServiceWorker();
      if ('serviceWorker' in navigator && 'getRegistrations' in navigator.serviceWorker) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map((name) => caches.delete(name)));
      }
    } catch {
      // no-op: startup should continue even if cache cleanup fails
    }
  })();
}

const CHUNK_RELOAD_GUARD_KEY = 'pellicura_chunk_reload_once';
const CHUNK_PRELOAD_ERROR_RE = /(Unable to preload CSS|Failed to fetch dynamically imported module|Loading chunk [\w-]+ failed)/i;

function tryRecoverFromChunkError(rawError: unknown): void {
  const message = rawError instanceof Error ? rawError.message : String(rawError ?? '');
  if (!CHUNK_PRELOAD_ERROR_RE.test(message)) return;
  if (sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY) === '1') return;
  sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, '1');
  window.location.reload();
}

window.addEventListener('error', (event) => {
  tryRecoverFromChunkError(event.error ?? event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  tryRecoverFromChunkError(event.reason);
});

// Task 10000: Remove splash when app mounts (app-like loading)
const splash = document.getElementById('app-splash')
const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
if (splash) {
  const hide = () => {
    splash.classList.add('hidden')
    setTimeout(() => splash.remove(), 250)
  }
  requestAnimationFrame(() => requestAnimationFrame(hide))
  // Failsafe: never leave users permanently blocked on splash.
  setTimeout(hide, 3500)
}