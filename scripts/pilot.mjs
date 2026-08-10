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
const PILOT = path.join(ROOT, 'img/pilot');
// Where a fresh generation gets dropped. Both, newest wins, so it does not
// matter which one the browser is pointed at today.
const INBOX = [path.join(os.homedir(), 'Desktop'), path.join(os.homedir(), 'Downloads')];

const die = (msg) => {
  console.error(`\n  ${msg}\n`);
  process.exit(1);
};

// --- prompts ---------------------------------------------------------------

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
    const body = blockquoteAfter(lines, editIndex);
    // The "*Attach …*" note sits between the heading and the quote, with a
    // blank line either side, and it wraps — so find where it starts and run
    // on until the line that closes the italics.
    const window = lines.slice(editIndex + 1, editIndex + 8);
    const start = window.findIndex((l) => /^\*.*attach/i.test(l));
    let attach = null;
    if (start !== -1) {
      const end = window.findIndex((l, i) => i >= start && l.trimEnd().endsWith('*'));
      attach = window
        .slice(start, (end === -1 ? start : end) + 1)
        .join(' ')
        .replace(/\*/g, '')
        .trim();
    }
    return {
      title: lines[editIndex].replace(/^#+\s*/, ''),
      attach,
      text: `Keep the attached image. The style and cast rules we have been using still apply — do not restate or redraw them.\n\n${body}`,
    };
  }

  const sceneIndex = findHeading(lines, (l) => new RegExp(`^## Scene ${key}\\b`).test(l));
  if (sceneIndex === null) {
    die(`No prompt "${id}". Try 1-5 for a full scene, or 3a/3b/3c for a follow-up edit.`);
  }
  return {
    title: lines[sceneIndex].replace(/^#+\s*/, ''),
    attach: null,
    text: `${blockA}\n\n${blockB}\n\n${blockquoteAfter(lines, sceneIndex)}`,
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
  if (attach) console.log(`   Attach: ${attach.trim()}`);
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

/** Every image already in img/, so a re-add can be caught by its bytes. */
function knownHashes() {
  const seen = new Map();
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (isImage(entry.name)) seen.set(md5(full), path.relative(ROOT, full));
    }
  };
  walk(path.join(ROOT, 'img'));
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
const CROPS = [
  { name: 'today-16x7', h: 634, w: 1448, note: 'Today hero' },
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
      try {
        execFileSync('sips', ['-c', String(c.h), String(c.w), full, '--out', out], {
          stdio: 'ignore',
        });
      } catch {
        /* a crop larger than the source just gets skipped */
      }
    }
  }
  console.log(`\n  crops → ${path.relative(ROOT, crops)}/`);
  console.log(`  contact sheet → node scripts/pilot.mjs sheet\n`);
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
  sheet: () => cmdSheet(rest[0]),
}[cmd] ||
  (() =>
    die(
      'pilot.mjs <command>\n\n' +
        '  prompt <1-5|3a|3b|3c>   copy a prompt to the clipboard\n' +
        '  add <name> [file]       name the newest ChatGPT download and file it\n' +
        '  check [dir]             ratios, duplicate detection, every crop from §2\n' +
        '  sheet [dir]             contact sheet to review them side by side'
    )))();
