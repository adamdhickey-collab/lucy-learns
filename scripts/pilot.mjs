#!/usr/bin/env node
// The ChatGPT round-trip, minus the parts that keep going wrong.
//
// Generating illustrations means bouncing between this repo and a chat window,
// and three things in that loop have cost a round trip each: copying a prompt
// out of a markdown blockquote and taking the "> " with it, downloads landing
// as "ChatGPT Image Aug 10, 2026, 11_08_57 AM (5).png" with nothing to say
// which scene they are, and the same batch being re-added twice without anyone
// noticing until five images had been described back.
//
// So: prompts come out clean and go straight to the clipboard, incoming files
// are named on arrival and refused if they are bytes we have already seen, and
// the mechanical checks — ratio, size, every crop in the audit's §2 — run
// without anyone having to remember them.
//
//   node scripts/pilot.mjs prompt 3a          copy a prompt to the clipboard
//   node scripts/pilot.mjs add door-cover     name the newest download
//   node scripts/pilot.mjs check              ratios, dupes, crops
//   node scripts/pilot.mjs sheet              contact sheet for review
//
// Prompts are read from docs/pilot-prompts.md rather than duplicated here.
// That file is the source of truth; this only strips the markdown off it.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ROOT = path.resolve(import.meta.dirname, '..');
const PROMPTS = path.join(ROOT, 'docs/pilot-prompts.md');
const PILOT = path.join(ROOT, 'art/pilot');
// Where a fresh generation gets dropped. Both, newest wins, so it does not
// matter which one the browser is pointed at today.
const INBOX = [path.join(os.homedir(), 'Desktop'), path.join(os.homedir(), 'Downloads')];

const die = (msg) => {
  console.error(`\n  ${msg}\n`);
  process.exit(1);
};

// --- prompts ---------------------------------------------------------------

/**
 * Every prompt opens with this, because every prompt is sent with an approved
 * image attached and the attachment is the strongest lever on consistency we
 * have. Round 4 and round 5 of Scene 6 differed only in the human's pose —
 * Lucy came back right both times, off the reference.
 *
 * It leads rather than trails: the model should know the attachment outranks
 * the description before it reads three hundred words of description.
 */
const MATCH = 'Match this attached image exactly for style, palette and the dog\'s appearance — same dog, same woman, same room.';

