/**
 * The single source of truth for the build version.
 *
 * Bumping this is a release: the splash screen and the Lucy tab footer show
 * it, and app.js registers the service worker as `sw.js?v=<version>` — a new
 * version means a new registration URL, which makes the browser install a
 * fresh service worker whose cache is named after the version. One edit
 * rotates everything; there is no second counter to keep in step.
 *
 * The 1.12 lineage continues the old hand-bumped cache names, which reached
 * lucy-learns-v11 before this file existed.
 */
export const APP_VERSION = '1.153.0';

/**
 * The day this build went out, shown under the version on the splash.
 *
 * Bumped by hand alongside APP_VERSION. There is no build step to stamp it,
 * and inventing one to fill in a date would be a worse trade than typing it.
 * Stored as plain parts rather than an ISO string on purpose: `new Date()` on
 * "2026-08-08" parses as UTC midnight, which renders as the 7th anywhere west
 * of Greenwich — including here.
 */
export const APP_UPDATED = { year: 2026, month: 9, day: 6 };

/**
 * The build date as a sentence, for wherever the version is shown.
 *
 * Labeled, because a bare date under a version number is ambiguous — it could
 * as easily be today's date or an expiry as the build date. Written once here
 * rather than by each screen that shows it: the splash and the Lucy tab
 * footer both say when the app was last updated, and two copies of the
 * formatting would be two dates that disagree about their own wording.
 */
export function updatedLabel() {
  const { year, month, day } = APP_UPDATED;
  const stamp = new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `Last updated ${stamp}`;
}
