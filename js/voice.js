// Hands-free practice. Two halves, deliberately separate, because they cost
// completely different things.
//
// Speaking is cheap: it runs on the device, needs no permission, and works
// with the phone in a pocket and no signal. Listening is dear: both Chrome
// and Safari ship the audio to a server, so it needs a network the rest of
// this app does not, and it needs a microphone permission that an installed
// PWA does not always survive. One switch for both would have made the
// reliable half hostage to the fragile one.
//
// The reason any of this exists: practice happens with a leash in one hand
// and a treat pouch in the other. Tapping is the thing there is no hand for.

import { getState, getVoice, setVoice } from './store.js';

// ---------------------------------------------------------------------------
// Speaking
// ---------------------------------------------------------------------------

const synth = typeof speechSynthesis !== 'undefined' ? speechSynthesis : null;

export const canSpeak = () => Boolean(synth);

/**
 * Not eligible at all, as opposed to eligible and poor.
 *
 * These have to be different things, and conflating them is what dropped
 * three of an iPhone's six English voices. Quality is expressed as a penalty,
 * so a rough voice scores below zero — and while "ineligible" was also
 * spelled as a negative number, a filter for usable voices could not tell
 * "wrong language" from "the only build of Karen this phone has".
 */
const INELIGIBLE = -Infinity;

/**
 * Apple ships a set of joke voices — a robot, a set of bells, one that sings.
 * They are real voices by every flag the API exposes, so nothing but their
 * names distinguishes them, and a list opening with "Bad News" and "Bahh"
 * reads as a bug rather than a choice. The names have been stable across a
 * decade of releases, which is what makes a list like this worth keeping.
 *
 * Declared up here because the automatic pick runs when this module loads and
 * consults it.
 */
const NOVELTY = new Set(
  [
    'Albert', 'Bad News', 'Bahh', 'Bells', 'Boing', 'Bubbles', 'Cellos',
    'Deranged', 'Good News', 'Hysterical', 'Jester', 'Junior', 'Kathy',
    'Organ', 'Pipe Organ', 'Princess', 'Ralph', 'Superstar', 'Trinoids',
    'Whisper', 'Wobble', 'Zarvox', 'Bruce', 'Fred',
  ].map((n) => n.toLowerCase())
);

const isNovelty = (voice) => NOVELTY.has(String(voice.name || '').trim().toLowerCase());

/** How many to offer. Enough to have a real choice, few enough to scan. */
const VOICE_LIMIT = 12;

/**
 * Quality, as far as it can be read off a name and an id.
 *
 * iOS spells its tier into the voice id — com.apple.voice.super-compact.
 * en-GB.Daniel is the smallest, roughest build of Daniel there is. Ranking
 * these rather than refusing them is the entire trick: an earlier version
 * disqualified anything matching "compact", which on an iPhone disqualifies
 * every voice on the device, emptied the list, and fell through to offering
 * Italian and Hebrew voices for reading English dog training instructions.
 *
 * A rough voice is still a voice. The bad tiers sort to the bottom instead
 * of taking the list down with them.
 */
const VOICE_HINTS = [
  [/siri/i, 100], // iOS, by some distance the best thing available
  [/premium|enhanced|neural|natural|wavenet|studio/i, 60],
  [/google/i, 25], // Android's better set
  [/super-compact/i, -30], // smallest and roughest
  [/(?<!super-)compact/i, -12],
];

/**
 * Locales are not written the same way everywhere. `en_US` with an underscore
 * turns up on Android engines and in some WebKit builds, and comparing it
 * against `en-US` character by character says they are different languages —
 * which quietly rejected every voice on the device and left a picker with
 * nothing in it while speech carried on working on the engine's default.
 */
const normLang = (value) => String(value || '').replace(/_/g, '-').toLowerCase();