/** Every line of the blockquote that follows a heading, with the "> " gone. */
function blockquoteAfter(lines, headingIndex) {
  const out = [];
  let started = false;
  for (let i = headingIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('>')) {
      started = true;
      out.push(line.replace(/^>\s?/, ''));
      continue;
    }
    // A blank line inside a quote is written as a bare ">", but an unquoted
    // blank between paragraphs ends nothing — only a new heading does.
    if (started && (line.startsWith('#') || line.startsWith('---'))) break;
    if (started && line.trim() === '') continue;
    if (started) break;
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function findHeading(lines, test) {
  const i = lines.findIndex((l) => /^#{2,3} /.test(l) && test(l));
  return i === -1 ? null : i;
}

/**
 * The "*Attach …*" note under a heading, if it has one.
 *
 * It sits between the heading and the blockquote, with a blank line either
 * side, and it wraps — so find where it starts and run on until the line that
 * closes the italics.
 *
 * Read for scenes as well as edits now. It used to be an edit-only field on
 * the assumption that a scene always wants the same thing — "attach an
 * approved image" — and that assumption expired: the approved masters are the
 * pre-restyle cast for most keys, so a scene redrawing one of those has to say
 * which file to attach, and the generic advice is actively wrong for it.
 */
function attachNote(lines, headingIndex) {
  const window = lines.slice(headingIndex + 1, headingIndex + 8);
  const start = window.findIndex((l) => /^\*.*attach/i.test(l));
  if (start === -1) return null;
  const end = window.findIndex((l, i) => i >= start && l.trimEnd().endsWith('*'));
  return window
    .slice(start, (end === -1 ? start : end) + 1)
    .join(' ')
    .replace(/\*/g, '')
    .trim();
}

function buildPrompt(id) {
  const lines = fs.readFileSync(PROMPTS, 'utf8').split('\n');
  const key = String(id).toLowerCase();

  const blockA = blockquoteAfter(lines, findHeading(lines, (l) => l.includes('Block A')));
  const blockB = blockquoteAfter(lines, findHeading(lines, (l) => l.includes('Block B')));

  // Round 3 entries are edits: they attach an existing image and change one
  // named thing. Pasting the full style and cast blocks in front of an edit is
  // how you get the whole scene redrawn instead.
  const editIndex = findHeading(lines, (l) => new RegExp(`^### ${key}\\b`, 'i').test(l));
  if (editIndex !== null) {
    return {
      title: lines[editIndex].replace(/^#+\s*/, ''),
      attach: attachNote(lines, editIndex),
      text: `${MATCH}\n\nKeep the attached image — this is an edit, not a redraw. The style and cast rules we have been using still apply; do not restate them.\n\n${blockquoteAfter(lines, editIndex)}`,
    };
  }

  // Scenes live at ## while the pilot was flat, and at ### once the restyle
  // batches gave them parents. Both are a scene.
  const sceneIndex = findHeading(lines, (l) => new RegExp(`^#{2,3} Scene ${key}\\b`).test(l));
  if (sceneIndex === null) {
    die(`No prompt "${id}". Scenes are numbered; 3a/3b/3c are the follow-up edits.`);
  }
  return {
    title: lines[sceneIndex].replace(/^#+\s*/, ''),
    attach: attachNote(lines, sceneIndex),
    text: `${MATCH}\n\n${blockA}\n\n${blockB}\n\n${blockquoteAfter(lines, sceneIndex)}`,
  };
}

function cmdPrompt(id) {
  if (!id) die('Which one? e.g. `prompt 1` or `prompt 3a`');
  const { title, attach, text } = buildPrompt(id);
  try {
    execFileSync('pbcopy', { input: text });
  } catch {
    /* not on a Mac, or no clipboard — the text still prints below */
  }
  console.log(`\n── ${title} ──\n`);
  console.log(text);
  console.log(`\n── copied to the clipboard ──`);
  if (attach) console.log(`   ${attach.trim()}`);
  else console.log('   Attach an approved image — the prompt opens by telling it to match one.');
  console.log('');
}

// --- files -----------------------------------------------------------------

const md5 = (file) => createHash('md5').update(fs.readFileSync(file)).digest('hex');

const dims = (file) => {
  const out = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file]).toString();
  const w = Number(out.match(/pixelWidth:\s*(\d+)/)?.[1]);
  const h = Number(out.match(/pixelHeight:\s*(\d+)/)?.[1]);
  return { w, h, ratio: w / h };
};

const isImage = (f) => /\.(png|jpe?g)$/i.test(f);

/**
 * Every image the project already holds, so a re-add can be caught by its
 * bytes. Both trees, because they answer different halves of "have I seen
 * this before": art/ catches the same generation being filed twice, img/
 * catches it being installed twice under different keys.
 */
function knownHashes() {
  const seen = new Map();
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (isImage(entry.name)) seen.set(md5(full), path.relative(ROOT, full));
    }
  };
  walk(path.join(ROOT, 'img'));
  walk(path.join(ROOT, 'art'));
  return seen;
}

function nextRoundName() {
  const n = Number(path.basename(currentRound()).split('-')[1] || 0);
  return `round-${n + 1}`;
}

function currentRound() {
  if (!fs.existsSync(PILOT)) return path.join(PILOT, 'round-1');
  const rounds = fs
    .readdirSync(PILOT)
    .filter((d) => /^round-\d+$/.test(d))
    .sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]));
  return path.join(PILOT, rounds.at(-1) || 'round-1');
}

/**
 * The newest image sitting in either drop folder.
 *
 * This used to filter on the filename containing "chatgpt" or "image", which
 * was wrong twice over: the browser saves some of them under a bare UUID, and
 * the filter silently matched nothing rather than saying so. Newest wins, and
 * the chosen path is always printed so a wrong pick is visible immediately.
 */
