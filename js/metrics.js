// Mastery, progression, and weekly summary calculations.

import { ACTIVITIES, activityById, levelOf } from './content.js';
import { getState, chosenLevel } from './store.js';

export const MASTERY = {
  learning: { id: 'learning', label: 'Learning', rank: 0 },
  improving: { id: 'improving', label: 'Improving', rank: 1 },
  almost: { id: 'almost', label: 'Almost there', rank: 2 },
  reliable: { id: 'reliable', label: 'Reliable', rank: 3 },
  untouched: { id: 'untouched', label: 'Not started', rank: -1 },
};

const WATCH = ['barked', 'jumped', 'nipped', 'pulled', 'broke_position'];

export const successRate = (sessions) => {
  const reps = sessions.reduce((n, s) => n + (s.repetitions || 0), 0);
  if (!reps) return null;
  const ok = sessions.reduce((n, s) => n + (s.successfulRepetitions || 0), 0);
  return ok / reps;
};

const countTag = (sessions, tag) =>
  sessions.filter((s) => (s.behaviorsObserved || []).includes(tag)).length;

const heavyAssist = (s) =>
  (s.assistanceUsed || []).some((a) => ['treat_lure', 'leash_guidance', 'reduced_distance'].includes(a));

/** Sessions for one activity at one level, newest first. */
export function sessionsAt(activityId, levelNumber) {
  return getState()
    .sessions.filter((s) => s.activityId === activityId && s.levelNumber === levelNumber)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

/** The level the household is currently working, defaulting to the highest practiced. */
export function currentLevel(activity) {
  const override = chosenLevel(activity.id);
  if (override) return levelOf(activity, override);
  const practiced = getState()
    .sessions.filter((s) => s.activityId === activity.id)
    .map((s) => s.levelNumber);
  if (!practiced.length) return activity.levels[0];
  return levelOf(activity, Math.max(...practiced));
}

/** Mastery for a specific level of an activity. */
export function masteryFor(activityId, levelNumber) {
  const sessions = sessionsAt(activityId, levelNumber);
  if (!sessions.length) return MASTERY.untouched;

  const rate = successRate(sessions) ?? 0;
  const nipped = countTag(sessions, 'nipped');
  const jumped = countTag(sessions, 'jumped');

  if (rate < 0.5) return MASTERY.learning;
  if (rate < 0.75) return MASTERY.improving;
  if (rate < 0.9 || nipped > 0) return MASTERY.almost;

  // Reliable is deliberately hard: it needs repetition across days and contexts.
  const recent = sessions.slice(0, 3);
  const days = new Set(recent.map((s) => s.startedAt.slice(0, 10))).size;
  const people = new Set(recent.map((s) => s.completedByUserId)).size;
  const light = recent.every((s) => !heavyAssist(s));
  if (recent.length >= 3 && days >= 2 && people >= 2 && light && !nipped && !jumped) {
    return MASTERY.reliable;
  }
  return MASTERY.almost;
}

/** Best mastery reached anywhere in the activity, for library cards. */
export function activityMastery(activityId) {
  const activity = activityById(activityId);
  if (!activity) return MASTERY.untouched;
  let best = MASTERY.untouched;
  activity.levels.forEach((level) => {
    const m = masteryFor(activityId, level.number);
    if (m.rank > best.rank) best = m;
  });
  return best;
}

/**
 * Should the household move up a level?
 * Two sessions at 80%+, no nipping, at most one jump each, arousal 3 or lower.
 */
export function readyToAdvance(activityId, levelNumber) {
  const sessions = sessionsAt(activityId, levelNumber).slice(0, 2);
  if (sessions.length < 2) return false;
  return sessions.every((s) => {
    const reps = s.repetitions || 0;
    const rate = reps ? (s.successfulRepetitions || 0) / reps : 0;
    const tags = s.behaviorsObserved || [];
    return rate >= 0.8 && !tags.includes('nipped') && (s.arousalLevel || 4) <= 3;
  });
}

/** Feedback shown on the recommendation screen right after a session. */
export function recommendation(activity, level, session) {
  const reps = session.repetitions || 0;
  const rate = reps ? (session.successfulRepetitions || 0) / reps : 0;
  const tags = session.behaviorsObserved || [];
  const pct = Math.round(rate * 100);

  if (session.arousalLevel >= 4) {
    return {
      title: 'Good call stopping',
      body: 'Ending early is a real training decision, not a failure. Next time start one level easier and finish while she is still winning.',
      suggest: 'down',
    };
  }
  if (!reps) {
    // Finished without counting anything — logged, but there is nothing to
    // score, so do not lecture about success rates that do not exist.
    return {
      title: 'Session logged',
      body: 'No repetitions counted this time. Ready whenever you two are.',
      suggest: 'stay',
    };
  }
  if (tags.includes('nipped')) {
    return {
      title: 'Take the pressure off',
      body: `Nipping usually means she is over threshold. Repeat this level with more distance from the door before adding anything new.`,
      suggest: 'stay',
    };
  }
  if (readyToAdvance(activity.id, level.number) && level.number < activity.levels.length) {
    const next = levelOf(activity, level.number + 1);
    return {
      title: 'Ready for the next step',
      body: `${pct}% success two sessions running. ${next.setup}`,
      suggest: 'up',
      nextLevel: next.number,
    };
  }
  if (rate >= 0.8) {
    return {
      title: 'Nice progress',
      body: `${session.successfulRepetitions} of ${reps} reps went well. One more session like that and this level is done.`,
      suggest: 'stay',
    };
  }
  if (rate >= 0.5) {
    return {
      title: 'Coming along',
      body: `${pct}% success. Keep this level and shorten the sessions. Stop while she is still getting it right.`,
      suggest: 'stay',
    };
  }
  return {
    title: 'Make it easier',
    body: 'Under half the reps landed. Drop back a level or cut the distance so she can rebuild some wins.',
    suggest: 'down',
  };
}

// ---------------------------------------------------------------------------
// Weekly summary
// ---------------------------------------------------------------------------

const startOfDay = (d) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};

