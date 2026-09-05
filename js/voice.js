// Reading the steps aloud.
//
// This module once had two halves: speaking, and listening for spoken
// commands. Listening is gone, and not because it stopped working. Practice
// happens with the dog a metre away, and a handler saying "next step" to the
// phone is a handler saying words, out loud, in a bright voice, at a dog who
// is being taught that words said like that are for her. The commands were
// chosen to avoid every cue and still landed in the same room as them. The
// hands-free job it did is done by the pace timer in the player now, which
// asks nothing of anyone's voice.
//
// Speaking stays because it is the cheap half: it runs on the device, needs
// no permission, and works with the phone in a pocket and no signal.

import { getVoice, setVoice } from './store.js';

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
