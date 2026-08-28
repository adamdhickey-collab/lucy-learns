// node --test scripts/lib/*.test.mjs
//
// What these cover: prompt assembly, reference ordering, missing references,
// and invalid specs. No network, no image processing, no macOS tools — so they
// run anywhere, including the Linux box the code is written on.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { validateScene, loadScene, assemblePrompt, legacyMaster, ROLES, SCENES_DIR } from './scene.mjs';
import { loadBlocks, BLOCK_IDS, BRIEF_ID } from './brief.mjs';

const BLOCKS = { style: 'STYLE BLOCK', porch: 'PORCH BLOCK', cast: 'CAST BLOCK' };

/** A spec that passes, which each test then breaks in exactly one way. */
const good = (over = {}) => ({
  id: 'test-scene',
  briefId: BRIEF_ID,
  blocks: ['style', 'cast'],
  scene: 'A room. Something happens in it.',
  mustBeTrue: 'the thing happened',
  references: [
    { path: 'art/source/trainer-reference.jpg', role: 'likeness:handler' },
    { path: 'art/source/lucy-reference.jpg', role: 'likeness:lucy' },
  ],
  ...over,
});

// --- validation ------------------------------------------------------------

test('a well-formed spec validates', () => {
  const s = validateScene(good(), { checkFiles: false });
  assert.equal(s.id, 'test-scene');
  assert.equal(s.references.length, 2);
});

test('missing scene text is rejected', () => {
  assert.throws(() => validateScene(good({ scene: '   ' }), { checkFiles: false }), /scene text is required/);
});

test('missing mustBeTrue is rejected', () => {
  assert.throws(() => validateScene(good({ mustBeTrue: undefined }), { checkFiles: false }), /mustBeTrue is required/);
});

test('a spec with no briefId is rejected', () => {
  assert.throws(() => validateScene(good({ briefId: undefined }), { checkFiles: false }), /briefId is required/);
});

test('a spec written for a superseded brief is rejected, not silently regenerated', () => {
  assert.throws(
    () => validateScene(good({ briefId: 'warm-instructional-v1' }), { checkFiles: false }),
    /is not the current brief "cool-flat-v1"/
  );
});

test('an unknown block is rejected, and names the offender', () => {
  assert.throws(
    () => validateScene(good({ blocks: ['style', 'sepia'] }), { checkFiles: false }),
    /unknown block "sepia"/
  );
});

test('empty blocks array is rejected', () => {
  assert.throws(() => validateScene(good({ blocks: [] }), { checkFiles: false }), /non-empty array/);
});

test('an unknown reference role is rejected', () => {
  const spec = good({ references: [{ path: 'a.jpg', role: 'likeness:cat' }] });
  assert.throws(() => validateScene(spec, { checkFiles: false }), /unknown role "likeness:cat"/);
});

test('a duplicate reference is rejected', () => {
  const spec = good({
    references: [
      { path: 'same.jpg', role: 'likeness:handler' },
      { path: 'same.jpg', role: 'likeness:lucy' },
    ],
  });
  assert.throws(() => validateScene(spec, { checkFiles: false }), /duplicate reference/);
});

test('every problem is reported at once, not just the first', () => {
  const spec = good({ scene: '', mustBeTrue: '', blocks: ['nope'] });
  try {
    validateScene(spec, { checkFiles: false });
    assert.fail('should have thrown');
  } catch (e) {
    assert.ok(e.problems.length >= 3, `expected 3+ problems, got ${e.problems.length}`);
  }
});

// --- missing reference files ----------------------------------------------

test('a reference that is not on disk is rejected when files are checked', () => {
  const spec = good({ references: [{ path: 'art/source/nope-not-here.jpg', role: 'likeness:lucy' }] });
  assert.throws(() => validateScene(spec, { checkFiles: true }), /file not found — art\/source\/nope-not-here\.jpg/);
});

test('real references on disk resolve and are marked present', () => {
  const s = validateScene(good(), { checkFiles: true });
  assert.ok(s.references.every((r) => r.exists), 'both fixtures should exist in the repo');
  assert.ok(path.isAbsolute(s.references[0].abs));
});

// --- ordering --------------------------------------------------------------

test('reference order is preserved and numbered from 1', () => {
  const spec = good({
    references: [
      { path: 'art/source/lucy-reference.jpg', role: 'likeness:lucy' },
      { path: 'art/source/trainer-reference.jpg', role: 'likeness:handler' },
    ],
  });
  const s = validateScene(spec, { checkFiles: false });
  assert.deepEqual(
    s.references.map((r) => [r.order, path.basename(r.path)]),
    [[1, 'lucy-reference.jpg'], [2, 'trainer-reference.jpg']]
  );
});

