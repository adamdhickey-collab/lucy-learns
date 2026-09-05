import { personAvatar } from './content.js';
import { fillDog, PRONOUN_CHOICES } from './store.js';
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

// Tokens are filled here, on the way in, and only in plain interpolations:
// the template's own literal text is never touched, and neither is anything
// already marked raw. So "{dog}" belongs in a content string that a view
// interpolates, never in the view's markup. One place rather than a fill call
// at every site, because the sites that forget are exactly the ones that end
// up saying "Lucy" to somebody else's dog.
const renderValue = (value) => {
  if (Array.isArray(value)) return value.map(renderValue).join('');
  return isRaw(value) ? String(value) : esc(fillDog(value));
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

/**
 * Every mark in the app, and all of them from Lucide.
 *
 * https://lucide.dev — copyright the Lucide contributors, ISC license, credited
 * in the README. The Lucide name each entry is drawn from is named in its
 * comment, so a mark can be re-fetched or swapped without guessing.
 *
 * These used to be hand-drawn. They were drawn to Feather's construction — a
 * 24px grid, a 1.75px stroke, round caps and joins, no fill — which is the same
 * construction Lucide inherited, so the switch is a change of hand rather than
 * of house style. The reason for making it was the profile dog: I drew four
 * attempts at one and the best of them still read as crude at 24px. Once one
 * icon came from a set that draws them properly, every icon had to, or the
 * set would read as one good mark among fifteen homemade ones.
 *
 * They are copied in, not installed. There is no build step here and the
 * service worker precaches the app for offline use, so a package or a CDN link
 * would break both. Only the geometry is copied: the wrappers are ours, because
 * the stroke, the cap and the join come from CSS at each place a mark is used —
 * the tab bar wants 1.75 and 2.25 when current, the route nodes want their own.
 *
 * A handful of marks — the check on a completed chip, the chevrons on a
 * details row, the caution triangle — live in css/app.css as data-URI
 * backgrounds instead, because they are drawn by a pseudo-element rather than
 * placed by a view. Those were already Lucide's geometry and are left alone.
 */
export const ICONS = {
  // --- the four tabs -------------------------------------------------------
  // These four are the only marks a household sees on every screen, so they
  // have to stay apart from each other at a glance and at 24px.

  // Today — `lightbulb`. The idea for today, not the date; a calendar page
  // would promise a schedule the app does not keep.
  today:
    '<svg viewBox="0 0 24 24">' +
    '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>' +
    '<path d="M9 18h6"/>' +
    '<path d="M10 22h4"/>' +
    '</svg>',

  // Activities — `clipboard-list`. A plain panel of lines read as a document;
  // the clip and the bulleted rows read as the list of things to work through.
  activities:
    '<svg viewBox="0 0 24 24">' +
    '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>' +
    '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>' +
    '<path d="M12 11h4"/><path d="M12 16h4"/>' +
    '<path d="M8 11h.01"/><path d="M8 16h.01"/>' +
    '</svg>',

  // Progress — `chart-line`. The same two axes and rising line as before,
  // with the axis drawn as one cornered path rather than two crossing strokes.
  progress:
    '<svg viewBox="0 0 24 24">' +
    '<path d="M3 3v16a2 2 0 0 0 2 2h16"/>' +
    '<path d="m19 9-5 5-4-4-3 3"/>' +
    '</svg>',

  // Profile — `dog`. Fourth attempt at this tab's mark and the first not drawn
  // here. An ID tag failed cold-reading, a paw read as a paw but not as "the
  // dog's page", and the silhouette I drew to replace it read as a dog but a
  // crude one: the ear looked detached and the muzzle merged into the skull.
  // This is the mark that started the switch.
  profile:
    '<svg viewBox="0 0 24 24">' +
    '<path d="M11.25 16.25h1.5L12 17z"/>' +
    '<path d="M16 14v.5"/>' +
    '<path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444a11.702 11.702 0 0 0-.493-3.309"/>' +
    '<path d="M8 14v.5"/>' +
    '<path d="M8.5 8.5c-.384 1.05-1.083 2.028-2.344 2.5-1.931.722-3.576-.297-3.656-1-.113-.994 1.177-6.53 4-7 1.923-.321 3.651.845 3.651 2.235A7.497 7.497 0 0 1 14 5.277c0-1.39 1.844-2.598 3.767-2.277 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5"/>' +
    '</svg>',

  // --- chrome --------------------------------------------------------------

  // `chevron-left`, `x`, `plus`, `arrow-right`. Already identical to what was
  // here — Feather and Lucide draw these the same way, which is the clearest
  // evidence the two hands agree on construction.
  back: '<svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',

  // The insight row's mark — `sparkles`. What was here was a sun with rays,
  // which is very nearly the lightbulb the Today tab now uses; two radiant
  // marks on one screen were reading as the same thing. This one does not.
  spark:
    '<svg viewBox="0 0 24 24">' +
    '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/>' +
    '<path d="M20 2v4"/><path d="M22 4h-4"/>' +
    '<circle cx="4" cy="20" r="2"/>' +
    '</svg>',

  // The person a badge stands for, before there is a picture of them —
  // Lucide's `user`. A placeholder, and knowingly temporary: the setup is
  // getting a set of avatars to choose from, and this is what holds the space
  // until one has been picked.
  user:
    '<svg viewBox="0 0 24 24">' +
    '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>' +
    '<circle cx="12" cy="7" r="4"/>' +
    '</svg>',

  // The pace timer's one control — `pause`, and `play` for the way back.
  // Lucide draws both as outlines, which keeps them in the stroke family every
  // other mark here lives in; a solid triangle would have been the only filled
  // shape on the step screen, and the eye goes to the odd one out.
  pause:
    '<svg viewBox="0 0 24 24">' +
    '<rect x="14" y="4" width="4" height="16" rx="1"/>' +
    '<rect x="6" y="4" width="4" height="16" rx="1"/>' +
    '</svg>',
  play:
    '<svg viewBox="0 0 24 24">' +
    '<path d="M6 3 20 12 6 21z"/>' +
    '</svg>',

  // The end of the route — `star`. Solid is the point: the marks before it are
  // outlines of things still to be done, and this one is filled because it is
  // the prize. `icon--solid` is what lets the stroke rules every other icon
  // lives by step aside, since a 2px stroke on a filled star swells the points
  // until they touch. Lucide's star has rounded joins built into the path, so
  // it survives the fill better than the sharp-cornered one it replaces.
  star:
    '<svg viewBox="0 0 24 24" class="icon--solid">' +
    '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>' +
    '</svg>',

  // `check`. One path rather than a polyline, which the session-complete
  // draw-on animation handles either way — it dashes `svg path, svg polyline`.
  check: '<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',

  // `pencil`. Edit, wherever a thing the household typed can be retyped.
  pencil:
    '<svg viewBox="0 0 24 24">' +
    '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>' +
    '<path d="m15 5 4 4"/>' +
    '</svg>',

  // `trash-2`.
  trash:
    '<svg viewBox="0 0 24 24">' +
    '<path d="M10 11v6"/><path d="M14 11v6"/>' +
    '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>' +
    '<path d="M3 6h18"/>' +
    '<path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>' +
    '</svg>',

  // The trainer summary — `book-open`. The old mark was a book seen from the
  // side with one visible cover, which at 20px read as a filled rectangle.
  book:
    '<svg viewBox="0 0 24 24">' +
    '<path d="M12 5v16"/>' +
    '<path d="M20.001 19A2 2 0 0 0 22 17V5a2 2 0 0 0-1.999-2L16 3.002A5 5 0 0 0 12 5a5 5 0 0 0-4-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 1.999 2H8a5 5 0 0 1 4 2 5 5 0 0 1 4-2z"/>' +
    '</svg>',

  // The safety note — `shield-alert`. It stands opposite `check` in the
  // player's step rail, so it has to read as "mind this", not as "protected":
  // the bar and dot inside say that where a plain shield did not.
  shield:
    '<svg viewBox="0 0 24 24">' +
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>' +
    '<path d="M12 8v4"/><path d="M12 16h.01"/>' +
    '</svg>',

  // --- the four activities of the door program ----------------------------
  // One mark per activity, used wherever that activity appears: the route on
  // the welcome, the strip on Today, and the rail on the program map.
  //
  // They have to stay apart from each other at 18px, so each is a different
  // silhouette rather than a different detail: a sound, a hand, a bed, a door.

  // Sound — `volume-2`. A source with two arcs coming off it, which is what
  // was drawn here by hand. Deliberately not `bell-ring`: a bell in an app
  // reads as a notification before it reads as a doorbell.
  'act-sound':
    '<svg viewBox="0 0 24 24">' +
    '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/>' +
    '<path d="M16 9a5 5 0 0 1 0 6"/>' +
    '<path d="M19.364 18.364a9 9 0 0 0 0-12.728"/>' +
    '</svg>',

  // Stay — `hand`. The flat raised palm the handler actually gives.
  'act-stay':
    '<svg viewBox="0 0 24 24">' +
    '<path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/>' +
    '<path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/>' +
    '<path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/>' +
    '<path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>' +
    '</svg>',

  // Place — `bed-single`. The bed she is sent to, raised at both ends so it
  // stays distinct from the flat mat of 'plan-mat'.
  'act-place':
    '<svg viewBox="0 0 24 24">' +
    '<path d="M3 20v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8"/>' +
    '<path d="M5 10V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4"/>' +
    '<path d="M3 18h18"/>' +
    '</svg>',

  // Greet — `door-closed`. The door itself, front on, which is the thing the
  // whole program is about.
  'act-greet':
    '<svg viewBox="0 0 24 24">' +
    '<path d="M10 12h.01"/>' +
    '<path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"/>' +
    '<path d="M2 20h20"/>' +
    '</svg>',

  // --- the six goals, and the activities named under them ------------------
  // These sit at a heading rather than in a route, so they only have to be
  // distinct from each other and from the four activity marks above.

  // Door routine — `door-open`. In perspective and standing open, so it is not
  // the flat front-on door of 'act-greet'.
  'goal-door':
    '<svg viewBox="0 0 24 24">' +
    '<path d="M11 20H2"/>' +
    '<path d="M11 4.562v16.157a1 1 0 0 0 1.242.97L19 20V5.562a2 2 0 0 0-1.515-1.94l-4-1A2 2 0 0 0 11 4.561z"/>' +
    '<path d="M11 4H8a2 2 0 0 0-2 2v14"/>' +
    '<path d="M14 12h.01"/>' +
    '<path d="M22 20h-3"/>' +
    '</svg>',

  // Calm greetings — `users`. Two people meeting, no door involved.
  'goal-greeting':
    '<svg viewBox="0 0 24 24">' +
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>' +
    '<path d="M16 3.128a4 4 0 0 1 0 7.744"/>' +
    '<path d="M22 21v-2a4 4 0 0 0-3-3.87"/>' +
    '<circle cx="9" cy="7" r="4"/>' +
    '</svg>',

  // Impulse control — `hourglass`. Waiting, made of time.
  'goal-impulse':
    '<svg viewBox="0 0 24 24">' +
    '<path d="M5 22h14"/><path d="M5 2h14"/>' +
    '<path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/>' +
    '<path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>' +
    '</svg>',

  // Walks — `route`. A leash was the obvious drawing and the wrong one: it is
  // a thin curve between two small blobs, and at 17px the curve closed up
  // against the handle. A route is three shapes that stay apart at any size,
  // and "the walk" is the thing being named, not the equipment.
  'goal-walk':
    '<svg viewBox="0 0 24 24">' +
    '<circle cx="6" cy="19" r="3"/>' +
    '<path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>' +
    '<circle cx="18" cy="5" r="3"/>' +
    '</svg>',

  // Settle and recovery — `moon`. Coming back down.
  'goal-settle':
    '<svg viewBox="0 0 24 24">' +
    '<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>' +
    '</svg>',

  // Foundation skills — `layers`. What the rest is stacked on.
  'goal-foundation':
    '<svg viewBox="0 0 24 24">' +
    '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/>' +
    '<path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/>' +
    '<path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>' +
    '</svg>',

  // Four Paws on the Floor — `arrow-down-to-line`. Keep it down.
  'plan-fourpaws':
    '<svg viewBox="0 0 24 24">' +
    '<path d="M12 17V3"/>' +
    '<path d="m6 11 6 6 6-6"/>' +
    '<path d="M19 21H5"/>' +
    '</svg>',

  // Settle on a Mat — `bed`. Low and open at one end, against the two raised
  // ends of 'act-place'. The pair keeps the flat-mat / raised-bed distinction
  // the two hand-drawn marks were carrying.
  'plan-mat':
    '<svg viewBox="0 0 24 24">' +
    '<path d="M2 4v16"/>' +
    '<path d="M2 8h18a2 2 0 0 1 2 2v10"/>' +
    '<path d="M2 17h20"/>' +
    '<path d="M6 8v9"/>' +
    '</svg>',

  // People Passing on Walks — `person-standing`. The one person you meet,
  // against the two of 'goal-greeting' and the route of 'goal-walk'.
  'plan-walkpeople':
    '<svg viewBox="0 0 24 24">' +
    '<circle cx="12" cy="5" r="1"/>' +
    '<path d="m9 20 3-6 3 6"/>' +
    '<path d="m6 8 6 2 6-2"/>' +
    '<path d="M12 10v4"/>' +
    '</svg>',

  // Name Response — `message-circle-more`. Her name, said out loud.
  'plan-name':
    '<svg viewBox="0 0 24 24">' +
    '<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/>' +
    '<path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/>' +
    '</svg>',
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
  // Fired when the sheet closes any way other than confirming — cancel,
  // backdrop, Escape. A caller that holds on to the returned close function
  // needs to know when the sheet let itself go, or it keeps a handle to a
  // dialog that is no longer on screen.
  onDismiss,
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
  let settled = false;
  const close = () => {
    const wasOpen = !settled;
    settled = true;
    release();
    backdrop.remove();
    if (wasOpen && onDismiss) onDismiss();
  };

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });
  backdrop.querySelector('[data-cancel]').addEventListener('click', close);
  backdrop.querySelector('[data-confirm]').addEventListener('click', () => {
    // Marked settled first so closing does not read as a dismissal: this is
    // the one exit that is an answer rather than a retreat from the question.
    settled = true;
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

/**
 * Fix the dog's name after setup.
 *
 * One field now that breed has gone, and still a sheet rather than an input
 * edited in place on the card. A sheet for a single field looks like
 * overkill until you build the alternative: editing in place needs its own
 * save and cancel, its own escape key, its own focus handling and its own
 * answer for what a half-typed name means if the screen changes underneath
 * it — all of which this already does, and does the same way as every other
 * edit in the app. The cost of the modal is one tap; the cost of the
 * inline version is four behaviours reimplemented in a card.
 *
 * A form element, not a pair of buttons, so the phone keyboard offers "done"
 * and Enter submits.
 *
 * @param {object}   opts
 * @param {string}   opts.name
 * @param {Function} opts.onSave   ({ name }) => void — only when changed
 */
export function dogSheet({ name, pronoun = 'she', onSave }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'sheet-backdrop';

  backdrop.innerHTML = `
    <div class="sheet sheet--dialog" role="dialog" aria-modal="true" aria-labelledby="dog-sheet-title">
      <h2 id="dog-sheet-title">Their name</h2>
      <form data-form>
        <div class="field">
          <label for="dog-sheet-name">Their name</label>
          <input id="dog-sheet-name" type="text" data-name value="${esc(name)}"
                 maxlength="24" autocapitalize="words" autocomplete="off"
                 enterkeyhint="done" required />
        </div>
        <div class="field" style="margin-top: var(--s-4)">
          <span class="label" id="dog-sheet-pronoun">And you call them…</span>
          <div class="chips" role="group" aria-labelledby="dog-sheet-pronoun">
            ${PRONOUN_CHOICES.map(
              (p) => `<button type="button" class="chip" data-pronoun="${p.id}"
                aria-pressed="${String(p.id === pronoun)}">${p.label}</button>`
            ).join('')}
          </div>
        </div>


        <div class="btn-row" style="margin-top: var(--s-5)">
          <button class="btn btn--quiet" type="button" data-cancel>Cancel</button>
          <button class="btn" type="submit" data-save>Save</button>
        </div>
      </form>
    </div>`;

  let release = () => {};
  const close = () => {
    release();
    backdrop.remove();
  };

  const nameInput = backdrop.querySelector('[data-name]');
  const saveBtn = backdrop.querySelector('[data-save]');

  // A dog with no name breaks the greeting, the report title and the attention
  // cue at once, so the only invalid state this form has is disabled rather
  // than explained after the fact.
  const sync = () => {
    saveBtn.disabled = !nameInput.value.trim();
  };
  nameInput.addEventListener('input', sync);
  sync();

  let chosen = pronoun;
  backdrop.querySelectorAll('[data-pronoun]').forEach((b) => {
    b.addEventListener('click', () => {
      chosen = b.dataset.pronoun;
      backdrop.querySelectorAll('[data-pronoun]').forEach((x) => {
        x.setAttribute('aria-pressed', String(x.dataset.pronoun === chosen));
      });
    });
  });

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });
  backdrop.querySelector('[data-cancel]').addEventListener('click', close);

  backdrop.querySelector('[data-form]').addEventListener('submit', (e) => {
    e.preventDefault();
    const next = { name: nameInput.value.trim(), pronoun: chosen };
    if (!next.name) return;
    close();
    // Silence on no change: saving identical values would still fire a toast
    // and a re-render, which reads as though something happened.
    if (next.name !== name || next.pronoun !== pronoun) onSave(next);
  });

  document.body.appendChild(backdrop);
  release = trapModal(backdrop, { onEscape: close, initialFocus: nameInput });
  return close;
}

