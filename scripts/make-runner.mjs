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
//      straight RGBA),
//   2. keys out whatever the exporter left behind for a background,
//   3. finds the eight frames by scanning for transparent columns,
//   4. trims the sheet vertically to the art,
//   5. re-packs each frame centred in a uniform cell,
//   6. writes img/lucy-run.png and prints the numbers the CSS needs.
//
// Step 2 is not paranoia. Three sheets have been through here and two of them
// were exported as "transparent" without being transparent; see WASH.
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

// Anything at or below this is background; above it, alpha is rescaled so the
// surviving range still spans 0–255.
//
// "Transparent" in an export's filename means the exporter was asked for
// transparency, not that it delivered it, and this is the one line of defence
// against what it actually hands over. Two rejected sheets, both named
// -transparent: one carried a single 1px column of 1–5/255 alpha in a gap
// between frames, invisible at any size and enough to make the frame scan
// count nine; the other carried its whole canvas at alpha 15–19 over a grey,
// which is nothing on a dark drawing surface and a grey rectangle the size of
// the cell once it is composited on the splash's cream.
//
// The rescale rather than a straight cut matters for sketched art, whose fur
// edges are genuinely semi-transparent — cutting at a threshold trades a grey
// box for a hard cut-out edge. On a clean sheet like the current one this is
// close to a no-op, which is the point: it costs nothing and it catches the
// export that isn't.
const WASH = 8;

// Alpha above this counts as art when finding the frame boundaries. It never
// changes a pixel — it only decides where one frame ends and the next begins,
// and where the band of art starts and stops vertically.
//
// Kept separate from WASH because a sheet can need a high bar here and a low
// one there: frames six and seven are drawn 2px apart, so on a sheet with any
// halo around the art the two dogs merge into one 405px-wide run and the
// count fails. This sheet's edges are hard, so the two settings agree.
const ALPHA_FLOOR = 8;

// Cells round up to a multiple of this, and the CSS displays them divided by
// it. Two things are being held at once.
//
// The hard requirement is that the display size is a whole number of CSS
// pixels: `background-position-x` steps by one cell per frame, and a
// fractional step slides a sliver of the next frame into view on every tick.
//
// The judgement is the size on the lane, and it does not change when the art
// does. Somewhere around 38px leaves her an eighth of the run, which is what
// makes the distance look like a distance; at a fifth she appears to arrive
// almost as soon as she sets off. So when a sheet arrives bigger, this number
// goes up to hold the dog the same size — six for this one's 222px cells,
// where the first commissioned sheet's 114px cells wanted three.
const DIVISOR = 6;

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

// Key the wash out first, so every later step — the frame scan, the vertical
// trim, the copy — is looking at the drawing rather than at the canvas it was
// exported over. Counted, and reported, because "how much of this sheet was
// background" is the one number that says whether the key did anything.
let keyed = 0;
for (let i = 3; i < px.length; i += 4) {
  const a = px[i];
  if (a <= WASH) {
    px[i] = 0;
    keyed++;
  } else {
    px[i] = Math.round(((a - WASH) / (255 - WASH)) * 255);
  }
}

const columnHasInk = (x) => {
  for (let y = 0; y < h; y++) if (px[(y * w + x) * 4 + 3] > ALPHA_FLOOR) return true;
  return false;
};
const rowHasInk = (y) => {
  for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > ALPHA_FLOOR) return true;
  return false;
};

// Runs of inked columns, separated by fully-transparent gaps, are the frames.
let frames = [];
let start = null;
for (let x = 0; x <= w; x++) {
  const ink = x < w && columnHasInk(x);
  if (ink && start === null) start = x;
  if (!ink && start !== null) {
    frames.push({ x0: start, x1: x }); // x1 exclusive
    start = null;
  }
}

// A frame count of eight is not the same as eight frames. On the loose-leash
// sheet the gap scan found exactly eight runs — two of them 640px blobs of
// three touching figures, two of them 2px slivers of a stray tail — and the
// count alone would have waved it through. A real frame is about a pitch
// wide, so make the widths prove it.
const pitch = w / EXPECTED_FRAMES;
const gapScanIsSane =
  frames.length === EXPECTED_FRAMES &&
  frames.every((f) => {
    const fw = f.x1 - f.x0;
    return fw >= pitch * 0.15 && fw <= pitch * 1.25;
  });

