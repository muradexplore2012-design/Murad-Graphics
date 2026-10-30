// Vyrqonix Lightweight PWA Service Worker
const CACHE_NAME = 'vyrqonix-pwa-v11';

let dynamicSubtitle = 'YOUR DIGITAL WORLD';
let dynamicSiteName = 'Vyrqonix';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UPDATE_PWA_SETTINGS') {
    if (event.data.siteName) dynamicSiteName = event.data.siteName;
    if (event.data.siteSubtitle) dynamicSubtitle = event.data.siteSubtitle;
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Dynamically serve manifest.json with the updated logo subtitle
  if (url.pathname === '/manifest.json') {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          try {
            const data = await response.json();
            data.name = `${dynamicSiteName} - ${dynamicSubtitle}`;
            data.short_name = dynamicSiteName;
            return new Response(JSON.stringify(data, null, 2), {
              headers: {
                'Content-Type': 'application/manifest+json; charset=utf-8',
                'Cache-Control': 'no-cache'
              }
            });
          } catch {
            return response;
          }
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
