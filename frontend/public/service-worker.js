// Emergency cleanup service worker.
// Purpose: remove legacy stale caches/workers that can trap users on splash screens
// or reference old CSS/JS chunk names after deploy.

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const names = await caches.keys();
        await Promise.all(names.map((name) => caches.delete(name)));
      } catch {
        // ignore cache cleanup failures
      }

      await self.clients.claim();
      await self.registration.unregister();

      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clients) {
        // Reload open tabs so they rebootstrap from network without old SW cache.
        client.navigate(client.url);
      }
    })()
  );
});
