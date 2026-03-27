// Pellicura Service Worker — Push notifications + offline fallback

const CACHE_NAME = 'pellicura-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

// Push notification handler
self.addEventListener('push', (event) => {
  let data = { title: 'Pellicura', body: 'Time for your skincare routine!', url: '/dashboard' };
  if (event.data) {
    try { data = { ...data, ...event.data.json() }; } catch { data.body = event.data.text(); }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/dashboard' },
      actions: [
        { action: 'open', title: 'Open App' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
      tag: 'pellicura-' + Date.now(),
    })
  );
});

// Click handler — open or focus app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// Network-first for navigation, fallback to simple offline message
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response('<html><body style="font-family:system-ui;text-align:center;padding:60px 20px"><h1>You\'re offline</h1><p>Check your connection and try again.</p></body></html>', {
          headers: { 'Content-Type': 'text/html' },
        })
      )
    );
  }
});
