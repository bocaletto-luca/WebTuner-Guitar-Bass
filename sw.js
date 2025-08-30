// Simple offline-first cache
const CACHE = 'webtuner-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './favicon.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  e.respondWith(
    caches.match(req).then(cached =>
      cached ||
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(cache => {
          // Only cache GET same-origin requests
          if (req.method === 'GET' && req.url.startsWith(self.location.origin)) {
            cache.put(req, copy);
          }
        });
        return res;
      }).catch(() => caches.match('./index.html'))
    )
  );
});
