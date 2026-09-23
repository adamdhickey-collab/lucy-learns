// Mastery, progression, and weekly summary calculations.

import { LIVE_ACTIVITIES, activityById, isPractice, levelOf } from './content.js';
import { getState, chosenLevel, getDog } from './store.js';

export const MASTERY = {
  learning: { id: 'learning', label: 'Learning', rank: 0, short: 'Learning' },
  improving: { id: 'improving', label: 'Improving', rank: 1, short: 'Improving' },
  almost: { id: 'almost', label: 'Almost there', rank: 2, short: 'Almost' },
  reliable: { id: 'reliable', label: 'Reliable', rank: 3, short: 'Reliable' },
  untouched: { id: 'untouched', label: 'Not started', rank: -1, short: 'Not started' },
};

/**
 * The four earnable rungs in order. "Not started" is deliberately absent: it
 * is the absence of a rung, not the bottom one, and putting it on the ladder
 * would make standing at the bottom look like an achievement.
 */
export const MASTERY_LADDER = [
  MASTERY.learning,
  MASTERY.improving,
  MASTERY.almost,
  MASTERY.reliable,
];

const WATCH = ['barked', 'jumped', 'nipped', 'pulled', 'broke_position'];

/**
 * The shortest session that is allowed to advance a level on its own.
 *
 * Exported so the setting screen can say the same number rather than repeat it
 * in prose and drift from it later.
 */
export const MIN_REPS_TO_ADVANCE = 3;

/**
 * The level that clears for turning up, and the test for it.
 *
 * Level 1 of every activity is the easy one by design -- the doorbell rings
 * and nothing is asked of the dog yet -- and it is the level a household
 * meets the app on. Holding it to the same bar as level 6 meant a real first
 * session could be run, counted and logged and still leave every number on
 * the screen exactly where it started: nothing cleared, nothing opened, no
 * sign the app had noticed. That is the session that decides whether there is
 * a second one, and it was the one session guaranteed to look like nothing.
 *
 * So level 1 asks what a first level can honestly ask: that they ran it, and
 * that something went well. One repetition is enough. Nothing above level 1
 * moves -- the bar that protects the training is still there, one level up,
 * by which point the household has watched the app work once.
 *
 * This is not a participation trophy in the sense that worries me, because
 * the claim stays true: level 1 IS cleared once a dog has done it once. What
 * changed is that the app stopped asking the first level to prove the same
 * thing as the last.
 */
export const INTRO_LEVEL = 1;
export const clearsOnEffort = (levelNumber) => levelNumber === INTRO_LEVEL;

/**
 * Total repetitions behind a set of sessions — the denominator under every
 * percentage this app prints.
 *
 * Exported because a rate without its count is a claim without its weight:
 * 77% of thirteen reps and 77% of two hundred are the same number and
 * different evidence, and the screens that hand a percentage to a trainer
 * should be able to say which one they mean.
 */
export const repCount = (sessions) =>
  sessions.reduce((n, s) => n + (s.repetitions || 0), 0);