/**
 * Rank one voice for reading this app's instructions.
 *
 * Returns INELIGIBLE for anything that must never be used, and otherwise a
 * number that may well be negative — a penalised tier is still a candidate.
 *
 * Nothing in here trusts a voice to be well formed. `getVoices()` is a list
 * handed over by the platform, and platforms vary: a voice with no `lang`, or
 * no `name`, is rare but real, and calling `.split` on it throws — inside a
 * render, which replaces a training session with an error page. So every
 * field is coerced before it is used.
 */
function scoreVoice(voice, lang) {
  if (!voice) return INELIGIBLE;
  const name = `${voice.name || ''} ${voice.voiceURI || ''}`;
  const voiceLang = normLang(voice.lang);
  const wanted = normLang(lang) || 'en-us';
  // A voice that will not say what language it speaks cannot be ranked
  // against one that does.
  if (!voiceLang) return INELIGIBLE;
  // Eloquence is a speech-synthesis relic that reads like a modem. Compact
  // is merely poor, and is penalised in VOICE_HINTS rather than refused,
  // because on iOS it is all there is.
  if (/eloquence/i.test(name)) return INELIGIBLE;
  // And a joke voice is never the answer. This was only filtering the picker,
  // not the automatic choice, so an iPhone whose list happens to put Albert
  // before Samantha had its training steps read by a comedy robot — the
  // "really bad voice" that started all this.
  if (isNovelty(voice)) return INELIGIBLE;

  let score = 0;
  VOICE_HINTS.forEach(([pattern, points]) => {
    if (pattern.test(name)) score += points;
  });
  // An exact locale beats the bare language, which beats nothing.
  if (voiceLang === wanted) score += 20;
  else if (voiceLang.split('-')[0] === wanted.split('-')[0]) score += 10;
  else return INELIGIBLE;
  // On-device voices do not stall on a bad connection at the door.
  if (voice.localService) score += 5;
  if (voice.default) score += 1;
  return score;
}

let chosenVoice = null;

/**
 * `getVoices()` is empty on the first call in most browsers and fills in
 * later, so this re-picks whenever the list changes rather than caching a
 * decision made too early.
 */
function pickVoice() {
  try {
    return choosePreferredOrBest();
  } catch {
    chosenVoice = null;
    return null;
  }
}

function choosePreferredOrBest() {
  if (!synth) return null;
  const voices = synth.getVoices();
  if (!voices || !voices.length) return null;

  // A chosen voice outranks a scored one. Guessing well is worth doing, but
  // the guess is made against names and flags that vary by platform and
  // version, and a household that has heard all of them knows better than the
  // scoring does. Falls through if the saved voice is gone — an engine swap,
  // or a phone the install moved to.
  const lang = navigator.language || 'en-US';

  const preferred = getVoice().voiceURI;
  if (preferred) {
    const match = voices.find((v) => v && v.voiceURI === preferred);
    if (match) {
      // Honour the name, not the build. iOS ships several tiers of the same
      // voice under one name — Daniel exists as compact and as super-compact
      // — and the picker only ever showed one "Daniel", so that is what was
      // chosen. Saving whichever id happened to be first then locked in the
      // roughest build of a voice somebody picked for how it sounds. Where a
      // better cut of the same voice is on the device, it wins.
      const better = voices
        .filter(
          (v) =>
            v &&
            String(v.name || '') === String(match.name || '') &&
            normLang(v.lang) === normLang(match.lang)
        )
        .sort((a, b) => scoreVoice(b, lang) - scoreVoice(a, lang))[0];
      chosenVoice = better && scoreVoice(better, lang) > scoreVoice(match, lang) ? better : match;
      return chosenVoice;
    }
  }

  let best = null;
  voices.filter(Boolean).forEach((voice) => {
    const score = scoreVoice(voice, lang);
    if (Number.isFinite(score) && (!best || score > best.score)) best = { voice, score };
  });
  chosenVoice = best ? best.voice : null;
  return chosenVoice;
}

