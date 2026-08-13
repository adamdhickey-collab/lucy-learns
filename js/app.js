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
if (STUDY) {
  applyStudyMode(STUDY);

  // Then take the parameter out of the address bar.
  //
  // Applying the mode wipes stored data and rebuilds a baseline, and it did
  // that on every single load while the parameter stayed in the URL. A bare
  // `?study` means demo, so one forgotten query string turned every refresh
  // into "delete everything this person logged and reseed twelve days of
  // someone else's practice" — which looks, from the outside, exactly like
  // resetting the app and being dropped into the middle of the program with
  // activities already finished.
  //
  // It cost nothing while the only URLs carrying it were pasted by hand
  // during research. It is unacceptable the moment a link is handed to
  // someone to try, and links get shared.
  //
  // replaceState rather than a redirect: the baseline for this load is
  // already built, so the only job is to stop the *next* load rebuilding it.
  // A genuine fresh navigation to a ?study URL still resets, which is what
  // the research flow needs — each mission link rebuilds the world. What no
  // longer happens is a reload silently destroying work.
  const url = new URL(location.href);
  url.searchParams.delete('study');
  history.replaceState(null, '', url.pathname + url.search + url.hash);
}

const routes = [
  { pattern: /^#\/welcome$/, view: welcome },
  { pattern: /^#?\/?(today)?$/, view: today },
  { pattern: /^#\/activities$/, view: activities },
  { pattern: /^#\/program\/([^/]+)$/, view: program, keys: ['id'] },
  { pattern: /^#\/activity\/([^/]+)$/, view: detail, keys: ['slug'] },
  { pattern: /^#\/play\/([^/]+)$/, view: player, keys: ['slug'] },
  { pattern: /^#\/progress$/, view: progressView },
  { pattern: /^#\/report$/, view: report },
  { pattern: /^#\/profile$/, view: lucy },
  { pattern: /^#\/moment$/, view: moment },
];

// The fourth tab is "Profile", not the dog's name.
//
// It briefly was the name — which is charming for "Lucy" and unusable for
// "Bartholomew". A tab label has a quarter of a phone to live in and no room
// to wrap or truncate gracefully, so it cannot be the one string in the app
// that a stranger gets to make arbitrarily long. The screen is the dog's
// profile plus the household's settings, and "Profile" describes that at any
// name length.
//
// A plain constant again, now that nothing in it varies.
const TABS = [
  { id: 'today', href: '#/today', label: 'Today', icon: ICONS.today },
  { id: 'activities', href: '#/activities', label: 'Activities', icon: ICONS.activities },
  { id: 'progress', href: '#/progress', label: 'Progress', icon: ICONS.progress },
  { id: 'profile', href: '#/profile', label: 'Profile', icon: ICONS.profile },
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
  // Entrance animations are for arrivals, not refreshes. The nav-fresh class
  // gates every screen-entrance rule in app.css: present when this render is
  // a navigation, absent when it is refreshApp() re-painting the same screen
  // after an edit — without the gate, toggling Edit on the log would replay
  // the whole cascade, and a screen that performs its entrance twice reads as
  // a glitch, not a welcome. On the body rather than #app because the tab bar
  // sits outside #app and its active-tab pop wants the same gate.
  document.body.classList.toggle('nav-fresh', !keepScroll);
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
// How long the card holds. Three seconds, which is where this landed after a
// long detour.
//
// Four things have occupied the space under the art: a galloping sprite, a
// walking pair with a millisecond countdown at their heels, a filling bar,
// and now nothing. Each of the first three carried real choreography, and
// each was in the end louder than the thing it reported. The last of them was
// already quiet, and taking it away turns out to cost nothing — the wait is
// three seconds, which nobody needs a bar to sit through, and what is left is
// a name, a picture and a build number. A title card should settle the room.
//
// Three rather than the 4.3s the bar's arithmetic produced: with nothing
// reporting progress there is no longer anything to justify a longer wait,
// and three is the number this app already learned once — one full pass of
// the entrance choreography plus a beat, past which a static card stops
// reading as a title card and starts reading as loading.
//
// Study mode still gets its own short card, calibrated for a timed task.

const SPLASH_HOLD_MS = STUDY ? STUDY_SPLASH_HOLD_MS : 3000;
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
  // guarded against landing on a version that does not exist. With the
  // progress bar gone this and the date are the only things under the art,
  // which suits them: a colophon, not a status readout.
  const versionSlot = splash.querySelector('#splash-version');
  if (versionSlot) versionSlot.textContent = `Version ${APP_VERSION}`;

  if (!location.search.includes('splash-hold')) {
    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      splash.classList.add('splash--done');

      // Replay the first screen's entrance as the splash lifts.
      //
      // The app renders behind the splash, so its arrival cascade — the
      // sections drifting up, the bars growing — has already played to
      // completion by the time anyone can see it. What the household actually
      // saw was a finished screen appearing all at once underneath a fading
      // veil, which is the other half of "it jumps": nothing was moving on the
      // side being revealed.
      //
      // Restarting it here means the two halves cross-dissolve — the splash
      // fades over 420ms while the screen rises into place over roughly the
      // same window. The remove/reflow/add is the same trick the rep tally
      // uses to re-fire a one-shot: the class list is only consulted at the
      // next style recalculation, so setting it straight back is a no-op
      // unless something forces that recalculation in between.
      document.body.classList.remove('nav-fresh');
      void document.body.offsetWidth;
      document.body.classList.add('nav-fresh');

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