export const successRate = (sessions) => {
  const reps = repCount(sessions);
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
  //
  // This used to also require two different handlers, because a behavior that
  // only holds for one person has not generalised. With a single handler that
  // clause could never be satisfied and Reliable would be unreachable, so the
  // spread moved onto the axis that is still available: three separate days
  // rather than two. The bar stays high, and it stays earnable.
  const recent = sessions.slice(0, 3);
  const days = new Set(recent.map((s) => s.startedAt.slice(0, 10))).size;
  const light = recent.every((s) => !heavyAssist(s));
  if (recent.length >= 3 && days >= 3 && light && !nipped && !jumped) {
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
  // One clean session, not two.
  //
  // The bar itself is unchanged — 80% of reps, calm, no nipping — but it used
  // to have to be cleared twice in a row before the app would move. That meant
  // a household could have a genuinely good session and watch the level sit
  // exactly where it was, which is the opposite of the feedback a good session
  // should get. The quality gate is doing the real work here; the repeat count
  // was mostly making progress feel unavailable.
  //
  // A level is still not "mastered" on one session — that is what the mastery
  // ladder tracks, and it still wants sessions across separate days. This only
  // decides which level to queue next.
  const sessions = sessionsAt(activityId, levelNumber).slice(0, 1);
  if (!sessions.length) return false;
  return sessions.every((s) => {
    const reps = s.repetitions || 0;
    const tags = s.behaviorsObserved || [];
    // The intro level opens the next one on a single repetition that went
    // well. Nipping still holds it, and deliberately: a dog over threshold on
    // the easiest level in the program is the one case where moving up is the
    // wrong answer, and the branch above this sends that session to the
    // fallback advice instead.
    //
    // A practice takes the same branch at every level, not just the first.
    // The rule below divides successes by repetitions, and a practice has one
    // of each by definition -- one pass, one observation -- so it would be
    // held at reps < 3 forever and never open the level after it. Today all
    // four practices have a single level and nothing would notice; the fifth
    // one written with two levels would, silently, which is the kind of trap
    // worth closing while the reason is still on screen.
    if (clearsOnEffort(levelNumber) || isPractice(activityById(activityId))) {
      return (s.successfulRepetitions || 0) >= 1 && !tags.includes('nipped');
    }
    // A rate needs something under it. Reps per session is a setting now, and
    // at its floor a single good repetition is a 100% session — enough, on the
    // rule below, to move the household up a level on one lucky pass. Three is
    // the smallest count where the 80% bar is asking for a pattern rather than
    // an outcome, so shorter sessions still log, still count toward mastery,
    // and simply do not decide the next level on their own.
    if (reps < MIN_REPS_TO_ADVANCE) return false;
    const rate = reps ? (s.successfulRepetitions || 0) / reps : 0;
    return rate >= 0.8 && !tags.includes('nipped') && (s.arousalLevel || 4) <= 3;
  });
}

/**
 * The one-line verdict, which has to agree with the answer the household just
 * gave it.
 *
 * This used to be a fixed `${pct}% success, calm throughout.` — and
 * `readyToAdvance` accepts arousal up to 3, which is *Calm*, *Some excitement*
 * and *Very excited*. So a household that had just tapped "Very excited — hard
 * to reach" was told on the very next screen that she was calm. Found by a
 * blind run-through of the app: the tester picked "Some excitement", read
 * "calm throughout", and re-read it twice trying to work out which one the app
 * meant.
 *
 * In an app whose entire subject is a dog's arousal, contradicting the
 * household's own reading of it is the one thing the summary must never do —
 * it teaches them the number is not listening.
 *
 * Unknown arousal makes no claim at all rather than assuming the best.
 */
function verdict(pct, arousal) {
  if (arousal === 1) return `${pct}% success, calm throughout.`;
  if (arousal === 2) return `${pct}% success, wiggly but with you the whole way.`;
  if (arousal === 3) {
    return `${pct}% success, though {dog} was wired for it — no harm in repeating this level once more.`;
  }
  return `${pct}% success.`;
}

/**
 * Feedback shown on the recommendation screen right after a session.
 *
 * `key` names the picture the done screen draws above the title — one per
 * verdict, in VERDICT_ART in content.js. It is a field of its own rather than
 * a slug derived from `title`, because the titles are copy and get reworded;
 * `suggest` cannot carry it either, since that has three values for seven
 * verdicts. `pilot.mjs verify` checks that every key returned here has a
 * picture, so a new branch without one fails there rather than rendering a
 * broken image on the emotional peak of the app.
 */
export function recommendation(activity, level, session) {
  const reps = session.repetitions || 0;
  const rate = reps ? (session.successfulRepetitions || 0) / reps : 0;
  const tags = session.behaviorsObserved || [];
  const pct = Math.round(rate * 100);

  if (session.arousalLevel >= 4) {
    return {
      key: 'good-call-stopping',
      title: 'Good call stopping',
      body: 'Ending early is a real training decision, not a failure. Next time start one level easier and finish while {dog} is still winning.',
      suggest: 'down',
    };
  }
  if (!reps) {
    // Finished without counting anything — logged, but there is nothing to
    // score, so do not lecture about success rates that do not exist.
    return {
      key: 'session-logged',
      title: 'Session logged',
      body: 'No repetitions counted this time. Ready whenever you two are.',
      suggest: 'stay',
    };
  }
  if (tags.includes('nipped')) {
    return {
      key: 'take-the-pressure-off',
      title: 'Take the pressure off',
      body: `Nipping usually means {dog} is over threshold. Repeat this level with more distance from whatever set {her} off before adding anything new.`,
      suggest: 'stay',
    };
  }
  if (readyToAdvance(activity.id, level.number) && level.number < activity.levels.length) {
    const next = levelOf(activity, level.number + 1);
    return {
      key: 'ready-for-next-step',
      title: 'Ready for the next step',
      // No preview of the next level's setup here. The done screen states
      // which activity the program is actually pointing at, and that is often
      // a different one — describing what level 2 involves directly above
      // "up next: Stay While the Door Opens" put two different futures on the
      // same screen. This is the verdict; the notice below it is the plan.
      body: verdict(pct, session.arousalLevel),
      suggest: 'up',
      nextLevel: next.number,
    };
  }
  if (rate >= 0.8) {
    return {
      key: 'nice-progress',
      title: 'Nice progress',
      // Not "this level is done": clearing a level and being ready to leave it
      // are two different bars — 75% once, against 80% twice — and the done
      // screen can show both at the same time. Saying "done" next to a "Level
      // 4 cleared" stamp made one of them look wrong.
      // Reached only when readyToAdvance said no, and past the arousal and
      // nipping branches above the only thing left for it to have said no to
      // is the rep floor. Say that, then. "Keep her calm through a whole
      // session" was the sentence here before, and after a one-rep session it
      // sat beside a "Level 1 cleared" card promising something the same
      // screen had just withheld.
      // A practice has one pass and no count, so "1 of 1 reps went well" is
      // the app reporting a statistic about a number it invented. It is also
      // never short of the rep floor, because that floor does not apply to it
      // -- see readyToAdvance -- so only the second sentence can be true here.
      body: isPractice(activity)
        ? `That went well. Do it again tomorrow and it starts to stick.`
        : reps < MIN_REPS_TO_ADVANCE && !clearsOnEffort(level.number)
          ? `${session.successfulRepetitions} of ${reps} reps went well. A session needs at least ${MIN_REPS_TO_ADVANCE} reps to open the next level, so count a few more next time.`
          : `${session.successfulRepetitions} of ${reps} reps went well. Keep {her} calm through a whole session and the next level opens.`,
      suggest: 'stay',
    };
  }
  if (rate >= 0.5) {
    return {
      key: 'coming-along',
      title: 'Coming along',
      body: `${pct}% success. Keep this level and shorten the sessions. Stop while {dog} is still getting it right.`,
      suggest: 'stay',
    };
  }
  return {
    key: 'make-it-easier',
    title: 'Make it easier',
    body: 'Under half the reps landed. Drop back a level or cut the distance so {dog} can rebuild some wins.',
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

  // The average level practiced, so the calm rate can say whether two weeks are
  // comparable. `calmRate` is a flat count of calm sessions over all sessions,
  // and nothing in it knows that level 1 is easier than level 5 — so a week
  // spent on early rungs scores higher than a week spent on late ones for the
  // same dog, and the screen was presenting that as improvement.
  //
  // Found by asking three people to read the Progress screen cold. All three
  // answered "yes, she is getting calmer" off the headline and then, unprompted,
  // pointed out that the two weeks were not the same work.
  const levels = sessions.map((s) => s.levelNumber).filter((n) => typeof n === 'number');

  return {
    from,
    to,
    sessions,
    incidents,
    count: sessions.length,
    calmRate: sessions.length ? calm / sessions.length : null,
    avgLevel: levels.length ? levels.reduce((a, b) => a + b, 0) / levels.length : null,
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

/**
 * One sentence worth reading, chosen over decorative charts.
 *
 * Returns `{ text, tone }`. The tone exists because this line sits next to a
 * sunburst: "Jumping showed up in 2 sessions" under a cheerful icon is the same
 * flattery the branch order was just fixed to stop, done with a graphic instead
 * of a sentence.
 */
export function headlineInsight() {
  const say = (text, tone = 'good') => ({ text, tone });
  const week = weekSummary(0);
  const prior = weekSummary(1);

  if (!week.count && !prior.count) {
    return say(`Log a few sessions and ${getDog().name}’s trends will show up here.`);
  }
  // A watch behavior getting worse outranks everything, including good news.
  //
  // Every branch in this function used to be a positive framing — jumping
  // *down*, no nipping, goal met, calm rate — with one exception for a success
  // rate that dipped. There was a "jumping is down" branch and no "jumping is
  // up" branch, so a week where she practiced plenty and nipped for the first
  // time in a month opened with "Goal met." A household reading that gets told
  // the thing that flatters them, on a screen they hand to their trainer.
  //
  // Nipping is checked before the success rate, not after. This app already
  // treats nipping as the marker of a dog over threshold — `recommendation()`
  // drops everything else and says take the pressure off — so a week that
  // opened "success rate is up 10 points" while she nipped for the first time
  // would be cheerier than the app's own advice about the same sessions.
  const worse = (now, before, word, advice = '') => {
    if (now <= before) return null;
    const s = now === 1 ? 'session' : 'sessions';
    return before === 0
      ? `${word} showed up in ${now} ${s} this week, after none last week.${advice}`
      : `${word} is up from ${before} to ${now} sessions this week.${advice}`;
  };

  const nipping = worse(week.nips, prior.nips, 'Nipping', ' Drop back a level and add distance.');
  if (nipping) return say(nipping, 'watch');

  if (week.successRate !== null && prior.successRate !== null) {
    const delta = Math.round((week.successRate - prior.successRate) * 100);
    if (delta >= 5) return say(`${getDog().name}’s success rate is up ${delta} points on last week.`);
    if (delta <= -5) return say(`Success dipped ${Math.abs(delta)} points this week. Try dropping back a level.`, 'watch');
  }

  const jumping = worse(week.jumps, prior.jumps, 'Jumping');
  if (jumping) return say(jumping, 'watch');

  if (prior.jumps > 0 && week.jumps < prior.jumps) {
    return say(`Jumping is down from ${prior.jumps} sessions to ${week.jumps} this week.`);
  }
  if (week.nips === 0 && prior.nips > 0) return say('No nipping at all this week.');
  if (week.count >= getState().weeklyGoal) return say(`${week.count} sessions this week. Goal met.`);
  if (week.calmRate !== null) {
    return say(`${Math.round(week.calmRate * 100)}% of this week’s sessions stayed calm.`);
  }
  return say('Keep going. Short sessions beat long ones.');
}

/** What Today suggests practicing next. */
export function suggestedActivity() {
  const state = getState();
  // Only what can be opened: suggesting a parked activity would send the
  // household to a screen with no way to start.
  const scored = LIVE_ACTIVITIES.map((activity) => {
    const level = currentLevel(activity);
    const sessions = state.sessions.filter((s) => s.activityId === activity.id);
    const last = sessions.length
      ? Math.max(...sessions.map((s) => new Date(s.startedAt).getTime()))
      : 0;
    const mastery = masteryFor(activity.id, level.number);
    return { activity, level, last, mastery, sessions, cadence: cadenceFor(activity, level) };
  });

  // What the handout asks for today outranks everything below.
  //
  // A curriculum written as frequencies has an answer to "what now" that
  // mastery cannot see: an exercise due daily and not done today is wanted
  // more than one due weekly that was practiced this morning, however much
  // less far along it is. Ordered by how overdue rather than by how new —
  // a daily one missed is more pressing than a weekly one missed, because
  // the window closes sooner.
  //
  // Only packs that declare a cadence reach this. Every level in the door
  // pack returns null from cadenceFor, `dueNow` is empty, and the two rules
  // below decide exactly as they always have.
  const dueNow = scored
    .filter((s) => s.cadence && s.cadence.due)
    .sort((a, b) => {
      const window = (c) => (c.per === 'day' ? 0 : 1);
      return window(a.cadence) - window(b.cadence) || a.last - b.last;
    });
  if (dueNow.length) return dueNow[0];

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

// ---------------------------------------------------------------------------
// Cadence
// ---------------------------------------------------------------------------

/**
 * How often a level asks to be practiced, and whether it has been.
 *
 * The handout this pack came from is written as frequencies rather than as
 * repetitions -- "DO THIS daily", "once or twice a week" -- and that is the
 * spine of it: the same Stay exercise is weekly at step one and daily at step
 * two, and a household that runs everything once a week is not doing the
 * program. Those sentences used to live in prose inside each level's `setup`,
 * where they could be read and nothing could act on them.
 *
 * Absent means no opinion, which is what every level in the door pack has. A
 * level with no `cadence` returns null and every caller falls back to what it
 * did before, so nothing about that app changes.
 *
 * Counted per activity rather than per level. The frequency belongs to the
 * exercise -- the handout says how often to practice Stay, not how often to
 * practice Stay at step three -- and a level change mid-week would otherwise
 * reset the count and mark a household late for work they had just done.
 *
 * The week is the rolling seven days ending today, which is what weekSummary
 * and the streak already mean by a week. A second definition of "this week"
 * living in this file would be a second answer to "did we do it".
 *
 * `sessions` is a test seam, the same shape approve.mjs uses for its
 * filesystem. What is being computed here is date arithmetic against a rolling
 * window, which is the kind that is wrong by one day for a week before anybody
 * notices, and it cannot be pinned by a test that has to stand up a whole
 * store first. Nothing in the app passes it.
 */
export function cadenceFor(activity, level, sessions = null) {
  const cadence = level && level.cadence;
  if (!cadence) return null;
  const { min, max, per } = cadence;
  const from = per === 'day' ? daysAgo(0) : daysAgo(6);
  const log = sessions || getState().sessions;
  const done = log.filter(
    (s) => s.activityId === activity.id && new Date(s.startedAt) >= from
  ).length;
  return { min, max, per, done, due: done < min, met: done >= min, ahead: done >= max };
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
