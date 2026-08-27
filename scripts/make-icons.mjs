#!/usr/bin/env node
// Builds the PWA icon set.
//
//   node scripts/make-icons.mjs                     uses icons/source.png
//   node scripts/make-icons.mjs ~/Downloads/art.png uses that file instead
//
// The given file (or icons/source.png) is resized with sips and used as-is.
// With neither, a simple on-brand placeholder is generated so the manifest is
// never pointing at missing files.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { constants as zlibConstants, deflateSync, inflateSync } from 'node:zlib';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const iconDir = resolve(root, 'icons');
const argument = process.argv[2];
const source = argument
  ? resolve(process.cwd(), argument.replace(/^~/, process.env.HOME || '~'))
  : resolve(iconDir, 'source.png');

mkdirSync(iconDir, { recursive: true });

// Full-bleed icons. The maskable one is built separately: Android crops it to
// whatever shape the launcher uses, so the artwork has to sit inside a safe
// zone on a matching background rather than reach the edges.
const SIZES = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['icon-180.png', 180],
];

const MASKABLE = { name: 'icon-maskable-512.png', size: 512, safeZone: 0.8 };

// --- minimal PNG writer ----------------------------------------------------

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
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function writePng(path, size, pixel) {
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    const rowStart = y * stride;
    raw[rowStart] = 0; // no filter
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x, y, size);
      const i = rowStart + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  writeFileSync(
    path,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ])
  );
}

// --- corner sampling -------------------------------------------------------

/**
 * Read the artwork's background colour from the top-left of a PNG, to pad the
 * maskable icon with the artwork's own field instead of a guess.
 *
 * Reads a run of pixels along the first scanline and takes the median rather
 * than trusting pixel zero. One pixel is not safe: the icon source generated
 * for 1.56.0 had a single stray #1d7b7a at (0,0) against a field of #147f7b
 * everywhere else, and padding with it drew a visibly lighter rectangle around
 * the artwork inside the safe zone — the exact seam this sampling exists to
 * avoid. A median over a run ignores a stray pixel and still costs one
 * scanline.
 *
 * Every PNG row filter leaves pixel zero equal to the raw byte (Sub, Average,
 * and Paeth all have zero-valued neighbours at the left edge), so the first
 * pixel needs no unfiltering. Later pixels in the row do, so only filter type
 * 0 (None) is read past pixel zero; anything else falls back to pixel zero,
 * which is still better than nothing. Returns null for anything unusual —
 * interlaced, 16-bit, or palettes.
 */
function sampleCorner(path) {
  try {
    const file = readFileSync(path);
    let offset = 8; // PNG signature
    let header = null;
    const idat = [];

    while (offset < file.length) {
      const length = file.readUInt32BE(offset);
      const type = file.toString('ascii', offset + 4, offset + 8);
      const start = offset + 8;

      if (type === 'IHDR') {
        header = {
          depth: file[start + 8],
          colorType: file[start + 9],
          interlace: file[start + 12],
        };
      } else if (type === 'IDAT') {
        idat.push(file.subarray(start, start + length));
        // One chunk is more than enough for the first scanline.
        break;
      } else if (type === 'IEND') {
        break;
      }
      offset = start + length + 4; // skip data and CRC
    }

    if (!header || !idat.length) return null;
    if (header.depth !== 8 || header.interlace !== 0) return null;
    if (header.colorType !== 2 && header.colorType !== 6) return null;

    // Only the first IDAT chunk was read, so the deflate stream is truncated.
    // Z_SYNC_FLUSH returns what decompressed instead of throwing.
    const raw = inflateSync(Buffer.concat(idat), {
      finishFlush: zlibConstants.Z_SYNC_FLUSH,
    });
    if (raw.length < 4) return null;

    const channels = header.colorType === 6 ? 4 : 3;
    const first = [raw[1], raw[2], raw[3]];

    // Unfilter the first scanline. The row above it is all zeroes, which
    // collapses every filter to something one line long: Up leaves the bytes
    // alone, and Paeth's predictor degenerates to the left neighbour, which is
    // Sub. That is the whole table, so no general decoder is needed.
    const filter = raw[0];
    const wanted = 64;
    const available = Math.floor((raw.length - 1) / channels);
    const count = Math.min(wanted, available);
    if (count < 3) return first;

    const bytes = count * channels;
    const line = new Uint8Array(bytes);
    for (let i = 0; i < bytes; i++) {
      const value = raw[1 + i];
      const left = i >= channels ? line[i - channels] : 0;
      if (filter === 1 || filter === 4) line[i] = (value + left) & 0xff;
      else if (filter === 3) line[i] = (value + (left >> 1)) & 0xff;
      else line[i] = value; // 0 None, 2 Up
    }

    const median = (values) => {
      const sorted = [...values].sort((a, b) => a - b);
      return sorted[sorted.length >> 1];
    };

    return [0, 1, 2].map((channel) =>
      median(Array.from({ length: count }, (_, i) => line[i * channels + channel]))
    );
  } catch {
    return null;
  }
}

