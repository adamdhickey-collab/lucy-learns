// node --test scripts/lib/*.test.mjs
//
// approve edits things that are easy to get subtly wrong and hard to notice:
// two JPEGs at exact sizes and a checklist. The checklist is a pure string
// transform, so it is tested against the real file without writing to it; the
// install is driven with a stubbed sips in a temp copy of the tree.
//
// It used to edit a stylesheet too — the pilot ledger, which listed every
// redrawn file so it skipped the warm-art grade. That went at the finish line
// with the grade itself, and its tests went with it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

import { ROOT } from './brief.mjs';
import { PROFILES } from './profiles.mjs';
import { loadScene, SCENES_DIR } from './scene.mjs';
import { MASTER, outputPaths } from './request.mjs';
import { tickWorklist, worklistTotal, worklistRemaining, worklistRows } from './worklist.mjs';
import { jpegSize, pngSize, imageSize } from './imagesize.mjs';
import { cmdApprove, sipsShip, latestRound, SHIPPED, THUMB, CSS, WORKLIST , avatarPath } from './approve.mjs';

const css = fs.readFileSync(path.join(ROOT, CSS), 'utf8');
const worklist = fs.readFileSync(path.join(ROOT, WORKLIST), 'utf8');

// --- the worklist ----------------------------------------------------------

test('the worklist accounts for every picture, done or not', () => {
  // This used to cross-check the worklist against the pilot ledger, because
  // approve maintained both and a disagreement meant it had stopped halfway.
  // The ledger is gone; the worklist is the only register now, so what is left
  // to pin is that it adds up.
  const total = worklistTotal(worklist);
  assert.equal(total, 37);
  const rows = worklistRows(worklist);
  const remaining = worklistRemaining(worklist);
  assert.equal(rows.filter((r) => !r.ticked).length, remaining.length);
  assert.ok(remaining.length <= total);
});

/**
 * The worklist with one row put back to unticked, so the tick transform has
 * something to act on.
 *
 * These tests used to take the first remaining row off the real file. That
 * worked until the last picture was redrawn and nothing remained — the set
 * being finished, not the transform breaking. They build their own starting
 * state now.
 */
function withOneUnticked() {
  const key = worklistRows(worklist)[0].key;
  const before = worklist.replace(
    new RegExp(`^\\|\\s*\\[x\\]\\s*\\|\\s*\`${key}\``, 'm'),
    `| [ ] | \`${key}\``,
  );
  assert.ok(worklistRemaining(before).includes(key), 'the fixture must actually be unticked');
  return { key, before };
}

test('ticking a row removes it from remaining, and only it', () => {
  const { key, before: worklist } = withOneUnticked();
  const after = tickWorklist(worklist, key);
  assert.equal(worklistRemaining(after).length, worklistRemaining(worklist).length - 1);
  assert.ok(!worklistRemaining(after).includes(key));
  assert.equal(worklistTotal(after), worklistTotal(worklist), 'no row may be lost');
});

test('ticking twice changes nothing, and an unknown key throws', () => {
  const { key, before: worklist } = withOneUnticked();
  const once = tickWorklist(worklist, key);
  assert.equal(tickWorklist(once, key), once);
  assert.throws(() => tickWorklist(worklist, 'not-a-real-key'), /is not a row in the worklist/);
});

// --- image sizes -----------------------------------------------------------

test('jpegSize reads the real shipped files', () => {
  const at = (p) => fs.readFileSync(path.join(ROOT, p));
  assert.deepEqual(jpegSize(at('img/door-sound-03-name.jpg')), { width: 1100, height: 825 });
  assert.deepEqual(jpegSize(at('img/thumb-door-sound-03-name.jpg')), { width: 240, height: 180 });
});

test('imageSize dispatches on the signature, not the filename', () => {
  const at = (p) => fs.readFileSync(path.join(ROOT, p));
  assert.deepEqual(imageSize(at('art/pilot/approved/door-sound-03-name.png')), MASTER);
  assert.deepEqual(imageSize(at('img/door-cover.jpg')), { width: 1100, height: 825 });
});

test('jpegSize refuses a PNG and vice versa', () => {
  const at = (p) => fs.readFileSync(path.join(ROOT, p));
  assert.throws(() => jpegSize(at('art/pilot/approved/door-sound-03-name.png')), /not a JPEG/);
  assert.throws(() => pngSize(at('img/door-cover.jpg')), /not a PNG/);
});

test('the shipped sizes divide the master exactly, with no rounding', () => {
  for (const { width } of [SHIPPED, THUMB]) {
    const height = (MASTER.height * width) / MASTER.width;
    assert.ok(Number.isInteger(height), `${width}px gives a fractional height of ${height}`);
  }
});

