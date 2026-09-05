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
  people: [{ id: HANDLER_DEFAULT.id, name: HANDLER_DEFAULT.fullName, avatar: 'handler' }],
  activePersonId: HANDLER_DEFAULT.id,
  sessions: [],
  incidents: [],
  levelOverrides: {}, // activityId -> level number chosen manually
  weeklyGoal: 5,
  /**
   * How many repetitions a session aims for, 1 to 5.
   *
   * A cap rather than a replacement. Every level in the program carries its
   * own `reps` — the number The Canine Coach asks for there, 4 or 5 — and this
   * lowers it without ever raising it above what the program wanted. At 5 the
   * levels keep their own numbers; at 3, which is the default, everything
   * shortens to 3.
   *
   * It defaults below every level's own count on purpose. A session that ends
   * while the dog is still going well is the one worth having, and the number
   * on the screen is what most households will actually stop at.
   */
  repsPerSession: 3,
  seeded: false,
  // Has the household been through the welcome? Nothing is seeded until they
  // choose, so the app can be handed to someone genuinely empty.
  onboarded: false,
  // One-time hints already shown, by id. A set of ids rather than a flag per
  // hint so adding the next one needs no migration: an install saved before a
  // hint existed simply does not list it, and sees it once.
  hintsSeen: [],
  /** Reading the steps aloud, off until asked for. */
  voice: { speak: false, voiceURI: '' },
  /**
   * The steps turning by themselves, off until asked for.
   *
   * `seconds` is how long each step stays up before the next one comes. It
   * is one number for every step rather than one per step, because the
   * household changes it mid-session from the step screen — the same number
   * this stores — and a value that is easy to nudge beats a table of guesses
   * that would be wrong for their dog anyway.
   */
  pace: { auto: false, seconds: 10 },
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
    return migrate({ ...emptyState(), ...JSON.parse(raw) });
  } catch {
    return emptyState();
  }
}

/**
 * Bring a stored state up to date with the files that actually exist.
 *
 * The dog portraits are saved by path, so a change of format orphans every
 * install that had already picked one: the file they point at is no longer in
 * the build and the profile shows a broken image where their dog had been. A
 * default in config.js only ever reaches a fresh install; anybody who has used
 * the app has their own copy of that string.
 *
 * This has now happened twice, in both directions. The placeholders were PNG;
 * the painted set that replaced them was JPEG, and this rewrote .png to .jpg.
 * The redrawn flat set is PNG again — hard edges on flat fields are the one
 * thing JPEG handles worst — so the rewrite runs the other way now, and the
 * old direction is gone rather than kept: a stored `.png` is once again a file
 * that exists, and re-pointing it at a `.jpg` would break the very installs
 * the old rule was written to save.
 *
 * Rewriting the extension is enough because the numbering never changed:
 * dog-01 has been the black Labrador throughout. Anything unrecognised is left
 * exactly as it is rather than reset to the default, since a path this code
 * does not know is more likely to be something later than something broken.
 */
