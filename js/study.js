/**
 * Study mode: put every research participant into the same app.
 *
 *   ?study         → past the welcome, with the demo history (the default)
 *   ?study=demo    → the same thing, said out loud
 *   ?study=empty   → past the welcome, no history at all
 *   ?study=welcome → the very first launch, so onboarding is the task
 *
 * Why this exists. An unmoderated platform — Maze, Lyssna, whatever — times
 * tasks and compares participants to each other, and three things in this app
 * make two participants incomparable:
 *
 *   The welcome ends on a fork. Its last panel offers "Start empty" or the
 *   demo history, so half a panel could land in an app with an empty Progress
 *   tab and no mastery badges and the other half in one reporting eight levels
 *   cleared. Those are different products to navigate, and no amount of task
 *   design papers over it.
 *
 *   Nothing is reachable before the welcome, so a task written against Today
 *   actually starts three panels earlier unless onboarding is the point.
 *
 *   The splash holds for five seconds. That is deliberate for a household
 *   opening the app once a day, and it is five seconds inside the first task of
 *   every participant, on every reload, in a tool that reports time on task.
 *
 * Every load with the parameter rebuilds the baseline from scratch. That is the
 * whole point: a participant who reloads, or backs out and re-enters from the
 * study link, gets the state the last one started from rather than whatever
 * they had made of it. It is why the reset is keyed to page load and not to
 * navigation — moving around inside the app leaves their work alone.
 *
 * Nothing here runs without the parameter. A household never touches this path.
 */

import { startFresh, clearAll, completeOnboarding, seedDemoSessions } from './store.js';

/** How long the splash holds in study mode, in ms. */
export const STUDY_SPLASH_HOLD_MS = 1200;

const MODES = new Set(['demo', 'empty', 'welcome']);

/**
 * The mode for this load, or null when the parameter is absent.
 *
 * A bare `?study` means demo, because that is the state worth testing: an app
 * with history in it exercises Progress, mastery, the streak and the program
 * map, and an empty one leaves most of the product unreachable. Empty is a
 * deliberate choice, not the default you get by forgetting to say.
 */
export function studyMode() {
  const value = new URLSearchParams(location.search).get('study');
  if (value === null) return null;
  const mode = value.trim().toLowerCase();
  if (mode === '') return 'demo';
  return MODES.has(mode) ? mode : 'demo';
}

/**
 * Rebuild the baseline. Call once, before the first render.
 *
 * `clearAll` rather than `startFresh` for the two onboarded modes: it keeps the
 * household and the cue wording and skips the welcome, which is the state a
 * participant should be dropped into. `startFresh` is the true first launch and
 * is what `welcome` wants.
 */
export function applyStudyMode(mode) {
  if (mode === 'welcome') {
    startFresh();
    return;
  }

  clearAll();
  completeOnboarding();

  if (mode === 'demo') {
    // force, because clearAll leaves `seeded` set and the seeder is otherwise
    // a no-op on a second run — which would have made every reload after the
    // first one land in an empty app while reporting success.
    seedDemoSessions({ force: true });
  }
}