function newestDrop() {
  const candidates = INBOX.filter((dir) => fs.existsSync(dir)).flatMap((dir) =>
    fs
      .readdirSync(dir)
      .filter(isImage)
      .map((f) => ({ full: path.join(dir, f), t: fs.statSync(path.join(dir, f)).mtimeMs }))
  );
  if (!candidates.length) die(`No images in ${INBOX.join(' or ')}.`);
  return candidates.sort((a, b) => b.t - a.t)[0].full;
}

/**
 * Wait until the file stops growing.
 *
 * A half-written download copies happily and reports whatever nonsense is in
 * the partial header — this returned "1920 x 2749" for a 1448 x 1086 image
 * once, which is a confusing thing to be told about your own artwork.
 */
function settled(file) {
  let last = -1;
  for (let i = 0; i < 40; i++) {
    const size = fs.statSync(file).size;
    if (size === last && size > 0) return;
    last = size;
    execFileSync('sleep', ['0.25']);
  }
  die(`${path.basename(file)} is still being written. Wait for the download to finish.`);
}

function cmdAdd(name, file) {
  if (!name) die('Name it: `add door-cover` (the name it should land under).');
  const src = file ? path.resolve(file) : newestDrop();
  if (!fs.existsSync(src)) die(`No such file: ${src}`);
  settled(src);
  console.log(`\n  from ${src.replace(os.homedir(), '~')}`);

  const hash = md5(src);
  const twin = knownHashes().get(hash);
  if (twin) {
    die(
      `That is byte-for-byte ${twin}.\n  Nothing was copied — this is the same file, not a new generation.`
    );
  }

  const round = currentRound();
  fs.mkdirSync(round, { recursive: true });
  const dest = path.join(round, `${name.replace(/\.png$/i, '')}.png`);
  // Never write over an image that is already here. An earlier version did,
  // and quietly destroyed the round 2 cover it was meant to be replacing —
  // these files are untracked, so there was nothing to restore it from.
  if (fs.existsSync(dest)) {
    die(
      `${path.relative(ROOT, dest)} already exists.\n` +
        `  Nothing was copied. Start the next round (mkdir ${path.relative(ROOT, path.join(PILOT, nextRoundName()))})\n` +
        `  or add it under a different name.`
    );
  }
  fs.copyFileSync(src, dest);

  const { w, h, ratio } = dims(dest);
  const ok = Math.abs(ratio - 4 / 3) < 0.01;
  console.log(`\n  → ${path.relative(ROOT, dest)}`);
  console.log(`    ${w} x ${h}   ratio ${ratio.toFixed(2)}   ${(fs.statSync(dest).size / 1048576).toFixed(2)} MB`);
  console.log(ok ? '    ✓ 4:3' : `    ✗ not 4:3 — ${w === h ? 'square, reject' : 'will need cropping'}`);
  console.log('');
}

// --- checks ----------------------------------------------------------------

// Straight out of §2 of the audit. Heights are computed from a 1448px width.
//
// `offset` is the top edge of the crop, for the surfaces the app does not cut
// down the middle. Only Today does, and it is the one that matters most: the
// hero is `object-position: center 42%`, so a household sees y 190–824 of a
// 1086px master and `sips -c` was showing y 226–860. Thirty-six pixels, and
// this file was quietly the last place that did not know — the prose in
// pilot-prompts.md has spelled the real band out for several batches while
// `check` went on producing a centred approximation of it, which is a check
// that agrees with you for the wrong reason. It is what let a cover ship with
// both heads outside the band.
const CROPS = [
  { name: 'today-16x7', h: 634, w: 1448, offset: 190, note: 'Today hero' },
  { name: 'program-21x9', h: 621, w: 1448, note: 'program hero' },
  { name: 'welcome-5x4', h: 1086, w: 1357, note: 'welcome panel' },
  { name: 'square', h: 1086, w: 1086, note: 'library card / map rail' },
];

