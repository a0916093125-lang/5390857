const CACHE_NAME = 'hs-5390857-static-v20261114v31';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/water-tank.html',
  '/cooling-tower.html',
  '/ac-cleaning.html',
  '/motor-pump-valve.html',
  '/shop.html',
  '/quote.html',
  '/llms.txt',
  '/ucp.json',
  '/assets/style.css?v=20261114v31',
  '/assets/stage1-preview.css?v=20261114v31',
  '/assets/mobile-ux.css?v=20261114v31',
  '/assets/choice-cards.css?v=20261114v31',
  '/assets/mep-scroll-world.css?v=20261114v31',
  '/assets/pricing-config.js?v=20261114v31',
  '/assets/cad-engine.js?v=20261114v31',
  '/assets/choice-cards.js?v=20261114v31',
  '/assets/mobile-ux.js?v=20261114v31',
  '/assets/mep-scroll-world.js?v=20261114v31',
  '/assets/favicon.svg'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return Promise.allSettled(
        PRECACHE_URLS.map(function (url) {
          return cache.add(url);
        })
      );
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('analytics.js')) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(function (response) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, copy);
        });
        return response;
      }).catch(function () {
        return caches.match(event.request).then(function (cached) {
          return cached || caches.match('/index.html');
        });
      })
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      const networkFetch = fetch(event.request).then(function (response) {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, copy);
          });
        }
        return response;
      }).catch(function () {
        return cached;
      });
      return cached || networkFetch;
    })
  );
});