// When the gap scan fails, cut on the grid instead — at the emptiest column
// near each grid line.
//
// The loose-leash sheet is why this exists: eight walking pairs drawn so
// close that a tail tip sits within a pixel of the next figure, and the gap
// scan sees three big blobs instead of eight frames. But the sheet is
// generated on a regular pitch (width / 8), so the boundaries are known to
// within a few pixels — the job is only to avoid cutting *through* ink where
// a leash or a nose strays over the line. Searching ±40px around each grid
// line for the column with the least ink does that; ties go to the column
// closest to the grid, so a clean gap cuts exactly where the generator drew
// it.
//
// After cutting, each slice is tightened to its own ink bounds, which is the
// same shape the gap scan would have produced. A slice with no ink at all
// still fails hard — a sheet with a missing frame should break the build,
// not ship a stutter.
if (!gapScanIsSane) {
  const inkCount = new Array(w).fill(0);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) if (px[(y * w + x) * 4 + 3] > ALPHA_FLOOR) inkCount[x]++;
  }
  const cuts = [0];
  for (let i = 1; i < EXPECTED_FRAMES; i++) {
    const centre = Math.round(i * pitch);
    let best = centre;
    for (let x = Math.max(0, centre - 40); x <= Math.min(w - 1, centre + 40); x++) {
      if (
        inkCount[x] < inkCount[best] ||
        (inkCount[x] === inkCount[best] && Math.abs(x - centre) < Math.abs(best - centre))
      ) {
        best = x;
      }
    }
    cuts.push(best);
  }
  cuts.push(w);

  frames = [];
  for (let i = 0; i < EXPECTED_FRAMES; i++) {
    let x0 = cuts[i];
    let x1 = cuts[i + 1];
    while (x0 < x1 && !columnHasInk(x0)) x0++;
    while (x1 > x0 && !columnHasInk(x1 - 1)) x1--;
    if (x0 === x1) {
      throw new Error(
        `grid cell ${i + 1} (${cuts[i]}-${cuts[i + 1]}) holds no ink — the sheet ` +
          `does not have ${EXPECTED_FRAMES} frames on a regular pitch`
      );
    }
    frames.push({ x0, x1 });
  }
  const leak = cuts.slice(1, -1).filter((c) => inkCount[c] > 0);
  console.log(
    `gap scan failed (frames touch); cut on the ${Math.round(pitch)}px grid instead` +
      (leak.length
        ? ` — ${leak.length} cut${leak.length === 1 ? '' : 's'} pass through ink ` +
          `(${leak.map((c) => `${inkCount[c]}px at x=${c}`).join(', ')})`
        : ', every cut through clear space')
  );
}

let top = 0;
while (top < h && !rowHasInk(top)) top++;
let bottom = h;
while (bottom > top && !rowHasInk(bottom - 1)) bottom--;

// --- re-pack ----------------------------------------------------------------

const round = (n) => n + ((DIVISOR - (n % DIVISOR)) % DIVISOR);
const cellH = round(bottom - top);
const cellW = round(Math.max(...frames.map((f) => f.x1 - f.x0)) + CELL_PAD * 2);
const sheetW = cellW * frames.length;
const out = Buffer.alloc(sheetW * cellH * 4);

frames.forEach((f, i) => {
  const fw = f.x1 - f.x0;
  const dx = i * cellW + Math.floor((cellW - fw) / 2);
  // bottom - top, not cellH: the rounding rows at the foot of the cell are
  // padding, and reading them from the source would run past the sheet.
  for (let y = 0; y < bottom - top; y++) {
    const srcOff = ((top + y) * w + f.x0) * 4;
    const dstOff = (y * sheetW + dx) * 4;
    px.copy(out, dstOff, srcOff, srcOff + fw * 4);
  }
});

// --- repair the leash --------------------------------------------------------

/**
 * Give every frame the leash the generator forgot, and clear the fragments the
 * grid cut left behind.
 *
 * The loose-leash sheet arrived with the leash drawn in six frames of eight.
 * At a sixth scale it is a hairline, but a hairline that blinks on and off
 * eight times a second is exactly the kind of thing the eye catches without
 * being able to say what it saw — and the leash is the whole subject. Frames
 * one and five had none, and four frames carried small orphans in the leash
 * band: severed leash ends stranded on the wrong side of a grid cut.
 *
 * Nothing here is drawn from imagination. The frames that *have* a leash are
 * measured first — where it meets the hand, where it meets the collar, how far
 * it sags, how thick the line is — and the missing ones are drawn to that
 * average, anchored to their own figures. If fewer than three frames have a
 * measurable leash there is nothing to copy and the build fails rather than
 * inventing a house style.
 *
 * Everything runs on the packed sheet rather than the source, so it works in
 * the same coordinates the CSS will show.
 */
const CELL_AREA = cellW * cellH;
const cellMask = (i) => {
  const m = new Uint8Array(cellW * cellH);
  for (let y = 0; y < cellH; y++) {
    for (let x = 0; x < cellW; x++) {
      m[y * cellW + x] = out[((y * sheetW) + i * cellW + x) * 4 + 3] > ALPHA_FLOOR ? 1 : 0;
    }
  }
  return m;
};