export function daysAgo(n) {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - n);
  return d;
}

export function sessionsBetween(from, to) {
  return getState().sessions.filter((s) => {
    const t = new Date(s.startedAt);
    return t >= from && t < to;
  });
}

export function weekSummary(offset = 0) {
  const from = daysAgo(7 * (offset + 1) - 1);
  const to = new Date(daysAgo(7 * offset - 1).getTime() + 24 * 60 * 60 * 1000);
  const sessions = sessionsBetween(from, to);
  const incidents = getState().incidents.filter((i) => {
    const t = new Date(i.occurredAt);
    return t >= from && t < to;
  });

  const calm = sessions.filter((s) => (s.arousalLevel || 4) <= 2).length;
  const recoveries = sessions
    .map((s) => s.recoverySeconds)
    .filter((n) => typeof n === 'number');

  return {
    from,
    to,
    sessions,
    incidents,
    count: sessions.length,
    calmRate: sessions.length ? calm / sessions.length : null,
    successRate: successRate(sessions),
    jumps: sessions.filter((s) => (s.behaviorsObserved || []).includes('jumped')).length,
    nips: sessions.filter((s) => (s.behaviorsObserved || []).includes('nipped')).length,
    avgRecovery: recoveries.length
      ? Math.round(recoveries.reduce((a, b) => a + b, 0) / recoveries.length)
      : null,
  };
}

/** Seven bars: how many sessions happened on each of the last seven days. */
export function practiceByDay() {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const day = daysAgo(i);
    const next = new Date(day.getTime() + 24 * 60 * 60 * 1000);
    out.push({
      date: day,
      label: day.toLocaleDateString(undefined, { weekday: 'narrow' }),
      count: sessionsBetween(day, next).length,
    });
  }
  return out;
}

export function currentStreak() {
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const day = daysAgo(i);
    const next = new Date(day.getTime() + 24 * 60 * 60 * 1000);
    const count = sessionsBetween(day, next).length;
    if (count) streak++;
    else if (i > 0) break; // today not practiced yet is fine
  }
  return streak;
}

/** One sentence worth reading, chosen over decorative charts. */
export function headlineInsight() {
  const week = weekSummary(0);
  const prior = weekSummary(1);

  if (!week.count && !prior.count) {
    return 'Log a few sessions and Lucy’s trends will show up here.';
  }
  if (week.successRate !== null && prior.successRate !== null) {
    const delta = Math.round((week.successRate - prior.successRate) * 100);
    if (delta >= 5) return `Lucy’s success rate is up ${delta} points on last week.`;
    if (delta <= -5) return `Success dipped ${Math.abs(delta)} points this week. Try dropping back a level.`;
  }
  if (prior.jumps > 0 && week.jumps < prior.jumps) {
    return `Jumping is down from ${prior.jumps} sessions to ${week.jumps} this week.`;
  }
  if (week.nips === 0 && prior.nips > 0) return 'No nipping at all this week.';
  if (week.count >= getState().weeklyGoal) return `${week.count} sessions this week. Goal met.`;
  if (week.calmRate !== null) {
    return `${Math.round(week.calmRate * 100)}% of this week’s sessions stayed calm.`;
  }
  return 'Keep going. Short sessions beat long ones.';
}

/** What Today suggests practicing next. */
export function suggestedActivity() {
  const state = getState();
  const scored = ACTIVITIES.map((activity) => {
    const level = currentLevel(activity);
    const sessions = state.sessions.filter((s) => s.activityId === activity.id);
    const last = sessions.length
      ? Math.max(...sessions.map((s) => new Date(s.startedAt).getTime()))
      : 0;
    const mastery = masteryFor(activity.id, level.number);
    return { activity, level, last, mastery, sessions };
  });

  // Anything untouched at the earliest point in the program comes first.
  const untouched = scored.find((s) => s.mastery === MASTERY.untouched);
  const inProgress = scored
    .filter((s) => s.mastery !== MASTERY.untouched && s.mastery !== MASTERY.reliable)
    .sort((a, b) => a.last - b.last)[0];

  if (inProgress && untouched && inProgress.last < Date.now() - 36 * 60 * 60 * 1000) {
    return inProgress;
  }
  return inProgress || untouched || scored[0];
}

export function lastPracticed(activityId) {
  const sessions = getState().sessions.filter((s) => s.activityId === activityId);
  if (!sessions.length) return null;
  return new Date(Math.max(...sessions.map((s) => new Date(s.startedAt).getTime())));
}

export function relativeDay(date) {
  if (!date) return 'Not yet practiced';
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'Last week';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
