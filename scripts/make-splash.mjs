#!/usr/bin/env node
// Builds the iOS startup images ("apple-touch-startup-image") from
// img/source/splash-source.png.
//
//   node scripts/make-splash.mjs
//   cd splash && for f in *.png; do sips -s format jpeg -s formatOptions 85 \
//     "$f" --out "${f%.png}.jpg"; done && rm *.png
//
// Two steps for the same reason the illustrations are: this script stays pure
// Node and portable, and `sips` does the lossy pass. It is worth doing — these
// are a flat field with one crisp badge, which JPEG handles without visible
// ringing, and it takes the set from 6.7MB to 2.1MB. Update the link tags in
// index.html if the extension ever changes back.
//
// iOS shows a static image while a standalone PWA boots, but only if an exact
// pixel-size match exists for the device — so one file per screen. Each image
// is the mark centred on the app's own background, sized to match the in-app
// splash (60% of viewport width, centred at 45% height), so the OS image and
// the app's first paint are indistinguishable and the handoff is seamless.
//
// Two things the first pass got wrong, both visible on device:
//
//   The field was sampled from the artwork's top-left pixel, #f7e7ca, while
//   the app paints #f7f5ef. Launching flashed warm cream to paper. The field
//   is now the app's --background, so there is nothing to flash.
//
//   The source art is square with its own cream corners, which sat on the
//   field as an obvious lighter rectangle. The mark is masked to its inscribed
//   circle now, anti-aliased at the edge, so it reads as a badge on paper
//   rather than a pasted-in square.
//
// Pure Node: decodes the PNG (8-bit RGB/RGBA, non-interlaced), unfilters,
// bilinear-resizes, composes, and re-encodes. No dependencies to install.

import { deflateSync, inflateSync } from 'node:zlib';
import { mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = resolve(root, 'img/source/splash-source.png');
const OUT_DIR = resolve(root, 'splash');

// Portrait screens of iPhones in current circulation.
// iPads omitted deliberately — this household, and the pilot, are phone-first.
//
// The point size and DPR are listed, not derived. iOS matches these images on
// a media query in CSS points, and pixels alone cannot tell you which: the
// 8 Plus is 1242×2208 at 414×736@3x, but 1242 and 2208 are both even, so
// anything that guesses by divisibility calls it 621×1104@2x, a screen no
// phone has ever had. A query like that matches nothing and the launch falls
// back to a blank white screen. 828×1792 and 1242×2688 are the other trap:
// same 414×896 points, different DPR, so the ratio has to be in the query.
//   [pixelW, pixelH, pointW, pointH, dpr, devices]
const SCREENS = [
  [750, 1334, 375, 667, 2, 'SE gen 2/3, 8'],
  [1242, 2208, 414, 736, 3, '8 Plus'],
  [1125, 2436, 375, 812, 3, 'X, XS, 11 Pro, 12/13 mini'],
  [828, 1792, 414, 896, 2, 'XR, 11'],
  [1242, 2688, 414, 896, 3, 'XS Max, 11 Pro Max'],
  [1170, 2532, 390, 844, 3, '12, 13, 14'],
  [1284, 2778, 428, 926, 3, '12/13 Pro Max, 14 Plus'],
  [1179, 2556, 393, 852, 3, '14 Pro, 15, 15 Pro, 16'],
  [1290, 2796, 430, 932, 3, '14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus'],
  [1206, 2622, 402, 874, 3, '16 Pro'],
  [1320, 2868, 440, 956, 3, '16 Pro Max'],
];

// Same geometry as the in-app splash in app.css.
const ART_WIDTH_FRACTION = 0.5;
const ART_CENTER_Y = 0.34;

// The app's --background. Keep these in step: the whole point of the launch
// image is that the boot and the first paint are the same colour.
const FIELD = [0xf7, 0xf5, 0xef];

// --- decode ----------------------------------------------------------------

function decodePng(path) {
  const file = readFileSync(path);
  let offset = 8;
  let header = null;
  const idat = [];
  while (offset < file.length) {
    const length = file.readUInt32BE(offset);
    const type = file.toString('ascii', offset + 4, offset + 8);
    const start = offset + 8;
    if (type === 'IHDR') header = file.subarray(start, start + 13);
    else if (type === 'IDAT') idat.push(file.subarray(start, start + length));
    else if (type === 'IEND') break;
    offset = start + length + 4;
  }
  const width = header.readUInt32BE(0);
  const height = header.readUInt32BE(4);
  const depth = header[8];
  const colorType = header[9];
  const interlace = header[12];
  if (depth !== 8 || interlace !== 0 || (colorType !== 2 && colorType !== 6)) {
    throw new Error('need an 8-bit non-interlaced RGB or RGBA PNG');
  }
  const bpp = colorType === 2 ? 3 : 4;
  const raw = inflateSync(Buffer.concat(idat));

  // Undo the per-scanline filters (spec section 9): None/Sub/Up/Average/Paeth.
  const stride = width * bpp;
  const out = Buffer.alloc(height * stride);
  const paeth = (a, b, c) => {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const value = raw[src + x];
      const left = x >= bpp ? out[dst + x - bpp] : 0;
      const up = y > 0 ? out[dst - stride + x] : 0;
      const upLeft = y > 0 && x >= bpp ? out[dst - stride + x - bpp] : 0;
      let recon;
      if (filter === 0) recon = value;
      else if (filter === 1) recon = value + left;
      else if (filter === 2) recon = value + up;
      else if (filter === 3) recon = value + ((left + up) >> 1);
      else recon = value + paeth(left, up, upLeft);
      out[dst + x] = recon & 0xff;
    }
  }
  return { width, height, bpp, data: out };
}

