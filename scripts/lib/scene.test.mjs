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
  refuseStale,
  stampShippedUnder,
} from './scene.mjs';
import { loadBlocks, BLOCK_IDS, BRIEF_ID, SUPERSEDED_BRIEFS, ROOT } from './brief.mjs';

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
    /is not the current brief "cool-flat-v2"/
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

test('the cast block carries the anatomy rule, and it reaches the prompt', () => {
  // door-stay-03-cross shipped with three hands. A per-spec clause would have
  // caught that one picture; this is in the brief so it reaches all of them.
  const blocks = loadBlocks();
  assert.match(blocks.cast, /ANATOMY/);
  assert.match(blocks.cast, /exactly two arms, two hands and two legs/i);
  const p = assemblePrompt(validateScene(good(), { checkFiles: false }));
  assert.match(p, /ANATOMY/, 'a scene using the cast block must carry it');
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

test('the real pilot scene loads, validates and assembles — and is stale until re-declared', () => {
  const scene = loadScene('door-sound-03-name');
  // Its picture shipped under the first cool brief. The spec still says so,
  // which is the committed record of what is left to redraw, and loading it
  // is how status finds that out; only spending, previewing and installing
  // are refused (see refuseStale below).
  assert.ok(SUPERSEDED_BRIEFS.includes(scene.briefId), scene.briefId);
  assert.equal(scene.stale, true);
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
  assert.match(p, /#e9e5df/, 'must carry the plaster wall from the current brief');
  assert.match(p, /#4a216d/, 'must carry the collar violet');
  assert.doesNotMatch(p, /Warm Instructional Vector/);
  assert.match(p, /1\. door-sound-02-self\.png/);
  assert.match(p, /2\. trainer-reference\.jpg/);
  assert.match(p, /ATTACHMENT 1 IS THE STYLE REFERENCE/);
});

test('the scene re-declared for the live brief is current, and the first v2 exemplar', () => {
  const scene = loadScene('door-sound-02-self');
  assert.equal(scene.briefId, BRIEF_ID);
  assert.equal(scene.stale, false);
  assert.doesNotThrow(() => refuseStale(scene));
});

test('shippedUnder is optional, must be a known brief, and is kept on the scene', () => {
  assert.equal(validateScene(good(), { checkFiles: false }).shippedUnder, undefined);
  assert.equal(validateScene(good({ shippedUnder: SUPERSEDED_BRIEFS[0] }), { checkFiles: false }).shippedUnder, SUPERSEDED_BRIEFS[0]);
  assert.throws(
    () => validateScene(good({ shippedUnder: 'warm-instructional-v1' }), { checkFiles: false }),
    /shippedUnder "warm-instructional-v1" is not a brief this pipeline knows/
  );
});

test('stampShippedUnder sets one field beside briefId and touches nothing else', () => {
  const text = JSON.stringify({ id: 'x', briefId: BRIEF_ID, title: 'T', scene: 's' }, null, 2) + '\n';
  const stamped = stampShippedUnder(text, BRIEF_ID);
  assert.deepEqual(Object.keys(JSON.parse(stamped)), ['id', 'briefId', 'shippedUnder', 'title', 'scene']);
  assert.equal(JSON.parse(stamped).shippedUnder, BRIEF_ID);
  // Idempotent, and a re-stamp under a newer brief replaces rather than duplicates.
  assert.equal(stampShippedUnder(stamped, BRIEF_ID), stamped);
  assert.equal(stamped.split('\n').length, text.split('\n').length + 1, 'one line added');
});

test('a ladder rung waits for the previous rung to ship under the current brief; the exemplar does not', () => {
  // The real register: every rung shipped under the first cool brief. A rung
  // re-declared for v2 is therefore blocked on the rung before it, while the
  // same v1 picture used as a style exemplar is not — Block A carves the wall
  // out of the exemplar by name, but a ladder is composition, not style.
  const rung = JSON.parse(fs.readFileSync(path.join(SCENES_DIR, 'door-stay-03-halfway.json'), 'utf8'));
  const redeclared = validateScene({ ...rung, briefId: BRIEF_ID });
  const byRole = Object.fromEntries(redeclared.references.map((r) => [r.role, r]));
  assert.equal(byRole['continuity:ladder'].pending, true, 'door-stay-03-onestep shipped under v1');
  assert.equal(byRole['style:exemplar'].pending, false, 'the exemplar may be a v1 picture');
  assert.deepEqual(pendingReferences(redeclared).map((r) => r.fromScene), ['door-stay-03-onestep']);
  // Still stale, the same rung asks nothing of its references: it is refused first.
  const stale = validateScene(rung);
  assert.equal(pendingReferences(stale).length, 0);
});

test('a superseded briefId validates and is marked stale; an unknown one is refused', () => {
  const stale = validateScene(good({ briefId: SUPERSEDED_BRIEFS[0] }), { checkFiles: false });
  assert.equal(stale.stale, true);
  assert.throws(() => refuseStale(stale), /shipped under brief "cool-flat-v1"/);
  assert.throws(() => refuseStale(stale), /set its briefId to "cool-flat-v2"/);
  assert.throws(
    () => validateScene(good({ briefId: 'warm-instructional-v1' }), { checkFiles: false }),
    /or a superseded one \(cool-flat-v1\)/
  );
  assert.equal(validateScene(good(), { checkFiles: false }).stale, false);
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

test('a rung whose predecessor shipped under the current brief is not pending; under an older one it is', () => {
  // A register of one predecessor, in a dir of its own, so the test can say
  // which brief it shipped under without touching the real specs.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scenes-'));
  const predecessor = JSON.parse(fs.readFileSync(path.join(SCENES_DIR, 'door-sound-01-setup.json'), 'utf8'));
  const rung = good({ references: [{ scene: 'door-sound-01-setup', role: 'continuity:ladder' }] });
  const write = (shippedUnder) =>
    fs.writeFileSync(path.join(dir, 'door-sound-01-setup.json'), JSON.stringify({ ...predecessor, shippedUnder }));

  write(BRIEF_ID);
  const done = validateScene(rung, { checkFiles: true, scenesDir: dir });
  assert.equal(done.references[0].pending, false);
  assert.deepEqual(pendingReferences(done), []);

  write(SUPERSEDED_BRIEFS[0]);
  const behind = validateScene(rung, { checkFiles: true, scenesDir: dir });
  assert.equal(behind.references[0].pending, true);
  assert.deepEqual(pendingReferences(behind).map((r) => r.fromScene), ['door-sound-01-setup']);

  // No record at all — the hand-drawn pictures — is pending too.
  fs.unlinkSync(path.join(dir, 'door-sound-01-setup.json'));
  assert.equal(validateScene(rung, { checkFiles: true, scenesDir: dir }).references[0].pending, true);
});

/**
 * Pending came back with the second brief.
 *
 * While the first restyle ran, art/pilot/approved/ held warm masters and cool
 * ones under the same keys, and only the pilot ledger could tell them apart —
 * so a reference to a not-yet-redrawn picture was "pending" and `generate`
 * refused it. The ledger went at the finish line, and for a while nothing was
 * pending because nothing was left to redraw. cool-flat-v2 is the "future set"
 * that comment allowed for: the question is real again, and the answer now
 * lives in each spec's `shippedUnder` rather than in a ledger.
 */
test('a continuity reference is pending until the picture ships under the current brief', () => {
  // The real register: every rung shipped under the first cool brief.
  const spec = good({ references: [{ scene: 'door-stay-03-cross', role: 'continuity:ladder' }] });
  const s = validateScene(spec, { checkFiles: true });
  assert.equal(s.references[0].pending, true);
  assert.deepEqual(pendingReferences(s).map((r) => r.fromScene), ['door-stay-03-cross']);
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

test('every ladder rung resolves, and none of them waits', () => {
  // This asserted that a rung waited exactly while its predecessor was absent
  // from the pilot ledger. The ledger is gone and the ladder is drawn, so what
  // is left worth pinning is that every rung still resolves its predecessor to
  // a real master and nothing reports itself blocked.
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
    const scene = loadScene(rung);
    const ladder = scene.references.filter((r) => r.role === 'continuity:ladder');
    assert.deepEqual(ladder.map((r) => r.fromScene), [predecessor], rung);
    assert.ok(ladder[0].exists, `${predecessor}'s master should be on disk`);
    assert.deepEqual(pendingReferences(scene), [], rung);
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