/**
 * The voices worth offering, best first.
 *
 * Filtered to the reading language, because the rest would read English
 * instructions with the wrong phonology, then to the ones meant for reading
 * prose, then cut to a list somebody can actually look through. Sorted by the
 * same score used to guess, so the likeliest good ones are at the top rather
 * than wherever the engine happened to put them.
 *
 * The voice in use is always included, even when it would have been cut. A
 * picker that cannot show the current selection is worse than a long one: it
 * silently reads as though something else were chosen.
 */
export function listVoices() {
  try {
    return buildVoiceList();
  } catch {
    // A picker that cannot be built is a missing dropdown. A picker that
    // throws is an error page over a training session.
    return [];
  }
}

function buildVoiceList() {
  if (!synth) return [];
  const voices = synth.getVoices() || [];
  const lang = navigator.language || 'en-US';

  const ranked = voices
    // A hole in the list should cost that entry, not every entry after it.
    .filter(Boolean)
    .map((voice) => ({
      voice,
      score: scoreVoice(voice, lang),
      // Apple names several voices "Eddy (English (United States))", which in
      // a list already filtered to English is the same word three times.
      base: String(voice.name || '')
        .replace(/\s*\((?:English|Language)[^)]*(?:\([^)]*\))?\)\s*$/i, '')
        .trim(),
    }))
    .filter((v) => Number.isFinite(v.score) && v.base)
    .sort((a, b) => b.score - a.score);

  // One entry per name and locale, best first.
  //
  // Android is the reason this exists rather than a plain cut: Google's
  // engine exposes several voices sharing one name — half a dozen "English
  // United States" differing only by an opaque id — and a dropdown listing
  // the same words six times is not a choice, it is a puzzle. Keeping the
  // best-scoring of each collapses them without hiding anything a person
  // could have told apart anyway.
  // If every voice on the device failed the filters, offer them anyway.
  //
  // The filters exist to put a good short list in front of somebody, and a
  // list of none is not a shorter list, it is a missing control — with no way
  // for the person holding the phone to tell whether the feature is broken or
  // the app simply forgot it. Whatever unexpected shape this platform reports
  // its voices in, the names still read fine in a dropdown.
  const named = voices.filter((v) => v && String(v.name || '').trim() && !isNovelty(v));
  const sameTongue = named.filter(
    (v) => normLang(v.lang).split('-')[0] === normLang(lang).split('-')[0]
  );
  // Language first, always. The fallback exists so the picker is never empty,
  // not so it can offer a Swedish voice to read English — which is what
  // happened when it reached past the language filter for anything at all.
  const usable = ranked.length
    ? ranked
    : (sameTongue.length ? sameTongue : named).map((voice) => ({
        voice,
        score: 0,
        base: String(voice.name).trim(),
      }));

  const byName = new Map();
  usable.forEach((v) => {
    const key = `${v.base.toLowerCase()}|${normLang(v.voice.lang)}`;
    if (!byName.has(key)) byName.set(key, v);
  });
  const unique = [...byName.values()];

  const shortlist = unique.slice(0, VOICE_LIMIT);
  const activeUri = chosenVoice ? chosenVoice.voiceURI : '';
  if (activeUri && !shortlist.some((v) => v.voice.voiceURI === activeUri)) {
    const active = unique.find((v) => v.voice.voiceURI === activeUri);
    if (active) shortlist.unshift(active);
  }

  // The region only earns a mention when two survivors would otherwise read
  // identically — "Eddy" twice tells you nothing, "Eddy" and "Eddy (GB)" does.
  const counts = new Map();
  shortlist.forEach((v) => counts.set(v.base, (counts.get(v.base) || 0) + 1));

  return shortlist.map((v) => {
    const vLang = normLang(v.voice.lang);
    return {
      uri: v.voice.voiceURI || '',
      lang: vLang,
      name:
        counts.get(v.base) > 1 && vLang.includes('-')
          ? `${v.base} (${vLang.split('-')[1].toUpperCase()})`
          : v.base,
    };
  });
}

