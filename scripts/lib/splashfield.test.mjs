// node --test scripts/lib/*.test.mjs
//
// The splash field colour. One number, three files, and a launch that flashes if
// they disagree — so the interesting tests here are not the transforms but the
// invariant: the stylesheet and the manifest still match the artwork on disk.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { deflateSync } from 'node:zlib';

import {
  EDGE_RING,
  decodePng,
  measureField,
  toHex,
  setCssField,
  setManifestBackground,
  cssField,
  manifestBackground,
} from './splashfield.mjs';
import { ROOT } from './brief.mjs';
import {
  cmdApprove,
  CSS,
  MANIFEST,
  SPLASH_SOURCE,
  SPLASH_MARK,
  SPLASH_BUILD,
  SPLASH_MARK_WIDTH,
  WORKLIST,
} from './approve.mjs';
import { PROFILES } from './profiles.mjs';
import { outputPaths } from './request.mjs';
import { worklistRemaining } from './worklist.mjs';

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const SPLASH_ART = 'art/source/splash-source.png';

// --- the invariant ----------------------------------------------------------

test('the stylesheet still paints the colour the splash art actually is', () => {
  // This is the whole point of the module. If it ever fails, the launch flashes:
  // iOS paints the measured field behind the artwork and the app then paints
  // --splash-field, so the two have to be the same colour.
  const measured = toHex(measureField(decodePng(fs.readFileSync(path.join(ROOT, SPLASH_ART)))));
  assert.equal(cssField(read(CSS)), measured, '--splash-field has drifted from the art');
});

test('the manifest background is the same colour as well', () => {
  const measured = toHex(measureField(decodePng(fs.readFileSync(path.join(ROOT, SPLASH_ART)))));
  assert.equal(manifestBackground(read(MANIFEST)), measured);
});

test('the ring is six pixels deep, and only those six count', () => {
  // make-splash.mjs documented its field as the mean of a six-pixel edge ring,
  // and the extraction is only faithful if it samples the same depth.
  //
  // This used to assert the measurement equalled that file's old constant,
  // #e4dcec, taken from the art on disk — which held right up until the splash
  // was redrawn and the art legitimately became a different colour. A test that
  // fails because the artwork changed is testing the artwork, not the code. The
  // one-time proof that the extraction was faithful is that the refactored
  // make-splash.mjs produced all eleven launch images byte-for-byte identical to
  // the original; what is worth pinning here is the depth.
  assert.equal(EDGE_RING, 6);

  const edge = [0x10, 0x20, 0x30];
  const img = solidWithBlot(edge, [0xff, 0xff, 0xff]);
  assert.deepEqual(measureField(img), edge, 'the ring is exactly the border');

  // Repaint the row just inside the top band, but only across the span that is
  // not also the left or right band — at x < 6 and x >= w-6 that row is still
  // the side border and is supposed to count.
  for (let x = EDGE_RING; x < img.width - EDGE_RING; x++) {
    const i = (EDGE_RING * img.width + x) * img.bpp;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = 0;
  }
  assert.deepEqual(measureField(img), edge, 'the seventh pixel in is not part of the ring');
});

// --- measuring --------------------------------------------------------------

test('a flat border measures as exactly that colour, whatever the middle holds', () => {
  const img = solidWithBlot([0x11, 0x22, 0x33], [0xff, 0x00, 0x00]);
  assert.deepEqual(measureField(img), [0x11, 0x22, 0x33]);
});

test('measuring counts every edge, so one dark side cannot be ignored', () => {
  const img = solidWithBlot([0x40, 0x40, 0x40], [0x40, 0x40, 0x40]);
  const flat = measureField(img);
  // Darken the whole top band; the mean must move toward it rather than stay put.
  for (let x = 0; x < img.width; x++) {
    for (let y = 0; y < EDGE_RING; y++) {
      const i = (y * img.width + x) * img.bpp;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 0;
    }
  }
  assert.ok(measureField(img)[0] < flat[0], 'a darkened edge must pull the mean down');
});

// --- writing ----------------------------------------------------------------

