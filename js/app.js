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
// Two numbers, deliberately independent: how long the crossing takes, and how
// fast the legs move.
//
// They used to be locked to one another — cadence times the 4.87 stride cycles
// a crossing contains — on the principle that a walk whose feet disagree with
// the ground it covers reads as skating. That principle is real, and it is
// being knowingly set aside here. Held to it, the slow cadence that looks right
// costs a 12.4s crossing and a 13.7s splash, which is far too long to sit in
// front of an app somebody opens daily. The choice is between honest physics
// and a splash worth shipping, and the splash wins: the legs keep the unhurried
// step, the pair covers the lane in three seconds, and they glide a little.
//
// At 3000ms the crossing contains 1.2 stride cycles for 275px of lane — about
// 230px of ground per stride against the ~57px their legs actually describe.
// If that ever reads as wrong rather than as stylised, the honest fix is one
// line: WALK_CADENCE_MS = Math.round(WALK_MS / 4.87), which is 616ms. Faster
// legs, same three seconds.
//
// Study mode is exempt. Its 1.2s card is calibrated for a timed task, and the
// pair simply do not get to walk in it.

const WALK_MS = 3000;
const WALK_CADENCE_MS = 2550;
const SPLASH_FADE_MS = 420;

// Mirrors `splash-progress-in 460ms 820ms` in app.css, by hand — the lane has
// to have finished arriving before anyone steps onto it. Change one, change both.
const LANE_IN_END_MS = 820 + 460;

// The hold is what the walk needs, not a number picked for its own sake: the
// lane has to arrive, the pair has to cross it, and the last 420ms of that
// crossing happen during the fade. 1280 + 3000 - 420 = 3860, so the splash is
// on screen for 4.3s all told.
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
  // The cadence goes out as a variable rather than living in the stylesheet so
  // that the two halves of the walk — how fast the legs move, how long the
  // crossing takes — are decided in one place and can be read side by side.
  const elapsed = performance.now();
  const remaining = Math.max(SPLASH_HOLD_MS - elapsed, 0);
  const runDelay = Math.min(Math.max(LANE_IN_END_MS - elapsed, 0), remaining);
  splash.style.setProperty('--splash-hold', `${SPLASH_HOLD_MS}ms`);
  splash.style.setProperty('--splash-run-delay', `${Math.round(runDelay)}ms`);
  splash.style.setProperty(
    '--splash-run',
    `${Math.round(remaining - runDelay + SPLASH_FADE_MS)}ms`
  );
  splash.style.setProperty('--splash-cadence', `${WALK_CADENCE_MS}ms`);
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