function cmdCheck(dir) {
  const target = dir ? path.resolve(dir) : currentRound();
  if (!fs.existsSync(target)) die(`No such folder: ${target}`);
  const files = fs.readdirSync(target).filter(isImage).sort();
  if (!files.length) die(`No images in ${path.relative(ROOT, target)}`);

  const others = knownHashes();
  const crops = path.join(target, 'crops');
  fs.mkdirSync(crops, { recursive: true });

  console.log(`\n  ${path.relative(ROOT, target)}\n`);
  for (const f of files) {
    const full = path.join(target, f);
    const { w, h, ratio } = dims(full);
    const flag = Math.abs(ratio - 4 / 3) < 0.01 ? '✓' : w === h ? '✗ square' : '~';
    const dupe = [...others.entries()].find(
      ([hash, rel]) => hash === md5(full) && rel !== path.relative(ROOT, full)
    );
    console.log(
      `  ${flag} ${f.padEnd(34)} ${String(w).padStart(5)}x${String(h).padEnd(6)} ${ratio.toFixed(2)}` +
        (dupe ? `   ⚠ identical to ${dupe[1]}` : '')
    );
    for (const c of CROPS) {
      const out = path.join(crops, `${f.replace(/\.\w+$/, '')}-${c.name}.png`);
      // The offset is scaled off this file's own height rather than assumed to
      // be 1086 — a generation that arrives larger would otherwise get a band
      // measured for a smaller picture, which is the same class of error this
      // offset exists to fix.
      const top = c.offset ? Math.round((c.offset / 1086) * h) : null;
      const args =
        top === null
          ? ['-c', String(c.h), String(c.w), full, '--out', out]
          : [
              full,
              '--cropToHeightWidth',
              String(c.h),
              String(c.w),
              '--cropOffset',
              String(top),
              '0',
              '--out',
              out,
            ];
      try {
        execFileSync('sips', args, { stdio: 'ignore' });
      } catch {
        /* a crop larger than the source just gets skipped */
      }
    }
  }
  console.log(`\n  crops → ${path.relative(ROOT, crops)}/`);
  console.log(`  contact sheet → node scripts/pilot.mjs sheet\n`);
}

// --- verify ----------------------------------------------------------------

/**
 * Every way an image key can be reached, checked at once.
 *
 * This exists because a narrower version of it missed one. Retiring `dg-03`
 * walked ACTIVITIES, found no references, and declared it safe — but the
 * welcome screen names images in its own PANELS array, and panel 2 was still
 * asking for it. The app would have thrown on first run, on the second screen
 * a household ever sees.
 *
 * So the structured walk is backed by a text sweep: any `image: '...'` in js/
 * has to name a key that exists, wherever it lives. Belt and braces, because
 * the structured half is the one that already failed.
 */
async function cmdVerify() {
  const content = await import(`file://${path.join(ROOT, 'js/content.js')}`);
  const { IMAGES, ACTIVITIES, PROGRAMS, PLANNED_ACTIVITIES, stepsForLevel } = content;
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const problems = [];
  const used = new Set();

  const need = (key, where) => {
    if (!key) return;
    used.add(key);
    if (!IMAGES[key]) problems.push(`${where} wants "${key}", which is not in IMAGES`);
  };

  for (const p of PROGRAMS) need(p.coverImage, `program ${p.id}`);
  for (const a of PLANNED_ACTIVITIES) need(a.coverImage, `planned ${a.id}`);
  for (const a of ACTIVITIES) {
    need(a.coverImage, `${a.id} cover`);
    need(a.fallbackImage, `${a.id} fallback`);
    a.steps.forEach((s, i) => {
      need(s.image, `${a.id} step ${i + 1}`);
      need(s.avoid, `${a.id} step ${i + 1} (avoid)`);
    });
    for (const l of a.levels)
      for (const s of stepsForLevel(a, l)) {
        need(s.image, `${a.id} L${l.number} step ${s.position}`);
        need(s.avoid, `${a.id} L${l.number} step ${s.position} (avoid)`);
      }
  }

  // The text sweep. Anything naming an image outside the structures above.
  const walk = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const full = path.join(dir, e.name);
      return e.isDirectory() ? walk(full) : full.endsWith('.js') ? [full] : [];
    });
  for (const file of walk(path.join(ROOT, 'js'))) {
    const src = fs.readFileSync(file, 'utf8');
    // `image:` and `avoid:` both name a key. Any third field that ever does
    // needs adding here, which is the cost of the sweep being a sweep.
    for (const m of src.matchAll(/\b(?:image|avoid):\s*'([^']+)'/g))
      need(m[1], path.relative(ROOT, file));
  }

  for (const [key, v] of Object.entries(IMAGES)) {
    for (const f of [v.src, v.thumb]) {
      if (!fs.existsSync(path.join(ROOT, f))) problems.push(`${key}: ${f} is not on disk`);
      if (!sw.includes(`'./${f}'`)) problems.push(`${key}: ${f} is not in the sw.js precache`);
    }
  }

  const orphans = Object.keys(IMAGES).filter((k) => !used.has(k));

  console.log(`\n  ${Object.keys(IMAGES).length} keys, ${used.size} reached, ${problems.length} problems`);
  for (const p of problems) console.log(`  ✗ ${p}`);
  if (orphans.length) console.log(`  · unreferenced keys: ${orphans.join(', ')}`);
  if (!problems.length) console.log('  ✓ every reference resolves, every file exists and is precached');
  console.log('');
  if (problems.length) process.exit(1);
}

