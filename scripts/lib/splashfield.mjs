// The splash field colour, and the three files that have to agree about it.
//
// The launch sequence is two pictures pretending to be one: iOS shows a static
// image while a standalone PWA boots, then the app paints its own splash. If the
// colour behind the artwork differs between them by even a shade, the launch
// flashes. And the artwork itself is a full-width illustration, so the field has
// to be the colour the illustration already is at its own edges — otherwise the
// art reads as a rectangle sitting on a slightly different tint, which is the
// same seam in the other direction.
//
// That one colour was written down in three places:
//
//   FIELD              scripts/make-splash.mjs   bakes it into the iOS images
//   --splash-field     css/app.css               what the app paints
//   background_color   manifest.webmanifest      what the OS paints around it
//
// Each carried a comment telling the next person to keep the others in step,
// which is the comment you write when the code cannot do it for you. Now it can:
// the colour is MEASURED from the artwork rather than chosen, so make-splash
// reads it off the source at build time and `approve` writes the same
// measurement into the other two. Nobody has to remember anything, and a test
// asserts the stylesheet still matches the art on disk.
//
// Pure functions over strings and buffers, so all of it is testable without a
// browser, a phone or macOS.

import { inflateSync } from 'node:zlib';

/**
 * How far in from each edge the field is sampled.
 *
 * A six-pixel ring, which is what the measurement in make-splash.mjs was
 * documented as using. Deep enough to miss a stray anti-aliased outermost row,
 * shallow enough that it is still the border and not the picture.
 */
export const EDGE_RING = 6;

/** Decode an 8-bit non-interlaced RGB/RGBA PNG to raw samples. */
export function decodePng(buffer) {
  let offset = 8;
  let header = null;
  const idat = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const start = offset + 8;
    if (type === 'IHDR') header = buffer.subarray(start, start + 13);
    else if (type === 'IDAT') idat.push(buffer.subarray(start, start + length));
    else if (type === 'IEND') break;
    offset = start + length + 4;
  }
  if (!header) throw new Error('not a PNG: no IHDR');
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

/**
 * The mean colour of a ring `depth` pixels deep around all four edges.
 *
 * Measured rather than chosen. Every redraw of the splash has shifted this
 * slightly, and picking a value by eye is how the seam comes back.
 */
export function measureField(image, depth = EDGE_RING) {
  const { width, height, bpp, data } = image;
  let r = 0, g = 0, b = 0, n = 0;
  const take = (x, y) => {
    const i = (y * width + x) * bpp;
    r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
  };
  for (let y = 0; y < Math.min(depth, height); y++) for (let x = 0; x < width; x++) take(x, y);
  for (let y = Math.max(0, height - depth); y < height; y++) for (let x = 0; x < width; x++) take(x, y);
  for (let x = 0; x < Math.min(depth, width); x++) {
    for (let y = depth; y < height - depth; y++) take(x, y);
  }
  for (let x = Math.max(0, width - depth); x < width; x++) {
    for (let y = depth; y < height - depth; y++) take(x, y);
  }
  if (!n) throw new Error('no edge pixels to measure');
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

export const toHex = (rgb) => '#' + rgb.map((c) => c.toString(16).padStart(2, '0')).join('');

/**
 * Set `--splash-field` in css/app.css.
 *
 * Idempotent, and it refuses rather than appends if the token is not already
 * there: a stylesheet that has lost the token is not one this should be
 * inventing a place in.
 */
export function setCssField(css, hex) {
  const re = /(--splash-field:\s*)(#[0-9a-fA-F]{3,8})/;
  if (!re.test(css)) throw new Error('--splash-field not found in the stylesheet');
  return css.replace(re, `$1${hex}`);
}

/** Set `background_color` in manifest.webmanifest, preserving its formatting. */
export function setManifestBackground(json, hex) {
  const re = /("background_color"\s*:\s*")(#[0-9a-fA-F]{3,8})(")/;
  if (!re.test(json)) throw new Error('background_color not found in the manifest');
  return json.replace(re, `$1${hex}$3`);
}

/** Read `--splash-field` back out, for the test that pins art and app together. */
export function cssField(css) {
  const m = /--splash-field:\s*(#[0-9a-fA-F]{3,8})/.exec(css);
  return m ? m[1].toLowerCase() : null;
}

/** Read `background_color` back out. */
export function manifestBackground(json) {
  const m = /"background_color"\s*:\s*"(#[0-9a-fA-F]{3,8})"/.exec(json);
  return m ? m[1].toLowerCase() : null;
}