/** Choose a voice by hand. Empty string hands the decision back to scoring. */
export function setPreferredVoice(uri) {
  setVoice({ voiceURI: uri || '' });
  chosenVoice = null;
  return pickVoice();
}

/**
 * Told when the voice list first has anything in it.
 *
 * `getVoices()` answers empty on the first call almost everywhere, and on iOS
 * it can stay empty until something has actually been spoken. A screen that
 * renders a voice picker from that first empty answer renders no picker at
 * all and never reconsiders — which is precisely why the dropdown was
 * missing on the phone while the app was perfectly able to name the voice it
 * was using a moment later.
 */
const voicesReady = new Set();
export function onVoicesReady(fn) {
  if (synth && (synth.getVoices() || []).length) {
    fn();
    return () => {};
  }
  voicesReady.add(fn);
  return () => voicesReady.delete(fn);
}

function announceVoices() {
  if (!synth || !(synth.getVoices() || []).length) return;
  const waiting = [...voicesReady];
  voicesReady.clear();
  waiting.forEach((fn) => fn());
}

if (synth) {
  pickVoice();
  // Fires once the list is populated, and again if the user installs a voice.
  synth.addEventListener?.('voiceschanged', () => {
    pickVoice();
    announceVoices();
  });
}

/**
 * The chosen voice, re-picked if it no longer exists.
 *
 * Android lets the text-to-speech engine be swapped in system settings, and
 * an engine change empties and refills the list underneath us. Holding the
 * old object across that hands the engine a voice it has never heard of,
 * which does not throw — it just says nothing, which is the worst way for
 * this to fail. Compared by `voiceURI` rather than identity because several
 * browsers build fresh objects on every `getVoices()` call.
 *
 * An empty list is treated as the transient state it usually is: the first
 * call before the engine has answered. Re-picking there would throw away a
 * good choice for a moment of silence.
 */
function resolveVoice() {
  try {
    if (!synth) return null;
    const voices = synth.getVoices();
    if (!voices || !voices.length) return chosenVoice;
    if (chosenVoice && voices.some((v) => v && v.voiceURI === chosenVoice.voiceURI)) {
      return chosenVoice;
    }
    return pickVoice();
  } catch {
    return null;
  }
}

/** The voice being used, so a screen can say which one rather than guess. */
export const currentVoiceName = () => {
  const voice = resolveVoice();
  return voice ? voice.name : null;
};

/** Same, as an id, so a picker can show which entry is the live one. */
export const currentVoiceURI = () => {
  const voice = resolveVoice();
  return voice ? voice.voiceURI : '';
};

/**
 * Say one short thing, dropping whatever was still being said.
 *
 * Cancel-then-speak rather than queue: these are step instructions, and a
 * queue would have the phone still reading step two while the handler is
 * looking at step four. The newest instruction is the only true one.
 *
 * Never give this a cue. The cues are words the dog has been trained on, and
 * a phone that says "Lucy!" out loud has just cued the dog itself — from the
 * wrong place, in the wrong voice, at a moment nobody chose. Cues are for the
 * handler to say; this reads the instruction around them.
 */
/**
 * What became of the last thing we tried to say.
 *
 * Speech failing on iOS is silent in both senses: no sound, and no error
 * either — the utterance is simply never started. That leaves a screen that
 * looks identical whether the feature is working or dead, which is
 * undebuggable on a phone that is not on this desk. So the lifecycle is
 * recorded and a screen can show it.
 */
let lastSpeech = { text: '', state: 'idle', error: null };
let currentUtterance = null;
const speechListeners = new Set();

export const speechStatus = () => ({ ...lastSpeech });
export function onSpeechChange(fn) {
  speechListeners.add(fn);
  return () => speechListeners.delete(fn);
}
function setSpeech(patch) {
  lastSpeech = { ...lastSpeech, ...patch };
  speechListeners.forEach((fn) => fn(speechStatus()));
}

