const CACHE_NAME = 'beautiful-tv-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json',
  '/assets/favicon.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  'https://raw.githubusercontent.com/tvBeautifully/assets/refs/heads/main/BeautifulVideos.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request).catch(() =>
        new Response('<h1 style="text-align:center;color:red;">Offline</h1>', {
          headers: { 'Content-Type': 'text/html' }
        })
      ))
  );
});
