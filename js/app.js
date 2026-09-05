import { isStorageOk, isOnboarded, onStorageChange } from './store.js';
import { APP_VERSION, updatedLabel } from './version.js';
import { studyMode, applyStudyMode, STUDY_SPLASH_HOLD_MS } from './study.js';
import { ICONS, announceScreen, esc, markNavigated, withTransition } from './ui.js';
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
import diagnostics from './views/diagnostics.js';

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
  { pattern: /^#\/diagnostics$/, view: diagnostics },
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
    // What actually broke, on the screen.
    //
    // This used to go only to console.error, which is the one place nobody
    // can reach on the device where these happen: a phone in a hallway, in a
    // browser with no inspector. Every crash then costs a round trip of
    // guessing. The message and the first line of the stack are enough to
    // name the failure, and they are not secret — the source is right there
    // in the same folder.
    const detail = [
      error && error.message ? String(error.message) : String(error),
      error && error.stack ? String(error.stack).split('\n')[1] || '' : '',
    ]
      .join(' ')
      .trim()
      .slice(0, 300);

    app.innerHTML = `
      <div class="screen">
        <div class="card" style="margin-top: 20vh">
          <div class="empty">
            <h3>Something went wrong</h3>
            <p>Your logged sessions are safe. Reloading usually clears this.</p>
            <details class="disclosure" style="margin-top: var(--s-4); text-align: left">
              <summary>What happened</summary>
              <div class="disclosure-body">
                <code style="word-break: break-word">${esc(detail)}</code>
              </div>
            </details>
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
  if (dateSlot) dateSlot.textContent = updatedLabel();

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
    // than following it. `performance.now()` is that measurement directly —
    // the page clock is zeroed at navigation — and this line runs during
    // module evaluation, so reading it here reads it at boot.
    //
    // It used to read a local the progress bar's arithmetic kept, and when the
    // bar came out the local went with it while this reference stayed. A bare
    // ReferenceError inside the `if (splash)` block skips the rest of it, so
    // `dismiss` was never scheduled: the splash sat there until it was tapped,
    // on every launch. Nothing failed loudly and nothing looked broken — it
    // just looked like a slow app. Worth remembering that the splash is the
    // one place where a dead timer is indistinguishable from a long one.
    //
    // Timers still fire in a hidden tab where animation frames do not, which
    // is what keeps a backgrounded launch from coming back to a splash that
    // never left.
    setTimeout(dismiss, Math.max(SPLASH_HOLD_MS - performance.now(), 0));
  }
}


// --- add to home screen ------------------------------------------------------

/**
 * A one-time nudge to install, shown on a phone that is running this in a tab.
 *
 * The gap this closes: everything built for the installed app is invisible
 * until it is installed. The launch images, the splash handoff, the standalone
 * chrome, the address bar not taking a fifth of a small screen — a visitor who
 * opens a link sees none of it, and nothing in the app has ever mentioned that
 * there is more to see. The difference is between somebody looking at the app
 * and somebody looking at a website.
 *
 * Kept under its own storage key rather than in the app state on purpose.
 * "I have already been told how to install this" is a fact about the browser,
 * not about the training log, and it should survive `clearAll()` — otherwise
 * resetting the demo re-nags a person who reset it precisely because they were
 * exploring. It is also why a failed write here is swallowed: in a private
 * window the hint reappearing is a far smaller problem than the app throwing.
 */
const INSTALL_KEY = 'lucy-learns/install-hint-dismissed';

// Two of the three cases can be answered without asking the user agent what it
// is. `display-mode: standalone` is the installed app, and `navigator.standalone`
// is the same question on older iOS. Sniffing would be guessing at the answer
// the browser already reports.
const isInstalled = () =>
  window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

const installHint = document.getElementById('install-hint');

if (installHint) {
  // Chromium fires this and lets the page trigger the real install dialog.
  // Safari does not, which is the whole reason the copy below has two forms.
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // It can arrive after the hint is already up — Chromium fires this when it
    // decides the install criteria are met, which is not tied to load. Without
    // this the card would keep whatever wording it was painted with and never
    // grow the button that makes it one tap instead of four.
    if (!installHint.hidden) paint();
  });

  // Set once the question has been answered one way or the other — shown and
  // acted on, shown and dismissed, or installed — so nothing reschedules it.
  let settled = false;

  const dismiss = () => {
    installHint.hidden = true;
    settled = true;
    try {
      localStorage.setItem(INSTALL_KEY, '1');
    } catch {
      /* private mode: the hint comes back next launch, which is survivable */
    }
  };

  installHint.querySelector('[data-dismiss]').addEventListener('click', dismiss);

  const goBtn = installHint.querySelector('[data-install]');
  goBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    // Dismissed either way: accepted means it is installed, declined means
    // they have answered the question and should not be asked again.
    dismiss();
  });

  /**
   * The wording, which depends on what the browser can actually do.
   *
   * Three cases, and only the first is a real install: Chromium hands the page
   * an event and a one-tap dialog, iOS Safari has a Home Screen but no API for
   * it, and anything else gets told where to look. The iOS wording names the
   * two taps literally — a vague "add this to your home screen" is worse than
   * saying nothing on a phone where the control is an unlabeled icon.
   *
   * Separated from `maybeShow` because it can be called twice: see the
   * `beforeinstallprompt` handler.
   */
  const paint = () => {
    const body = installHint.querySelector('.install-hint-body');
    if (deferredPrompt) {
      body.textContent = 'Install this and it opens full screen, without the browser bar.';
      goBtn.hidden = false;
    } else if ('standalone' in navigator) {
      body.innerHTML =
        'Add this to your Home Screen for the full app — tap <strong>Share</strong>, ' +
        'then <strong>Add to Home Screen</strong>.';
      goBtn.hidden = true;
    } else {
      body.textContent =
        'Add this to your home screen from the browser menu and it opens full screen.';
      goBtn.hidden = true;
    }
  };

  const maybeShow = () => {
    if (settled || !installHint.hidden) return;
    if (isInstalled()) return;
    // Never over a session or the setup flow. Both are full-screen states with
    // one thing to do, and both paint above this: it would sit behind them,
    // unseen, and still count as shown. The tab bar is the tell — where there
    // is no tab bar there is no room for this.
    if (!/^#\/(today|activities|progress|profile)/.test(location.hash || '#/today')) return;
    // A phone, not a laptop. `pointer: coarse` is the closest thing to "this
    // is a touch device" that is not a user-agent string, and the pitch —
    // full screen, no address bar, an icon on the home screen — is a phone
    // pitch. On a desktop the tab is a perfectly good way to use this.
    if (!window.matchMedia('(pointer: coarse)').matches) return;
    if (!isOnboarded()) return;
    try {
      if (localStorage.getItem(INSTALL_KEY)) return;
    } catch {
      /* unreadable storage: show it, the dismiss button still works */
    }

    paint();
    installHint.hidden = false;
    settled = true;
  };

  /**
   * Checked repeatedly rather than once, and always after a pause.
   *
   * The pause: the hint sits above the tab bar, and firing it during the
   * splash would have it animate in behind the veil and be waiting, already
   * there, on the first screen anybody sees. A beat after the app has proved
   * it works is the earliest point at which "you can keep this" means
   * anything.
   *
   * The repetition, which matters more: a single check at boot is a check run
   * against the wrong person. A returning household is onboarded at boot and
   * would see it — but a first-time visitor is still in setup five seconds in,
   * so the one check would find `isOnboarded()` false, bail, and never run
   * again. The person the hint was written for would meet it on their *second*
   * launch, if there was one. Rescheduling on navigation also means it waits
   * for a gap rather than interrupting: somebody tapping through the app every
   * two seconds is busy, and this can wait until they are not.
   */
  const HINT_DELAY_MS = 2600;
  let hintTimer = null;
  const scheduleHint = (delay) => {
    if (settled) return;
    clearTimeout(hintTimer);
    hintTimer = setTimeout(maybeShow, delay);
  };

  scheduleHint(SPLASH_HOLD_MS + HINT_DELAY_MS);
  window.addEventListener('hashchange', () => scheduleHint(HINT_DELAY_MS));

  // Installing while the hint is up should retire it without a tap.
  window.addEventListener('appinstalled', dismiss);
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