test('the sips recipe matches what the set was rendered with', () => {
  assert.deepEqual(sipsShip('m.png', 'img/x.jpg', 1100, 72), [
    'sips', '-Z', '1100', '-s', 'format', 'jpeg', '-s', 'formatOptions', '72',
    'm.png', '--out', 'img/x.jpg',
  ]);
});

// --- a whole approve, in a temp copy of the tree ---------------------------

const crc = (buf) => {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
};

function png(w, h) {
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(Buffer.alloc((w + 1) * h))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** A JPEG carrying only a start-of-frame, which is all imageSize reads. */
function jpeg(w, h) {
  const sof = Buffer.alloc(10);
  sof.writeUInt16BE(0xffc0, 0);
  sof.writeUInt16BE(8, 2);
  sof[4] = 8;
  sof.writeUInt16BE(h, 5);
  sof.writeUInt16BE(w, 7);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), sof, Buffer.from([0xff, 0xd9])]);
}

/** A temp tree with just the files approve touches, and a round to promote. */
function tree({ masterSize = MASTER, round = 1 } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'approve-'));
  const out = outputPaths('door-sound-03-name', round);
  const write = (p, data) => {
    fs.mkdirSync(path.join(dir, path.dirname(p)), { recursive: true });
    fs.writeFileSync(path.join(dir, p), data);
  };
  write(CSS, css);
  write(WORKLIST, worklist);
  write(out.master, png(masterSize.width, masterSize.height));
  write(out.manifest, JSON.stringify({ briefId: 'cool-flat-v1', scene: 'door-sound-03-name', approved: false }, null, 2));
  const lines = [];
  return {
    dir,
    out,
    lines,
    read: (p) => fs.readFileSync(path.join(dir, p), 'utf8'),
    opts: {
      base: dir,
      log: (...a) => lines.push(a.join(' ')),
      // Stand in for sips: -Z <width> on a 4:3 master, written as a JPEG.
      sips: (argv) => {
        const w = Number(argv[argv.indexOf('-Z') + 1]);
        const target = argv[argv.indexOf('--out') + 1];
        fs.mkdirSync(path.join(dir, path.dirname(target)), { recursive: true });
        fs.writeFileSync(path.join(dir, target), jpeg(w, Math.round((w * MASTER.height) / MASTER.width)));
      },
    },
  };
}

test('approve installs both files, the master and the tick', async () => {
  const t = tree();
  const res = await cmdApprove('door-sound-03-name', ['--yes'], t.opts);
  assert.equal(res.approved, true);

  assert.deepEqual(imageSize(fs.readFileSync(path.join(t.dir, 'img/door-sound-03-name.jpg'))), { width: 1100, height: 825 });
  assert.deepEqual(imageSize(fs.readFileSync(path.join(t.dir, 'img/thumb-door-sound-03-name.jpg'))), { width: 240, height: 180 });
  assert.ok(fs.existsSync(path.join(t.dir, 'art/pilot/approved/door-sound-03-name.png')));

  assert.ok(!worklistRemaining(t.read(WORKLIST)).includes('door-sound-03-name'));
  assert.equal(t.read(CSS), css, 'the stylesheet is no longer touched at all');
});

test('the promoted master is the round\'s master, byte for byte', async () => {
  const t = tree();
  await cmdApprove('door-sound-03-name', ['--yes'], t.opts);
  assert.deepEqual(
    fs.readFileSync(path.join(t.dir, 'art/pilot/approved/door-sound-03-name.png')),
    fs.readFileSync(path.join(t.dir, t.out.master))
  );
});

