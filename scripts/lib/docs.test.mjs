// node --test scripts/lib/*.test.mjs
//
// Keeping docs/illustration-pipeline.md honest.
//
// Documentation rots quietly: the numbers in it were right when they were
// written, and the first person to find out otherwise is someone acting on
// them. This repo already treats that kind of check as executable — the
// contrast pairings, the image-reference audit — so the pipeline's stated
// facts are asserted against the code that implements them.
//
// If one of these fails, the doc is wrong, not the test. Fix the prose.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { ROOT } from './brief.mjs';
import { ROLES } from './scene.mjs';
import { SOURCE, MASTER, REQUEST, SIZE_LIMITS } from './request.mjs';
import { SHIPPED, THUMB } from './approve.mjs';
import { renditionPlan } from './renditions.mjs';

const DOC = 'docs/illustration-pipeline.md';
const doc = fs.readFileSync(path.join(ROOT, DOC), 'utf8');
const LIB = path.join(ROOT, 'scripts/lib');

const has = (needle, why) => assert.ok(doc.includes(needle), `${DOC} is missing ${why}: ${needle}`);

test('the documented canvas and master are the ones the code uses', () => {
  has(`${SOURCE.width}×${SOURCE.height}`, 'the API canvas');
  has(`${MASTER.width}×${MASTER.height}`, 'the master size');
  has(REQUEST.parameters.size, 'the size parameter');
  // The downscale factor is quoted to five places; recompute rather than trust.
  has((MASTER.width / SOURCE.width).toFixed(5), 'the downscale factor');
});

test('the documented sips command is the one approve and generate would run', () => {
  has(`sips --resampleHeightWidth ${MASTER.height} ${MASTER.width}`, 'the master command');
  has('height then width', 'the argument-order warning');
});

test('the documented ship recipe matches the constants', () => {
  has(`${SHIPPED.width}px wide, JPEG quality ${SHIPPED.quality}`, 'the shipped render');
  has(`${THUMB.width}px wide`, 'the thumbnail width');
});

test('every documented API limit is the value the code enforces', () => {
  has(`multiple of ${SIZE_LIMITS.edgeMultipleOf}`, 'the edge rule');
  has(String(SIZE_LIMITS.maxEdge), 'the longest-edge limit');
  has(`${SIZE_LIMITS.maxAspect}:1`, 'the aspect limit');
  has(SIZE_LIMITS.minPixels.toLocaleString('en-US'), 'the pixel floor');
  has(SIZE_LIMITS.maxPixels.toLocaleString('en-US'), 'the pixel ceiling');
  has(`at most ${SIZE_LIMITS.maxImages} reference images`, 'the image limit');
});

test('the doc says input_fidelity is not sent, and it is not', () => {
  assert.equal('input_fidelity' in REQUEST.parameters, false);
  has('`input_fidelity` is **not sent.**', 'the input_fidelity note');
});

test('every reference role is documented', () => {
  for (const role of Object.keys(ROLES)) has(role, 'a reference role');
});

test('every rendition the pipeline produces is in the table', () => {
  for (const r of renditionPlan('m.png', 'c', 's', MASTER.width, MASTER.height)) {
    has(`\`${r.name}\``, 'a rendition');
  }
});

test('every module is listed in the code inventory', () => {
  const modules = fs.readdirSync(LIB).filter((f) => f.endsWith('.mjs') && !f.endsWith('.test.mjs'));
  for (const m of modules) has(`scripts/lib/${m}`, 'a module');
});

test('the documented test count is the real one', () => {
  const files = fs.readdirSync(LIB).filter((f) => f.endsWith('.test.mjs'));
  const count = files.reduce(
    (n, f) => n + (fs.readFileSync(path.join(LIB, f), 'utf8').match(/^test\(/gm) || []).length,
    0
  );
  has(`${count} tests`, `the test count (it is ${count})`);
});

test('the doc does not still describe generation as unimplemented', () => {
  assert.doesNotMatch(doc, /not implemented|stub that (throws|refuses)|no live call has been authorised/i);
});

test('every repo path the doc names exists', () => {
  const paths = new Set(
    [...doc.matchAll(/`((?:scripts|art|docs|css|js|img)\/[A-Za-z0-9_.\/-]+)`/g)].map((m) => m[1])
  );
  for (const p of paths) {
    if (p.includes('*') || p.endsWith('/')) continue;
    // Templated names, and the two draft trees, which are gitignored.
    if (/<|round-NN|restyle\/|round-\d/.test(p)) continue;
    assert.ok(fs.existsSync(path.join(ROOT, p)), `${DOC} names a path that does not exist: ${p}`);
  }
});
