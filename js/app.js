import { isStorageOk, isOnboarded, onStorageChange } from './store.js';
import { APP_VERSION, APP_UPDATED } from './version.js';
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

const SPLASH_HOLD_MS = 3000;
const SPLASH_FADE_MS = 420;

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

  // Hand the bar the actual numbers. The negative delay is how much of the
  // hold went on booting, so the fill starts where the load already got to
  // rather than restarting the clock at first paint, and reaches full exactly
  // as the splash begins to leave.
  const elapsed = performance.now();
  splash.style.setProperty('--splash-hold', `${SPLASH_HOLD_MS}ms`);
  splash.style.setProperty('--splash-elapsed', `-${Math.round(elapsed)}ms`);

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