// Square-kernel erode/dilate. An opening (erode then dilate) keeps the thick
// masses and drops anything thinner than 2R — which on this art is the leash
// and nothing else, the figures being solid silhouettes.
const LEASH_R = 3;
function morph(src, r, want) {
  const dst = new Uint8Array(cellW * cellH);
  for (let y = 0; y < cellH; y++) {
    for (let x = 0; x < cellW; x++) {
      let hit = 0;
      for (let dy = -r; dy <= r && !hit; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          const v = xx < 0 || xx >= cellW || yy < 0 || yy >= cellH ? 0 : src[yy * cellW + xx];
          if (v === want) {
            hit = 1;
            break;
          }
        }
      }
      dst[y * cellW + x] = want ? hit : hit ? 0 : 1;
    }
  }
  return dst;
}

/** Connected pixels of `pixels`, 8-connected with a 2px bridge for dashed art. */
function groups(pixels) {
  const set = new Set(pixels.map((p) => p.y * cellW + p.x));
  const seen = new Set();
  const found = [];
  for (const p of pixels) {
    const k = p.y * cellW + p.x;
    if (seen.has(k)) continue;
    seen.add(k);
    const stack = [p];
    const group = [];
    while (stack.length) {
      const q = stack.pop();
      group.push(q);
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const kk = (q.y + dy) * cellW + (q.x + dx);
          if (set.has(kk) && !seen.has(kk)) {
            seen.add(kk);
            stack.push({ x: q.x + dx, y: q.y + dy });
          }
        }
      }
    }
    found.push(group);
  }
  return found;
}

// The band the leash lives in — between the walker's hand and the dog's neck,
// as fractions of cell height so it survives a sheet of a different size.
const BAND_TOP = Math.round(cellH * 0.45);
const BAND_BOTTOM = Math.round(cellH * 0.82);

const measured = [];
const cells = [];
for (let i = 0; i < frames.length; i++) {
  const mask = cellMask(i);
  const opened = morph(morph(mask, LEASH_R, 0), LEASH_R, 1);
  const residue = [];
  for (let y = BAND_TOP; y < BAND_BOTTOM; y++) {
    for (let x = 0; x < cellW; x++) {
      if (mask[y * cellW + x] && !opened[y * cellW + x]) residue.push({ x, y });
    }
  }
  const best = groups(residue).sort((a, b) => b.length - a.length)[0] || [];

  // Whether a frame has a leash is a question about connectivity, not length:
  // a leash is the thing that joins the two figures into one shape. Measuring
  // the residue's span instead got frame two wrong — its leash is the
  // steepest on the sheet and spans only 29px, under any threshold that also
  // rejects the stranded stub in frame one — and drew a second leash over the
  // one already there.
  //
  // The dilation is what makes it a fair question. The generator's leashes
  // stop a pixel short of the collar, which is invisible and still counts as
  // disconnected; bridging 2px closes that without closing the 13px and 30px
  // voids in the frames that genuinely have nothing.
  const bridged = morph(mask, 1, 1);
  const wide = [];
  for (let y = 0; y < cellH; y++) {
    for (let x = 0; x < cellW; x++) if (bridged[y * cellW + x]) wide.push({ x, y });
  }
  const bodies = groups(wide).filter((g) => g.length > CELL_AREA * 0.02);
  const hasLeash = bodies.length === 1;
  cells.push({ mask, opened, best, hasLeash });
  if (!hasLeash || !best.length) continue;

  const sorted = [...best].sort((a, b) => a.x - b.x);
  const collar = sorted[0];
  const hand = sorted[sorted.length - 1];
  let sag = 0;
  for (const p of best) {
    const t = (p.x - collar.x) / Math.max(1, hand.x - collar.x);
    sag = Math.max(sag, p.y - (collar.y + t * (hand.y - collar.y)));
  }
  const length = Math.hypot(hand.x - collar.x, hand.y - collar.y);
  measured.push({ collarY: collar.y, handY: hand.y, sag, width: best.length / Math.max(1, length) });
}