test('setting the css field is idempotent and leaves everything else alone', () => {
  const css = ':root { --splash-field: #e4dcec; --other: #123456; }';
  const once = setCssField(css, '#aabbcc');
  assert.equal(cssField(once), '#aabbcc');
  assert.equal(setCssField(once, '#aabbcc'), once);
  assert.match(once, /--other: #123456/);
});

test('setting the manifest background keeps the file valid JSON', () => {
  const json = read(MANIFEST);
  const next = setManifestBackground(json, '#aabbcc');
  assert.equal(JSON.parse(next).background_color, '#aabbcc');
  assert.equal(JSON.parse(next).name, JSON.parse(json).name);
});

test('a missing token is refused rather than appended', () => {
  // A stylesheet that has lost the token is not one to invent a place in, and
  // failing here means the install stops before it has written anything.
  assert.throws(() => setCssField(':root { --a: #fff; }', '#aabbcc'), /--splash-field not found/);
  assert.throws(() => setManifestBackground('{"name":"x"}', '#aabbcc'), /background_color not found/);
});

// --- approving a splash -----------------------------------------------------

test('approving a splash writes one measurement into both files and rebuilds', async () => {
  const t = splashTree();
  const res = await cmdApprove('app-splash', ['--yes'], t.opts);
  assert.equal(res.approved, true);
  assert.equal(res.field, '#204060', 'the field is measured off the master, not asked for');

  assert.equal(cssField(t.read(CSS)), '#204060');
  assert.equal(manifestBackground(t.read(MANIFEST)), '#204060');
  assert.deepEqual(
    fs.readFileSync(path.join(t.dir, SPLASH_SOURCE)),
    fs.readFileSync(path.join(t.dir, t.out.master))
  );
  assert.ok(t.ran.includes(SPLASH_BUILD.join(' ')), 'make-splash.mjs should have been run');
  assert.ok(fs.existsSync(path.join(t.dir, SPLASH_MARK)), 'the in-app mark should be written');

  // By width, not by -Z: the master is portrait, so fitting the longest edge
  // would size the height and silently produce a 733×1100 mark instead of 600×900.
  const mark = t.ran.find((c) => c.includes(SPLASH_MARK));
  assert.match(mark, new RegExp(`--resampleWidth ${SPLASH_MARK_WIDTH}\\b`));
  assert.ok(!mark.includes('-Z'), 'the portrait mark must not be sized with -Z');
});

test('the splash takes no worklist tick', async () => {
  const t = splashTree();
  const before = worklistRemaining(t.read(WORKLIST)).length;
  await cmdApprove('app-splash', ['--yes'], t.opts);
  assert.equal(worklistRemaining(t.read(WORKLIST)).length, before);
});

test('a stylesheet missing the token stops the install before anything is written', async () => {
  const t = splashTree({ css: ':root { --nothing: #fff; }' });
  await assert.rejects(() => cmdApprove('app-splash', ['--yes'], t.opts), /--splash-field not found/);
  assert.equal(fs.existsSync(path.join(t.dir, SPLASH_SOURCE)), false);
  assert.deepEqual(t.ran, [], 'nothing should have been run');
});

test('without --yes a splash approve writes nothing but still reports the colour', async () => {
  const t = splashTree();
  const res = await cmdApprove('app-splash', [], t.opts);
  assert.equal(res.approved, false);
  assert.equal(fs.existsSync(path.join(t.dir, SPLASH_SOURCE)), false);
  assert.ok(t.lines.join('\n').includes('#204060'), 'the measurement is shown before committing to it');
});

// --- fixtures ---------------------------------------------------------------

/** A real PNG: `edge` everywhere, with a different colour blotted in the middle. */
function pngBytes(w, h, edge, middle) {
  const raw = Buffer.alloc(h * (w * 3 + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0; // filter: none
    for (let x = 0; x < w; x++) {
      const inner = x >= EDGE_RING && x < w - EDGE_RING && y >= EDGE_RING && y < h - EDGE_RING;
      const c = inner ? middle : edge;
      const i = y * (w * 3 + 1) + 1 + x * 3;
      raw[i] = c[0]; raw[i + 1] = c[1]; raw[i + 2] = c[2];
    }
  }
  const crcTable = (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })();
  const crc = (buf) => {
    let c = -1;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const tail = Buffer.alloc(4);
    tail.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, tail]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const solidWithBlot = (edge, middle) => decodePng(pngBytes(40, 60, edge, middle));

/** A temp tree holding what a splash approve touches. */
function splashTree({ css = null } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'splash-approve-'));
  const out = outputPaths('app-splash', 1);
  const write = (p, data) => {
    fs.mkdirSync(path.join(dir, path.dirname(p)), { recursive: true });
    fs.writeFileSync(path.join(dir, p), data);
  };
  write(CSS, css ?? read(CSS));
  write(WORKLIST, read(WORKLIST));
  write(MANIFEST, read(MANIFEST));
  // A master whose edge ring is #204060, so the measurement has a known answer.
  const { width, height } = PROFILES.splash.master;
  write(out.master, pngBytes(width, height, [0x20, 0x40, 0x60], [0xff, 0xff, 0xff]));
  write(out.manifest, JSON.stringify({ briefId: 'cool-flat-v1', scene: 'app-splash', approved: false }));

  const ran = [];
  const lines = [];
  return {
    dir,
    out,
    ran,
    lines,
    read: (p) => fs.readFileSync(path.join(dir, p), 'utf8'),
    opts: {
      base: dir,
      log: (...a) => lines.push(a.join(' ')),
      sips: (argv) => {
        ran.push(argv.join(' '));
        const at = argv.indexOf('--out');
        if (at !== -1) write(argv[at + 1], Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
      },
    },
  };
}