// --- resize ----------------------------------------------------------------

function bilinearResize(image, targetSize) {
  const { width, height, bpp, data } = image;
  const out = Buffer.alloc(targetSize * targetSize * 3);
  for (let ty = 0; ty < targetSize; ty++) {
    const sy = (ty + 0.5) * (height / targetSize) - 0.5;
    const y0 = Math.max(0, Math.floor(sy));
    const y1 = Math.min(height - 1, y0 + 1);
    const fy = sy - y0;
    for (let tx = 0; tx < targetSize; tx++) {
      const sx = (tx + 0.5) * (width / targetSize) - 0.5;
      const x0 = Math.max(0, Math.floor(sx));
      const x1 = Math.min(width - 1, x0 + 1);
      const fx = sx - x0;
      const di = (ty * targetSize + tx) * 3;
      for (let c = 0; c < 3; c++) {
        const p00 = data[(y0 * width + x0) * bpp + c];
        const p10 = data[(y0 * width + x1) * bpp + c];
        const p01 = data[(y1 * width + x0) * bpp + c];
        const p11 = data[(y1 * width + x1) * bpp + c];
        const top = p00 + (p10 - p00) * fx;
        const bottom = p01 + (p11 - p01) * fx;
        out[di + c] = Math.round(top + (bottom - top) * fy);
      }
    }
  }
  return out;
}

// --- encode ----------------------------------------------------------------

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

function writeRgbPng(path, width, height, pixels) {
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  // The Up filter turns identical rows (all that cream) into runs of zeros
  // and gives the artwork vertical delta-coding: ~4x smaller than filter None.
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = y === 0 ? 0 : 2;
    const dst = y * (stride + 1) + 1;
    if (y === 0) {
      pixels.copy(raw, dst, 0, stride);
    } else {
      for (let x = 0; x < stride; x++) {
        raw[dst + x] = (pixels[y * stride + x] - pixels[(y - 1) * stride + x]) & 0xff;
      }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2; // RGB
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

// --- compose ---------------------------------------------------------------

mkdirSync(OUT_DIR, { recursive: true });
const art = decodePng(SOURCE);
console.log(
  `art ${art.width}×${art.height} on field #${FIELD.map((c) => c.toString(16).padStart(2, '0')).join('')}`
);

let total = 0;
const tags = [];
for (const [width, height, ptW, ptH, dpr, devices] of SCREENS) {
  const side = Math.round(width * ART_WIDTH_FRACTION);
  const scaled = bilinearResize(art, side);
  const canvas = Buffer.alloc(width * height * 3);
  for (let i = 0; i < canvas.length; i += 3) {
    canvas[i] = FIELD[0];
    canvas[i + 1] = FIELD[1];
    canvas[i + 2] = FIELD[2];
  }
  const left = Math.round((width - side) / 2);
  const top = Math.round(height * ART_CENTER_Y - side / 2);

  // Composite the mark through its inscribed circle. `coverage` is the pixel's
  // fraction inside the circle, so the last pixel-width of the edge blends into
  // the field instead of stepping down it.
  const radius = side / 2;
  const centre = radius - 0.5;
  for (let y = 0; y < side; y++) {
    const dy = y - centre;
    for (let x = 0; x < side; x++) {
      const dx = x - centre;
      const coverage = Math.min(Math.max(radius - Math.hypot(dx, dy) + 0.5, 0), 1);
      if (coverage === 0) continue;
      const src = (y * side + x) * 3;
      const dst = ((top + y) * width + left + x) * 3;
      for (let c = 0; c < 3; c++) {
        canvas[dst + c] = Math.round(
          scaled[src + c] * coverage + FIELD[c] * (1 - coverage)
        );
      }
    }
  }
  const name = `apple-splash-${width}-${height}.png`;
  writeRgbPng(resolve(OUT_DIR, name), width, height, canvas);
  const size = statSync(resolve(OUT_DIR, name)).size;
  total += size;
  console.log(`${name}  ${(size / 1024).toFixed(0)}KB  ${ptW}×${ptH}@${dpr}x  ${devices}`);

  tags.push(
    `    <!-- ${devices} -->\n` +
      '    <link\n' +
      '      rel="apple-touch-startup-image"\n' +
      `      media="screen and (device-width: ${ptW}px) and (device-height: ${ptH}px) ` +
      `and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)"\n` +
      `      href="splash/${name.replace(/\.png$/, '.jpg')}"\n` +
      '    />'
  );
}
console.log(`total ${(total / 1024 / 1024).toFixed(1)}MB across ${SCREENS.length} screens`);

// The link tags are the other half of the job: an image with no matching
// media query is never shown. Emitting them from the same table that made the
// images is the only way the two cannot drift apart.
writeFileSync(resolve(OUT_DIR, 'links.html'), tags.join('\n') + '\n');
console.log('\nwrote splash/links.html — paste into index.html <head>');