function migrate(next) {
  const photo = next.dog && next.dog.photo;
  if (typeof photo === 'string' && /^img\/avatars\/dog-\d+\.jpg$/.test(photo)) {
    next.dog = { ...next.dog, photo: photo.replace(/\.jpg$/, '.png') };
  }
  // Lucy's own portrait is gone from the build: the redrawn dog-01 is the same
  // dog, drawn in the palette the rest of the app now uses, so keeping a second
  // black Labrador beside it was one picture to maintain for no difference on
  // screen. Her install is the only one that stores this path, and it stores it
  // from setup — without this line she is the one household the deletion breaks.
  if (next.dog && next.dog.photo === 'img/lucy-portrait.jpg') {
    next.dog = { ...next.dog, photo: 'img/avatars/dog-01.png' };
  }
  // People predate having a portrait. Everyone without one gets the handler
  // from the illustrations, which is the same answer a fresh install gives.
  if (Array.isArray(next.people)) {
    next.people = next.people.map((p) => (p && p.avatar ? p : { ...p, avatar: 'handler' }));
  }
  // Listening for spoken commands is gone. An install that had it on keeps
  // the flag in storage forever otherwise, and a flag nothing reads is the
  // kind of thing that gets read again by accident two refactors later.
  if (next.voice && 'listen' in next.voice) {
    const { listen: _dropped, ...voice } = next.voice;
    next.voice = voice;
  }
  return next;
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
 * The three pronoun forms the content needs, by the household's answer.
 *
 * `{she}` is the subject, `{her}` the object ("reward her"), `{their}` the
 * possessive determiner ("her bed"). The possessive is named after the
 * they-form on purpose: "{her} bed" and "{her} eye" would read fine in the
 * source and then come out as "him bed" for a male dog, and a token that
 * reads wrong in the source is one nobody types by mistake.
 *
 * Verbs are not tokenised. "{she} is" comes out as "they is", so any sentence
 * that conjugates after the pronoun is written around the name instead —
 * "after {dog} lands", not "after {she} lands".
 */
const PRONOUNS = {
  she: { she: 'she', her: 'her', their: 'her' },
  he: { she: 'he', her: 'him', their: 'his' },
  they: { she: 'they', her: 'them', their: 'their' },
};
export const PRONOUN_CHOICES = [
  { id: 'she', label: 'She' },
  { id: 'he', label: 'He' },
  { id: 'they', label: 'They' },
];

const TOKEN = /\{(dog|she|her|their|She|Her|Their)\}/g;

/**
 * Fill the dog tokens — `{dog}` and the pronoun forms above — in one string.
 *
 * Applied by the html`` tag in js/ui.js to every interpolated string, so a
 * content string only has to carry the token and every screen that shows it
 * gets the household's own dog. Before this, twenty-nine sentences in
 * content.js said "Lucy" outright: the first step of the first session read
 * "Stand near the door with Lucy on leash" directly above a button reading
 * "Biscuit is too excited", on an install that had just been asked the dog's
 * name. A capitalised token capitalises its answer, for sentence starts.
 *
 * The cue case is the one that must never fail: "{dog}!" is not something
 * anyone would say to a dog, and a demo seeded straight into state can carry
 * it. An install with no stored pronoun — one from before the field existed —
 * reads as "she", which is what every sentence said until then.
 */
export function fillDog(text) {
  const forms = PRONOUNS[state.dog.pronoun] || PRONOUNS.she;
  return String(text ?? '').replace(TOKEN, (_, key) => {
    const lower = key.toLowerCase();
    const word = lower === 'dog' ? state.dog.name : forms[lower];
    return key === lower ? word : word[0].toUpperCase() + word.slice(1);
  });
}

const fillToken = fillDog;

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

/** Clamped on read as well as write: a bad stored value cannot break a session. */
const clampReps = (n) => Math.min(5, Math.max(1, Math.round(Number(n) || 0) || 3));

export const getRepsPerSession = () => clampReps(state.repsPerSession);

export function setRepsPerSession(n) {
  state.repsPerSession = clampReps(n);
  persist();
}

/**
 * How many reps this level should aim for, once the household's setting is
 * applied. The one place the two numbers meet, so nothing has to remember
 * which of them wins.
 */
export const repTarget = (level) => Math.min(level && level.reps ? level.reps : 5, getRepsPerSession());

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

/** Everyone who practices with this dog, in the order they were added. */
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
 * Rename anybody, not only whoever is holding the phone.
 *
 * The active-person-only version was the obvious one and the wrong one: the
 * typo people actually want to fix is usually in somebody *else's* name, put
 * in by whoever set the app up. Restricting it to the active person would have
 * meant switching to the misspelt person to correct them — which changes who
 * the next session is logged under, so fixing a spelling would quietly move
 * attribution. An id costs nothing and avoids that entirely.
 */
/** Give the active person a portrait. */
export function setPersonAvatar(avatarId) {
  setPersonAvatarFor(state.activePersonId, avatarId);
}

/**
 * Give anybody a portrait, by id.
 *
 * Needed because the switcher lists everyone and their pictures are the
 * fastest way to tell them apart, which makes it the natural place to change
 * one — including for somebody who is not the person currently logging.
 */
export function setPersonAvatarFor(id, avatarId) {
  const person = state.people.find((p) => p.id === id);
  if (!person) return;
  person.avatar = avatarId;
  persist();
}

export function renamePerson(id, name) {
  const person = state.people.find((p) => p.id === id);
  if (!person) return false;
  const trimmed = name.trim();
  if (!trimmed) return false;
  person.name = trimmed;
  persist();
  return true;
}

/**
 * Add somebody and hand the app to them.
 *
 * Switching on add is the whole point of the interaction: nobody adds a person
 * in the abstract, they add themselves because they are about to practice. An
 * add that left the previous person active would attribute the next session to
 * the wrong one, which is the single thing this feature exists to get right.
 */
export function addPerson(name) {
  const person = { id: uid(), name: name.trim(), avatar: 'handler' };
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
 * one dog several people practice with, not several accounts.
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
 * person is "they do not practice here any more", not "the practice did not
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

/** Read-aloud preferences. Defaulted here so installs saved before it exist. */
export const getVoice = () => ({
  speak: false,
  voiceURI: '',
  ...(state.voice || {}),
});

export function setVoice(patch) {
  state.voice = { ...getVoice(), ...patch };
  persist();
}

/**
 * The seconds a step may stay up for, in the order the stepper walks them.
 *
 * A ladder rather than a linear step. Five seconds is "ring or knock once";
 * ninety is a stay that is meant to be long. Walking that range five seconds
 * at a time takes seventeen taps, and the taps happen with a dog waiting, so
 * the rungs widen as they climb — each is a different length of step, not a
 * different decimal.
 */
export const PACE_LADDER = [5, 8, 10, 15, 20, 30, 45, 60, 90];

/** The nearest rung to any number, so a stored value is always one of them. */
const snapPace = (n) => {
  const value = Number(n);
  if (!Number.isFinite(value)) return 5;
  return PACE_LADDER.reduce((best, rung) =>
    Math.abs(rung - value) < Math.abs(best - value) ? rung : best
  );
};

/**
 * Step-timer preferences. Defaulted here so installs saved before it exist.
 *
 * Five seconds to start, the bottom rung. The first number somebody sees is
 * the one they judge the feature by, and ten felt like the phone had
 * stopped: a step read aloud in two seconds then sat for eight. Five is
 * short enough to be obviously a timer, and the plus is right beside it.
 */
export const getPace = () => {
  const stored = state.pace || {};
  return { auto: Boolean(stored.auto), seconds: snapPace(stored.seconds ?? 5) };
};

export function setPace(patch) {
  state.pace = { ...getPace(), ...patch };
  state.pace.seconds = snapPace(state.pace.seconds);
  persist();
}

/**
 * One rung up or down. Returns the new value, and stays put at either end
 * rather than wrapping — a stepper that jumps from ninety to five is a
 * stepper that just cost somebody a rep.
 */
export function stepPace(direction) {
  const { seconds } = getPace();
  const at = PACE_LADDER.indexOf(seconds);
  const next = PACE_LADDER[Math.min(Math.max(at + Math.sign(direction), 0), PACE_LADDER.length - 1)];
  if (next !== seconds) setPace({ seconds: next });
  return next;
}

/** Whether a one-time hint has already had its turn. */
export const hintSeen = (id) => (state.hintsSeen || []).includes(id);

/** Spend a one-time hint. Idempotent, so callers need not check first. */
export function markHintSeen(id) {
  if (!state.hintsSeen) state.hintsSeen = [];
  if (state.hintsSeen.includes(id)) return;
  state.hintsSeen.push(id);
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
