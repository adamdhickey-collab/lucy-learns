// Cache the whole app on install so a session works in a hallway with no signal.
//
// The cache is named after the ?v= query on the registration URL, which
// app.js sets from js/version.js. Bumping APP_VERSION changes the URL, the
// browser treats that as a new service worker, and the activate step below
// clears every cache that does not match. One constant rotates everything.

const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE = `lucy-learns-${VERSION}`;

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
  './js/version.js',
  './js/study.js',
  './js/config.js',
  './js/metrics.js',
  './js/program.js',
  './js/programui.js',
  // The player imports this at module load, so a miss here does not degrade
  // hands-free — it takes the whole player down in a hallway with no signal.
  './js/voice.js',
  './js/views/program.js',
  './js/views/today.js',
  './js/views/activities.js',
  './js/views/detail.js',
  './js/views/player.js',
  './js/views/progress.js',
  './js/views/lucy.js',
  './js/views/moment.js',
  './js/views/welcome.js',
  './js/views/report.js',
  './js/person.js',
  './img/lucy-portrait.jpg',
  './img/splash-mark.jpg',
  // The ten dog portraits. All of them, not just the chosen one: the picker
  // shows the full grid, and a household that opens it offline to change their
  // mind should not meet nine broken tiles. 80 KB for the set.
  './img/avatars/dog-01.png',
  './img/avatars/dog-02.png',
  './img/avatars/dog-03.png',
  './img/avatars/dog-04.png',
  './img/avatars/dog-05.png',
  './img/avatars/dog-06.png',
  './img/avatars/dog-07.png',
  './img/avatars/dog-08.png',
  './img/avatars/dog-09.png',
  './img/avatars/dog-10.png',
  './img/thumb-door-cover.jpg',
  './img/thumb-door-place-03-send.jpg',
  './img/thumb-door-place-cover.jpg',
  './img/thumb-door-stay-03-cross.jpg',
  './img/thumb-door-stay-03-onestep.jpg',
  './img/thumb-door-stay-03-halfway.jpg',
  './img/thumb-door-stay-03-handle.jpg',
  './img/thumb-door-stay-03-crack.jpg',
  './img/thumb-door-stay-03-conversation.jpg',
  './img/thumb-door-stay-03-pretend.jpg',
  './img/thumb-door-stay-04-pay.jpg',
  './img/thumb-door-stay-05-release.jpg',
  './img/thumb-door-stay-cover.jpg',
  './img/thumb-plan-fourpaws.jpg',
  './img/thumb-plan-mat.jpg',
  './img/thumb-plan-walkpeople.jpg',
  './img/thumb-plan-name.jpg',
  './img/thumb-door-greet-04-open.jpg',
  './img/thumb-door-greet-05-reward.jpg',
  './img/thumb-door-greet-06-enter.jpg',
  './img/thumb-door-greet-06-seated.jpg',
  './img/thumb-door-greet-07-approach.jpg',
  './img/thumb-door-greet-09-leaves.jpg',
  './img/thumb-door-greet-cover.jpg',
  './img/thumb-door-sound-01-setup.jpg',
  './img/thumb-door-sound-02-self.jpg',
  './img/thumb-door-sound-03-name.jpg',
  './img/thumb-door-sound-03-name-distant.jpg',
  './img/thumb-door-sound-04-treats.jpg',
  './img/thumb-door-sound-05-settle.jpg',
  './img/thumb-door-sound-cover.jpg',
  './img/thumb-door-greet-08-petting.jpg',
  './img/thumb-door-greet-08-jumping.jpg',
  './img/thumb-door-sound-02-bell.jpg',
  './img/thumb-door-sound-02-knock.jpg',
  './img/thumb-door-stay-02-cue.jpg',
  './img/thumb-door-greet-01-settle.jpg',
  './img/door-cover.jpg',
  './img/door-place-03-send.jpg',
  './img/door-place-cover.jpg',
  './img/door-stay-03-cross.jpg',
  './img/door-stay-03-onestep.jpg',
  './img/door-stay-03-halfway.jpg',
  './img/door-stay-03-handle.jpg',
  './img/door-stay-03-crack.jpg',
  './img/door-stay-03-conversation.jpg',
  './img/door-stay-03-pretend.jpg',
  './img/door-stay-04-pay.jpg',
  './img/door-stay-05-release.jpg',
  './img/door-stay-cover.jpg',
  './img/plan-fourpaws.jpg',
  './img/plan-mat.jpg',
  './img/plan-walkpeople.jpg',
  './img/plan-name.jpg',
  './img/door-greet-04-open.jpg',
  './img/door-greet-05-reward.jpg',
  './img/door-greet-06-enter.jpg',
  './img/door-greet-06-seated.jpg',
  './img/door-greet-07-approach.jpg',
  './img/door-greet-09-leaves.jpg',
  './img/door-greet-cover.jpg',
  './img/door-sound-01-setup.jpg',
  './img/door-sound-02-self.jpg',
  './img/door-sound-03-name.jpg',
  './img/door-sound-03-name-distant.jpg',
  './img/door-sound-04-treats.jpg',
  './img/door-sound-05-settle.jpg',
  './img/door-sound-cover.jpg',
  './img/door-greet-08-petting.jpg',
  './img/door-greet-08-jumping.jpg',
  './img/door-sound-02-bell.jpg',
  './img/door-sound-02-knock.jpg',
  './img/door-stay-02-cue.jpg',
  './img/door-greet-01-settle.jpg',
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
