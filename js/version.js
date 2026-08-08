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
export const APP_VERSION = '1.14.1';
