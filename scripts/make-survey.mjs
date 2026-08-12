#!/usr/bin/env node
// Builds the image-comprehension survey from the briefs that produced the art.
//
//   node scripts/make-survey.mjs        writes docs/comprehension-survey.md
//
// Every brief in docs/pilot-prompts.md ends with the same line:
//
//   The single thing this image must make obvious: ___
//
// That is a falsifiable claim, written before the picture existed, for all
// thirty-six illustrations in the app. This turns each one into a survey
// question and its own scoring key, which is the only way to find out whether
// the restyle actually worked — reading a picture you commissioned tells you
// what you meant, not what a stranger sees. Two of the defects in §5 (`dg-05`
// facing away from the handler, `dg-06` walking off the bed) were pictures that
// said the opposite of their step and survived months of being looked at.
//
// Generated rather than written out so it cannot drift: the claims live in the
// briefs, the filenames live in content.js, and this joins them. Reword a brief
// and re-run, and the scoring key follows.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { IMAGES, ACTIVITIES } from '../js/content.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BRIEFS = resolve(root, 'docs/pilot-prompts.md');
const OUT = resolve(root, 'docs/comprehension-survey.md');
const LIVE = 'https://adamdhickey-collab.github.io/lucy-learns';

// Scene number to the key it shipped as. Explicit because the briefs name their
// output inconsistently — the early batches say "Replaces `dg-20`" and the late
// ones carry a "Save as" column — and a rule with four exceptions is worse than
// a table you can read.
//
// When a scene redraws a key another scene already owns, the old scene comes out
// and the new one goes in — only the current scene for a key is listed, because
// two scenes claiming one key would mean two scoring keys for one picture.
// Scene 15 is absent for that reason: Scene 37 redrew `door-sound-cover` to a
// different claim and owns its scoring key now.

const SHIPPED_AS = {
  1: 'door-sound-01-setup',
  2: 'door-greet-07-approach',
  3: 'door-greet-08-petting',
  4: 'door-greet-08-jumping',
  5: 'door-cover',
  6: 'door-stay-02-cue',
  7: 'door-greet-01-settle',
  40: 'door-sound-02-bell',
  41: 'door-sound-02-knock',
  10: 'door-sound-02-self',
  11: 'door-sound-03-name',
  12: 'door-sound-04-treats',
  13: 'door-sound-05-settle',
  14: 'door-sound-03-name-distant',
  46: 'door-place-03-send',
  17: 'door-greet-04-open',
  18: 'door-greet-05-reward',
  19: 'door-greet-06-enter',
  20: 'door-greet-06-seated',
  21: 'door-greet-09-leaves',
  22: 'door-greet-cover',
  23: 'door-stay-04-pay',
  24: 'door-stay-03-cross',
  25: 'door-stay-05-release',
  26: 'door-stay-03-pretend',
  28: 'door-stay-03-onestep',
  29: 'door-stay-03-halfway',
  30: 'door-stay-03-handle',
  31: 'door-stay-03-crack',
  32: 'door-stay-03-conversation',
  42: 'plan-fourpaws',
  43: 'plan-mat',
  44: 'plan-walkpeople',
  36: 'plan-name',
  37: 'door-sound-cover',
  38: 'door-stay-cover',
  39: 'door-place-cover',
};

// Pairs §5 warned would read alike, or that this work found reading alike. A
// comprehension question cannot catch these: a participant can describe both
// pictures correctly and still not be able to tell them apart, which is the
// failure that actually reaches a household — two steps of one activity that
// look like the same photograph.
const CONFUSABLE = [
  {
    a: 46,
    b: 25,
    ask: 'Which one shows the dog being sent TO her bed?',
    answer: 'a',
    why: '§5: the two compositions were near-mirrors and meant opposite things. One arrives on the bed away from a pointing hand; the other leaves it toward open palms.',
  },
  {
    a: 24,
    b: 29,
    ask: 'In which one has the person STOPPED walking?',
    answer: 'b',
    why: '§5 called these near-duplicates. The only difference is motion: one is mid-stride going away, the other has stopped and turned back.',
  },
  {
    a: 30,
    b: 31,
    ask: 'In which one is the door OPEN?',
    answer: 'b',
    why: 'One level apart in the ladder. The first attempt at the open-door frame came back with the door shut and a hand on its edge — the same picture as the one before it.',
  },
  {
    a: 26,
    b: 32,
    ask: 'In which one is the person settled into a longer conversation?',
    answer: 'b',
    why: 'One level apart, both talking to nobody at an open door. §5 gives the difference as posture: a standing hello against a lean with a hand in a pocket.',
  },
];

