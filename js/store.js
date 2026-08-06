// Local-first persistence. Everything lives in localStorage under one key so a
// future Supabase sync only has to replace this module's read/write functions.

import { DEFAULT_COMMANDS, MEMBERS, ACTIVITIES } from './content.js';

const KEY = 'lucy-learns/v1';

const emptyState = () => ({
  version: 1,
  activeMemberId: MEMBERS[0].id,
  commands: DEFAULT_COMMANDS.map((c) => ({ ...c })),
  sessions: [],
  incidents: [],
  levelOverrides: {}, // activityId -> level number chosen manually
  weeklyGoal: 5,
  seeded: false,
  notes: '',
});

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    return { ...emptyState(), ...JSON.parse(raw) };
  } catch {
    return emptyState();
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private browsing or quota: the app still works for this session */
  }
  listeners.forEach((fn) => fn(state));
}

export const getState = () => state;
export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// --- members ---------------------------------------------------------------

export const activeMember = () =>
  MEMBERS.find((m) => m.id === state.activeMemberId) || MEMBERS[0];

export function setActiveMember(id) {
  state.activeMemberId = id;
  persist();
}

// --- sessions --------------------------------------------------------------

export function addSession(session) {
  const record = {
    id: uid(),
    dogId: 'lucy',
    completedByUserId: state.activeMemberId,
    startedAt: new Date().toISOString(),
    ...session,
  };
  state.sessions.unshift(record);
  persist();
  return record;
}

export function addIncident(incident) {
  const record = {
    id: uid(),
    dogId: 'lucy',
    completedByUserId: state.activeMemberId,
    occurredAt: new Date().toISOString(),
    ...incident,
  };
  state.incidents.unshift(record);
  persist();
  return record;
}

export const sessionsFor = (activityId) =>
  state.sessions.filter((s) => s.activityId === activityId);

// --- level selection -------------------------------------------------------

export function setLevel(activityId, levelNumber) {
  state.levelOverrides[activityId] = levelNumber;
  persist();
}

export const chosenLevel = (activityId) => state.levelOverrides[activityId];

// --- commands --------------------------------------------------------------

export function updateCommand(id, cue) {
  const command = state.commands.find((c) => c.id === id);
  if (command) {
    command.cue = cue;
    persist();
  }
}

export const cueFor = (id) => {
  const command = state.commands.find((c) => c.id === id);
  return command ? command.cue : '';
};

/** Map a seed cue like "Go to bed" onto whatever the household actually says. */
export function resolveCue(seedCue) {
  if (!seedCue) return seedCue;
  const seeded = DEFAULT_COMMANDS.find(
    (c) => c.cue.toLowerCase() === seedCue.toLowerCase()
  );
  return seeded ? cueFor(seeded.id) : seedCue;
}

export function setWeeklyGoal(n) {
  state.weeklyGoal = n;
  persist();
}

export function setNotes(text) {
  state.notes = text;
  persist();
}

// --- demo data -------------------------------------------------------------

export function clearAll() {
  state = emptyState();
  state.seeded = true; // do not re-seed after an explicit wipe
  persist();
}

export function resetToDemo() {
  state = emptyState();
  seedDemoSessions();
}

/**
 * Realistic practice history so Progress means something on first open.
 * Marked `demo: true` so it can be cleared from the Lucy tab.
 */
