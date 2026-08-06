// Cache the whole app on install so a session works in a hallway with no signal.

const CACHE = 'lucy-learns-v9';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './css/app.css',
  './fonts/fraunces-latin.woff2',
  './fonts/karla-latin.woff2',
  './js/app.js',
  './js/ui.js',
  './js/store.js',
  './js/content.js',
  './js/metrics.js',
  './js/views/today.js',
  './js/views/activities.js',
  './js/views/detail.js',
  './js/views/player.js',
  './js/views/progress.js',
  './js/views/lucy.js',
  './js/views/moment.js',
  './js/views/welcome.js',
  './img/lucy-portrait.jpg',
  './img/thumb-dg-01.jpg',
  './img/thumb-dg-02.jpg',
  './img/thumb-dg-03.jpg',
  './img/thumb-dg-04.jpg',
  './img/thumb-dg-05.jpg',
  './img/thumb-dg-06.jpg',
  './img/thumb-dg-07.jpg',
  './img/thumb-dg-08.jpg',
  './img/thumb-dg-09.jpg',
  './img/thumb-dg-10.jpg',
  './img/thumb-dg-11.jpg',
  './img/thumb-dg-12.jpg',
  './img/dg-01.jpg',
  './img/dg-02.jpg',
  './img/dg-03.jpg',
  './img/dg-04.jpg',
  './img/dg-05.jpg',
  './img/dg-06.jpg',
  './img/dg-07.jpg',
  './img/dg-08.jpg',
  './img/dg-09.jpg',
  './img/dg-10.jpg',
  './img/dg-11.jpg',
  './img/dg-12.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // addAll is all-or-nothing, so add individually and tolerate misses.
      // Bypass the HTTP cache on install too, so a new version never
      // primes itself with the files it was meant to replace.
      .then((cache) =>
        Promise.all(
          SHELL.map((url) =>
            fetch(url, { cache: 'no-cache' })
              .then((res) => (res.ok ? cache.put(url, res) : null))
              .catch(() => {})
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  // Cache first for illustrations and fonts. Both are large and never change.
  if (request.destination === 'image' || request.destination === 'font') {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
    return;
  }

  // Everything else is network first, so an edit is never masked by the cache.
  // Module imports do not always report destination "script", so this has to be
  // the default branch rather than a list of destinations.
  //
  // `cache: 'no-cache'` forces revalidation with the server. Without it the
  // browser's own HTTP cache answers first, and GitHub Pages sends
  // max-age=600 — so a fresh deploy would keep serving the old bundle.
  event.respondWith(
    fetch(request, { cache: 'no-cache' })
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match('./index.html')))
  );
});
