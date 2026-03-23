/**
 * Service Worker registration utility
 * Registers the service worker and handles updates
 */

function getServiceWorkerBaseScope(): string {
  const baseUrl = import.meta.env.BASE_URL || '/';
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const scope = getServiceWorkerBaseScope();
    const registration = await navigator.serviceWorker.register(`${scope}service-worker.js`, {
      scope,
    });

    void registration.scope;

    // Check for updates periodically (every hour)
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000);

    // Handle service worker updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker available
          // Show update notification to user
          if (confirm('A new version is available! Reload to update?')) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        }
      });
    });

    // Handle controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });

    return true;
  } catch (error) {
    void error;
    return false;
  }
}

/**
 * Unregister service worker (for development/testing)
 */
export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration(getServiceWorkerBaseScope());
    if (registration) {
      await registration.unregister();
      return true;
    }
    return false;
  } catch (error) {
    void error;
    return false;
  }
}

/**
 * Check if service worker is active
 */
export function isServiceWorkerActive(): boolean {
  return !!(navigator.serviceWorker && navigator.serviceWorker.controller);
}

/**
 * Send message to service worker
 */
export function sendMessageToSW(message: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (!navigator.serviceWorker.controller) {
      reject(new Error('No service worker controller'));
      return;
    }

    const messageChannel = new MessageChannel();
    
    messageChannel.port1.onmessage = (event) => {
      const payload = event.data as { error?: unknown };
      if (payload.error) {
        reject(payload.error);
      } else {
        resolve(event.data);
      }
    };

    navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
  });
}

/**
 * Cache specific URLs for offline use
 */
export async function cacheUrls(urls: string[]) {
  if (!isServiceWorkerActive()) return false;

  try {
    await sendMessageToSW({
      type: 'CACHE_URLS',
      urls,
    });
    return true;
  } catch (error) {
    void error;
    return false;
  }
}

/**
 * Clear all caches (for debugging)
 */
export async function clearAllCaches() {
  if (!('caches' in window)) return false;

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    return true;
  } catch (error) {
    void error;
    return false;
  }
}
