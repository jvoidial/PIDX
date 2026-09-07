/* Service worker for the Quantum Ease Flow dashboard.
   Registered with a relative scope so it also works under the
   /spirit-guide-token/ GitHub Pages path. */
const CACHE = 'sgt-shell-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './agi_phb_divine_complete.json',
  './images/icon-192.png',
  './images/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let CDN + API calls hit the network

  // The dashboard JSON is network-first so a live page always shows fresh data,
  // with the last successful response kept for offline use.
  if (url.pathname.endsWith('agi_phb_divine_complete.json')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('./agi_phb_divine_complete.json', copy));
          return response;
        })
        .catch(() => caches.match('./agi_phb_divine_complete.json'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response && response.status === 200 && response.type === 'basic') {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
      }
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});