export function seedDemoSessions() {
  if (state.seeded) return;
  // Rest days and a double-practice day, so the charts look like real life.
  const plan = [
    // [daysAgo, hour, activityId, level, reps, successes, arousal, behaviors, assistance, member]
    [12, 18, 'dg-1', 1, 5, 2, 3, ['barked', 'looked_at_handler'], ['treat_lure'], 'adam'],
    [11, 19, 'dg-1', 1, 5, 3, 3, ['looked_at_handler', 'barked'], ['treat_lure'], 'fabiola'],
    [10, 18, 'dg-1', 1, 5, 5, 2, ['looked_at_handler', 'recovered_quickly'], ['none'], 'adam'],
    [8, 17, 'dg-1', 2, 5, 4, 2, ['looked_at_handler', 'four_paws_down'], ['verbal_cue'], 'adam'],
    [7, 19, 'dg-1', 2, 5, 5, 1, ['looked_at_handler', 'recovered_quickly'], ['none'], 'fabiola'],
    [5, 18, 'dg-2', 1, 5, 3, 2, ['went_to_place', 'broke_position'], ['leash_guidance'], 'adam'],
    [4, 9, 'dg-2', 1, 5, 4, 2, ['went_to_place', 'held_place'], ['verbal_cue'], 'adam'],
    [4, 19, 'dg-1', 3, 5, 4, 2, ['looked_at_handler'], ['verbal_cue'], 'fabiola'],
    [2, 18, 'dg-2', 2, 5, 4, 2, ['went_to_place', 'held_place', 'jumped'], ['verbal_cue'], 'adam'],
    [1, 18, 'dg-2', 2, 5, 5, 1, ['went_to_place', 'held_place', 'recovered_quickly'], ['none'], 'fabiola'],
  ];

  state.sessions = plan
    .map(([days, hour, activityId, level, reps, ok, arousal, behaviors, assistance, member]) => {
      const when = new Date();
      when.setDate(when.getDate() - days);
      when.setHours(hour, 15, 0, 0);
      return {
        id: uid(),
        dogId: 'lucy',
        activityId,
        levelNumber: level,
        startedAt: when.toISOString(),
        durationSeconds: 240 + level * 30,
        repetitions: reps,
        successfulRepetitions: ok,
        arousalLevel: arousal,
        recoverySeconds: arousal >= 3 ? 90 : 30,
        behaviorsObserved: behaviors,
        assistanceUsed: assistance,
        context: { location: 'home', trigger: 'imaginary_guest', distractionLevel: level },
        note: '',
        completedByUserId: member,
        demo: true,
      };
    })
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  const incidentWhen = new Date();
  incidentWhen.setDate(incidentWhen.getDate() - 3);
  incidentWhen.setHours(16, 40, 0, 0);
  state.incidents = [
    {
      id: uid(),
      dogId: 'lucy',
      occurredAt: incidentWhen.toISOString(),
      context: 'guest_arrived',
      responses: ['barked', 'jumped'],
      helpers: ['leash', 'treats'],
      recoveryBand: '30_60',
      note: 'Neighbor stopped by unannounced. She recovered once she was on her bed.',
      completedByUserId: 'adam',
      demo: true,
    },
  ];

  state.levelOverrides = { 'dg-1': 3, 'dg-2': 2 };
  state.seeded = true;
  persist();
}

export const hasDemoData = () =>
  state.sessions.some((s) => s.demo) || state.incidents.some((i) => i.demo);

export function clearDemoData() {
  state.sessions = state.sessions.filter((s) => !s.demo);
  state.incidents = state.incidents.filter((i) => !i.demo);
  persist();
}

// --- export ----------------------------------------------------------------

export function exportSummary() {
  const rows = [
    ['type', 'date', 'activity', 'level', 'reps', 'successful', 'arousal', 'behaviors', 'assistance', 'by', 'note'],
  ];
  state.sessions.forEach((s) => {
    const activity = ACTIVITIES.find((a) => a.id === s.activityId);
    rows.push([
      'session',
      s.startedAt.slice(0, 10),
      activity ? activity.title : s.activityId,
      s.levelNumber,
      s.repetitions,
      s.successfulRepetitions,
      s.arousalLevel,
      (s.behaviorsObserved || []).join(' '),
      (s.assistanceUsed || []).join(' '),
      s.completedByUserId,
      s.note || '',
    ]);
  });
  state.incidents.forEach((i) => {
    rows.push([
      'incident',
      i.occurredAt.slice(0, 10),
      i.context,
      '',
      '',
      '',
      '',
      (i.responses || []).join(' '),
      (i.helpers || []).join(' '),
      i.completedByUserId,
      i.note || '',
    ]);
  });
  return rows
    .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}
