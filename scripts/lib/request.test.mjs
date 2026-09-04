// node --test scripts/lib/*.test.mjs
//
// The request surface, asserted rather than trusted. Every value here was wrong
// in the first draft of request.mjs in a way that reads fine and only shows up
// as a wasted paid call: a 3:2 canvas for a 4:3 master, and an input_fidelity
// the model rejects outright. These are cheap to check and expensive to miss.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  REQUEST,
  SOURCE,
  MASTER,
  CONVERSION,
  SIZE_LIMITS,
  RESTYLE_DIR,
  outputPaths,
  nextRound,
  sipsDownscale,
  manifestSkeleton,
} from './request.mjs';
import { loadScene } from './scene.mjs';
import { BRIEF_ID } from './brief.mjs';

const ratio = ({ width, height }) => width / height;

// --- the canvas -------------------------------------------------------------

test('both source edges are multiples of 16', () => {
  assert.equal(SOURCE.width % SIZE_LIMITS.edgeMultipleOf, 0, `${SOURCE.width} must be /16`);
  assert.equal(SOURCE.height % SIZE_LIMITS.edgeMultipleOf, 0, `${SOURCE.height} must be /16`);
});

test('source and master are both exactly 4:3', () => {
  assert.equal(ratio(SOURCE), 4 / 3, `${SOURCE.width}×${SOURCE.height} is not 4:3`);
  assert.equal(ratio(MASTER), 4 / 3, `${MASTER.width}×${MASTER.height} is not 4:3`);
  assert.equal(ratio(SOURCE), ratio(MASTER));
});

test('the source meets the documented pixel and aspect constraints', () => {
  const px = SOURCE.width * SOURCE.height;
  assert.ok(px >= SIZE_LIMITS.minPixels, `${px} below the ${SIZE_LIMITS.minPixels} floor`);
  assert.ok(px <= SIZE_LIMITS.maxPixels, `${px} above the ${SIZE_LIMITS.maxPixels} ceiling`);
  assert.ok(Math.max(SOURCE.width, SOURCE.height) <= SIZE_LIMITS.maxEdge);
  const aspect = Math.max(ratio(SOURCE), 1 / ratio(SOURCE));
  assert.ok(aspect <= SIZE_LIMITS.maxAspect, `${aspect} exceeds ${SIZE_LIMITS.maxAspect}:1`);
});

test('the size parameter is the source canvas, not something else', () => {
  assert.equal(REQUEST.parameters.size, `${SOURCE.width}x${SOURCE.height}`);
  assert.equal(REQUEST.parameters.size, '1472x1104');
});

test('the master is a whole-number downscale of the source by one shared factor', () => {
  const fw = MASTER.width / SOURCE.width;
  const fh = MASTER.height / SOURCE.height;
  assert.equal(fw, fh, 'the two edges must scale by the same factor or it is a crop');
  assert.ok(fw < 1, 'the master must be smaller than the canvas, not upscaled');
  assert.equal(Number.isInteger(MASTER.width), true);
  assert.equal(Number.isInteger(MASTER.height), true);
});

// --- what must NOT be in the request ---------------------------------------

test('the request carries no input_fidelity — gpt-image-2 rejects it', () => {
  assert.equal('input_fidelity' in REQUEST.parameters, false);
  assert.doesNotMatch(JSON.stringify(REQUEST), /input_fidelity/);
});

test('the request is marked verified, and names its source', () => {
  assert.equal(REQUEST.verified, true);
  assert.match(REQUEST.verifiedAgainst, /developers\.openai\.com/);
  // Documentation is not a live call, and the file must keep saying so.
  assert.ok(REQUEST.unverified.length > 10);
});

test('the model is gpt-image-2 in both places it appears', () => {
  assert.equal(REQUEST.model, 'gpt-image-2');
  assert.equal(REQUEST.parameters.model, 'gpt-image-2');
});

// --- no crop, anywhere on the master path ----------------------------------