// --- masters ---------------------------------------------------------------

/**
 * Is the approved master still the picture that ships?
 *
 * `art/pilot/approved/` is the style anchor: every generation goes out with an
 * approved image attached, and that attachment is what holds the cast, the
 * room and the palette steady across scenes drawn weeks apart. Which makes a
 * master that has quietly stopped matching its shipped image worse than a
 * missing one — a missing file fails loudly, a stale one silently pulls the
 * next batch back toward an older cast.
 *
 * That is not hypothetical. The 19 August regeneration replaced most of the
 * library and left this folder on the 12th, and the check in art/README.md did
 * not notice because it asks whether a master *exists*:
 *
 *     [ -f "art/pilot/approved/$b.png" ] || echo "NO MASTER: $b"
 *
 * Existence was the wrong question. This asks whether it is the same picture.
 */

/**
 * A 32-square thumbnail of an image as raw RGB.
 *
 * Via BMP because it is the one uncompressed format `sips` writes that can be
 * read here without a decoder, and this script has no dependencies and should
 * not grow one to answer a question this coarse. 32 is chosen so a row is 96
 * bytes, a multiple of four, and the rows carry no padding — but the reader
 * below honours the stride anyway rather than relying on that holding.
 *
 * Squashed to a square rather than fitted. Every image here is 4:3 and both
 * sides get squashed identically, so it costs nothing and removes a case.
 */
const MASTER_THUMB = 32;