const drawn = [];
if (measured.length >= 3) {
  const mean = (k) => measured.reduce((s, m) => s + m[k], 0) / measured.length;
  const handY = Math.round(mean('handY'));
  const collarY = Math.round(mean('collarY'));
  const sag = mean('sag');
  const stroke = Math.max(2, mean('width'));

  for (let i = 0; i < cells.length; i++) {
    // Clear stranded fragments first, so a severed end cannot sit beside a
    // freshly drawn leash. Anything in the band that is small and touches
    // neither figure is debris — a real leash reaches all the way across.
    const { mask } = cells[i];
    const loose = [];
    for (let y = BAND_TOP; y < BAND_BOTTOM; y++) {
      for (let x = 0; x < cellW; x++) if (mask[y * cellW + x]) loose.push({ x, y });
    }
    for (const g of groups(loose)) {
      const gxs = g.map((p) => p.x);
      const gys = g.map((p) => p.y);
      const touchesFigure =
        Math.min(...gys) <= BAND_TOP || Math.max(...gys) >= BAND_BOTTOM - 1;
      if (touchesFigure || g.length > CELL_AREA * 0.02) continue;
      if (Math.max(...gxs) - Math.min(...gxs) > cellW * 0.15) continue;
      for (const p of g) {
        const o = ((p.y * sheetW) + i * cellW + p.x) * 4;
        out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0;
      }
    }

    if (cells[i].hasLeash) continue;

    // Anchor to this frame's own figures: the hand is the walker's leading
    // edge at the height the other frames hold the leash, the collar the dog's
    // trailing edge at the height the other frames attach to it. The split
    // between the two figures is the emptiest column in the middle third.
    const fresh = cellMask(i);
    const colInk = new Array(cellW).fill(0);
    for (let x = 0; x < cellW; x++) {
      for (let y = 0; y < cellH; y++) if (fresh[y * cellW + x]) colInk[x]++;
    }
    let split = Math.round(cellW / 2);
    for (let x = Math.round(cellW * 0.35); x < Math.round(cellW * 0.65); x++) {
      if (colInk[x] < colInk[split]) split = x;
    }

    const scan = (from, to, y0, step) => {
      for (let y = y0 - 6; y <= y0 + 6; y++) {
        for (let x = from; step > 0 ? x <= to : x >= to; x += step) {
          if (y >= 0 && y < cellH && fresh[y * cellW + x]) return { x, y };
        }
      }
      return null;
    };
    const hand = scan(split, cellW - 1, handY, 1);
    const collar = scan(split, 0, collarY, -1);
    if (!hand || !collar) {
      throw new Error(
        `frame ${i + 1} has no leash and no place to attach one ` +
          `(hand ${hand ? 'ok' : 'missing'}, collar ${collar ? 'ok' : 'missing'} ` +
          `around y ${handY}/${collarY}) — check the band fractions against this sheet`
      );
    }

    // Quadratic Bézier with the measured sag, stamped as overlapping discs so
    // the line is round-capped and anti-aliased like the art around it.
    const mx = (collar.x + hand.x) / 2;
    const my = (collar.y + hand.y) / 2 + sag * 2;
    const steps = Math.ceil(Math.hypot(hand.x - collar.x, hand.y - collar.y) * 3);
    const rad = stroke / 2;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const u = 1 - t;
      const cx = u * u * collar.x + 2 * u * t * mx + t * t * hand.x;
      const cy = u * u * collar.y + 2 * u * t * my + t * t * hand.y;
      for (let y = Math.floor(cy - rad - 1); y <= Math.ceil(cy + rad + 1); y++) {
        for (let x = Math.floor(cx - rad - 1); x <= Math.ceil(cx + rad + 1); x++) {
          if (x < 0 || x >= cellW || y < 0 || y >= cellH) continue;
          const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
          const cover = Math.max(0, Math.min(1, rad + 0.5 - d));
          if (cover <= 0) continue;
          const o = ((y * sheetW) + i * cellW + x) * 4;
          const a = Math.round(cover * 255);
          if (a <= out[o + 3]) continue;
          out[o] = 0;
          out[o + 1] = 0;
          out[o + 2] = 0;
          out[o + 3] = a;
        }
      }
    }
    drawn.push(i + 1);
  }
  console.log(
    `leash: measured in ${measured.length} frames ` +
      `(hand y${handY}, collar y${collarY}, sag ${sag.toFixed(0)}px, ${stroke.toFixed(1)}px wide)` +
      (drawn.length ? `; drew it into ${drawn.length} — frames ${drawn.join(', ')}` : '; none missing')
  );
} else {
  throw new Error(
    `only ${measured.length} frames have a measurable leash — too few to copy from. ` +
      `Either the sheet has no leash at all (drop this pass) or the band fractions ` +
      `(${BAND_TOP}-${BAND_BOTTOM} of ${cellH}) miss it.`
  );
}

const bytes = encode(OUT, sheetW, cellH, out);

console.log(
  `keyed ${((keyed / (w * h)) * 100).toFixed(1)}% of the source to transparent ` +
    `(alpha <= ${WASH})`
);
console.log(
  `wrote img/lucy-run.png — ${frames.length} frames, ${cellW}×${cellH} each, ` +
    `sheet ${sheetW}×${cellH}, ${(bytes / 1024).toFixed(1)}KB`
);
console.log(
  `CSS: width ${cellW / DIVISOR}px; height ${cellH / DIVISOR}px; ` +
    `background-size ${sheetW / DIVISOR}px ${cellH / DIVISOR}px; ` +
    `steps(${frames.length}) to background-position-x -${sheetW / DIVISOR}px ` +
    `(native cell ${cellW}×${cellH}, shown at 1/${DIVISOR})`
);
