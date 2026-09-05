// The arc above a single session.
//
// A household does not practice "Doorbell Predicts Rewards" for its own sake.
// They practice it because it is one of four activities that together rebuild
// the whole arrival sequence. Everything in here answers the question the
// activity screens cannot: where are we in that, and how much is left?
//
// Deliberately not a points system. The unit of progress is the level, which
// is the same unit the trainer talks in, so the number on the map is the same
// number in the lesson report.

import { ACTIVITIES, isAvailable, programById } from './content.js';
import {
  MASTERY,
  MIN_REPS_TO_ADVANCE,
  masteryFor,
  currentLevel,
  sessionsAt,
  repCount,
} from './metrics.js';
import { getState } from './store.js';

/** Stage states, ordered the way they read on the map. */
export const STAGE = {
  complete: 'complete',
  active: 'active',
  open: 'open',
  ahead: 'ahead',
  soon: 'soon',
};

/**
 * A level counts as cleared two ways, because there are two honest kinds of
 * "done with that".
 *
 *   1. It earned "Almost there" or better — 75%+ success on real reps.
 *   2. It has been practiced and the household has since moved past it.
 *
 * The second clause needs the session check: setting the level picker to 5 is
 * a plan, not an achievement, and four free levels would make the map lie.
 */
export function levelCleared(activity, levelNumber) {
  // The same floor readyToAdvance keeps. Without it a first session of one
  // rep marked "went well" is a 100% level — "Almost there" on the ladder,
  // cleared on the map, and Today rotating to the next activity — while the
  // level picker, which asks for three reps, stays exactly where it was. A
  // household's very first result was a milestone the app then took back.
  const sessions = sessionsAt(activity.id, levelNumber);
  if (
    repCount(sessions) >= MIN_REPS_TO_ADVANCE &&
    masteryFor(activity.id, levelNumber).rank >= MASTERY.almost.rank
  ) {
    return true;
  }
  return (
    levelNumber < currentLevel(activity).number &&
    sessionsAt(activity.id, levelNumber).length > 0
  );
}

/** One activity's standing: which levels are behind it, which one is live. */
export function activityProgress(activity) {
  const levels = activity.levels.map((level) => ({
    level,
    cleared: levelCleared(activity, level.number),
    mastery: masteryFor(activity.id, level.number),
  }));

  const cleared = levels.filter((l) => l.cleared).length;
  const started = levels.some((l) => l.mastery !== MASTERY.untouched);
  // Halfway through a level: this one has been practiced and has not been
  // cleared. The rotation in programProgress will not move off an activity in
  // this state, so a level that needs another go gets it.
  const workingEntry = levels.find((l) => l.level.number === currentLevel(activity).number);
  const midLevel =
    !!workingEntry &&
    !workingEntry.cleared &&
    sessionsAt(activity.id, workingEntry.level.number).length > 0;
  // When this activity was last practiced. Drives the rotation in
  // programProgress: the household is pointed at whatever they have left
  // alone longest, so the four activities take turns.
  const lastAt = getState()
    .sessions.filter((s) => s.activityId === activity.id)
    .reduce((newest, s) => Math.max(newest, new Date(s.startedAt).getTime()), 0);
  const working = currentLevel(activity);
  const nextUncleared = levels.find((l) => !l.cleared);

  return {
    activity,
    levels,
    cleared,
    total: levels.length,
    ratio: cleared / levels.length,
    started,
    lastAt,
    midLevel,
    complete: cleared === levels.length,
    // The level to open next: the one being worked, unless it is already
    // cleared and there is unfinished ground above it.
    working,
    nextLevel: nextUncleared ? nextUncleared.level : working,
    remaining: levels.length - cleared,
  };
}

/**
 * The whole program as an ordered set of stages.
 *
 * Nothing is hard-locked. A trainer can tell a household to jump to the real
 * greeting next week, and an app that refuses is an app they stop trusting.
 * Later stages are labeled rather than disabled — the sequence is advice with
 * a strong opinion, not a gate.
 */
