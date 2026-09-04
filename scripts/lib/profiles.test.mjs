// node --test scripts/lib/*.test.mjs
//
// The profile mechanism: a scene's output shape as data rather than as numbers
// hardcoded in five places. What is worth pinning is not that `icon` exists, but
// that adding it did not quietly change the thirty-seven — and that the parts a
// profile does NOT control are still shared.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { PROFILES, PROFILE_IDS, DEFAULT_PROFILE, profileFor, isDirect } from './profiles.mjs';
import { SIZE_LIMITS, SOURCE, MASTER, buildForm, manifestSkeleton, outputPaths } from './request.mjs';
import { renditionPlan, ICON_SIZES, ICON_SAFE_ZONE } from './renditions.mjs';
import { validateScene, assemblePrompt, SCENES_DIR } from './scene.mjs';
import { cmdApprove, ICON_SOURCE, ICON_OUTPUTS, ICON_BUILD, CSS, WORKLIST } from './approve.mjs';
import { ROOT, BRIEF_ID } from './brief.mjs';
import { worklistRemaining } from './worklist.mjs';
import { imageSize } from './imagesize.mjs';

// --- the shapes themselves --------------------------------------------------

test('every profile canvas is one gpt-image-2 will actually accept', () => {
  for (const p of Object.values(PROFILES)) {
    const { width: w, height: h } = p.source;
    assert.equal(w % SIZE_LIMITS.edgeMultipleOf, 0, `${p.id}: ${w} must be /16`);
    assert.equal(h % SIZE_LIMITS.edgeMultipleOf, 0, `${p.id}: ${h} must be /16`);
    assert.ok(Math.max(w, h) <= SIZE_LIMITS.maxEdge, `${p.id}: too long an edge`);
    assert.ok(w * h >= SIZE_LIMITS.minPixels, `${p.id}: too few pixels`);
    assert.ok(w * h <= SIZE_LIMITS.maxPixels, `${p.id}: too many pixels`);
    const aspect = Math.max(w / h, h / w);
    assert.ok(aspect <= SIZE_LIMITS.maxAspect, `${p.id}: ${aspect} is past the aspect limit`);
  }
});

test('a master never asks for more pixels than the canvas returned', () => {
  for (const p of Object.values(PROFILES)) {
    assert.ok(p.master.width <= p.source.width, `${p.id} would upscale the width`);
    assert.ok(p.master.height <= p.source.height, `${p.id} would upscale the height`);
  }
});

test('a downscaling profile keeps the canvas ratio exactly, so no crop is needed', () => {
  for (const p of Object.values(PROFILES)) {
    if (isDirect(p)) continue;
    const ratio = (d) => d.width / d.height;
    assert.equal(ratio(p.source), ratio(p.master), `${p.id}: reaching the master needs a crop`);
  }
});

test('the scene profile is still exactly what request.mjs exported before', () => {
  // The thirty-seven are mid-flight. If this drifts, every remaining picture
  // comes back a different size than the ones already approved.
  assert.deepEqual(SOURCE, { width: 1472, height: 1104 });
  assert.deepEqual(MASTER, { width: 1448, height: 1086 });
  assert.deepEqual(PROFILES.scene.source, SOURCE);
  assert.deepEqual(PROFILES.scene.master, MASTER);
});

// --- selection --------------------------------------------------------------

test('a spec with no profile is a scene, so the thirty-seven need no edit', () => {
  assert.equal(DEFAULT_PROFILE, 'scene');
  assert.equal(profileFor({}), PROFILES.scene);
  assert.equal(profileFor({ profile: undefined }), PROFILES.scene);
  assert.equal(profileFor(undefined), PROFILES.scene);
});

test('an unknown profile is refused rather than defaulted', () => {
  // Defaulting would draw an icon on a 4:3 canvas and charge for it, and the
  // result would look like a bad picture rather than a bad spec.
  assert.throws(
    () => validateScene(good({ profile: 'sqaure' }), { checkFiles: false }),
    /unknown profile "sqaure"/
  );
});

test('every declared profile id is one validateScene accepts', () => {
  for (const id of PROFILE_IDS) {
    assert.doesNotThrow(() => validateScene(good({ profile: id }), { checkFiles: false }), id);
  }
});

