// Local-first persistence. Everything lives in localStorage under one key so a
// future Supabase sync only has to replace this module's read/write functions.

import {
  ACTIVITIES,
  AROUSAL,
  ASSISTANCE,
  BEHAVIORS,
  DEFAULT_COMMANDS,
  INCIDENT_CONTEXTS,
  INCIDENT_HELPERS,
  INCIDENT_RESPONSES,
  RECOVERY_BANDS,
} from './content.js';
// Imported as defaults, not as truth. Who the dog and the household are is
// stored state now — see emptyState below — and config.js only supplies what a
// brand new install starts from. Nothing outside this module reads them.
import { DOG as DOG_DEFAULT, HANDLER as HANDLER_DEFAULT } from './config.js';

const KEY = 'lucy-learns/v1';

const emptyState = () => ({
  version: 1,
  commands: DEFAULT_COMMANDS.map((c) => ({ ...c })),

  /**
   * Who this install is about, and who is using it.
   *
   * These were module constants in config.js, which meant setting up the next
   * household was a developer editing a file. They are state now, written by
   * the welcome and editable afterwards, and config.js supplies the defaults
   * a fresh install begins with.
   *
   * Migration needs no code: load() spreads stored state over emptyState(), so
   * an install saved before this existed simply has no `dog` or `people` keys
   * and inherits these. The consequence worth knowing is the other direction —
   * once an install has run, editing config.js no longer changes it.
   *
   * `people` is an array with one entry rather than a single person, because
   * every session and moment already records `completedByUserId`. The plural
   * is the shape the data has always had; only the UI for it was missing.
   */
  dog: { ...DOG_DEFAULT },
  people: [{ id: HANDLER_DEFAULT.id, name: HANDLER_DEFAULT.fullName }],
  activePersonId: HANDLER_DEFAULT.id,
  sessions: [],
  incidents: [],
  levelOverrides: {}, // activityId -> level number chosen manually
  weeklyGoal: 5,
  seeded: false,
  // Has the household been through the welcome? Nothing is seeded until they
  // choose, so the app can be handed to someone genuinely empty.
  onboarded: false,
  notes: '',
});

let state = load();
const listeners = new Set();

/**
 * Whether the last write to localStorage actually landed. iOS Safari private
 * browsing and a full quota both throw here, and a session that silently fails
 * to save is worse than one that never got logged, so this is surfaced in the
 * UI rather than swallowed.
 */
let storageOk = true;
const storageListeners = new Set();

export const isStorageOk = () => storageOk;
export const onStorageChange = (fn) => {
  storageListeners.add(fn);
  return () => storageListeners.delete(fn);
};

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
  const wasOk = storageOk;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    storageOk = true;
  } catch {
    storageOk = false;
  }
  if (wasOk !== storageOk) storageListeners.forEach((fn) => fn(storageOk));
  listeners.forEach((fn) => fn(state));
  return storageOk;
}

export const getState = () => state;
export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// --- sessions --------------------------------------------------------------

export function addSession(session) {
  const record = {
    id: uid(),
    dogId: 'lucy',
    completedByUserId: state.activePersonId,
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
    completedByUserId: state.activePersonId,
    occurredAt: new Date().toISOString(),
    ...incident,
  };
  state.incidents.unshift(record);
  persist();
  return record;
}

export function updateSession(id, patch) {
  const index = state.sessions.findIndex((s) => s.id === id);
  if (index === -1) return null;
  state.sessions[index] = { ...state.sessions[index], ...patch };
  persist();
  return state.sessions[index];
}

/** Returns what was removed, so the caller can offer an undo. */
export function removeSession(id) {
  const index = state.sessions.findIndex((s) => s.id === id);
  if (index === -1) return null;
  const [removed] = state.sessions.splice(index, 1);
  persist();
  return { record: removed, index };
}

export function removeIncident(id) {
  const index = state.incidents.findIndex((i) => i.id === id);
  if (index === -1) return null;
  const [removed] = state.incidents.splice(index, 1);
  persist();
  return { record: removed, index };
}

