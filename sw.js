// EuroPython 2026 offline guide — service worker
//
// Bump CACHE_NAME (e.g. to -v2) whenever you redeploy updated content.
// That forces the old cache to be discarded so visitors pick up the new build
// instead of being stuck on a stale cached copy.
const CACHE_NAME = 'europython-2026-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache){ return cache.addAll(ASSETS); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys()
      .then(function(keys){
        return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
      })
      .then(function(){ return self.clients.claim(); })
  );
});

// Cache-first: serve from cache instantly (works offline), refresh the cache
// in the background from the network when available.
self.addEventListener('fetch', function(event){
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function(cached){
      const networkFetch = fetch(event.request).then(function(response){
        if (response && response.ok && response.type === 'basic'){
          const copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
        }
        return response;
      }).catch(function(){
        // Offline and not cached: fall back to the app shell for navigations.
        if (event.request.mode === 'navigate') return caches.match('./index.html');
        return cached;
      });

      return cached || networkFetch;
    })
  );
});