test('reordering the spec reorders the prompt text too', () => {
  const a = assemblePrompt(validateScene(good(), { checkFiles: false }), BLOCKS);
  const flipped = good({ references: [...good().references].reverse() });
  const b = assemblePrompt(validateScene(flipped, { checkFiles: false }), BLOCKS);
  assert.notEqual(a, b, 'attachment numbering must follow the declared order');
  assert.match(a, /1\. trainer-reference\.jpg/);
  assert.match(b, /1\. lucy-reference\.jpg/);
});

// --- prompt assembly -------------------------------------------------------

test('the prompt contains its blocks, in the declared order', () => {
  const p = assemblePrompt(validateScene(good(), { checkFiles: false }), BLOCKS);
  assert.ok(p.indexOf('STYLE BLOCK') < p.indexOf('CAST BLOCK'));
  assert.ok(!p.includes('PORCH BLOCK'), 'a block not asked for must not appear');
});

test('an exterior scene can pull the porch block in', () => {
  const spec = good({ blocks: ['style', 'porch', 'cast'] });
  const p = assemblePrompt(validateScene(spec, { checkFiles: false }), BLOCKS);
  assert.ok(p.includes('PORCH BLOCK'));
});

test('the prompt carries the scene text and the must-be-true line', () => {
  const p = assemblePrompt(validateScene(good(), { checkFiles: false }), BLOCKS);
  assert.match(p, /SCENE\. A room\. Something happens in it\./);
  assert.match(p, /MUST BE TRUE: the thing happened/);
});

test('the likeness warning appears only when a likeness sheet is attached', () => {
  const withSheet = assemblePrompt(validateScene(good(), { checkFiles: false }), BLOCKS);
  assert.match(withSheet, /likeness only/i);

  const noSheet = good({
    references: [{ path: 'art/source/splash-source.png', role: 'continuity:room' }],
  });
  const without = assemblePrompt(validateScene(noSheet, { checkFiles: false }), BLOCKS);
  assert.doesNotMatch(without, /likeness only/i);
});

test('every role has a sentence, so no attachment can go unlabelled', () => {
  for (const [role, text] of Object.entries(ROLES)) {
    assert.ok(typeof text === 'string' && text.length > 10, `${role} needs a description`);
  }
});

// --- loading from disk -----------------------------------------------------

test('loadScene rejects an id with no spec file', () => {
  assert.throws(() => loadScene('no-such-scene'), /no scene spec at/);
});

test('loadScene rejects a spec whose id disagrees with its filename', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scenes-'));
  fs.writeFileSync(path.join(dir, 'alpha.json'), JSON.stringify(good({ id: 'beta' })));
  assert.throws(() => loadScene('alpha', { dir, checkFiles: false }), /does not match filename/);
});

test('loadScene rejects malformed JSON with the filename in the message', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scenes-'));
  fs.writeFileSync(path.join(dir, 'broken.json'), '{ not json');
  assert.throws(() => loadScene('broken', { dir, checkFiles: false }), /is not valid JSON/);
});

test('the real pilot scene loads, validates and assembles against the live brief', () => {
  const scene = loadScene('door-sound-03-name');
  assert.equal(scene.briefId, BRIEF_ID);
  assert.equal(scene.references.length, 3);
  assert.deepEqual(scene.references.map((r) => r.role), [
    'likeness:handler',
    'likeness:lucy',
    'continuity:room',
  ]);
  assert.ok(scene.references.every((r) => r.exists), 'all three references must be on disk');

  const p = assemblePrompt(scene, loadBlocks());
  // The live brief, not the superseded warm one: these are Block A's own values.
  assert.match(p, /#eae7f0/, 'must carry the cool wall from the current brief');
  assert.match(p, /#4a216d/, 'must carry the collar violet');
  assert.doesNotMatch(p, /Warm Instructional Vector/);
  assert.match(p, /1\. trainer-reference\.jpg/);
  assert.match(p, /3\. door-sound-02-self\.png/);
});

// --- the legacy warm masters ----------------------------------------------

test('the pilot scene has a legacy warm master, and it is reported as one', () => {
  const found = legacyMaster('door-sound-03-name');
  assert.ok(found, 'art/pilot/approved/door-sound-03-name.* should exist');
  assert.match(found.path, /^art\/pilot\/approved\//);
});

test('a scene with no legacy master returns null rather than a bad path', () => {
  assert.equal(legacyMaster('no-such-scene-anywhere'), null);
});

test('every scene spec in art/scenes/ is valid', () => {
  const files = fs.existsSync(SCENES_DIR)
    ? fs.readdirSync(SCENES_DIR).filter((f) => f.endsWith('.json'))
    : [];
  assert.ok(files.length > 0, 'expected at least the pilot scene');
  for (const f of files) loadScene(f.replace(/\.json$/, ''));
});
