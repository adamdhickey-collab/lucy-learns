import { isStorageOk, isOnboarded, onStorageChange } from './store.js';
import { ICONS, announceScreen, markNavigated, withTransition } from './ui.js';
import today from './views/today.js';
import activities from './views/activities.js';
import detail from './views/detail.js';
import progressView from './views/progress.js';
import lucy from './views/lucy.js';
import moment from './views/moment.js';
import player, { cancelSession } from './views/player.js';
import welcome from './views/welcome.js';

const routes = [
  { pattern: /^#\/welcome$/, view: welcome },
  { pattern: /^#?\/?(today)?$/, view: today },
  { pattern: /^#\/activities$/, view: activities },
  { pattern: /^#\/activity\/([^/]+)$/, view: detail, keys: ['slug'] },
  { pattern: /^#\/play\/([^/]+)$/, view: player, keys: ['slug'] },
  { pattern: /^#\/progress$/, view: progressView },
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
    navigator.serviceWorker.register('sw.js').catch(() => {
      /* offline support is a bonus, not a requirement */
    });
  });
}