// The four activity covers, which sit side by side on the program map at 56px.
// The first draft of one of them passed every crop test on its own and was
// still the same thumbnail as its neighbour.
//
// Read out of the app rather than listed here. These were hardcoded as scene
// numbers once and drifted the moment a cover was redrawn: batch 6 moved dg-1's
// cover to a new scene and dg-2's to a new key, and the table went on pointing
// at the retired ones — emitting `thumb-undefined.jpg` into the block without
// complaint. Whatever `coverImage` says is what the map renders, so that is
// what the survey has to ask about.
const COVERS = ACTIVITIES.map((a) => ({ key: a.coverImage, activity: a.title }));

// --- parse the briefs ------------------------------------------------------

const md = readFileSync(BRIEFS, 'utf8');
const lines = md.split('\n');

const scenes = new Map();
let current = null;

for (let i = 0; i < lines.length; i++) {
  const heading = lines[i].match(/^#{2,3} Scene (\d+) — (.+)$/);
  if (heading) {
    current = { number: Number(heading[1]), title: heading[2].trim(), note: [], claim: null };
    scenes.set(current.number, current);
    continue;
  }
  if (!current) continue;

  // The italic note under the heading carries the provenance: what it replaces,
  // how many references it had, and whether §5 recorded a defect against it.
  //
  // Gathered as a block rather than line by line. The first version tested
  // every line against /^\*[^*]/, which only ever matches the line the italic
  // *opens* on — so a note wrapped across three lines contributed its first
  // line and nothing else, and "**The fix:**" or a reference count sitting on
  // line two was invisible. That silently decided Block A membership, which is
  // the kind of wrong that looks like a judgement call.
  if (!current.claim && !current.note.length && /^\*[^*]/.test(lines[i])) {
    for (let j = i; j < lines.length; j++) {
      current.note.push(lines[j]);
      // The italic closes on the first line ending in a lone `*` — `**bold**`
      // at a line end would be a false positive, so require a non-`*` before it.
      if (/[^*]\*$/.test(lines[j])) break;
      if (lines[j].trim() === '') break; // unterminated; do not run into the brief
    }
  }

  const claimStart = lines[i].match(/single thing this image must make obvious[^:]*:\s*(.*)$/);
  if (claimStart && !current.claim) {
    // Blockquote lines wrap, so gather until the sentence ends.
    let text = claimStart[1];
    let j = i;
    while (!/[.!?]\s*$/.test(text.trim()) && j + 1 < lines.length) {
      j += 1;
      const next = lines[j].replace(/^>\s?/, '').trim();
      if (!next) break;
      text += ' ' + next;
    }
    current.claim = text.replace(/\s+/g, ' ').trim().replace(/\.$/, '');
  }
}

for (const [n, key] of Object.entries(SHIPPED_AS)) {
  const scene = scenes.get(Number(n));
  if (!scene) throw new Error(`Scene ${n} is in SHIPPED_AS but not in the briefs`);
  if (!scene.claim) throw new Error(`Scene ${n} has no "single thing" line`);
  if (!IMAGES[key]) throw new Error(`Scene ${n} maps to "${key}", which is not an installed key`);
  scene.key = key;
}

const unmapped = Object.keys(IMAGES).filter(
  (k) => ![...scenes.values()].some((s) => s.key === k)
);
if (unmapped.length) throw new Error(`installed but never tested: ${unmapped.join(', ')}`);

// --- rank ------------------------------------------------------------------

const noteOf = (scene) => scene.note.join(' ');
const refsOf = (scene) => {
  const m = noteOf(scene).match(/(\d+)\s+references?/);
  return m ? Number(m[1]) : 1;
};
// A brief that carries "The fix:" is one where §5 recorded the old picture as
// saying the wrong thing. Those are the ones worth a stranger's eyes first:
// the redraw either corrected the meaning or quietly reproduced it.
const isFix = (scene) => /\*\*The fix[:,]/.test(noteOf(scene));

const ranked = [...scenes.values()]
  .filter((s) => s.key)
  .sort((a, b) => Number(isFix(b)) - Number(isFix(a)) || refsOf(b) - refsOf(a) || a.number - b.number);

const priority = ranked.filter(isFix);
const rest = ranked.filter((s) => !isFix(s));

// --- emit ------------------------------------------------------------------

const img = (scene) => `${LIVE}/img/${scene.key}.jpg`;
const thumb = (scene) => `${LIVE}/img/thumb-${scene.key}.jpg`;

const questionBlock = (scene, index) => `
### Q${index}. ${scene.title}

![${scene.key}](${img(scene)})

\`${scene.key}.jpg\`${isFix(scene) ? ' · **redraw of a recorded defect**' : ''} · ${refsOf(scene)} reference${refsOf(scene) === 1 ? '' : 's'}

> **Ask:** In one sentence, what is the person doing, and what is the dog doing?

**Scoring key —** ${scene.claim}.
`;

const out = [];
out.push(`# Image comprehension survey

Generated by \`scripts/make-survey.mjs\` — do not edit by hand. Reword a brief in
[pilot-prompts.md](pilot-prompts.md) and re-run; the scoring keys follow.

## What this is for

Every one of the ${ranked.length} illustrations in the app was commissioned against a written
claim: *"The single thing this image must make obvious: ___"*. Nobody outside
the people who wrote those claims has ever checked one. That matters more than
it sounds — two of the defects in §5 of the audit were pictures that said the
*opposite* of the step they illustrated (\`dg-05\` had the dog facing away from
the handler calling her; \`dg-06\` had her walking off the bed on a step that
says send her to it) and both survived months of being looked at by people who
knew what they were supposed to mean.

This survey asks strangers what they see, and scores it against what the brief
said they should see.

## How to run it

**Unmoderated survey, ~15 participants.** Below about 12 a single confused
participant swings a result; much above 20 buys precision you do not need to
act on. No screener beyond fluent English and no dog-training experience
required — needing expertise to read the picture *is* the failure.

**Randomise question order** within each block. These are all the same dog in
the same hallway, and a participant who has seen eight of them starts pattern-
matching rather than looking.

**Blocks A to C are one session, roughly ${Math.round((priority.length + CONFUSABLE.length + 1) * 0.75)} minutes** —
${priority.length} open-text questions, ${CONFUSABLE.length} pairs and the cover
match, at about 45 seconds each. Block D is another ${rest.length} open-text
questions and belongs in its own panel — bolting it on would push a participant
past the point where they are still looking rather than skimming.

If that is longer than a panel you want to buy, cut Block A by reference count
rather than by feel: the questions are emitted most-referenced first, so the
later ones are the images a household meets least often. Do not cut Block B or
C to make room — a confusable pair and a duplicate cover are failures a
single-image question cannot find.

**Scoring.** Open text, marked by hand against the key. A pass is a participant
naming the action in the key without prompting. Do not credit a description that
is merely *compatible* with it: "a woman and a dog by a door" is a fail for every
question here. Anything below **80% pass on a Block A image is a redraw**, and
what they said instead tells you what to change.

---

## Block A — the redraws (${priority.length} images)

These replaced a picture §5 recorded as saying the wrong thing. If the fix
landed, it lands here.
`);

priority.forEach((scene, i) => out.push(questionBlock(scene, i + 1)));

out.push(`
---

## Block B — telling two apart (${CONFUSABLE.length} pairs)

A participant can describe both pictures correctly and still not tell them
apart, which is the failure that actually reaches a household: two steps of one
activity that look like the same photograph. Show both, side by side, and ask
for one.
`);

CONFUSABLE.forEach((pair, i) => {
  const a = scenes.get(pair.a);
  const b = scenes.get(pair.b);

  // Throw rather than emit. These are scene numbers written by hand, and a
  // scene number is not stable: when a redraw supersedes a scene, SHIPPED_AS
  // moves the key to the new number and the old one stops owning a picture.
  // This list pointed at scene 16 after batch 9 moved that key to 46, and the
  // block rendered `undefined.jpg` for the image, the caption *and* the answer
  // — a survey question that scores nothing, in a file whose whole job is to
  // be trustworthy.
  //
  // Exactly the failure COVERS had one batch earlier, in the sibling code path
  // that was not guarded at the same time. Fixing one instance of a bug and
  // leaving its twin is how it comes back.
  for (const [side, scene, number] of [
    ['a', a, pair.a],
    ['b', b, pair.b],
  ]) {
    if (!scene) throw new Error(`pair P${i + 1} side ${side}: no scene ${number} in the briefs`);
    if (!scene.key) {
      throw new Error(
        `pair P${i + 1} side ${side}: scene ${number} ("${scene.title}") owns no key — ` +
          `it was probably superseded by a redraw, so point this pair at the scene ` +
          `that owns the key now, per SHIPPED_AS`
      );
    }
  }

  out.push(`
### P${i + 1}. ${a.title} vs ${b.title}

| A | B |
| --- | --- |
| ![A](${img(a)}) | ![B](${img(b)}) |
| \`${a.key}.jpg\` | \`${b.key}.jpg\` |

> **Ask:** ${pair.ask}

**Correct —** ${pair.answer.toUpperCase()} (\`${(pair.answer === 'a' ? a : b).key}\`).

**Why it is on the list —** ${pair.why}
`);
});

out.push(`
---

## Block C — the map rail at 56 pixels

The four activity covers sit in a column on the program map at 56px. One of
them passed every crop test on its own and was still the same thumbnail as its
neighbour, which no amount of testing a picture in isolation would have caught.

Show all four **at 56px, together, in this order**, then ask the question once
per cover.

| Cover | Activity | Thumbnail |
| --- | --- | --- |
${COVERS.map((c) => {
  const s = [...scenes.values()].find((x) => x.key === c.key);
  if (!s) throw new Error(`cover "${c.key}" (${c.activity}) has no scene — nothing would score it`);
  return `| \`${s.key}\` | ${c.activity} | ${thumb(s)} |`;
}).join('\n')}