/**
 * Pick the dog's portrait from a fixed set.
 *
 * A radiogroup again, for the same reason the person list is one: exactly one
 * is chosen and the sheet shows which. Here it matters more, because the
 * choice is carried entirely by a picture — without `aria-checked` and a real
 * accessible name per option, a screen reader gets ten identical "image"
 * buttons and no way to tell which is current.
 *
 * @param {object}   opts
 * @param {Array}    opts.options   [{ id, label, src }]
 * @param {string}   [opts.currentSrc]
 * @param {Function} opts.onPick    (option) => void
 */
/**
 * Choose a portrait, and meet the name that comes with it.
 *
 * The dog picker closes on the tap, because there the picture is the whole
 * answer and holding somebody there afterwards would be ceremony. Here the
 * name is half of it — "Barkitect", "Oracle of Obedience" — and closing
 * instantly would fire the punchline into an empty room. So a tap chooses,
 * the name arrives above the grid, and a second tap confirms. One extra tap,
 * once, on the only screen in this app that is allowed to be enjoyed rather
 * than got through.
 *
 * The name is announced politely rather than assertively: `aria-live` on the
 * plate means somebody moving through the grid hears each name as they land
 * on it, which is the same experience by a different route.
 */
export function personAvatarSheet({ options, currentId, onChoose }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'sheet-backdrop';
  let selected = options.find((o) => o.id === currentId) || options[0];

  const tile = (o) => `
    <li>
      <button
        class="avatar-choice ${o.id === selected.id ? 'avatar-choice--active' : ''}"
        type="button"
        role="radio"
        aria-checked="${o.id === selected.id}"
        aria-label="${esc(o.name)}"
        data-pick="${esc(o.id)}"
      >
        <img src="${esc(o.src)}" alt="" width="400" height="400" />
      </button>
    </li>`;

  backdrop.innerHTML = `
    <div class="sheet sheet--dialog" role="dialog" aria-modal="true" aria-labelledby="person-avatar-title">
      <h2 class="avatar-sheet-title" id="person-avatar-title">Choose your avatar</h2>
      <p class="avatar-name-plate" data-name aria-live="polite">${esc(selected.name)}</p>
      <ul class="avatar-grid avatar-grid--people" role="radiogroup" aria-labelledby="person-avatar-title">
        ${options.map(tile).join('')}
      </ul>
      ${/* Pinned to the foot of the sheet. Fourteen faces is five rows at
            three across and four at four, and either way the row that
            confirms the choice was below the fold — on the one screen where
            somebody is enjoying themselves and not looking for a button. */ ''}
      <div class="btn-row sheet-actions">
        <button class="btn btn--quiet" type="button" data-close>Cancel</button>
        <button class="btn" type="button" data-confirm>That is me</button>
      </div>
    </div>`;

  let release = () => {};
  const close = () => {
    release();
    backdrop.remove();
  };

  const plate = backdrop.querySelector('[data-name]');
  backdrop.querySelectorAll('[data-pick]').forEach((button) => {
    button.addEventListener('click', () => {
      selected = options.find((o) => o.id === button.dataset.pick) || selected;
      backdrop.querySelectorAll('[data-pick]').forEach((other) => {
        const on = other === button;
        other.classList.toggle('avatar-choice--active', on);
        other.setAttribute('aria-checked', String(on));
      });
      plate.textContent = selected.name;
      // Replayed rather than transitioned, so tapping along the row gives the
      // name a fresh arrival each time instead of one long crossfade.
      plate.classList.remove('is-new');
      void plate.offsetWidth;
      plate.classList.add('is-new');
    });
  });

  backdrop.querySelector('[data-confirm]').addEventListener('click', () => {
    close();
    onChoose(selected);
  });
  backdrop.querySelector('[data-close]').addEventListener('click', close);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  document.body.appendChild(backdrop);
  release = trapModal(backdrop, {
    onEscape: close,
    initialFocus: backdrop.querySelector('.avatar-choice--active') || backdrop.querySelector('[data-pick]'),
  });
  return close;
}