export function speak(text) {
  if (!synth || !text) {
    setSpeech({ text: String(text || ''), state: 'unsupported', error: null });
    return;
  }
  try {
    const utterance = new SpeechSynthesisUtterance(String(text));
    // Guarded on its own, because choosing a voice is an improvement and
    // saying the sentence is the job. A voice the engine rejects throws here,
    // and swallowing that with the rest would trade a slightly worse voice
    // for total silence — the one failure nobody would be able to diagnose.
    try {
      const voice = resolveVoice() || pickVoice();
      if (voice) {
        utterance.voice = voice;
        // Safari reads `lang` rather than the voice's own in some versions,
        // and a mismatch is what turns an English sentence into phonetic mush.
        utterance.lang = voice.lang;
      }
    } catch {
      chosenVoice = null; // fall back to the engine's default, and re-pick later
    }
    // A touch under natural pace. These are instructions being followed with
    // a dog, not prose being listened to, and the hurried default reads the
    // step out before the handler has looked up from the leash.
    utterance.rate = 0.95;
    utterance.pitch = 1;
    // Some engines start muted if volume is left unset after a cancel.
    utterance.volume = 1;

    setSpeech({ text: String(text), state: 'queued', error: null });
    // Only the newest utterance may write the status. Replacing one fires
    // `interrupted` on the old after the new is already queued, and letting
    // that land marks a perfectly good utterance as failed — in the one place
    // whose whole job is to be believed about whether speech is working.
    currentUtterance = utterance;
    const mine = (fn) => (e) => {
      if (utterance !== currentUtterance) return;
      fn(e);
    };
    utterance.onstart = mine(() => setSpeech({ state: 'speaking' }));
    utterance.onend = mine(() => setSpeech({ state: 'done' }));
    utterance.onerror = mine((e) =>
      setSpeech({ state: 'error', error: (e && e.error) || 'unknown' })
    );

    const wasSpeaking = synth.speaking || synth.pending;
    if (wasSpeaking) {
      synth.cancel();
      // Safari on iOS drops an utterance queued in the same tick as a cancel:
      // the cancel lands on the new one instead of the old. A turn of the
      // event loop is the whole fix, and it only costs anything in the case
      // where something was actually being said.
      setTimeout(() => {
        try {
          synth.speak(utterance);
        } catch {
          /* gone */
        }
      }, 60);
    } else {
      // No cancel on this path, deliberately. Calling cancel() before the
      // engine has ever spoken leaves iOS Safari's synthesizer wedged, and
      // every utterance after it is silent — which is exactly what a first
      // run looks like, because the first utterance is always this path.
      synth.speak(utterance);
    }

    // Speaking is what wakes the voice list on iOS, and `voiceschanged` is
    // not guaranteed to follow. Anyone waiting to draw a picker finds out
    // here instead.
    announceVoices();
  } catch {
    /* A voice that fails is not a reason to stop a training session. */
  }
}

export function stopSpeaking() {
  if (!synth) return;
  try {
    synth.cancel();
  } catch {
    /* nothing to cancel */
  }
}

// ---------------------------------------------------------------------------
// Listening
// ---------------------------------------------------------------------------

/**
 * Looked up when it is needed rather than when this module loads. Reading it
 * once at load time bakes in whatever the browser happened to expose before
 * the app started, which is the wrong answer in a page that can be resumed
 * from a service worker long after that.
 */
const recognitionApi = () =>
  typeof window === 'undefined'
    ? null
    : window.SpeechRecognition || window.webkitSpeechRecognition || null;

export const canListen = () => Boolean(recognitionApi());

