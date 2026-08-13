// Small rendering helpers. No framework: template strings plus event delegation.

/** Escape anything the household typed before it goes back into the DOM. */
export const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Mark a string as already-safe markup. */
export function raw(value) {
  const wrapper = new String(value ?? '');
  wrapper.__raw = true;
  return wrapper;
}

const isRaw = (value) => Boolean(value && value.__raw);

const renderValue = (value) => {
  if (Array.isArray(value)) return value.map(renderValue).join('');
  return isRaw(value) ? String(value) : esc(value);
};

/**
 * Tagged template that escapes interpolations. Nested html`` results and
 * raw() values pass through untouched, so views can compose freely.
 */
export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) {
    out += renderValue(values[i]) + strings[i + 1];
  }
  return raw(out);
}

/** Concatenate a list of already-rendered chunks. */
export const join = (parts) => raw(parts.map(renderValue).join(''));

export const ICONS = {
  today: '<svg viewBox="0 0 24 24"><path d="M12 3v2M5 6l1.4 1.4M3 13h2M19 13h2M17.6 7.4 19 6"/><path d="M8 20h8"/><path d="M9 17a5 5 0 1 1 6 0 2 2 0 0 0-.8 1.6V19H9.8v-.4A2 2 0 0 0 9 17z"/></svg>',
  activities:
    '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 9h8M8 13h8M8 17h4"/></svg>',
  progress:
    '<svg viewBox="0 0 24 24"><path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 3.5-4 3 2.5L20 7"/></svg>',
  // Dog head with floppy ears. Reads as Lucy at 24px without a paw print.
  dog:
    '<svg viewBox="0 0 24 24">' +
    '<path d="M8 7.4C6.4 6.8 4.8 7.9 4.8 10c0 2 1.3 3.6 3.2 4"/>' +
    '<path d="M16 7.4c1.6-.6 3.2.5 3.2 2.6 0 2-1.3 3.6-3.2 4"/>' +
    '<path d="M8 7.2A6.6 6.6 0 0 1 12 6c1.5 0 2.9.4 4 1.2v5.4a4.5 4.5 0 0 1-1.9 3.7l-1 .7a2 2 0 0 1-2.2 0l-1-.7A4.5 4.5 0 0 1 8 12.6z"/>' +
    '<path d="M10.3 11h.01M13.7 11h.01"/>' +
    '</svg>',
  back: '<svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  spark:
    '<svg viewBox="0 0 24 24"><path d="M12 3v3M12 18v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M3 12h3M18 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/><circle cx="12" cy="12" r="3"/></svg>',

  // The end of the route. A sun said "nice day" rather than "this is what you
  // are working towards", and the paw that replaced it was five separate
  // shapes trying to survive at 15px in the Today strip — at that size the
  // toes closed up and it read as a blob.
  //
  // A star is one shape, it is the only solid mark in a set of line-work, and
  // "the star at the end" needs no explaining. Solid is the point: the marks
  // before it are outlines of things still to be done, and this one is filled
  // because it is the prize. It is drawn `class="icon--solid"` so the stroke
  // rules that every other icon lives by can step aside for it — a 2px stroke
  // on a filled star swells the points until they touch.
  star:
    '<svg viewBox="0 0 24 24" class="icon--solid">' +
    '<path d="M12 3.1 14.29 9.4 21.04 9.66 15.71 13.81 17.58 20.29 12 16.5 6.42 20.29 8.29 13.81 2.96 9.66 9.71 9.4Z"/>' +
    '</svg>',
  check: '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
  trash:
    '<svg viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>',
  book:
    '<svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H19v3H6.5A2.5 2.5 0 0 1 4 20.5z"/></svg>',
  clock:
    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  shield:
    '<svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.4 3 8.5 7 10 4-1.5 7-5.6 7-10V6l-7-3z"/><path d="M12 9v4"/></svg>',

  // --- the four activities of the door program ----------------------------
  // One mark per activity, used wherever that activity appears: the route on
  // the welcome, the strip on Today, and the rail on the program map. The
  // number it replaced said only "which one", and said it in three different
  // shapes; the mark says which one it is.
  //
  // They have to stay apart from each other at 18px, so each is a different
  // silhouette rather than a different detail: waves, a hand, a low bed, an
  // upright door.

  // Sound — rings coming off a point. Not a bell, which reads as a
  // notification rather than a doorbell.
  'act-sound':
    '<svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="2"/><path d="M11.5 8.5a5 5 0 0 1 0 7"/><path d="M15.5 5.5a10 10 0 0 1 0 13"/></svg>',

  // Stay — the flat raised palm the handler actually gives.
  'act-stay':
    '<svg viewBox="0 0 24 24"><path d="M9.5 12.5V6a1.5 1.5 0 0 1 3 0v5.5"/><path d="M12.5 11.5V5a1.5 1.5 0 0 1 3 0v7"/><path d="M15.5 12V8.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.5a5 5 0 0 1-3.5-1.5l-2.4-2.4a1.5 1.5 0 0 1 2.1-2.1l1.3 1.3"/></svg>',

  // Place — a mat with a raised back, read as the bed she is sent to.
  'act-place':
    '<svg viewBox="0 0 24 24"><rect x="3" y="12" width="18" height="7" rx="3"/><path d="M6.5 12V9.5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2V12"/></svg>',

  // Greet — the door itself, the thing the whole program is about.
  'act-greet':
    '<svg viewBox="0 0 24 24"><path d="M6 20V4.5a1.5 1.5 0 0 1 1.5-1.5h9A1.5 1.5 0 0 1 18 4.5V20"/><path d="M4 20h16"/><circle cx="14.5" cy="12" r="1"/></svg>',

  // --- the six goals, and the activities named under them ------------------
  // The library was the last place still showing bare titles. These sit at a
  // heading rather than in a route, so they only have to be distinct from each
  // other and from the four activity marks above — a door with a swing arc is
  // not the plain door of 'act-greet', and a flat mat is not the raised bed of
  // 'act-place'.

  // Door routine — a door standing open, drawn in perspective so it is not the
  // flat front-on door of 'act-greet'. The swing arc that was here as well put
  // four separate marks inside 17px and the whole thing read as a smudge.
  'goal-door':
    '<svg viewBox="0 0 24 24"><path d="M8 21V5.4a1 1 0 0 1 1.3-1l7 2a1 1 0 0 1 .7 1V21"/><path d="M3.5 21h17"/><circle cx="10.5" cy="13.5" r="1"/></svg>',

  // Calm greetings — two people meeting, no door involved.
  'goal-greeting':
    '<svg viewBox="0 0 24 24"><circle cx="8.5" cy="8" r="2.6"/><circle cx="16" cy="9.5" r="2.2"/><path d="M3.5 19a5 5 0 0 1 10 0"/><path d="M14 19a4.2 4.2 0 0 1 6.6-3.4"/></svg>',

  // Impulse control — waiting, made of time.
  'goal-impulse':
    '<svg viewBox="0 0 24 24"><path d="M7 3h10"/><path d="M7 21h10"/><path d="M8 3c0 4 4 5.2 4 9s-4 5-4 9"/><path d="M16 3c0 4-4 5.2-4 9s4 5 4 9"/></svg>',

  // Walks — the leash.
  'goal-walk':
    '<svg viewBox="0 0 24 24"><circle cx="7" cy="5.5" r="2.5"/><path d="M7 8c0 4.5 3 5 5.5 6.5S17 18 17 21"/><path d="M14.5 20.4a2.6 2.6 0 0 0 5 0c0-1.6-2.5-4-2.5-4s-2.5 2.4-2.5 4z"/></svg>',

  // Settle and recovery — coming back down.
  'goal-settle':
    '<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4 8.2 8.2 0 1 0 20 14.5z"/></svg>',

  // Foundation skills — what the rest is stacked on.
  'goal-foundation':
    '<svg viewBox="0 0 24 24"><rect x="3" y="15" width="18" height="5" rx="1.3"/><rect x="6" y="9.5" width="12" height="5" rx="1.3"/><rect x="9" y="4" width="6" height="5" rx="1.3"/></svg>',

  // Four Paws on the Floor — keep it down.
  'plan-fourpaws':
    '<svg viewBox="0 0 24 24"><path d="M12 3v11"/><path d="m7.5 9.5 4.5 4.5 4.5-4.5"/><path d="M4 20h16"/></svg>',

  // Settle on a Mat — a flat mat, not the raised bed of 'act-place'.
  'plan-mat':
    '<svg viewBox="0 0 24 24"><rect x="2.5" y="13" width="19" height="5.5" rx="2.2"/><path d="M6.5 13V11M12 13V11M17.5 13V11"/></svg>',

  // People Passing on Walks — someone going by.
  'plan-walkpeople':
    '<svg viewBox="0 0 24 24"><circle cx="8" cy="4.8" r="2.2"/><path d="M8 7.5v6M8 13.5 5.5 20M8 13.5 11 20M5 10h6"/><path d="M15 8h6M18 5l3 3-3 3"/></svg>',

  // Name Response — her name, said out loud.
  'plan-name':
    '<svg viewBox="0 0 24 24"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v6a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A2.5 2.5 0 0 1 4 12.5z"/><path d="M9 9.5h.01M12 9.5h.01M15 9.5h.01"/></svg>',
};