export function avatarSheet({ options, currentSrc, onPick }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'sheet-backdrop';

  const tile = (o) => `
    <li>
      <button
        class="avatar-choice ${o.src === currentSrc ? 'avatar-choice--active' : ''}"
        type="button"
        role="radio"
        aria-checked="${o.src === currentSrc}"
        aria-label="${esc(o.label)}"
        data-pick="${esc(o.id)}"
      >
        ${/* Decorative: the button is named by its aria-label, so alt text
              here would have a screen reader say the name twice. */ ''}
        ${/* Not lazy. The whole set is precached and weighs less than one
              illustration, and every tile is on screen the moment the sheet
              opens — lazy here buys nothing and costs a grid that fills in
              under the reader. */ ''}
        <img src="${esc(o.src)}" alt="" width="400" height="400" />
      </button>
    </li>`;

  backdrop.innerHTML = `
    <div class="sheet sheet--dialog" role="dialog" aria-modal="true" aria-labelledby="avatar-sheet-title">
      <h2 id="avatar-sheet-title">Choose a picture</h2>
      <p class="section-note">
        The illustrations in the sessions all show the same dog. This one is
        yours — choose whichever comes closest.
      </p>
      <ul class="avatar-grid" role="radiogroup" aria-labelledby="avatar-sheet-title">
        ${options.map(tile).join('')}
      </ul>
      <div class="btn-row" style="margin-top: var(--s-4)">
        <button class="btn btn--quiet btn--block" type="button" data-close>Cancel</button>
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
  backdrop.querySelector('[data-close]').addEventListener('click', close);

  backdrop.querySelectorAll('[data-pick]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const picked = options.find((o) => o.id === btn.dataset.pick);
      close();
      if (picked && picked.src !== currentSrc) onPick(picked);
    });
  });

  document.body.appendChild(backdrop);
  release = trapModal(backdrop, {
    onEscape: close,
    initialFocus:
      backdrop.querySelector('[data-pick][aria-checked="true"]') ||
      backdrop.querySelector('[data-pick]'),
  });
  return close;
}

/**
 * Who is practicing: pick somebody, or add somebody.
 *
 * Built here rather than in a view because two screens open it — the avatar on
 * Today and the row on the profile — and a sheet that lives in one view cannot
 * be opened from the other without the wrong view owning it.
 *
 * The list is radios, not buttons. Exactly one person is active at a time and
 * the sheet shows which, which is a radio group whichever way it is painted;
 * building it out of buttons and a tick glyph would leave a screen reader to
 * infer the selection from an icon. `aria-checked` says it outright, and
 * arrow-key navigation comes free.
 *
 * @param {object}   opts
 * @param {Array}    opts.people        [{ id, name }]
 * @param {string}   opts.activeId
 * @param {Function} opts.onSelect      (id) => void
 * @param {Function} opts.onAdd         (name) => void
 * @param {Function} [opts.onRemove]    (id) => void, omitted when only one person
 * @param {Function} [opts.onClose]
 */
export function personSheet({
  people,
  activeId,
  onSelect,
  onAdd,
  onRename,
  onRemove,
  onPickAvatar,
  onClose,
}) {
  const backdrop = document.createElement('div');
  backdrop.className = 'sheet-backdrop';

  const row = (p) => `
    <li class="${p.id === activeId ? 'is-active' : ''}">
      ${/* The portrait is its own control, outside the row it used to sit
             inside. Tapping a face to change it is the gesture people bring
             with them, and it cannot be offered from within a button that
             already means "switch to this person" — a button inside a button
             is not markup, it is a guess about which one you hit. */ ''}
      ${
        onPickAvatar
          ? `<button class="person-row-face" type="button" data-avatar-for="${esc(p.id)}"
               aria-label="Change ${esc(p.name)}'s picture">
               ${personPortrait(p)}
               <span class="edit-badge" aria-hidden="true">${ICONS.pencil}</span>
             </button>`
          : personPortrait(p)
      }
      <button
        class="person-row ${p.id === activeId ? 'person-row--active' : ''}"
        type="button"
        role="radio"
        aria-checked="${p.id === activeId}"
        data-person="${esc(p.id)}"
      >
        <span class="person-row-name">${esc(p.name)}</span>
        ${p.id === activeId ? `<span class="person-row-mark">${ICONS.check}</span>` : ''}
      </button>
      ${
        onRename
          ? `<button class="person-row-edit" type="button" data-rename="${esc(p.id)}"
               aria-label="Rename ${esc(p.name)}">${ICONS.pencil}</button>`
          : ''
      }
      ${
        onRemove && p.id !== activeId
          ? `<button class="person-row-remove" type="button" data-remove="${esc(p.id)}"
               aria-label="Remove ${esc(p.name)}">${ICONS.close}</button>`
          : /* The active row has no remove — there must always be somebody to
               log the next session against — but it still has to hold the
               column open. Without this the row (flex: 1) takes the vacant
               space and drags its pencil out of line with every pencil above
               it, which reads as a rendering fault rather than an absence.
               aria-hidden so it is a gap on screen and nothing at all to a
               screen reader. */
            onRemove
            ? '<span class="person-row-spacer" aria-hidden="true"></span>'
            : ''
      }
    </li>`;

  backdrop.innerHTML = `
    <div class="sheet sheet--dialog" role="dialog" aria-modal="true" aria-labelledby="person-sheet-title">
      <h2 id="person-sheet-title">Who is practicing?</h2>
      <p class="section-note">
        This changes who the next session is logged under. Everything else — the
        training, the progress, the report — belongs to the household.
      </p>

      <ul class="person-list" role="radiogroup" aria-labelledby="person-sheet-title">
        ${people.map(row).join('')}
      </ul>

      <button class="person-add" type="button" data-add-open>
        ${ICONS.plus}<span>Add someone</span>
      </button>

      ${/* One field, revealed in place rather than on a second screen. Adding
            a person is one question and a screen change would make it feel
            like more.

            Renaming reuses this same field rather than opening a sheet on top
            of a sheet. It is the same question — what is this person called —
            and stacking two modals means two things to trap focus in, two
            things to escape from, and a backdrop over a backdrop. The label,
            the placeholder, the button and the prefill change; the form does
            not. */ ''}
      <form class="person-add-form" data-add-form hidden>
        <label class="visually-hidden" for="person-add-name" data-form-label>Their name</label>
        <input id="person-add-name" type="text" data-add-name placeholder="Their name"
               maxlength="32" autocapitalize="words" autocomplete="off" enterkeyhint="done" />
        <button class="btn" type="submit" data-add-save disabled>Add</button>
      </form>

      <div class="btn-row" style="margin-top: var(--s-4)">
        <button class="btn btn--quiet btn--block" type="button" data-close>Done</button>
      </div>
    </div>`;

  let release = () => {};
  const close = () => {
    release();
    backdrop.remove();
    if (onClose) onClose();
  };

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });
  backdrop.querySelector('[data-close]').addEventListener('click', close);

  backdrop.querySelectorAll('[data-person]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.person;
      // Picking the person who is already picked is a no-op, not a re-select:
      // it should not write to storage or announce a switch that did not
      // happen. Closing is the right response — they have confirmed.
      if (id !== activeId) onSelect(id);
      close();
    });
  });

  backdrop.querySelectorAll('[data-avatar-for]').forEach((btn) => {
    btn.addEventListener('click', () => {
      close();
      onPickAvatar(btn.dataset.avatarFor);
    });
  });

  backdrop.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onRemove(btn.dataset.remove);
      close();
    });
  });

  const form = backdrop.querySelector('[data-add-form]');
  const nameInput = backdrop.querySelector('[data-add-name]');
  const saveBtn = backdrop.querySelector('[data-add-save]');
  const addOpen = backdrop.querySelector('[data-add-open]');
  const formLabel = backdrop.querySelector('[data-form-label]');

  // null = adding somebody new; an id = renaming that person.
  let renamingId = null;

  const openForm = ({ id = null, value = '', label, placeholder, action }) => {
    renamingId = id;
    formLabel.textContent = label;
    nameInput.placeholder = placeholder;
    nameInput.value = value;
    saveBtn.textContent = action;
    saveBtn.disabled = !value.trim();
    addOpen.hidden = true;
    form.hidden = false;
    nameInput.focus();
    // Renaming starts with the existing name in the box, and the point is
    // almost always to change part of it. Selecting it means the first
    // keystroke replaces rather than appends to a name that is already wrong.
    if (id) nameInput.select();
  };

  addOpen.addEventListener('click', () =>
    openForm({ label: 'Their name', placeholder: 'Their name', action: 'Add' })
  );

  backdrop.querySelectorAll('[data-rename]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const person = people.find((p) => p.id === btn.dataset.rename);
      if (!person) return;
      openForm({
        id: person.id,
        value: person.name,
        label: 'Their name',
        placeholder: 'Their name',
        action: 'Save',
      });
    });
  });

  // A blank or whitespace name would render an empty avatar and greet nobody.
  nameInput.addEventListener('input', () => {
    saveBtn.disabled = !nameInput.value.trim();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;
    if (renamingId) {
      const person = people.find((p) => p.id === renamingId);
      // Same name back is not a rename. Close without announcing one.
      if (person && person.name !== name) onRename(renamingId, name);
    } else {
      onAdd(name);
    }
    close();
  });

  document.body.appendChild(backdrop);
  release = trapModal(backdrop, {
    onEscape: close,
    initialFocus: backdrop.querySelector('[data-person][aria-checked="true"]') || addOpen,
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

/**
 * A person's portrait, at whatever size the caller's class asks for.
 *
 * One helper rather than three copies, because these appear in three places
 * that already drifted once: the Today header, the profile row and the person
 * switcher each drew their own initials. Decorative in every one of them —
 * the name is always beside it or in the control's own label, so alt text
 * here would say it twice.
 */
export function personPortrait(person, className = 'avatar avatar--sm') {
  const avatar = personAvatar(person && person.avatar);
  return raw(
    `<span class="${esc(className)} avatar--photo" aria-hidden="true">` +
      `<img src="${esc(avatar.src)}" alt="" width="400" height="400" />` +
      `</span>`
  );
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
