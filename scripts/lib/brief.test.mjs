// node --test scripts/lib/*.test.mjs
//
// These guard the seam between the markdown brief and the pipeline. The whole
// design depends on the prompt existing in exactly one place, so the risk is
// not that extraction crashes — it is that it silently returns the wrong text,
// or text from the superseded warm brief, and nobody notices until an image
// comes back the wrong colour.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { loadBlocks, BLOCK_IDS, BRIEF, ROOT } from './brief.mjs';
import { blockquoteAfter, findHeading } from './markdown.mjs';

test('the live brief exists where the pipeline expects it', () => {
  assert.ok(fs.existsSync(BRIEF), `${path.relative(ROOT, BRIEF)} must exist`);
});

test('all three blocks extract and are non-trivial', () => {
  const b = loadBlocks();
  assert.deepEqual(Object.keys(b).sort(), [...BLOCK_IDS].sort());
  for (const id of BLOCK_IDS) {
    assert.ok(b[id].length > 200, `${id} block looks too short (${b[id].length} chars)`);
  }
});

test('the blocks carry the current cool palette, not the superseded warm one', () => {
  const { style, porch, cast } = loadBlocks();
  assert.match(style, /#eae7f0/, 'lavender wall');
  assert.match(style, /#c3b5a8/, 'desaturated floor');
  assert.match(style, /#4a216d/, 'collar violet');
  assert.match(porch, /#c9ccc8/, 'porch siding');
  assert.match(cast, /#4c6b9b/, "guest's denim hoodie");
  // The tan era's teal and cream must be gone from all three.
  for (const [id, text] of Object.entries({ style, porch, cast })) {
    assert.doesNotMatch(text, /#197b83|#f7f5ef|warm cream background/i, `${id} still carries tan-era values`);
  }
});

test('the markdown "> " prefix is stripped from every line', () => {
  for (const text of Object.values(loadBlocks())) {
    assert.doesNotMatch(text, /^>/m, 'a blockquote marker survived extraction');
  }
});

test("Block A keeps its bulleted colour list, which spans quoted blank lines", () => {
  const { style } = loadBlocks();
  assert.match(style, /- walls a pale lavender-grey/);
  assert.match(style, /- a woven doormat in muted taupe/);
});

test('the porch block stays separate from Block A', () => {
  const { style, porch } = loadBlocks();
  assert.doesNotMatch(style, /house siding/, 'porch text must not bleed into the interior block');
  assert.match(porch, /No sky detail/);
});

test('a brief missing a heading fails loudly rather than returning empty text', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'brief-'));
  const f = path.join(dir, 'partial.md');
  fs.writeFileSync(f, '## Block A — style\n\n> Something.\n');
  assert.throws(() => loadBlocks(f), /missing the "porch" heading/);
});

test('a heading with no blockquote under it fails loudly', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'brief-'));
  const f = path.join(dir, 'empty.md');
  fs.writeFileSync(f, '## Block A — style\n\nprose but no quote\n\n### The porch\n\n> x\n\n## Block B — the cast\n\n> y\n');
  assert.throws(() => loadBlocks(f), /has no blockquote under it/);
});

test('a brief that is not there fails with the path in the message', () => {
  assert.throws(() => loadBlocks('/nope/missing-brief.md'), /brief not found/);
});

// --- the shared extractor, which pilot.mjs also depends on -----------------

test('blockquoteAfter stops at the next heading', () => {
  const lines = ['## A', '> one', '> two', '', '## B', '> three'].join('\n').split('\n');
  assert.equal(blockquoteAfter(lines, findHeading(lines, (l) => /^## A/.test(l))), 'one\ntwo');
});

test('blockquoteAfter skips prose between the heading and the quote', () => {
  const lines = ['### H', '', 'some prose', '', '> quoted', ''].join('\n').split('\n');
  assert.equal(blockquoteAfter(lines, findHeading(lines, (l) => /^### H/.test(l))), 'quoted');
});

test('a heading with no quote does not borrow the next heading\'s', () => {
  // The failure this guards is silent: extraction succeeds, returns plausible
  // prose, and the wrong block ends up in a paid image request.
  const lines = ['## A', '', 'prose only', '', '## B', '> B\'s quote'].join('\n').split('\n');
  assert.equal(blockquoteAfter(lines, findHeading(lines, (l) => /^## A/.test(l))), '');
});

test('findHeading returns null rather than -1 when absent', () => {
  assert.equal(findHeading(['# x'], (l) => /nope/.test(l)), null);
});