export function programProgress(programId) {
  const program = programById(programId);
  const items = ACTIVITIES.filter((a) => a.programId === programId).map(activityProgress);

  const stages = items.map((item, i) => {
    // Earlier stages that are parked cannot be "started", so they must not make
    // everything after them read as out of order.
    const earlierUntouched = items
      .slice(0, i)
      .some((prev) => isAvailable(prev.activity) && !prev.started);
    let state;
    if (!isAvailable(item.activity)) state = STAGE.soon;
    else if (item.complete) state = STAGE.complete;
    else if (item.started) state = STAGE.active;
    else if (earlierUntouched) state = STAGE.ahead;
    else state = STAGE.open;
    return { ...item, index: i, number: i + 1, state, after: i ? items[i - 1].activity : null };
  });

  // Totals count only what can be practiced. A denominator the household has no
  // way to move is not progress, it is a promise someone else has to keep.
  const live = stages.filter((s) => s.state !== STAGE.soon);
  const cleared = live.reduce((n, s) => n + s.cleared, 0);
  const total = live.reduce((n, s) => n + s.total, 0);
  const finished = live.filter((s) => s.state === STAGE.complete).length;
  const underway = live.filter((s) => s.state === STAGE.active).length;

  // What Today and the map point at.
  //
  // This used to be "finish what is open before opening more", which is a
  // reasonable rule and made the app feel like one long corridor: the first
  // activity holds the focus for all five of its levels, so the second is
  // fifteen sessions away and the fourth is barely a rumor. A household
  // cannot care about an arc they never see.
  //
  // So the focus rotates. Among the activities that are actually unlocked and
  // unfinished, it points at whichever has been left alone longest — which
  // means a never-practiced one first, then the least recently practiced. Do a
  // level of Sound and the app moves you to Stay; do a level there and it
  // moves you to Place.
  //
  // This does not break the stacking the handout insists on. `ahead` is
  // excluded, and a stage only stops being `ahead` once the one before it has
  // been *started* — which is exactly what "each one assumes the one before it
  // is starting to hold" asks for. Nothing here jumps a household into the
  // real greeting before the door has ever been opened.
  const rotation = live
    .filter((s) => !s.complete && s.state !== STAGE.ahead)
    .sort((a, b) => a.lastAt - b.lastAt || a.index - b.index);

  // Rotate on a cleared level, not on every session. Moving after each session
  // regardless meant a level that went badly was abandoned rather than
  // repeated — the app would shuffle the household to the next activity in the
  // middle of the one thing they had not managed yet. An activity holds the
  // focus until its live level is behind it.
  const midway = rotation.find((s) => s.midLevel);

  const focus =
    midway ||
    rotation[0] ||
    live.find((s) => !s.complete) ||
    live[live.length - 1] ||
    stages[0];

  return {
    program,
    stages,
    live,
    cleared,
    total,
    ratio: total ? cleared / total : 0,
    finished,
    underway,
    /** How many of the four are not in the app yet. */
    soon: stages.length - live.length,
    remainingStages: live.length - finished,
    complete: live.length > 0 && finished === live.length,
    focus,
    /** The stage after `focus` — the thing the map dangles next. */
    upNext: live.find((s) => s.index > focus.index && !s.complete) || null,
  };
}

/** The program an activity belongs to, already scored. */
export const progressForActivity = (activity) => programProgress(activity.programId);

/** The stage entry for one activity inside its program. */
export function stageFor(activity) {
  const prog = programProgress(activity.programId);
  return {
    program: prog,
    stage: prog.stages.find((s) => s.activity.id === activity.id),
  };
}

/**
 * The one sentence that goes under the progress bar.
 *
 * Goal gradient: as the finish line gets close the message stops being about
 * how far they have come and starts being about how little is left, because
 * that is the half that actually pulls.
 */
export function programPitch(prog) {
  const { cleared, total, finished, live, soon, focus } = prog;

  if (prog.complete) {
    return soon
      ? `Everything in the app so far is done. ${soon} more ${
          soon === 1 ? 'activity' : 'activities'
        } to come.`
      : 'All four finished. This is the whole arrival sequence.';
  }
  if (!cleared) {
    // Deliberately no count. `total` here is the levels that are actually
    // open, which is 5 while three activities are parked — and the route panel
    // one screen earlier showed 23 across four. "5 levels to work through"
    // right after that reads as a contradiction rather than a smaller scope.
    // Before anything is practiced there is nothing to count anyway.
    return 'Four activities, from the first doorbell to a calm hello.';
  }

  const left = total - cleared;
  if (left <= 3) {
    return `${left} ${left === 1 ? 'level' : 'levels'} left in what is open so far.`;
  }
  if (focus && focus.remaining <= 2 && focus.started) {
    return `${focus.remaining} more ${focus.remaining === 1 ? 'level' : 'levels'} and ${
      focus.activity.title
    } is done.`;
  }
  if (finished) {
    return `${finished} of ${live.length} activities finished. ${left} levels to go.`;
  }
  return `${cleared} of ${total} levels cleared.`;
}

/**
 * Did this session just move the program? Called right after a save so the
 * done screen can name what changed at a level above "nice reps".
 */
export function programGain(activity, levelNumber, before) {
  const after = programProgress(activity.programId);
  const stage = after.stages.find((s) => s.activity.id === activity.id);
  const wasComplete = before.stages.find((s) => s.activity.id === activity.id).complete;

  return {
    program: after,
    stage,
    // A level crossed the line this session.
    clearedLevel: after.cleared > before.cleared ? levelNumber : null,
    // The whole activity crossed the line this session. The big one.
    completedActivity: stage.complete && !wasComplete ? stage : null,
    completedProgram: after.complete && !before.complete,
    upNext: after.upNext,
  };
}

/** Has the household set the app up as their own? Used by the map's first node. */
export function setupDone() {
  const state = getState();
  return Boolean(state.onboarded && state.commands.length);
}
