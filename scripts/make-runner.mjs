#!/usr/bin/env node
// Builds the pixel-art Lucy that runs across the splash while the app boots.
//
//   node scripts/make-runner.mjs        writes img/lucy-run.png
//
// This used to *draw* her: four 32×20 frames authored as ASCII grids and
// emitted as SVG rects. That version is in the history (up to 1.65.0) and it
// was the right tool while the sprite was ours to author. It was replaced by
// commissioned art — an eight-frame gallop in Lucy's black-and-white coat,
// generated as one sheet — because eight hand-authored frames of a bouncing
// gallop was past the point where text grids stay honest.
//
// The commissioned sheet can't be used raw: its frames are spaced by eye, not
// by cell, and CSS sprite animation (`background-position-x` stepped by a
// fixed amount) needs every frame in an identical box. So this script is now a
// *slicer* rather than a drawer, but the reason it exists is unchanged — the
// frames have to stay in register, and re-deriving the registration from the
// source on every run beats hand-cropping eight boxes and keeping them aligned.
//
// What it does:
//   1. reads the approved sheet (art/pilot/approved/lucy-run-sheet.png,
//      straight RGBA, transparent background),
//   2. finds the eight frames by scanning for fully-transparent columns,
//   3. trims the sheet vertically to the art,
//   4. re-packs each frame centred in a uniform cell,
//   5. writes img/lucy-run.png and prints the numbers the CSS needs.
//
// Frames keep their *source* vertical position — the artist drew them on a
// common ground plane, and a gallop's airborne frames are meant to sit higher
// than its stance frames. Only the horizontal packing is normalised.
//
// PNG rather than SVG now because the art is anti-aliased bitmap art; there is
// no vector to keep. It also means `image-rendering: pixelated` comes OFF in
// the CSS — that hint existed to protect hard pixel edges under 2× upscale,
// and on anti-aliased art displayed 1:1 it does nothing but degrade.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync, inflateSync } from 'node:zlib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(root, 'art/pilot/approved/lucy-run-sheet.png');
const OUT = resolve(root, 'img/lucy-run.png');

const EXPECTED_FRAMES = 8;
// Breathing room inside each cell, so the widest frame doesn't touch the cell
// edge and shimmer against its neighbour during the stepped animation.
const CELL_PAD = 2;

// --- minimal PNG in/out ------------------------------------------------------
// Same approach as make-icons.mjs: this project has no dependencies, and the
// subset of PNG needed here — 8-bit RGBA, non-interlaced — is small enough to
// do honestly. Anything else in the header is a hard error, not a guess.

function decode(path) {
  const buf = readFileSync(path);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error(`${path}: not a PNG`);
  let off = 8;
  let ihdr = null;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    if (type === 'IHDR') {
      ihdr = {
        w: buf.readUInt32BE(off + 8),
        h: buf.readUInt32BE(off + 12),
        depth: buf[off + 16],
        color: buf[off + 17],
        interlace: buf[off + 20],
      };
    }
    if (type === 'IDAT') idat.push(buf.subarray(off + 8, off + 8 + len));
    off += 12 + len;
  }
  if (!ihdr) throw new Error(`${path}: no IHDR`);
  if (ihdr.depth !== 8 || ihdr.color !== 6 || ihdr.interlace !== 0) {
    throw new Error(
      `${path}: need 8-bit RGBA non-interlaced, got depth ${ihdr.depth} ` +
        `color ${ihdr.color} interlace ${ihdr.interlace}`
    );
  }

  const { w, h } = ihdr;
  const stride = w * 4;
  const raw = inflateSync(Buffer.concat(idat));
  const px = Buffer.alloc(h * stride);

  // Unfilter. Each scanline leads with its filter byte; a/b/c are the standard
  // left / above / above-left neighbours, zero off the edges.
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const out = px.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? px.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= 4 ? out[i - 4] : 0;
      const b = prev ? prev[i] : 0;
      const c = prev && i >= 4 ? prev[i - 4] : 0;
      let v = line[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      } else if (filter !== 0) throw new Error(`${path}: unknown filter ${filter}`);
      out[i] = v & 0xff;
    }
  }
  return { w, h, px };
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function encode(path, w, h, px) {
  const stride = w * 4;
  const raw = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) {
    // Filter 0 on every line; deflate at level 9 does the compressing. The
    // sheet is mostly transparent, so this stays small without filter tuning.
    px.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // depth
  ihdr[9] = 6; // RGBA
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  writeFileSync(path, png);
  return png.length;
}

// --- find the frames ---------------------------------------------------------

const { w, h, px } = decode(SRC);

const columnHasInk = (x) => {
  for (let y = 0; y < h; y++) if (px[(y * w + x) * 4 + 3] !== 0) return true;
  return false;
};
const rowHasInk = (y) => {
  for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] !== 0) return true;
  return false;
};

// Runs of inked columns, separated by fully-transparent gaps, are the frames.
const frames = [];
let start = null;
for (let x = 0; x <= w; x++) {
  const ink = x < w && columnHasInk(x);
  if (ink && start === null) start = x;
  if (!ink && start !== null) {
    frames.push({ x0: start, x1: x }); // x1 exclusive
    start = null;
  }
}
if (frames.length !== EXPECTED_FRAMES) {
  throw new Error(
    `found ${frames.length} frames, expected ${EXPECTED_FRAMES} — either the ` +
      `sheet changed or two frames touch and need a wider gap in the source`
  );
}

let top = 0;
while (top < h && !rowHasInk(top)) top++;
let bottom = h;
while (bottom > top && !rowHasInk(bottom - 1)) bottom--;

// --- re-pack ----------------------------------------------------------------

// Cells are rounded up to even, because the sprite displays at exactly half
// its native size — device pixels match source pixels 1:1 on the 2× screens
// this app actually lives on. Half of an odd cell is a fractional CSS pixel,
// and a fractional background-position-x step is how frames bleed into their
// neighbours.
const even = (n) => n + (n % 2);
const cellH = even(bottom - top);
const cellW = even(Math.max(...frames.map((f) => f.x1 - f.x0)) + CELL_PAD * 2);
const sheetW = cellW * frames.length;
const out = Buffer.alloc(sheetW * cellH * 4);

frames.forEach((f, i) => {
  const fw = f.x1 - f.x0;
  const dx = i * cellW + Math.floor((cellW - fw) / 2);
  // bottom - top, not cellH: the even-rounding row at the foot of the cell is
  // padding, and reading it from the source would run past the sheet.
  for (let y = 0; y < bottom - top; y++) {
    const srcOff = ((top + y) * w + f.x0) * 4;
    const dstOff = (y * sheetW + dx) * 4;
    px.copy(out, dstOff, srcOff, srcOff + fw * 4);
  }
});

const bytes = encode(OUT, sheetW, cellH, out);

console.log(
  `wrote img/lucy-run.png — ${frames.length} frames, ${cellW}×${cellH} each, ` +
    `sheet ${sheetW}×${cellH}, ${(bytes / 1024).toFixed(1)}KB`
);
console.log(
  `CSS: width ${cellW}px; height ${cellH}px; background-size ${sheetW}px ${cellH}px; ` +
    `steps(${frames.length}) to background-position-x -${sheetW}px`
);