> **Ask, per cover:** These four pictures are four different training
> activities. Which of these four is this one? *(list the four activity names)*

**Passing —** each cover picked correctly by most participants, and no two
covers confused with each other more than once or twice. A cover nobody can
place is doing no work; two that swap are worse than one bad one.

---

## Block D — everything else (${rest.length} images)

Same question and scoring as Block A. Run these once Block A is clean, or split
them across two panels — ${rest.length} more open-text questions is too long to bolt onto the
same session.
`);

rest.forEach((scene, i) => out.push(questionBlock(scene, i + 1)));

out.push(`
---

## Known compromises, and what to watch for

Three things were accepted during the restyle with the reasoning written down.
The survey is the first chance to find out whether accepting them was right.

- **\`door-sound-04-treats\` — "two treats".** Clearly two at full size, one dark
  smudge at 1× on a small screen. The step copy says "two" regardless. If
  participants say "a treat" rather than "two treats", the picture is carrying
  less than the brief claimed.
- **\`door-place-03-send\` — the bed.** Ships as a thin mat where its neighbours
  are a deep mattress, and it sits next to one of them in the same activity. If
  anyone describes it as a mat, a towel, or a rug rather than a bed, that is the
  drift showing.
- **The four \`plan-*\` covers — the coat.** Three of the four drifted toward a
  smooth Labrador rather than the wirehaired mix, and were redrawn in batch 8;
  \`plan-name\` never drifted. All four should now read as one dog. This stays
  on the list because it is the thing to watch rather than a known fault: if a
  participant seeing one full-size calls her a different breed from the rest of
  the set, the drift came back.
`);

writeFileSync(OUT, out.join('\n').replace(/\n{3,}/g, '\n\n'));
console.log(
  `wrote docs/comprehension-survey.md — ${ranked.length} images ` +
    `(${priority.length} in Block A, ${rest.length} in Block D), ` +
    `${CONFUSABLE.length} pairs, ${COVERS.length} covers`
);