function thumbPixels(file) {
  const tmp = path.join(os.tmpdir(), `pilot-${process.pid}-${createHash('md5').update(file).digest('hex')}.bmp`);
  try {
    execFileSync(
      'sips',
      ['-z', String(MASTER_THUMB), String(MASTER_THUMB), '-s', 'format', 'bmp', file, '--out', tmp],
      { stdio: 'ignore' }
    );
    const buf = fs.readFileSync(tmp);
    const start = buf.readUInt32LE(10);
    const w = buf.readInt32LE(18);
    // A negative height means the rows are stored top-down. Both files are
    // written by the same sips, so the orientation is the same either way and
    // the comparison does not care — the magnitude is all that is needed.
    const h = Math.abs(buf.readInt32LE(22));
    const bytes = buf.readUInt16LE(28) / 8;
    const stride = Math.ceil((w * bytes) / 4) * 4;
    const out = Buffer.alloc(w * h * 3);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const from = start + y * stride + x * bytes;
        const to = (y * w + x) * 3;
        out[to] = buf[from];
        out[to + 1] = buf[from + 1];
        out[to + 2] = buf[from + 2];
      }
    return out;
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

/** Mean absolute difference per channel, 0 (identical) to 255 (inverted). */
function meanDifference(a, b) {
  let total = 0;
  for (let i = 0; i < a.length; i++) total += Math.abs(a[i] - b[i]);
  return total / a.length;
}

/**
 * Where the bands sit, and why they are not a single threshold.
 *
 * The same picture re-rendered — downsampled 1448→1100 and JPEG'd at quality
 * 72 — lands under 8. A different picture lands well above 18; the greeting
 * cover's stale master scores 58. Between them is the case the number cannot
 * settle on its own: `door-sound-cover` scores 18 for a master with the same
 * composition and a different handler, which is a change that matters and does
 * not look like one to an arithmetic mean of 3072 bytes.
 *
 * So the middle band is called `check` rather than guessed at, and the command
 * writes the pairs out so checking costs one look.
 */
const MASTER_MATCH = 8;
const MASTER_DIFFERS = 18;

/**
 * Shipped images with no master here, legitimately. Both are named in
 * art/README.md: the portrait predates the pilot process, and the splash
 * mark's master is art/source/splash-source.png.
 */
const NO_MASTER_EXPECTED = new Set(['lucy-portrait', 'splash-mark']);

function cmdMasters() {
  const approved = path.join(ROOT, 'art/pilot/approved');
  if (!fs.existsSync(approved)) die('No art/pilot/approved — nothing to compare against.');

  const shipped = fs
    .readdirSync(path.join(ROOT, 'img'))
    .filter((f) => f.endsWith('.jpg') && !f.startsWith('thumb-'))
    .map((f) => f.replace(/\.jpg$/, ''))
    .sort();

  const rows = [];
  for (const key of shipped) {
    if (NO_MASTER_EXPECTED.has(key)) continue;
    const master = path.join(approved, `${key}.png`);
    if (!fs.existsSync(master)) {
      rows.push({ key, verdict: 'missing', score: null });
      continue;
    }
    const score = meanDifference(thumbPixels(master), thumbPixels(path.join(ROOT, `img/${key}.jpg`)));
    const verdict = score < MASTER_MATCH ? 'match' : score < MASTER_DIFFERS ? 'check' : 'differs';
    rows.push({ key, verdict, score, master });
  }

  // A master with nothing shipping under its name is not a problem — the run
  // sheet is one — but it is worth saying out loud, because the other reason
  // for it is a key that got renamed and left its master behind.
  const orphans = fs
    .readdirSync(approved)
    .filter((f) => f.endsWith('.png'))
    .map((f) => f.replace(/\.png$/, ''))
    .filter((k) => !shipped.includes(k))
    .sort();

  const MARK = { match: '✓', check: '~', differs: '✗', missing: '✗' };
  console.log(`\n  ${rows.length} shipped images with a master expected\n`);
  for (const r of rows)
    console.log(
      `  ${MARK[r.verdict]} ${r.verdict.padEnd(8)} ${(r.score === null ? '—' : r.score.toFixed(1)).padStart(5)}  ${r.key}`
    );

  const count = (v) => rows.filter((r) => r.verdict === v).length;
  console.log(
    `\n  ${count('match')} match · ${count('check')} to check · ${count('differs')} differ · ${count('missing')} missing`
  );
  if (orphans.length) console.log(`  · masters with nothing shipping under that name: ${orphans.join(', ')}`);

  const suspect = rows.filter((r) => r.verdict === 'check' || r.verdict === 'differs');
  if (suspect.length) {
    const out = path.join(ROOT, 'art/pilot/masters.html');
    fs.writeFileSync(out, mastersSheet(suspect, out));
    console.log(`  side by side → ${path.relative(ROOT, out)}`);
    console.log(`  http://localhost:4232/${path.relative(ROOT, out)}`);
  }
  console.log('');

  if (count('differs') || count('missing')) process.exit(1);
}

/** Master beside shipped, one row each, because the verdict wants looking at. */
function mastersSheet(rows, out) {
  const rel = (f) => path.relative(path.dirname(out), f);
  const cards = rows
    .map(
      (r) => `<section><h2>${r.key} <em>${r.verdict} · ${r.score.toFixed(1)}</em></h2>
<div class="pair">
  <figure><img src="${rel(r.master)}" alt=""><figcaption>master — art/pilot/approved</figcaption></figure>
  <figure><img src="${rel(path.join(ROOT, `img/${r.key}.jpg`))}" alt=""><figcaption>shipped — img</figcaption></figure>
</div></section>`
    )
    .join('\n');

  return `<!doctype html><meta charset="utf-8"><title>masters vs shipped</title>
<style>
  body{margin:0;padding:24px;background:#f4f1ea;font:14px/1.4 -apple-system,system-ui,sans-serif;color:#233239}
  h1{font-size:16px;letter-spacing:.06em;text-transform:uppercase;color:#5a6b72;margin:0 0 20px}
  section{margin:0 0 24px}
  h2{font-size:14px;margin:0 0 8px;font-variant-numeric:tabular-nums}
  h2 em{color:#6b7b82;font-style:normal;font-weight:400}
  .pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  figure{margin:0;background:#fff;border:1px solid #dfe4e2;border-radius:12px;overflow:hidden}
  img{display:block;width:100%;aspect-ratio:4/3;object-fit:contain;background:#eceae4}
  figcaption{padding:8px 12px;font-size:12px;color:#6b7b82}
</style>
<h1>masters vs shipped — ${rows.length} to look at</h1>
${cards}`;
}

// --- contact sheet ---------------------------------------------------------

function cmdSheet(dir) {
  const target = dir ? path.resolve(dir) : currentRound();
  const files = fs.readdirSync(target).filter(isImage).sort();
  const rel = (f) => path.relative(path.dirname(path.join(target, 'sheet.html')), path.join(target, f));

  const cards = files
    .map((f) => {
      const { w, h, ratio } = dims(path.join(target, f));
      return `<figure><img src="${rel(f)}" alt=""><figcaption><b>${f}</b><span>${w}×${h} · ${ratio.toFixed(2)}</span></figcaption></figure>`;
    })
    .join('\n');

  const html = `<!doctype html><meta charset="utf-8"><title>${path.basename(target)}</title>
<style>
  body{margin:0;padding:24px;background:#f4f1ea;font:14px/1.4 -apple-system,system-ui,sans-serif;color:#233239}
  h1{font-size:16px;letter-spacing:.06em;text-transform:uppercase;color:#5a6b72;margin:0 0 20px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:20px}
  figure{margin:0;background:#fff;border:1px solid #dfe4e2;border-radius:12px;overflow:hidden}
  img{display:block;width:100%;aspect-ratio:4/3;object-fit:contain;background:#eceae4}
  figcaption{display:flex;justify-content:space-between;gap:12px;padding:10px 12px;font-size:12px}
  figcaption span{color:#6b7b82;font-variant-numeric:tabular-nums}
</style>
<h1>${path.relative(ROOT, target)} — ${files.length} images</h1>
<div class="grid">${cards}</div>`;

  const out = path.join(target, 'sheet.html');
  fs.writeFileSync(out, html);
  const url = `http://localhost:4232/${path.relative(ROOT, out)}`;
  console.log(`\n  ${path.relative(ROOT, out)}`);
  console.log(`  ${url}\n`);
}

// --- go --------------------------------------------------------------------

const [cmd, ...rest] = process.argv.slice(2);
({
  prompt: () => cmdPrompt(rest[0]),
  add: () => cmdAdd(rest[0], rest[1]),
  check: () => cmdCheck(rest[0]),
  verify: () => cmdVerify(),
  masters: () => cmdMasters(),
  sheet: () => cmdSheet(rest[0]),
}[cmd] ||
  (() =>
    die(
      'pilot.mjs <command>\n\n' +
        '  prompt <1-5|3a|3b|3c>   copy a prompt to the clipboard\n' +
        '  add <name> [file]       name the newest ChatGPT download and file it\n' +
        '  check [dir]             ratios, duplicate detection, every crop from §2\n' +
        '  verify                  every image reference in the app resolves\n' +
        '  masters                 is each approved master still the shipped picture\n' +
        '  sheet [dir]             contact sheet to review them side by side'
    )))();