// --- what the profile reaches -----------------------------------------------

test('the form carries the profile canvas, not the scene default', () => {
  const scene = validateScene(good({ profile: 'icon' }), { checkFiles: false });
  const form = buildForm(scene, 'PROMPT', () => Buffer.from([1]), PROFILES.icon);
  assert.equal(form.get('size'), '1024x1024');
  // Everything else in REQUEST.parameters still comes through untouched.
  assert.equal(form.get('model'), 'gpt-image-2');
  assert.equal(form.get('quality'), 'high');
});

test('the manifest records which shape was asked for', () => {
  const scene = validateScene(good({ profile: 'icon' }), { checkFiles: false });
  const m = manifestSkeleton(scene, outputPaths('app-icon', 3), null, PROFILES.icon);
  assert.equal(m.profile, 'icon');
  assert.equal(m.request.size, '1024x1024');
  assert.equal(m.output.rawSize, '1024x1024');
  assert.equal(m.output.masterSize, '1024x1024');
});

test('a scene manifest still says scene, and still says 1472x1104', () => {
  const m = manifestSkeleton(validateScene(good(), { checkFiles: false }), outputPaths('s', 1));
  assert.equal(m.profile, 'scene');
  assert.equal(m.request.size, '1472x1104');
  assert.equal(m.output.masterSize, '1448x1086');
});

// --- renditions -------------------------------------------------------------

test('the icon renditions are the safe zone plus the sizes it is seen at', () => {
  const plan = renditionPlan('m.png', 'crops', 'app-icon', 1024, 1024, 'icon');
  assert.deepEqual(
    plan.map((r) => r.name),
    ['maskable-safe', ...ICON_SIZES.map((s) => `icon-${s}`)]
  );
  // The sheet renders 'thumb' cards unscaled and parses the px off the name.
  for (const r of plan.filter((r) => r.kind === 'thumb')) {
    assert.ok(ICON_SIZES.includes(Number(r.name.split('-').pop())), r.name);
  }
});

test('no icon rendition asks sips for more than the master has', () => {
  // sips pads an oversized crop rather than refusing it, which is a confident
  // wrong answer — the same trap the scene crops are written as ratios to avoid.
  const plan = renditionPlan('m.png', 'crops', 'app-icon', 1024, 1024, 'icon');
  const safe = plan.find((r) => r.name === 'maskable-safe');
  assert.equal(safe.box.w, Math.round(1024 * ICON_SAFE_ZONE));
  assert.ok(safe.box.w <= 1024 && safe.box.h <= 1024);
  assert.ok(safe.box.left >= 0 && safe.box.top >= 0);
  assert.ok(safe.box.left + safe.box.w <= 1024);
  assert.ok(safe.box.top + safe.box.h <= 1024);
  for (const size of ICON_SIZES) assert.ok(size <= 1024, `${size} would upscale the master`);
});

test('asking for the scene table still gets the crops it always got', () => {
  const named = renditionPlan('m.png', 'c', 's', MASTER.width, MASTER.height, 'scene');
  const defaulted = renditionPlan('m.png', 'c', 's', MASTER.width, MASTER.height);
  assert.deepEqual(defaulted.map((r) => r.name), named.map((r) => r.name));
  assert.deepEqual(named.map((r) => r.name), [
    'today-16x7', 'program-21x9', 'welcome-5x4', 'square', 'square-84', 'square-56',
  ]);
});

// --- the superseded-rendering warning ---------------------------------------
//
// Round 9 of app-icon came back with the shipping icon's soft airbrushed coat.
// The request had one flat exemplar and two softly-rendered attachments, and the
// warning did not fire on the second of them because it was a list of two
// filenames rather than a statement about what a reference carries.

test('a superseded reference is marked on its own line, not only in the note', () => {
  // The mark has to be inline: continuity:pair says "nothing but the action may
  // differ", which reads as an instruction to match rendering, and a note three
  // lines below does not reliably outrank it.
  const spec = good({
    references: [
      { path: 'art/source/Calm Door Greetings/door-sound-02-self.png', role: 'style:exemplar' },
      { path: 'icons/source.png', role: 'continuity:pair' },
    ],
  });
  const p = assemblePrompt(validateScene(spec, { checkFiles: false }), BLOCKS);
  assert.match(p, /source\.png — the companion picture[^\n]*NOT its rendering/);
  assert.match(p, /painted in an older style/);
});