test('the manifest records the approval', async () => {
  const t = tree();
  await cmdApprove('door-sound-03-name', ['--yes'], t.opts);
  const m = JSON.parse(t.read(t.out.manifest));
  assert.equal(m.approved, true);
  assert.match(m.approvedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test('without --yes nothing is written', async () => {
  const t = tree();
  const res = await cmdApprove('door-sound-03-name', [], t.opts);
  assert.equal(res.approved, false);
  assert.equal(fs.existsSync(path.join(t.dir, 'img')), false);
  assert.equal(t.read(CSS), css, 'the stylesheet must be untouched');
  assert.equal(t.read(WORKLIST), worklist);
  assert.ok(t.lines.join('\n').includes('Re-run with --yes'));
});

test('a master at the wrong size is refused before anything is installed', async () => {
  const t = tree({ masterSize: { width: 1472, height: 1104 } });
  await assert.rejects(
    () => cmdApprove('door-sound-03-name', ['--yes'], t.opts),
    /is 1472×1104, not 1448×1086/
  );
  assert.equal(fs.existsSync(path.join(t.dir, 'img')), false);
  assert.equal(t.read(CSS), css);
});

test('a round generated against another brief is refused', async () => {
  const t = tree();
  fs.writeFileSync(
    path.join(t.dir, t.out.manifest),
    JSON.stringify({ briefId: 'warm-instructional-v1', approved: false })
  );
  await assert.rejects(
    () => cmdApprove('door-sound-03-name', ['--yes'], t.opts),
    /generated against brief "warm-instructional-v1"/
  );
  assert.equal(fs.existsSync(path.join(t.dir, 'img')), false);
});

test('approving twice is safe — no lost row, no double tick', async () => {
  const t = tree();
  await cmdApprove('door-sound-03-name', ['--yes'], t.opts);
  const after = t.read(WORKLIST);
  await cmdApprove('door-sound-03-name', ['--yes'], t.opts);
  assert.equal(t.read(WORKLIST), after);
  assert.equal(worklistTotal(t.read(WORKLIST)), 37);
});

test('--round picks that round, and latestRound finds the newest', async () => {
  const t = tree({ round: 4 });
  // A later round with no master must not be chosen over round 4.
  fs.mkdirSync(path.join(t.dir, 'art/pilot/restyle/round-09'), { recursive: true });
  assert.equal(latestRound('door-sound-03-name', fs, t.dir), 4);
  const res = await cmdApprove('door-sound-03-name', ['--round', '4', '--yes'], t.opts);
  assert.equal(res.round, 4);
});

test('a missing round names the command that would make one', async () => {
  const t = tree();
  fs.rmSync(path.join(t.dir, 'art/pilot/restyle'), { recursive: true });
  await assert.rejects(() => cmdApprove('door-sound-03-name', ['--yes'], t.opts), /run `generate/);
});

test('the count reported is the worklist\'s, not a second tally', async () => {
  const t = tree();
  const res = await cmdApprove('door-sound-03-name', ['--yes'], t.opts);
  assert.equal(res.total, 37);
  assert.equal(res.remaining, worklistRemaining(t.read(WORKLIST)).length);

});

// --- avatars ----------------------------------------------------------------

test('the avatar profile is square, copied, and inside the API limits', () => {
  const p = PROFILES.avatar;
  assert.deepEqual(p.source, p.master, 'no ratio to reconcile, so nothing to resample');
  assert.equal(p.source.width, p.source.height);
  for (const e of [p.source.width, p.source.height]) assert.equal(e % 16, 0);
  const px = p.source.width * p.source.height;
  assert.ok(px >= 655360 && px <= 8294400, `${px} outside the documented band`);
});

test('an avatar installs one PNG, dogs flat and people one deeper', () => {
  assert.equal(avatarPath('dog-04'), 'img/avatars/dog-04.png');
  assert.equal(avatarPath('person-11'), 'img/avatars/people/person-11.png');
});

test('a PNG render passes no format or quality flags', () => {
  const argv = sipsShip('m.png', 'img/avatars/dog-01.png', 400, null);
  assert.deepEqual(argv, ['sips', '-Z', '400', 'm.png', '--out', 'img/avatars/dog-01.png']);
  assert.ok(!argv.includes('formatOptions'), 'quality on a PNG is ignored, which reads as if it worked');
});

test('every avatar spec declares the profile and leads with an exemplar', () => {
  const ids = fs.readdirSync(SCENES_DIR).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
  const avatars = ids.filter((id) => /^(dog|person)-\d\d$/.test(id));
  assert.equal(avatars.length, 24, 'ten dogs and fourteen people');
  for (const id of avatars) {
    const scene = loadScene(id);
    assert.equal(scene.profile, 'avatar', id);
    assert.equal(scene.references[0].role, 'style:exemplar', id);
  }
});

test('every avatar but dog-01 is drawn off dog-01', () => {
  const ids = fs.readdirSync(SCENES_DIR).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
  for (const id of ids.filter((i) => /^(dog|person)-\d\d$/.test(i) && i !== 'dog-01')) {
    const scene = loadScene(id);
    assert.equal(scene.references[0].fromScene, 'dog-01',
      `${id} must take its field, crop and line weight from the set leader`);
  }
});

test('avatars are outside the thirty-seven, so the finish line does not move', () => {
  const md = fs.readFileSync(path.join(ROOT, WORKLIST), 'utf8');
  assert.equal(worklistTotal(md), 37);
  for (const key of ['dog-01', 'person-01']) {
    assert.ok(!md.includes(`\`${key}\``), `${key} must not have a worklist row`);
  }
});