export const icon = (name) => raw(ICONS[name] || '');

/** Mastery badge. Shape plus text, never color alone. */
export const badge = (mastery) =>
  raw(`<span class="badge badge--${mastery.id}">${esc(mastery.label)}</span>`);

export const difficultyDots = (difficulty) => {
  const level = { beginner: 1, intermediate: 2, advanced: 3 }[difficulty] || 1;
  const pips = [1, 2, 3].map((n) => `<i class="${n <= level ? 'on' : ''}"></i>`).join('');
  const label = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  return raw(
    `<span class="difficulty"><span class="pips" aria-hidden="true">${pips}</span>${esc(label)}</span>`
  );
};

/** Ask the router to redraw the current screen after stored data changed. */
export const refreshApp = () =>
  window.dispatchEvent(new CustomEvent('app:refresh'));

/**
 * Transient confirmation. Pass an action to make it undoable — a mis-tap
 * should never be permanent.
 */
export function toast(message, action) {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');

  const text = document.createElement('span');
  text.textContent = message;
  el.appendChild(text);

  let timer = setTimeout(() => el.remove(), action ? 7000 : 2600);

  if (action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'toast-action';
    button.textContent = action.label;
    button.addEventListener('click', () => {
      clearTimeout(timer);
      el.remove();
      action.onAction();
    });
    el.appendChild(button);
  }

  document.body.appendChild(el);
  return () => {
    clearTimeout(timer);
    el.remove();
  };
}

