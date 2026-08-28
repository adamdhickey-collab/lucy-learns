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

import {
  validateScene,
  loadScene,
  assemblePrompt,
  legacyMaster,
  pendingReferences,
  ROLES,
  SCENES_DIR,
} from './scene.mjs';
import { loadBlocks, BLOCK_IDS, BRIEF_ID, ROOT } from './brief.mjs';
import { ledgerKeys } from './ledger.mjs';

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

  // Deliberately a redrawn scene: the fixture used to be splash-source.png,
  // which later joined SUPERSEDED_RENDERING and started firing the warning it
  // was here to prove absent. It has to be a reference that is genuinely flat.
  const noSheet = good({
    references: [
      { path: 'art/source/Calm Door Greetings/door-greet-07-approach.png', role: 'continuity:room' },
    ],
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
  // The flat scene was the room reference; it is now the exemplar, which
  // carries the room instruction with it rather than being attached twice.
  assert.equal(scene.references.length, 3);
  assert.deepEqual(scene.references.map((r) => r.role), [
    'style:exemplar',
    'likeness:handler',
    'likeness:lucy',
  ]);
  assert.ok(scene.references.every((r) => r.exists), 'all three references must be on disk');

  const p = assemblePrompt(scene, loadBlocks());
  // The live brief, not the superseded warm one: these are Block A's own values.
  assert.match(p, /#eae7f0/, 'must carry the cool wall from the current brief');
  assert.match(p, /#4a216d/, 'must carry the collar violet');
  assert.doesNotMatch(p, /Warm Instructional Vector/);
  assert.match(p, /1\. door-sound-02-self\.png/);
  assert.match(p, /2\. trainer-reference\.jpg/);
  assert.match(p, /ATTACHMENT 1 IS THE STYLE REFERENCE/);
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

test('the painterly warning fires on the sheets, not on the word likeness', () => {
  // The guest's likeness reference is a redrawn scene — already flat, already
  // cool. Telling the model to ignore its rendering would throw away the only
  // example of the target style in the request.
  const guestOnly = good({
    references: [
      { path: 'art/source/Calm Door Greetings/door-greet-08-petting.png', role: 'likeness:guest' },
    ],
  });
  const p = assemblePrompt(validateScene(guestOnly, { checkFiles: false }), BLOCKS);
  assert.match(p, /likeness:guest|copy his face/i, 'the guest reference is still labelled');
  assert.doesNotMatch(p, /painted in an older style/,
    'a flat reference must not be described as painterly');

  // The two sheets still trigger it.
  const withSheets = assemblePrompt(validateScene(good(), { checkFiles: false }), BLOCKS);
  assert.match(withSheets, /painted in an older style/);
});

test('every greeting scene puts the guest in the current clothes', () => {
  for (const id of [
    'door-greet-04-open',
    'door-greet-05-reward',
    'door-greet-06-enter',
    'door-greet-06-seated',
    'door-greet-09-leaves',
    'door-greet-cover',
  ]) {
    const scene = loadScene(id);
    assert.match(scene.scene, /blue zip-up hoodie/, `${id} must name the hoodie`);
    assert.match(scene.scene, /NOT in a plaid or checked shirt/,
      `${id} must rule out the replaced character`);
    assert.ok(
      scene.references.some((r) => r.role === 'likeness:guest'),
      `${id} must attach the guest's likeness`
    );
  }
});

test('every scene spec in art/scenes/ is valid', () => {
  const files = fs.existsSync(SCENES_DIR)
    ? fs.readdirSync(SCENES_DIR).filter((f) => f.endsWith('.json'))
    : [];
  assert.ok(files.length > 0, 'expected at least the pilot scene');
  for (const f of files) loadScene(f.replace(/\.json$/, ''));
});

// --- ladder references ------------------------------------------------------
//
// A rung names the scene before it rather than a file. The file it resolves to
// usually EXISTS already — as the legacy warm master — so "is it on disk" is
// the wrong question and these guard the right one.

test('a scene reference resolves to that scene\'s approved master', () => {
  const spec = good({
    references: [{ scene: 'door-sound-01-setup', role: 'continuity:ladder' }],
  });
  const s = validateScene(spec, { checkFiles: false });
  assert.equal(s.references[0].path, 'art/pilot/approved/door-sound-01-setup.png');
  assert.equal(s.references[0].fromScene, 'door-sound-01-setup');
});

test('a reference needs exactly one of path or scene', () => {
  for (const ref of [
    { role: 'continuity:ladder' },
    { path: 'a.png', scene: 'b', role: 'continuity:ladder' },
  ]) {
    assert.throws(
      () => validateScene(good({ references: [ref] }), { checkFiles: false }),
      /needs exactly one of path or scene/
    );
  }
});

test('a scene cannot reference itself', () => {
  const spec = good({ id: 'loop', references: [{ scene: 'loop', role: 'continuity:ladder' }] });
  assert.throws(() => validateScene(spec, { checkFiles: false }), /cannot reference itself/);
});

test('a rung whose predecessor is redrawn is not pending', () => {
  // door-sound-01-setup is in the pilot ledger, so it counts as current.
  const spec = good({ references: [{ scene: 'door-sound-01-setup', role: 'continuity:ladder' }] });
  const s = validateScene(spec, { checkFiles: true });
  assert.equal(s.references[0].pending, false);
  assert.deepEqual(pendingReferences(s), []);
});

/**
 * A scene whose legacy warm master is on disk but which the pilot ledger has
 * not claimed yet.
 *
 * Chosen at run time rather than named. This test used to name
 * door-sound-03-name, and approving that scene turned the fixture into an
 * example of the opposite thing — the test failed because the pipeline worked.
 */
function legacyOnlyScene() {
  const ledger = new Set(ledgerKeys(fs.readFileSync(path.join(ROOT, 'css/app.css'), 'utf8')));
  return fs
    .readdirSync(SCENES_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
    .find((id) => !ledger.has(id) && legacyMaster(id));
}

test('a legacy warm master on disk still counts as pending', () => {
  // The trap: the file is there, but it is the warm master. Existence is not
  // the question — the ledger is.
  const id = legacyOnlyScene();
  assert.ok(id, 'no un-redrawn legacy master left for this test to mean anything');
  const spec = good({ references: [{ scene: id, role: 'continuity:ladder' }] });
  const s = validateScene(spec, { checkFiles: true });
  assert.equal(s.references[0].exists, true, 'the file is there');
  assert.equal(s.references[0].pending, true, 'but it is not the current brief');
  assert.deepEqual(pendingReferences(s).map((r) => r.fromScene), [id]);
});

test('a pending rung is not a validation error — plan must still run', () => {
  const spec = good({ references: [{ scene: 'door-stay-03-cross', role: 'continuity:ladder' }] });
  assert.doesNotThrow(() => validateScene(spec, { checkFiles: true }));
});

test('the Stay ladder chains in order, each rung off the last', () => {
  const order = [
    'door-stay-03-onestep',
    'door-stay-03-halfway',
    'door-stay-03-cross',
    'door-stay-03-handle',
    'door-stay-03-crack',
    'door-stay-03-pretend',
    'door-stay-03-conversation',
  ];
  order.forEach((id, i) => {
    const scene = loadScene(id);
    const rungs = scene.references.filter((r) => r.role === 'continuity:ladder');
    if (i === 0) {
      assert.equal(rungs.length, 0, 'the first rung has nothing before it');
    } else {
      assert.deepEqual(rungs.map((r) => r.fromScene), [order[i - 1]],
        `${id} must be drawn off ${order[i - 1]}`);
    }
  });
});

test('a rung waits on its predecessor exactly while that predecessor is not redrawn', () => {
  // This asserted that every rung was waiting, "since none are redrawn yet",
  // which stopped being true the day the ladder was finished — the sixth test in
  // this repo to fail because the thing it described had succeeded. The
  // relationship holds at every point on the walk, so that is what it checks.
  const redrawn = new Set(ledgerKeys(fs.readFileSync(path.join(ROOT, 'css/app.css'), 'utf8')));
  const chain = {
    'door-stay-03-halfway': 'door-stay-03-onestep',
    'door-stay-03-cross': 'door-stay-03-halfway',
    'door-stay-03-handle': 'door-stay-03-cross',
    'door-stay-03-crack': 'door-stay-03-handle',
    'door-stay-03-pretend': 'door-stay-03-crack',
    'door-stay-03-conversation': 'door-stay-03-pretend',
    'door-stay-cover': 'door-stay-03-conversation',
  };
  for (const [rung, predecessor] of Object.entries(chain)) {
    const waiting = pendingReferences(loadScene(rung)).map((r) => r.fromScene);
    assert.deepEqual(waiting, redrawn.has(predecessor) ? [] : [predecessor], rung);
  }
});

test('the two documented near-duplicates are told apart in their own text', () => {
  // The tan-era post-mortem names these two collisions; the distinction has to
  // survive in the spec, not just in the write-up.
  const halfway = loadScene('door-stay-03-halfway');
  const cross = loadScene('door-stay-03-cross');
  assert.match(halfway.mustBeTrue, /standing still|stopped/i);
  assert.match(cross.mustBeTrue, /walking/i);

  const pretend = loadScene('door-stay-03-pretend');
  const conversation = loadScene('door-stay-03-conversation');
  assert.match(pretend.mustBeTrue, /square and upright|not leaning/i);
  assert.match(conversation.mustBeTrue, /leaning/i);

  // A third pair, found when these two were given specs so the door's window
  // could be corrected. They are the same hall, camera, crop, dog and trapped
  // leash; the arms are the only thing that separates them, so the arms have to
  // be what each claim is about.
  const setup = loadScene('door-sound-01-setup');
  const self = loadScene('door-sound-02-self');
  assert.match(setup.mustBeTrue, /hands are empty|at her sides/i);
  assert.match(self.mustBeTrue, /knocking|fist/i);
});

// --- the style exemplar -----------------------------------------------------

test('the style lead comes before the blocks, not after them', () => {
  const spec = good({
    references: [
      { path: 'art/source/Calm Door Greetings/door-sound-02-self.png', role: 'style:exemplar' },
      ...good().references,
    ],
  });
  const p = assemblePrompt(validateScene(spec, { checkFiles: false }), BLOCKS);
  assert.ok(p.indexOf('ATTACHMENT 1 IS THE STYLE REFERENCE') < p.indexOf('STYLE BLOCK'),
    'three hundred words too late is no use');
});

test('a scene with no exemplar gets no style lead', () => {
  const p = assemblePrompt(validateScene(good(), { checkFiles: false }), BLOCKS);
  assert.doesNotMatch(p, /ATTACHMENT 1 IS THE STYLE REFERENCE/);
});

test('an exemplar anywhere but first is refused', () => {
  const spec = good({
    references: [
      ...good().references,
      { path: 'art/source/Calm Door Greetings/door-sound-02-self.png', role: 'style:exemplar' },
    ],
  });
  assert.throws(() => validateScene(spec, { checkFiles: false }), /must be the first reference/);
});

test('every spec leads with a flat exemplar', () => {
  const ids = fs.readdirSync(SCENES_DIR).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
  for (const id of ids) {
    const scene = loadScene(id);
    assert.equal(scene.references[0].role, 'style:exemplar', `${id} does not lead with one`);
  }
});