test('master creation computes no crop coordinates', () => {
  const argv = sipsDownscale('raw.png', 'master.png');
  assert.deepEqual(argv, [
    'sips',
    '--resampleHeightWidth',
    '1086',
    '1448',
    'raw.png',
    '--out',
    'master.png',
  ]);
  // sips pads rather than refusing an oversized crop, so a stray crop flag here
  // would silently produce a bordered master.
  for (const flag of ['--crop', '-c', '--cropOffset', '--padToHeightWidth', '-p']) {
    assert.ok(!argv.includes(flag), `${flag} must not appear on the master path`);
  }
  assert.equal(CONVERSION, 'proportional downscale, no crop');
});

test('the module exports nothing that computes a crop box', () => {
  const src = fs.readFileSync(new URL('./request.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /export function crop|cropBox|focusY/);
});

// --- outputs ---------------------------------------------------------------

test('drafts land under the restyle tree, never in img/ or approved/', () => {
  const out = outputPaths('a-scene', 1);
  for (const p of [out.raw, out.master, out.crops, out.sheet, out.manifest]) {
    assert.ok(p.startsWith(`${RESTYLE_DIR}/round-01/`), `${p} escaped the draft tree`);
    assert.doesNotMatch(p, /(^|\/)img\/|approved/);
  }
});

test('the restyle counter starts at 1 and does not inherit the tan-era numbering', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'restyle-'));
  assert.equal(nextRound(fs, path.join(dir, 'absent')), 1);
  assert.equal(nextRound(fs, dir), 1);
  fs.mkdirSync(path.join(dir, 'round-01'));
  fs.mkdirSync(path.join(dir, 'round-07'));
  assert.equal(nextRound(fs, dir), 8);
});

// --- manifest --------------------------------------------------------------

test('the manifest records the brief, the sizes and the conversion', () => {
  const scene = loadScene('door-sound-03-name');
  const m = manifestSkeleton(scene, outputPaths(scene.id, 1));
  // The manifest records the brief the *scene* declares. For a shipped picture
  // that is the brief it was drawn under, which after a bump is a superseded
  // one — and generate refuses such a scene before a manifest is ever written,
  // so the record and the refusal agree.
  assert.equal(m.briefId, scene.briefId);
  assert.equal(m.output.rawSize, '1472x1104');
  assert.equal(m.output.masterSize, '1448x1086');
  assert.equal(m.output.conversion, CONVERSION);
  assert.equal(m.approved, false, 'a draft is never born approved');
  assert.deepEqual(m.references.map((r) => r.order), [1, 2, 3]);
});

test('the manifest carries no credential field, under any spelling', () => {
  const scene = loadScene('door-sound-03-name');
  const json = JSON.stringify(manifestSkeleton(scene, outputPaths(scene.id, 1)));
  // Deliberately not matching on "openai" — the endpoint host contains it and
  // is not a secret. What must never appear is the key, under any spelling.
  assert.doesNotMatch(json, /api[_-]?key|authorization|bearer|secret|credential/i);
});

// --- plan mode cannot leak a key -------------------------------------------

test('plan mode reads no environment variables at all', () => {
  // The strongest guarantee available: not "it does not print the key" but
  // "it never reads the environment", so there is nothing there to print.
  const src = fs.readFileSync(new URL('./plan.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /process\.env/);
});

/** Source with comments removed, so a mention is not mistaken for an access. */
const code = (file) =>
  fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

test('only request.mjs touches the environment at all', () => {
  const dir = path.dirname(new URL(import.meta.url).pathname);
  const readers = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.mjs') && !f.endsWith('.test.mjs'))
    .filter((f) => /process\.env/.test(code(path.join(dir, f))));
  assert.deepEqual(readers, ['request.mjs'], 'only request.mjs may reach process.env');
});

test('request.mjs reads OPENAI_API_KEY and no other variable', () => {
  const dir = path.dirname(new URL(import.meta.url).pathname);
  // process.env arrives as the `env` parameter; every read off it is env.NAME.
  const src = code(path.join(dir, 'request.mjs')).replaceAll('process.env', '');
  // Not \b: it would also match the ".env.local" inside the help text.
  const names = [...src.matchAll(/(?<![.\w])env\.([A-Za-z_]\w*)/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(names)], ['OPENAI_API_KEY']);
});
