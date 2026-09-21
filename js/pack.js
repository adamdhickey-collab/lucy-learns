/**
 * Which curriculum this page is teaching.
 *
 * The app is one engine with two sets of content: the door-greeting program it
 * was built for, and The Canine Coach's "I'm So Excited!" boot camp homework.
 * Both ship in every build and one of them is chosen here, at load, before any
 * screen renders.
 *
 * Declared on the <html> element rather than passed as a query string or set on
 * a global. A query string is something a person can edit mid-session, which
 * would swap the curriculum under a running app and leave the stored history
 * pointing at activities that no longer exist. The attribute belongs to the
 * document, so index.html is the door app and excited.html is the boot camp,
 * and there is no way to be half in one and half in the other.
 *
 * `document` is guarded because scripts/pilot.mjs imports content.js in Node to
 * check that every referenced picture exists. That check wants a pack by name,
 * not whichever one a browser would have picked, so Node gets the default and
 * the script imports js/content/<pack>.js directly when it wants the other one.
 */

export const PACKS = ['door', 'excited'];

const declared =
  typeof document !== 'undefined' ? document.documentElement.dataset.pack : undefined;

export const PACK = PACKS.includes(declared) ? declared : 'door';
