const CACHE_NAME = 'dardcor-media-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icons/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Hanya cache GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Jangan cache jika localhost atau development
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return;
  }

  // Jangan cache API atau Supabase requests
  if (url.pathname.startsWith('/api') || url.hostname.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Cache assets static Next.js
        if (
          response.status === 200 &&
          (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/'))
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback if needed
        return caches.match('/');
      });
    })
  );
});