export function restoreSession({ record, index }) {
  state.sessions.splice(index, 0, record);
  persist();
}

export function restoreIncident({ record, index }) {
  state.incidents.splice(index, 0, record);
  persist();
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

/**
 * Fill the dog-name token. The token only survives in an install that never
 * went through setup with a name — a demo seeded straight into state, say —
 * but it must never reach a screen, because "{dog}!" is not something anyone
 * would say to a dog.
 */
const fillToken = (cue) => String(cue || '').replace('{dog}', state.dog.name);

export const cueFor = (id) => {
  const command = state.commands.find((c) => c.id === id);
  return command ? fillToken(command.cue) : '';
};

/** Map a seed cue like "Go to bed" onto whatever the household actually says. */
export function resolveCue(seedCue) {
  if (!seedCue) return seedCue;
  const seeded = DEFAULT_COMMANDS.find(
    (c) =>
      c.cue.toLowerCase() === seedCue.toLowerCase() ||
      fillToken(c.cue).toLowerCase() === seedCue.toLowerCase()
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

// --- who this is ------------------------------------------------------------

/** The dog this install is about. */
export const getDog = () => state.dog;

/**
 * The person currently using the app.
 *
 * Falls back to the first person rather than returning undefined: a state with
 * an `activePersonId` pointing at somebody deleted is recoverable, and a
 * greeting that throws is not.
 */
export const getPerson = () =>
  state.people.find((p) => p.id === state.activePersonId) || state.people[0];

export function setDog(patch) {
  const before = state.dog.name;
  state.dog = { ...state.dog, ...patch };

  // The attention cue is the dog's name being called, so renaming the dog
  // renames it — unless the household has already written their own, in which
  // case theirs wins and nothing here touches it. Compared against the old
  // name rather than the token so this keeps working after the first rename.
  if (patch.name && patch.name !== before) {
    const attention = state.commands.find((c) => c.id === 'attention');
    if (attention && (attention.cue === '{dog}!' || attention.cue === `${before}!`)) {
      attention.cue = `${patch.name}!`;
    }
  }
  persist();
}

/** Everyone who practises with this dog, in the order they were added. */
export const getPeople = () => state.people;

/**
 * Rename the active person. One field — `name`, as they typed it.
 *
 * The greeting takes the first word and the avatar takes first-plus-last
 * initials, so "Fabiola Hickey" gives "Hello, Fabiola" over "FH" and "Fabiola"
 * gives "Hello, Fabiola" over "F". Storing one string and deriving both is
 * what stops a rename leaving stale initials behind.
 */
export function setPersonName(name) {
  const person = getPerson();
  if (!person) return;
  person.name = name;
  persist();
}

/**
 * Add somebody and hand the app to them.
 *
 * Switching on add is the whole point of the interaction: nobody adds a person
 * in the abstract, they add themselves because they are about to practise. An
 * add that left the previous person active would attribute the next session to
 * the wrong one, which is the single thing this feature exists to get right.
 */
export function addPerson(name) {
  const person = { id: uid(), name: name.trim() };
  state.people.push(person);
  state.activePersonId = person.id;
  persist();
  return person;
}

/**
 * Hand the app to somebody already on it.
 *
 * Only the attribution of what is logged from here on changes. The dog, the
 * sessions, the program position and the report stay the household's — this is
 * one dog several people practise with, not several accounts.
 */
export function setActivePerson(id) {
  if (!state.people.some((p) => p.id === id)) return;
  state.activePersonId = id;
  persist();
}

/**
 * Remove somebody, and never the last one.
 *
 * Their sessions stay, with their `completedByUserId` intact — deleting a
 * person is "they do not practise here any more", not "the practice did not
 * happen", and the report would be wrong if the history moved. `memberName`
 * handles the dangling id by name, so the CSV keeps saying who did it.
 */
export function removePerson(id) {
  if (state.people.length < 2) return false;
  const before = state.people.length;
  state.people = state.people.filter((p) => p.id !== id);
  if (state.people.length === before) return false;
  if (state.activePersonId === id) state.activePersonId = state.people[0].id;
  persist();
  return true;
}

// --- demo data -------------------------------------------------------------

export const isOnboarded = () => state.onboarded;

export function completeOnboarding() {
  state.onboarded = true;
  persist();
}

/**
 * Back to the very first launch: no sessions, no cue edits, welcome shown
 * again. This is what "let me show someone the app properly" needs.
 */
export function startFresh() {
  state = emptyState();
  persist();
}

/** Wipe the logs but keep the household set up and skip the welcome. */
export function clearAll() {
  const keep = { commands: state.commands };
  state = { ...emptyState(), ...keep, onboarded: true, seeded: true };
  persist();
}

/**
 * Realistic practice history so Progress means something on first open.
 * Marked `demo: true` so it can be cleared from the Lucy tab.
 */
export function seedDemoSessions({ force = false } = {}) {
  if (state.seeded && !force) return;
  // Twelve days across three of the four activities.
  //
  // Every row used to be dg-1, correctly, because it was the only activity in
  // the app. All four are open now, and a demo that only ever practices the
  // first one shows a household permanently stuck on it — the map stays empty,
  // no activity is ever finished, and nothing downstream of "you cleared one"
  // is reachable. This walks the arc instead: the first activity finished, the
  // second underway, the third just started.
  //
  // Rest days and a double-practice day, so the charts look like real life,
  // and early sessions that went badly, so progress reads as earned.
  const plan = [
    // [daysAgo, hour, activityId, level, reps, successes, arousal, behaviors, assistance]
    [12, 18, 'dg-1', 1, 5, 2, 3, ['barked', 'looked_at_handler'], ['treat_lure']],
    [11, 19, 'dg-1', 1, 5, 3, 3, ['looked_at_handler', 'barked'], ['treat_lure']],
    [10, 18, 'dg-1', 2, 5, 5, 2, ['looked_at_handler', 'recovered_quickly'], ['none']],
    [9, 17, 'dg-1', 3, 5, 4, 2, ['looked_at_handler', 'four_paws_down'], ['verbal_cue']],
    [8, 19, 'dg-1', 4, 5, 5, 1, ['looked_at_handler', 'recovered_quickly'], ['none']],
    [7, 18, 'dg-1', 5, 5, 3, 3, ['looked_at_handler', 'barked'], ['reduced_distance']],
    [6, 9, 'dg-1', 5, 5, 5, 2, ['looked_at_handler', 'recovered_quickly'], ['none']],
    [5, 19, 'dg-2', 1, 4, 2, 3, ['jumped', 'looked_at_handler'], ['treat_lure']],
    [4, 18, 'dg-2', 1, 4, 4, 2, ['looked_at_handler', 'four_paws_down'], ['none']],
    [3, 18, 'dg-2', 2, 4, 3, 2, ['looked_at_handler'], ['verbal_cue']],
    [2, 19, 'dg-2', 3, 4, 4, 2, ['looked_at_handler', 'recovered_quickly'], ['none']],
    [1, 18, 'dg-3', 1, 5, 3, 2, ['looked_at_handler', 'jumped'], ['treat_lure']],
  ];

  state.sessions = plan
    .map(([days, hour, activityId, level, reps, ok, arousal, behaviors, assistance]) => {
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
        completedByUserId: state.activePersonId,
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
      completedByUserId: state.activePersonId,
      demo: true,
    },
  ];

  state.levelOverrides = { 'dg-1': 4 };
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

const labelFrom = (list, id) => {
  const found = list.find((item) => item.id === id);
  return found ? found.label : id;
};

/**
 * Who did this row, by the id stored on it.
 *
 * This used to ignore its argument and return the active person for every
 * row. With one person on the install that was indistinguishable from correct,
 * and it stayed that way right up until the app could switch people — at which
 * point the trainer's CSV would have credited the whole history to whoever
 * happened to be holding the phone when it was exported. The bug was written
 * long before the feature that exposes it, which is the usual order.
 *
 * The fallback is for a person who has since been removed: their sessions keep
 * their id and no longer resolve. "Someone else" is honest — the app genuinely
 * no longer knows — and it is better than a blank cell, which reads as a
 * logging failure rather than a deletion.
 */
const memberName = (id) => {
  const person = state.people.find((p) => p.id === id);
  if (person) return person.name;
  return id ? 'Someone else' : getPerson()?.name || '';
};

const prettyDate = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const csvRow = (cells) =>
  cells.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',');

/**
 * A report a trainer can read, not a database dump. Raw enum ids never leave
 * the app: every code is resolved to the same wording shown on screen.
 */
export function exportSummary() {
  const sessions = [...state.sessions].sort((a, b) =>
    a.startedAt.localeCompare(b.startedAt)
  );
  const incidents = [...state.incidents].sort((a, b) =>
    a.occurredAt.localeCompare(b.occurredAt)
  );

  const stamps = [
    ...sessions.map((s) => s.startedAt),
    ...incidents.map((i) => i.occurredAt),
  ].sort();

  const totalReps = sessions.reduce((n, s) => n + (s.repetitions || 0), 0);
  const goodReps = sessions.reduce((n, s) => n + (s.successfulRepetitions || 0), 0);

  const lines = [
    csvRow([`${getDog().name} — training log`]),
    csvRow([getDog().breed || '']),
    csvRow([
      'Range',
      stamps.length ? `${prettyDate(stamps[0])} to ${prettyDate(stamps[stamps.length - 1])}` : 'No entries yet',
    ]),
    csvRow(['Practice sessions', sessions.length]),
    csvRow(['Real-life moments', incidents.length]),
    csvRow([
      'Overall success',
      totalReps ? `${Math.round((goodReps / totalReps) * 100)}% (${goodReps} of ${totalReps} repetitions)` : 'n/a',
    ]),
    csvRow(['Exported', prettyDate(new Date().toISOString())]),
    '',
    csvRow([
      'Type',
      'When',
      'Activity or situation',
      'Level',
      'Repetitions',
      'Went well',
      'Arousal',
      'What happened',
      'Help given',
      'Time to settle',
      'Practiced by',
      'Note',
    ]),
  ];

  sessions.forEach((s) => {
    const activity = ACTIVITIES.find((a) => a.id === s.activityId);
    const level = activity && activity.levels.find((l) => l.number === s.levelNumber);
    const arousal = AROUSAL.find((a) => a.value === s.arousalLevel);
    lines.push(
      csvRow([
        'Practice',
        prettyDate(s.startedAt),
        activity ? activity.title : s.activityId,
        level ? `${level.number} — ${level.title}` : s.levelNumber,
        s.repetitions,
        s.successfulRepetitions,
        arousal ? arousal.label : s.arousalLevel,
        (s.behaviorsObserved || []).map((id) => labelFrom(BEHAVIORS, id)).join('; '),
        (s.assistanceUsed || []).map((id) => labelFrom(ASSISTANCE, id)).join('; '),
        s.recoverySeconds == null ? '' : `${s.recoverySeconds}s`,
        memberName(s.completedByUserId),
        s.note || '',
      ])
    );
  });

  incidents.forEach((i) => {
    lines.push(
      csvRow([
        'Real life',
        prettyDate(i.occurredAt),
        labelFrom(INCIDENT_CONTEXTS, i.context),
        '',
        '',
        '',
        '',
        (i.responses || []).map((id) => labelFrom(INCIDENT_RESPONSES, id)).join('; '),
        (i.helpers || []).map((id) => labelFrom(INCIDENT_HELPERS, id)).join('; '),
        labelFrom(RECOVERY_BANDS, i.recoveryBand),
        memberName(i.completedByUserId),
        i.note || '',
      ])
    );
  });

  return lines.join('\n');
}
