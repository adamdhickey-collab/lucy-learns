// node --test scripts/lib/*.test.mjs
//
// approve edits four things that are easy to get subtly wrong and hard to
// notice: two JPEGs at exact sizes, a stylesheet, and a checklist. The
// stylesheet and the checklist are pure string transforms, so they are tested
// against the real files without writing to them; the install is driven with a
// stubbed sips in a temp copy of the tree.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

import { ROOT } from './brief.mjs';
import { MASTER, outputPaths } from './request.mjs';
import { addToLedger, ledgerKeys, ledgerContainers } from './ledger.mjs';
import { tickWorklist, worklistTotal, worklistRemaining } from './worklist.mjs';
import { jpegSize, pngSize, imageSize } from './imagesize.mjs';
import { cmdApprove, sipsShip, latestRound, SHIPPED, THUMB, CSS, WORKLIST } from './approve.mjs';

const css = fs.readFileSync(path.join(ROOT, CSS), 'utf8');
const worklist = fs.readFileSync(path.join(ROOT, WORKLIST), 'utf8');

// --- the ledger ------------------------------------------------------------

test('the ledger is found in the real stylesheet, with its containers', () => {
  const keys = ledgerKeys(css);
  assert.ok(keys.length >= 8, `expected the redrawn set, got ${keys.length}`);
  assert.ok(keys.includes('door-sound-01-setup'));
  assert.deepEqual(ledgerContainers(css), [
    '.hero',
    '.activity-card .card-illo',
    '.detail-hero',
    '.step-figure',
    '.step-pair-item',
    '.welcome-figure',
  ]);
});

test('adding a key adds one filter selector and one per container', () => {
  const before = ledgerKeys(css);
  const containers = ledgerContainers(css);
  const after = addToLedger(css, 'a-new-scene', 37);
  assert.deepEqual(ledgerKeys(after), [...before, 'a-new-scene']);
  const veils = [...after.matchAll(/:has\(img\[src\$="a-new-scene\.jpg"\]\)/g)];
  assert.equal(veils.length, containers.length);
  for (const c of containers) {
    assert.ok(after.includes(`${c}:has(img[src$="a-new-scene.jpg"])`), `${c} missing`);
  }
});

test('the ledger uses the shipped .jpg name, which also catches the thumb', () => {
  const after = addToLedger(css, 'a-new-scene', 37);
  assert.match(after, /img\[src\$="a-new-scene\.jpg"\]/);
  assert.doesNotMatch(after, /a-new-scene\.png/);
  // thumb-a-new-scene.jpg ends with a-new-scene.jpg, so one entry covers both.
  assert.ok('thumb-a-new-scene.jpg'.endsWith('a-new-scene.jpg'));
});

test('the running count is regenerated, never left stale', () => {
  const after = addToLedger(css, 'a-new-scene', 37);
  const n = ledgerKeys(after).length;
  assert.ok(after.includes(`(${n} of 37; ${37 - n} still warm`), 'count must match the selectors');
  assert.ok(after.includes('a-new-scene'), 'the name list must include it too');
});

test('adding a key twice changes nothing', () => {
  const once = addToLedger(css, 'a-new-scene', 37);
  assert.equal(addToLedger(once, 'a-new-scene', 37), once);
});

test('the two blocks stay syntactically closed', () => {
  const after = addToLedger(css, 'a-new-scene', 37);
  assert.equal((after.match(/\{/g) || []).length, (after.match(/\}/g) || []).length);
  assert.match(after, /img\[src\$="a-new-scene\.jpg"\] \{\n  filter: none;\n\}/);
  assert.match(after, /:has\(img\[src\$="a-new-scene\.jpg"\]\) \{\n  --art-veil: transparent;\n\}/);
});

test('a stylesheet with no ledger fails loudly rather than silently', () => {
  assert.throws(() => ledgerKeys('body { color: red }'), /filter block is not in this stylesheet/);
});

// --- the worklist ----------------------------------------------------------

test('the worklist total agrees with the ledger comment', () => {
  const total = worklistTotal(worklist);
  assert.equal(total, 37);
  const done = ledgerKeys(css).length;
  assert.equal(worklistRemaining(worklist).length, total - done,
    'the ledger and the worklist must not disagree about what is left');
});

test('ticking a row removes it from remaining, and only it', () => {
  const key = worklistRemaining(worklist)[0];
  const after = tickWorklist(worklist, key);
  assert.equal(worklistRemaining(after).length, worklistRemaining(worklist).length - 1);
  assert.ok(!worklistRemaining(after).includes(key));
  assert.equal(worklistTotal(after), worklistTotal(worklist), 'no row may be lost');
});

test('ticking twice changes nothing, and an unknown key throws', () => {
  const key = worklistRemaining(worklist)[0];
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

test('approve installs both files, the master, the ledger and the tick', async () => {
  const t = tree();
  const res = await cmdApprove('door-sound-03-name', ['--yes'], t.opts);
  assert.equal(res.approved, true);

  assert.deepEqual(imageSize(fs.readFileSync(path.join(t.dir, 'img/door-sound-03-name.jpg'))), { width: 1100, height: 825 });
  assert.deepEqual(imageSize(fs.readFileSync(path.join(t.dir, 'img/thumb-door-sound-03-name.jpg'))), { width: 240, height: 180 });
  assert.ok(fs.existsSync(path.join(t.dir, 'art/pilot/approved/door-sound-03-name.png')));

  assert.ok(ledgerKeys(t.read(CSS)).includes('door-sound-03-name'));
  assert.ok(!worklistRemaining(t.read(WORKLIST)).includes('door-sound-03-name'));
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

test('approving twice is safe — no duplicate selector, no lost row', async () => {
  const t = tree();
  await cmdApprove('door-sound-03-name', ['--yes'], t.opts);
  const after = t.read(CSS);
  await cmdApprove('door-sound-03-name', ['--yes'], t.opts);
  assert.equal(t.read(CSS), after);
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
  assert.equal(ledgerKeys(t.read(CSS)).length, res.total - res.remaining);
});