/**
 * What the app listens for.
 *
 * Every phrase here is at least two words, and none of them is anything a
 * person says to a dog. That is not fastidiousness — it is the one
 * constraint this feature actually has.
 *
 * The default cues are "Go to bed", "Back", "Stay", "<name>!", "Okay", "Go
 * say hi" and "Sit". Two of those are the most natural words in any voice
 * interface: "Back" is both the boundary cue and the obvious word for the
 * previous step, and "Okay" is the release cue and the obvious agreement.
 * And the handler is not saying these near the phone by accident — the step
 * screen instructs them to say the cue out loud, every rep. A microphone
 * listening for "back" would be triggered by the activity itself.
 *
 * `alternates` are for what recognizers actually return rather than what
 * people think they said: engines drop "step", hear "well" for "went well",
 * and punctuate freely.
 */
export const COMMANDS = [
  { id: 'next', phrase: 'next step', alternates: ['next one', 'next please'] },
  { id: 'prev', phrase: 'previous step', alternates: ['previous one', 'last step'] },
  { id: 'good', phrase: 'went well', alternates: ['that went well', 'it went well'] },
  { id: 'miss', phrase: 'not that one', alternates: ['not this one', 'no that one'] },
  { id: 'finish', phrase: 'finish session', alternates: ['finish practice', 'end session'] },
];

/**
 * The phrase, written the way a button writes it.
 *
 * Buttons take their words from here rather than holding their own, because
 * the two had drifted: the control said "Next" while the microphone only
 * answered to "next step", so the screen was quietly teaching the wrong
 * words. One source means a command cannot be renamed without its button
 * following, and somebody who has read the buttons already knows what to say.
 */
export const commandLabel = (id) => {
  const command = COMMANDS.find((c) => c.id === id);
  if (!command) return '';
  return command.phrase.charAt(0).toUpperCase() + command.phrase.slice(1);
};

const normalize = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Commands that the household's own cues would set off.
 *
 * Cues are editable, so this cannot be settled once by choosing careful
 * wording — somebody can rename the release cue to "next step" this evening.
 * It is checked against live state and the offending command is dropped
 * rather than the whole feature: losing "previous step" is a smaller loss
 * than a microphone that logs a rep every time the dog is released.
 */
export function cueCollisions() {
  const cues = (getState().commands || []).map((c) => normalize(resolveCueText(c.cue)));
  const hits = [];
  COMMANDS.forEach((command) => {
    [command.phrase, ...command.alternates].forEach((phrase) => {
      const p = normalize(phrase);
      cues.forEach((cue) => {
        if (!cue) return;
        // Either direction is a collision: a cue that contains the command
        // triggers it, and a cue contained by the command is close enough
        // that a recognizer will confuse the two.
        if (cue === p || cue.includes(p) || p.includes(cue)) {
          hits.push({ commandId: command.id, cue, phrase: p });
        }
      });
    });
  });
  return hits;
}

/** `{dog}` is a token in stored cues; the literal name is what gets spoken. */
function resolveCueText(cue) {
  const dog = getState().dog;
  return String(cue || '').replace(/\{dog\}/g, (dog && dog.name) || '');
}

/** The commands that survive the household's current cue list. */
export function availableCommands() {
  const blocked = new Set(cueCollisions().map((h) => h.commandId));
  return COMMANDS.filter((c) => !blocked.has(c.id));
}

/** Ordinary Levenshtein, two rows rather than a full matrix. */
function editDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let row = new Array(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, row] = [row, prev];
  }
  return prev[b.length];
}

/**
 * How far `phrase` is from the nearest run of words inside `said`.
 *
 * Windowed by word count rather than compared whole, because recognizers
 * wrap commands in sentences — "okay next step then" — and measuring the
 * whole sentence against a two-word phrase scores every real command as a
 * bad match. One word either side of the phrase's own length is enough
 * slack for a dropped or invented article.
 */
function windowedDistance(said, phrase) {
  const words = said.split(' ').filter(Boolean);
  const size = phrase.split(' ').filter(Boolean).length;
  let best = editDistance(said, phrase);
  for (let n = Math.max(1, size - 1); n <= size + 1; n++) {
    for (let i = 0; i + n <= words.length; i++) {
      const d = editDistance(words.slice(i, i + n).join(' '), phrase);
      if (d < best) best = d;
    }
  }
  return best;
}