const toHex = (rgb) => rgb.map((c) => c.toString(16).padStart(2, '0')).join('');

// --- placeholder mark ------------------------------------------------------

const PAPER = [245, 244, 249];
const VIOLET = [106, 61, 148];
const WHITE = [255, 255, 255];

const distanceToSegment = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};

/** Anti-aliased blend of a shape edge, using its signed distance in pixels. */
const coverage = (distance) => Math.max(0, Math.min(1, 0.5 - distance));

const mix = (base, top, alpha) => base.map((c, i) => Math.round(c + (top[i] - c) * alpha));

function placeholderPixel(x, y, size) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const px = x + 0.5;
  const py = y + 0.5;

  let color = PAPER;

  const circle = coverage(Math.hypot(px - cx, py - cy) - s * 0.36);
  if (circle > 0) color = mix(color, VIOLET, circle);

  const thickness = s * 0.075;
  const check = Math.min(
    distanceToSegment(px, py, s * 0.38, s * 0.5, s * 0.46, s * 0.6),
    distanceToSegment(px, py, s * 0.46, s * 0.6, s * 0.64, s * 0.4)
  );
  const stroke = coverage(check - thickness);
  if (stroke > 0) color = mix(color, WHITE, stroke * circle);

  return [...color, 255];
}

// --- build -----------------------------------------------------------------

const sips = (args) => execFileSync('sips', args, { stdio: 'ignore' });

if (existsSync(source)) {
  for (const [name, size] of SIZES) {
    sips(['-Z', String(size), '-s', 'format', 'png', source, '--out', resolve(iconDir, name)]);
  }

  // Maskable: shrink into the safe zone, then pad out with the artwork's own
  // background colour so a circular or squircle crop never clips the subject.
  const corner = sampleCorner(source);
  // Fallback is the artwork's own field (the splash lavender), not the app
  // paper — the two are close now, but the sampled corner is the truth.
  const pad = corner ? toHex(corner) : 'f0eaf7';
  const inner = Math.round(MASKABLE.size * MASKABLE.safeZone);
  const out = resolve(iconDir, MASKABLE.name);
  sips(['-Z', String(inner), '-s', 'format', 'png', source, '--out', out]);
  sips(['-p', String(MASKABLE.size), String(MASKABLE.size), '--padColor', pad, out]);

  console.log(
    `Built ${SIZES.length + 1} icons from ${source}\n` +
      `Maskable padded to #${pad}${corner ? ' (sampled from the artwork)' : ' (fallback)'}`
  );
} else {
  for (const [name, size] of [...SIZES, [MASKABLE.name, MASKABLE.size]]) {
    writePng(resolve(iconDir, name), size, placeholderPixel);
  }
  console.log(
    `No artwork found at ${source}. Wrote placeholder icons.\n` +
      'Save a square PNG at icons/source.png, or pass a path as the first argument.'
  );
}