test('the flat exemplar is never marked as superseded', () => {
  const spec = good({
    references: [
      { path: 'art/source/Calm Door Greetings/door-sound-02-self.png', role: 'style:exemplar' },
      { path: 'icons/source.png', role: 'continuity:pair' },
    ],
  });
  const p = assemblePrompt(validateScene(spec, { checkFiles: false }), BLOCKS);
  const exemplarLine = p.split('\n').find((l) => l.startsWith('1. '));
  assert.doesNotMatch(exemplarLine, /NOT its rendering/);
});

test('a request with no superseded reference carries no warning at all', () => {
  const spec = good({
    references: [
      { path: 'art/source/Calm Door Greetings/door-sound-02-self.png', role: 'style:exemplar' },
    ],
  });
  const p = assemblePrompt(validateScene(spec, { checkFiles: false }), BLOCKS);
  assert.doesNotMatch(p, /NOT its rendering/);
  assert.doesNotMatch(p, /painted in an older style/);
});

test('a superseded file cannot be the style exemplar', () => {
  // It is the one attachment the prompt says to copy exactly, so pointing it at
  // the old style would make the entire request argue for the old style.
  assert.throws(
    () =>
      validateScene(good({ references: [{ path: 'icons/source.png', role: 'style:exemplar' }] }), {
        checkFiles: false,
      }),
    /style:exemplar cannot be icons\/source\.png/
  );
});

test('the shipped icon spec attaches the current icon, and marks it', () => {
  // The spec that produced round 9, now carrying the fix. Read from disk rather
  // than rebuilt, so this fails if the real spec loses either property.
  const spec = JSON.parse(fs.readFileSync(path.join(ROOT, 'art/scenes/app-icon.json'), 'utf8'));
  assert.equal(spec.profile, 'icon');
  assert.equal(spec.references[0].role, 'style:exemplar');
  const pair = spec.references.find((r) => r.path === 'icons/source.png');
  assert.ok(pair, 'the current icon should still be attached to hold the composition');
  const p = assemblePrompt(validateScene(spec, { checkFiles: false }), BLOCKS);
  assert.match(p, /source\.png[^\n]*NOT its rendering/);
});

// --- approving an icon ------------------------------------------------------

test('approving an icon writes the source, runs the build, and touches nothing else', async () => {
  const t = iconTree();
  const res = await cmdApprove('app-icon', ['--yes'], t.opts);
  assert.equal(res.approved, true);

  // The source the generator reads is the round's master, byte for byte.
  assert.deepEqual(
    fs.readFileSync(path.join(t.dir, ICON_SOURCE)),
    fs.readFileSync(path.join(t.dir, t.out.master))
  );
  assert.deepEqual(t.ran, [ICON_BUILD.join(' ')], 'make-icons.mjs should have been run once');
  for (const f of ICON_OUTPUTS) assert.ok(fs.existsSync(path.join(t.dir, f)), f);

  // And the three registers that belong to the thirty-seven are untouched.
  assert.equal(fs.existsSync(path.join(t.dir, 'img')), false, 'an icon is not an img/ picture');
  assert.equal(t.read(CSS), t.cssBefore, 'an icon is not an illustration; the stylesheet is untouched');
  assert.equal(t.read(WORKLIST), t.worklistBefore, 'an icon is not one of the thirty-seven');
});

test('approving an icon does not move the finish line', async () => {
  const t = iconTree();
  const before = worklistRemaining(t.read(WORKLIST)).length;
  await cmdApprove('app-icon', ['--yes'], t.opts);
  assert.equal(worklistRemaining(t.read(WORKLIST)).length, before);
});