/**
 * Run a DOM update inside a view transition when the browser has them and the
 * user has not asked for reduced motion; otherwise just run it.
 *
 * `type` picks the choreography via a data attribute the CSS keys off:
 *   'fade'    cross-fade (default — tab and route changes)
 *   'forward' new screen slides in from the right (next step, next panel)
 *   'back'    reverse of forward
 */
export function withTransition(update, type = 'fade') {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.startViewTransition || reduced) {
    update();
    return;
  }
  document.documentElement.dataset.vt = type;
  const transition = document.startViewTransition(update);

  transition.finished.finally(() => {
    delete document.documentElement.dataset.vt;
  });

  // A ViewTransition hands back three promises and creates all of them up
  // front, so every one it rejects needs a handler or the browser reports an
  // unhandled rejection. Abandoning a transition rejects them — and two quick
  // taps on the tab bar abandons one, which made this a steady trickle of
  // console errors during ordinary use rather than an edge case.
  //
  // Catching `finished` alone is not enough: `ready` rejects on its own when a
  // transition is skipped before it animates, which is most of them here.
  //
  // Nothing is broken when this happens. `update()` runs synchronously inside
  // startViewTransition, so the DOM is already correct and all that was lost is
  // the animation.
  const ignore = () => {};
  transition.finished.catch(ignore);
  transition.ready.catch(ignore);
  transition.updateCallbackDone.catch(ignore);
}

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), textarea, select, summary, [tabindex]:not([tabindex="-1"])';

/**
 * Make a modal actually modal.
 *
 * Declaring role="dialog" and aria-modal="true" is a promise to assistive
 * tech that nothing outside the dialog exists. Without this, that promise is
 * a lie: the user tabs straight out of the sheet into the page behind it with
 * no way to tell they have left.
 *
 * Everything that is not an ancestor of the dialog gets `inert`, which removes
 * it from the tab order and the accessibility tree in one go. Returns a
 * release function; call it when the dialog closes.
 */
export function trapModal(dialog, { onEscape, initialFocus } = {}) {
  const inerted = [];
  let node = dialog;
  while (node && node.parentElement) {
    for (const sibling of node.parentElement.children) {
      // Leave live regions alone: inert would silence announcements.
      const isLiveRegion = sibling.hasAttribute('aria-live');
      if (sibling !== node && !isLiveRegion && !sibling.hasAttribute('inert')) {
        sibling.setAttribute('inert', '');
        inerted.push(sibling);
      }
    }
    node = node.parentElement;
  }

  const previous = document.activeElement;
  const target =
    initialFocus || dialog.querySelector(FOCUSABLE) || dialog.querySelector('h1, h2');
  if (target) {
    if (!target.matches(FOCUSABLE)) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }

  const onKey = (e) => {
    if (e.key === 'Escape' && onEscape) {
      e.preventDefault();
      onEscape();
    }
  };
  document.addEventListener('keydown', onKey);

  return function release({ restoreFocus = true } = {}) {
    document.removeEventListener('keydown', onKey);
    inerted.forEach((el) => el.removeAttribute('inert'));
    if (restoreFocus && previous && previous.isConnected && previous.focus) {
      previous.focus({ preventScroll: true });
    }
  };
}