/**
 * How wrong a phrase may be and still count.
 *
 * Proportional to length: three characters adrift in "not that one" is a
 * recognizer stumbling, while three adrift in a four-letter word is a
 * different word. A third is enough to absorb the failures these engines
 * actually produce — "next up" for "next step", "when well" for "went well"
 * — without reaching far enough to meet anything said to a dog.
 */
const tolerance = (phrase) => Math.floor(phrase.length / 3);

/**
 * Match a heard phrase to a command.
 *
 * Exact containment first, so the common case never pays for the fuzzy pass
 * and "not that one" is never answered by something shorter hiding inside it.
 *
 * Then the fuzzy pass, which exists because these recognizers are doing open
 * dictation against a five-phrase vocabulary they know nothing about: they
 * return "next up", "text step", "nest step". Refusing those trains people to
 * shout at the phone.
 *
 * The cue guard is what makes loosening it safe. Every household cue is
 * measured too, and if what was heard sits as close to a cue as it does to a
 * command, nothing happens. The handler is instructed to say those cues out
 * loud on every rep, so the microphone hears them constantly — and a
 * scorekeeper that logs a rep because somebody released the dog is worse than
 * one that occasionally misses a command.
 */
export function matchCommand(transcript, commands = availableCommands()) {
  const said = normalize(transcript);
  if (!said) return null;

  const candidates = [];
  commands.forEach((command) => {
    [command.phrase, ...command.alternates].forEach((phrase) =>
      candidates.push({ id: command.id, p: normalize(phrase) })
    );
  });

  // Exact: longest first so the most specific phrase wins.
  const exact = [...candidates]
    .sort((a, b) => b.p.length - a.p.length)
    .find((c) => said === c.p || said.includes(c.p));
  if (exact) return exact.id;

  // Fuzzy: the closest candidate, if it is close enough to be meant.
  let best = null;
  candidates.forEach((c) => {
    const d = windowedDistance(said, c.p);
    if (d <= tolerance(c.p) && (!best || d < best.d)) best = { id: c.id, d };
  });
  if (!best) return null;

  // A cue only gets a veto if it is itself a plausible reading of what was
  // said. Measuring raw distance instead let three-letter cues veto
  // everything — "sit" sits two or three edits from most short words, so
  // "next up" was being thrown out by a cue nobody had spoken. Holding each
  // cue to its own tolerance asks the question that matters: was this a cue?
  const cueDistance = cuePhrases().reduce((min, cue) => {
    const d = windowedDistance(said, cue);
    return d <= tolerance(cue) && d < min ? d : min;
  }, Infinity);
  if (cueDistance <= best.d) return null;

  return best.id;
}

/** The household's cues, normalized, for the guard above. */
function cuePhrases() {
  return (getState().commands || [])
    .map((c) => normalize(resolveCueText(c.cue)))
    .filter(Boolean);
}

/**
 * Ask for the microphone now, and find out where we stand.
 *
 * Turning the switch on used to promise nothing and check nothing: the
 * browser was asked for a microphone only once practice had started, and a
 * refusal surfaced two screens later as a chip that said "Tap to listen
 * again" — which is advice, and wrong, when the browser has already decided.
 * Chrome on iOS blocks it by default, so this was the common case rather
 * than the unlucky one.
 *
 * Asked at the moment the switch is tapped, which is the moment somebody has
 * a free hand and is thinking about microphones. The stream is stopped the
 * instant it arrives: this is a question, not a recording, and leaving even
 * one track running would light the indicator over an app that is not
 * listening yet.
 */
export async function probeMicrophone() {
  if (!canListen()) return 'unsupported';
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    // No way to ask ahead of time. Not a refusal — recognition may still
    // work, and saying "blocked" here would be inventing bad news.
    return 'unknown';
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {
        /* already ended */
      }
    });
    return 'granted';
  } catch (error) {
    const name = (error && error.name) || '';
    if (name === 'NotAllowedError' || name === 'SecurityError') return 'blocked';
    if (name === 'NotFoundError') return 'no-microphone';
    return 'error';
  }
}

