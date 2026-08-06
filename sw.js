// Cache the whole app on install so a session works in a hallway with no signal.

const CACHE = 'lucy-learns-v4';

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
  './img/lucy-portrait.jpg',
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
      .then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => {}))))
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
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match('./index.html')))
  );
});