test('an icon build that writes nothing is an error, not a silent success', async () => {
  const t = iconTree({ build: () => {} });
  await assert.rejects(() => cmdApprove('app-icon', ['--yes'], t.opts), /did not write icons\//);
});

test('without --yes an icon approve writes nothing', async () => {
  const t = iconTree();
  const res = await cmdApprove('app-icon', [], t.opts);
  assert.equal(res.approved, false);
  assert.equal(fs.existsSync(path.join(t.dir, ICON_SOURCE)), false);
  assert.deepEqual(t.ran, []);
  assert.ok(t.lines.join('\n').includes('Re-run with --yes'));
});

test('an icon master at the wrong size is refused before anything is installed', async () => {
  const t = iconTree({ masterSize: { width: 1448, height: 1086 } });
  await assert.rejects(
    () => cmdApprove('app-icon', ['--yes'], t.opts),
    /is 1448×1086, not 1024×1024/
  );
  assert.equal(fs.existsSync(path.join(t.dir, ICON_SOURCE)), false);
});

// --- fixtures ---------------------------------------------------------------

const BLOCKS = { style: 'STYLE BLOCK', porch: 'PORCH BLOCK', cast: 'CAST BLOCK' };

/** A spec that passes, which each test then varies in exactly one way. */
const good = (over = {}) => ({
  id: 'test-scene',
  briefId: BRIEF_ID,
  blocks: ['style', 'cast'],
  references: [{ path: 'art/source/lucy-reference.jpg', role: 'likeness:lucy' }],
  scene: 'A scene.',
  mustBeTrue: 'It is a scene.',
  ...over,
});

/** A minimal PNG header the size readers can parse. */
function png(w, h) {
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0);
  ihdr.write('IHDR', 4);
  ihdr.writeUInt32BE(w, 8);
  ihdr.writeUInt32BE(h, 12);
  ihdr[16] = 8;
  ihdr[17] = 6;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), ihdr]);
}

/**
 * A temp tree holding what an icon approve touches.
 *
 * The stand-in for `node scripts/make-icons.mjs` writes the four files the real
 * one writes, so the read-back check has something to find; a test can pass a
 * build that writes nothing to prove the check fires.
 */

/**
 * The real spec, re-declared for the live brief, in a scenes dir of its own. The specs in art/scenes/ say which brief their shipped picture
 * was drawn under, and after a brief bump that is a superseded one — true, and
 * refused by every command that spends, previews or installs. A test of those
 * commands therefore needs a spec that is current, and this is the honest way
 * to get one: the real request, with the one word that makes it drawable now.
 */
function currentSpec(id) {
  // Its own temp dir, not the tree's: several tests assert the tree holds
  // nothing but what the command wrote, and this spec is not the command's.
  const scenes = fs.mkdtempSync(path.join(os.tmpdir(), 'scenes-'));
  const spec = JSON.parse(fs.readFileSync(path.join(SCENES_DIR, `${id}.json`), 'utf8'));
  fs.writeFileSync(path.join(scenes, `${id}.json`), JSON.stringify({ ...spec, briefId: BRIEF_ID }));
  return scenes;
}

function iconTree({ masterSize = PROFILES.icon.master, round = 1, build = null } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'icon-approve-'));
  const out = outputPaths('app-icon', round);
  const write = (p, data) => {
    fs.mkdirSync(path.join(dir, path.dirname(p)), { recursive: true });
    fs.writeFileSync(path.join(dir, p), data);
  };
  const css = fs.readFileSync(path.join(ROOT, CSS), 'utf8');
  const worklist = fs.readFileSync(path.join(ROOT, WORKLIST), 'utf8');
  write(CSS, css);
  write(WORKLIST, worklist);
  write(out.master, png(masterSize.width, masterSize.height));
  write(out.manifest, JSON.stringify({ briefId: BRIEF_ID, scene: 'app-icon', approved: false }));

  const ran = [];
  const defaultBuild = () => {
    for (const f of ICON_OUTPUTS) {
      const size = Number(/-(\d+)\.png$/.exec(f)[1]);
      write(f, png(size, size));
    }
  };
  const doBuild = build ?? defaultBuild;
  const lines = [];
  return {
    dir,
    out,
    ran,
    lines,
    cssBefore: css,
    worklistBefore: worklist,
    read: (p) => fs.readFileSync(path.join(dir, p), 'utf8'),
    opts: {
      base: dir,
      scenesDir: currentSpec('app-icon'),
      log: (...a) => lines.push(a.join(' ')),
      sips: (argv) => {
        ran.push(argv.join(' '));
        doBuild();
      },
    },
  };
}