/**
 * Replaces window.confirm for destructive actions. The native dialog is the
 * one place the app's visual language drops away, and it shows up exactly at
 * the highest-anxiety moments.
 */
export function confirmSheet({
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  extraLabel,
  onExtra,
  onConfirm,
}) {
  const backdrop = document.createElement('div');
  backdrop.className = 'sheet-backdrop';
  backdrop.innerHTML = `
    <div class="sheet sheet--dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <h2 id="confirm-title">${esc(title)}</h2>
      ${body ? `<p>${esc(body)}</p>` : ''}
      ${
        extraLabel
          ? `<button class="btn btn--quiet btn--block" type="button" data-extra>${esc(extraLabel)}</button>`
          : ''
      }
      <div class="btn-row" style="margin-top: var(--s-4)">
        <button class="btn btn--quiet" type="button" data-cancel>${esc(cancelLabel)}</button>
        <button class="btn ${tone === 'danger' ? 'btn--danger' : ''}" type="button" data-confirm>
          ${esc(confirmLabel)}
        </button>
      </div>
    </div>`;

  let release = () => {};
  const close = () => {
    release();
    backdrop.remove();
  };

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });
  backdrop.querySelector('[data-cancel]').addEventListener('click', close);
  backdrop.querySelector('[data-confirm]').addEventListener('click', () => {
    close();
    onConfirm();
  });
  const extra = backdrop.querySelector('[data-extra]');
  if (extra) extra.addEventListener('click', () => onExtra());

  document.body.appendChild(backdrop);
  release = trapModal(backdrop, {
    onEscape: close,
    initialFocus: backdrop.querySelector('[data-confirm]'),
  });
  return close;
}

export const pct = (value) => (value === null || value === undefined ? '—' : `${Math.round(value * 100)}%`);

/**
 * "35 reps" / "1 rep" — the count that goes next to a percentage.
 *
 * Lives here rather than in each view because the rule it enforces is a house
 * rule: a rate is never printed without the number of repetitions behind it.
 * Three trainers reading the lesson report cold all asked the same question of
 * every percentage on it, and 77% of thirteen reps and 77% of two hundred are
 * the same number carrying different amounts of evidence.
 */
export const reps = (n) => `${n} rep${n === 1 ? '' : 's'}`;

export const mmss = (seconds) => {
  if (seconds === null || seconds === undefined) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m ? `${m}m ${s.toString().padStart(2, '0')}s` : `${s}s`;
};

/**
 * Moving focus to the heading is how a single-page app tells a screen reader
 * that the screen changed, since no real navigation happens. It is only
 * correct *after* a navigation: on the very first paint the browser already
 * starts at the top of a freshly announced document, so doing it there just
 * drops a focus ring on the title for no reason.
 */
let hasNavigated = false;

export const markNavigated = () => {
  hasNavigated = true;
};

export function focusOnNavigate(element) {
  if (!element || !hasNavigated) return;
  element.setAttribute('tabindex', '-1');
  element.focus({ preventScroll: true });
}

/** Announce the new screen without moving focus or re-reading the whole page. */
export function announceScreen(label) {
  if (!hasNavigated || !label) return;
  const region = document.getElementById('route-announcer');
  if (!region) return;
  // Clearing first guarantees the change is seen as new even when two screens
  // happen to share a title.
  region.textContent = '';
  setTimeout(() => {
    region.textContent = label;
  }, 60);
}

/** Convenience wrapper for views whose mount is just "focus the heading". */
export function focusHeading(root, _params, options = {}) {
  if (options.isRefresh) return;
  focusOnNavigate(root.querySelector('h1, h2'));
}

/**
 * Initials for the avatar, from whatever name we have.
 *
 * First and last where there are two words, first letter where there is one,
 * so a household set up with a single name still gets a sensible mark instead
 * of a blank circle. Latin-only is a real limitation of taking the first
 * character of each word, but it matches the audience this install has.
 */
/**
 * The name to greet somebody by: the first word of whatever they typed.
 *
 * People write their name into one field and mean different amounts by it.
 * "Fabiola Hickey" should still produce "Hello, Fabiola" — greeting somebody
 * by their full name reads like a letter from a bank. Pairs with initialsOf,
 * which takes the other end of the same string, so one stored value drives
 * both and a rename cannot leave the two disagreeing.
 */
export function firstNameOf(name) {
  const first = String(name || '').trim().split(/\s+/)[0];
  return first || '';
}

export function initialsOf(fullName) {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