/**
 * Start listening. Returns a stop function, or null if unavailable.
 *
 * `onCommand` gets a command id, `onState` gets progress worth showing —
 * listening or not, what was last heard, and anything that went wrong. The
 * screen has to show that last part: a microphone with no visible state is a
 * feature people cannot tell is broken.
 */
export function startListening({ onCommand, onState = () => {} }) {
  const Recognition = recognitionApi();
  if (!Recognition) return null;

  const commands = availableCommands();
  let stopped = false;
  let recognition = null;

  // Restarting is normal — recognizers stop themselves after a pause, and a
  // practice session is mostly pauses. But on iOS Safari every start needs a
  // user gesture, so a restart nobody tapped is refused, and the refusal
  // looks like an ordinary end. Telling the two apart is a matter of timing:
  // a real listen sits in a quiet room for seconds, while a refusal comes
  // back immediately. Several immediate empty ends in a row means this
  // platform will not listen unattended, and the honest thing is to say so
  // rather than leave a chip claiming to listen to a microphone that is off.
  let startedAt = 0;
  let sawResult = false;
  let refusals = 0;

  const report = (patch) => onState(patch);

  const build = () => {
    const r = new Recognition();
    r.continuous = true;
    r.interimResults = false;
    r.lang = navigator.language || 'en-US';
    // One alternative is enough: this is a five-phrase vocabulary, not
    // dictation, and extra candidates only widen the ways to be wrong.
    r.maxAlternatives = 1;

    r.onstart = () => {
      startedAt = Date.now();
      sawResult = false;
    };

    r.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result.isFinal) continue;
        sawResult = true;
        refusals = 0;
        const said = result[0].transcript;
        const id = matchCommand(said, commands);
        report({ heard: said.trim(), matched: Boolean(id) });
        if (id) onCommand(id);
      }
    };

    r.onerror = (event) => {
      // `no-speech` and `aborted` are the ordinary sound of a quiet room and
      // of our own restarts. Only the ones a person can act on get surfaced.
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        stopped = true;
        report({ listening: false, error: 'blocked' });
      } else if (event.error === 'network') {
        report({ error: 'network' });
      }
    };

    // Recognizers stop themselves after a pause. A practice session is mostly
    // pauses, so the loop is the feature: restart unless we were told to stop.
    r.onend = () => {
      if (stopped) {
        report({ listening: false });
        return;
      }
      // Immediate and empty is a refusal, not a quiet room. Three in a row is
      // a platform that will not restart without being asked by hand.
      if (!sawResult && Date.now() - startedAt < 700) refusals += 1;
      else refusals = 0;
      if (refusals >= 3) {
        stopped = true;
        report({ listening: false, error: 'gesture' });
        return;
      }
      try {
        r.start();
      } catch {
        stopped = true;
        report({ listening: false, error: 'gesture' });
      }
    };

    return r;
  };

  try {
    recognition = build();
    recognition.start();
    report({ listening: true, error: null });
  } catch {
    return null;
  }

  return () => {
    stopped = true;
    // Both, in this order, and each on its own. `abort` is the one that drops
    // the audio immediately, but iOS has been seen holding the recording
    // indicator until `stop` has also been called, and if `abort` throws
    // because the recognizer is mid-teardown then a shared try would skip
    // `stop` entirely — leaving the orange dot lit over a session that ended.
    try {
      recognition.abort();
    } catch {
      /* already gone */
    }
    try {
      recognition.stop();
    } catch {
      /* already gone */
    }
    // Drop the handlers too. A recognizer kept alive by a pending callback
    // can still fire `onend` after this and restart itself.
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    recognition.onstart = null;
    recognition = null;
    report({ listening: false });
  };
}
