import { isStorageOk, isOnboarded, onStorageChange } from './store.js';
import { APP_VERSION, APP_UPDATED } from './version.js';
import { studyMode, applyStudyMode, STUDY_SPLASH_HOLD_MS } from './study.js';
import { ICONS, announceScreen, markNavigated, withTransition } from './ui.js';
import today from './views/today.js';
import activities from './views/activities.js';
import detail from './views/detail.js';
import progressView from './views/progress.js';
import lucy from './views/lucy.js';
import moment from './views/moment.js';
import player, { cancelSession } from './views/player.js';
import welcome from './views/welcome.js';
import report from './views/report.js';
import program from './views/program.js';

// Before anything reads state. `?study` rebuilds the baseline so every research
// participant enters the same app; see js/study.js for why each of the three
// modes exists. Without the parameter this is a no-op and the household's own
// data is never touched.
const STUDY = studyMode();
if (STUDY) applyStudyMode(STUDY);

const routes = [
  { pattern: /^#\/welcome$/, view: welcome },
  { pattern: /^#?\/?(today)?$/, view: today },
  { pattern: /^#\/activities$/, view: activities },
  { pattern: /^#\/program\/([^/]+)$/, view: program, keys: ['id'] },
  { pattern: /^#\/activity\/([^/]+)$/, view: detail, keys: ['slug'] },
  { pattern: /^#\/play\/([^/]+)$/, view: player, keys: ['slug'] },
  { pattern: /^#\/progress$/, view: progressView },
  { pattern: /^#\/report$/, view: report },
  { pattern: /^#\/lucy$/, view: lucy },
  { pattern: /^#\/moment$/, view: moment },
];

const TABS = [
  { id: 'today', href: '#/today', label: 'Today', icon: ICONS.today },
  { id: 'activities', href: '#/activities', label: 'Activities', icon: ICONS.activities },
  { id: 'progress', href: '#/progress', label: 'Progress', icon: ICONS.progress },
  { id: 'lucy', href: '#/lucy', label: 'Lucy', icon: ICONS.dog },
];

const app = document.getElementById('app');
const tabbar = document.getElementById('tabbar');

function match(hash) {
  for (const route of routes) {
    const found = hash.match(route.pattern);
    if (found) {
      const params = {};
      (route.keys || []).forEach((key, i) => {
        params[key] = decodeURIComponent(found[i + 1]);
      });
      return { view: route.view, params };
    }
  }
  return { view: today, params: {} };
}

function renderTabs(activeId) {
  tabbar.innerHTML = TABS.map(
    (tab) => `
      <a href="${tab.href}" ${tab.id === activeId ? 'aria-current="page"' : ''}>
        ${tab.icon}
        <span>${tab.label}</span>
      </a>`
  ).join('');
}

let currentView = null;
let currentHash = null;

// Scroll memory per screen: leaving a screen remembers where you were, coming
// back restores it. Browsing the library stops punishing curiosity, and the
// tabs keep their own positions like a native tab bar.
const scrollMemory = new Map();

function renderRoute(options = {}) {
  // startViewTransition swallows exceptions thrown by its callback, so the
  // error boundary has to live inside the render, not around the transition.
  try {
    doRender(options);
  } catch (error) {
    // A render crash without this is a permanent white screen. Keep the shell
    // alive and offer the two ways out.
    app.innerHTML = `
      <div class="screen">
        <div class="card" style="margin-top: 30vh">
          <div class="empty">
            <h3>Something went wrong</h3>
            <p>Your logged sessions are safe. Reloading usually clears this.</p>
            <div class="btn-row" style="margin-top: var(--s-4)">
              <button class="btn btn--quiet" type="button" onclick="location.hash='#/today';location.reload()">
                Go to Today
              </button>
              <button class="btn" type="button" onclick="location.reload()">Reload</button>
            </div>
          </div>
        </div>
      </div>`;
    console.error('route render failed:', error);
  }
}

function doRender({ keepScroll = false } = {}) {
  const hash = location.hash || '#/today';
  const { view, params } = match(hash);

  // Leaving the player mid-session throws the draft away on purpose.
  if (currentView === player && view !== player) cancelSession();
  if (!keepScroll && currentHash && currentHash !== hash) {
    scrollMemory.set(currentHash, window.scrollY);
  }
  currentView = view;
  currentHash = hash;

  const scrollY = window.scrollY;
  app.innerHTML = String(view.render(params));
  renderTabs(view.tab);
  tabbar.hidden = Boolean(view.fullscreen);

  if (view.mount) view.mount(app, params, { isRefresh: keepScroll });
  if (!view.fullscreen) {
    const remembered = keepScroll ? scrollY : scrollMemory.get(hash) ?? 0;
    window.scrollTo(0, remembered);
  }

  if (!keepScroll) {
    const heading = app.querySelector('h1, h2');
    if (heading) announceScreen(heading.textContent.trim());
    // Everything after the first paint counts as navigation, so from here on
    // views may take focus to their heading.
    markNavigated();
  }

  document.querySelectorAll('[data-route]').forEach((el) => {
    el.addEventListener('click', () => {
      location.hash = el.dataset.route;
    });
  });
}

function route({ keepScroll = false } = {}) {
  const hash = location.hash || '#/today';

  // Nothing is reachable before the welcome. Resetting from settings clears the
  // flag, which drops straight back here.
  if (!isOnboarded() && hash !== '#/welcome') {
    location.hash = '#/welcome';
    return;
  }

  if (keepScroll) {
    // In-place refreshes are data updates, not navigation: no choreography.
    renderRoute({ keepScroll });
  } else {
    withTransition(() => renderRoute({ keepScroll }));
  }
}

window.addEventListener('hashchange', () => route());
// Views ask for a redraw after changing stored data.
window.addEventListener('app:refresh', () => route({ keepScroll: true }));

route();

// --- splash ----------------------------------------------------------------
// The static splash in index.html covers the blank moment before this module
// runs, then hands off to the painted app underneath it.
//
// It used to dismiss on the first animation frame, which meant that on any
// load fast enough to matter — every warm start, every reload — it appeared
// and vanished inside 20ms. Not a splash, a flicker. HOLD_MS is now a floor
// the splash is guaranteed to be on screen for, measured from when the page
// started loading rather than from here, so a slow boot spends its time
// booting instead of adding the hold on top of it.
//
// ?splash-hold on any URL parks it indefinitely for design review.
//
// Study mode shortens it instead of removing it. A long hold is right for a
// household opening the app once a day and wrong inside a timed task, but a
// participant should still meet the product they are being asked about — so
// they get the title card, just briefly. Long enough for the wordmark to land,
// short enough not to show up in the numbers.
//
// The hold is derived from the walk, and the walk from one number: PACE.
//
// PACE 1 is the speed the pair were drawn at — a 4.14s crossing with an 850ms
// two-step cadence, which at their size on the lane is a brisk walk. Every
// other value scales both together, because cadence and ground speed have to
// agree or the figures skate: half the cadence alone and they moonwalk, half
// the crossing alone and they churn. One knob is the only way that invariant
// survives being edited.
//
// PACE 3 is a deliberate choice for an unhurried, watchable crossing, and it
// is expensive: it puts the hold at thirteen seconds. That is a long time to
// look at a title card, and this app has been here before — the hold was five,
// cut to three because a static card past three seconds stopped reading as a
// title card and started reading as loading, then five again when the walk
// arrived and gave the wait something to report. Thirteen is a bet that a slow
// walk on a loose leash is the product's whole thesis in one picture and worth
// watching. If it ever grates, this is the number to turn down: 2 gives ~9s,
// 1 gives ~5s, and nothing else has to move.
//
// Study mode is exempt. Its 1.2s card is calibrated for a timed task, and the
// pair simply do not get to walk in it.

const WALK_PACE = 3;
const WALK_BASE_MS = 4140;
const WALK_CADENCE_BASE_MS = 850;
const SPLASH_FADE_MS = 420;

// Mirrors `splash-progress-in 460ms 820ms` in app.css, by hand — the lane has
// to have finished arriving before anyone steps onto it. Change one, change both.
const LANE_IN_END_MS = 820 + 460;

const WALK_MS = WALK_BASE_MS * WALK_PACE;
const SPLASH_HOLD_MS = STUDY
  ? STUDY_SPLASH_HOLD_MS
  : LANE_IN_END_MS + WALK_MS - SPLASH_FADE_MS;

const splash = document.getElementById('splash');
if (splash) {
  const dateSlot = splash.querySelector('#splash-date');
  if (dateSlot) {
    const { year, month, day } = APP_UPDATED;
    // Labelled, because a bare date under a version number is ambiguous —
    // it could as easily be today's date or an expiry as the build date.
    const stamp = new Date(year, month - 1, day).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    dateSlot.textContent = `Last updated ${stamp}`;
  }

  // The version is stated, not performed. An earlier pass counted it up from
  // zero, which animated a number that was never in doubt and had to be
  // guarded against landing on a version that does not exist. The progress bar
  // does the work of showing something is happening, and it does it about
  // something real.
  const versionSlot = splash.querySelector('#splash-version');
  if (versionSlot) versionSlot.textContent = `Version ${APP_VERSION}`;

  // Hand the lane the actual numbers, then start its clock.
  //
  // Order matters more than the numbers do. The traversal lives behind the
  // .splash--running class, added here *after* the variables are written —
  // because a CSS animation's clock starts the moment its rule first applies,
  // and any version of this that lets the rule apply at first paint starts
  // the run before the numbers are real. This file has now shipped that bug
  // in both available directions: first as a negative delay that opened with
  // the dog mid-lane by design, then as a fallback duration that opened with
  // the dog mid-lane by accident when the real value arrived mid-flight and
  // re-stretched a run already in progress. Both times, what the household saw
  // was a dog partway across a lane that had only just faded in, finishing
  // early.
  //
  // The delay holds her at the start line until the lane's own entrance has
  // finished, so the sequence reads: ground rolls out, dog sets off, dog
  // crosses the finish as the last of the splash fades out. The run is
  // stretched to whatever hold is left after the delay *plus the fade*: the
  // dismissal starts the fade at the hold, and she runs on through it,
  // reaching the end exactly as opacity reaches zero. Ending the run at the
  // start of the fade instead meant 420ms of dog standing at the finish line
  // on a splash that was still perfectly visible — which read as arriving
  // early, because it was. Boot time sets her speed, never her starting
  // line. On a boot slow enough to eat the entrance, the delay collapses to
  // zero and she simply runs what remains; past the hold entirely, both go
  // to zero and the splash is already leaving.
  //
  // The two clocks differ by first paint — this one starts at navigation, the
  // CSS one at first style — so they can set off a few tens of milliseconds
  // into the entrance's ease-out tail. That is a fraction of one cadence frame
  // and reads as nothing.
  //
  // The cadence goes out as a variable for the same reason the duration does:
  // it is derived from PACE, and a hardcoded number in the stylesheet would be
  // one edit away from disagreeing with the crossing it has to match.
  const elapsed = performance.now();
  const remaining = Math.max(SPLASH_HOLD_MS - elapsed, 0);
  const runDelay = Math.min(Math.max(LANE_IN_END_MS - elapsed, 0), remaining);
  splash.style.setProperty('--splash-hold', `${SPLASH_HOLD_MS}ms`);
  splash.style.setProperty('--splash-run-delay', `${Math.round(runDelay)}ms`);
  splash.style.setProperty(
    '--splash-run',
    `${Math.round(remaining - runDelay + SPLASH_FADE_MS)}ms`
  );
  splash.style.setProperty(
    '--splash-cadence',
    `${Math.round(WALK_CADENCE_BASE_MS * WALK_PACE)}ms`
  );
  splash.classList.add('splash--running');

  if (!location.search.includes('splash-hold')) {
    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      splash.classList.add('splash--done');
      setTimeout(() => splash.remove(), SPLASH_FADE_MS);
    };

    // Measured from navigation start, so the hold overlaps the boot rather
    // than following it. Timers still fire in a hidden tab where animation
    // frames do not, which is what keeps a backgrounded launch from coming
    // back to a splash that never left.
    setTimeout(dismiss, Math.max(SPLASH_HOLD_MS - elapsed, 0));
  }
}


// --- offline ---------------------------------------------------------------

const offlineNote = document.getElementById('offline-note');
const updateOnline = () => {
  offlineNote.hidden = navigator.onLine;
};
window.addEventListener('online', updateOnline);
window.addEventListener('offline', updateOnline);
updateOnline();

// A failed write is not a cosmetic problem: the household would keep logging
// all week and end up with nothing. Say so, loudly and persistently.
const storageBanner = document.getElementById('storage-warning');
const updateStorage = (ok) => {
  storageBanner.hidden = ok;
};
onStorageChange(updateStorage);
updateStorage(isStorageOk());

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`sw.js?v=${APP_VERSION}`).catch(() => {
      /* offline support is a bonus, not a requirement */
    });
  });
}
