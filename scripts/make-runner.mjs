#!/usr/bin/env node
// Builds the pixel-art Lucy that runs across the splash while the app boots.
//
//   node scripts/make-runner.mjs        writes img/lucy-run.svg
//
// Why a generator and not a drawn asset: the frames have to stay in register —
// same baseline, same scale, only the pose changing — and editing four aligned
// bitmaps by hand and keeping them aligned is the kind of job that goes wrong
// quietly. Here each frame is a text grid that diffs like source, the palette
// is one table, and a change to her coat colour is one line rather than four
// files.
//
// The first cut shared one BODY between frames and swapped only the legs. That
// kept the cycle in register but capped how alive it could look: a gallop
// bounces — the tail flicks, the head drives forward and gathers back — so the
// frames are now authored whole. Register is protected differently: every
// frame is validated to the same box, and the visual check is the sprite sheet
// itself, where four whole dogs sit side by side and a drifted baseline is
// obvious at a glance.
//
// The output is one SVG sprite sheet, four frames wide, each frame FRAME_W ×
// FRAME_H "pixels" rendered as rects. CSS runs it with steps(4) over a window
// one frame wide. SVG rather than PNG because it is a background-image either
// way, it stays crisp at any device pixel ratio, and it is a few KB of text.
//
// She is drawn facing right, because she runs left to right across the lane.
// The gallop is the classic four-beat cycle: reach (airborne, stretched),
// pull (front feet taking the ground), gather (airborne, folded under),
// drive (back feet pushing off).

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(root, 'img/lucy-run.svg');

// Lucy's palette, same as the illustrations: black coat with a darker shade
// for the far-side legs and the ear, cream scruff on the muzzle and chest,
// white toes, purple collar, round blue tag.
const INK = {
  K: '#22221f', // coat
  D: '#3a3a3c', // far side — legs on the other side, and the ear
  M: '#e8ddc8', // muzzle scruff and chest blaze
  W: '#f4efe4', // toes
  P: '#7d5aa6', // collar
  B: '#3d7ea6', // tag
};

const FRAME_W = 32;
const FRAME_H = 20;

// Rows shorter than FRAME_W are right-padded with transparent; longer is an
// error. This is what makes hand-editing the grids survivable — trailing
// emptiness does not have to be counted out by hand.
const pad = (row) => {
  if (row.length > FRAME_W) throw new Error(`row wider than ${FRAME_W}: "${row}"`);
  return row.padEnd(FRAME_W, '.');
};

// --- the four frames -------------------------------------------------------
//
// Anatomy shared by eye rather than by code: tail on the left, hindquarters,
// a level back, shoulders, a real neck carrying the head forward, cream on
// the muzzle, collar and tag at the throat, cream chest behind the front
// legs. Legs are two black near-side and two dark far-side, toes white.

const FRAMES = [
  // 1 — REACH: airborne and stretched, front legs thrown forward, back legs
  // trailing, tail streaming up and back.
  [
    '...KK',
    '..KKK',
    '..KK....................DD',
    '...KK..................KKKKKK',
    '....K.................KKKKKKKMM',
    '.....KKKKKKKKKKKKKKKKKKKKKKKMMM',
    '....KKKKKKKKKKKKKKKKKKKKKKKMMM',
    '....KKKKKKKKKKKKKKKKKKKPPKKMM',
    '.....KKKKKKKKKKKKKKKKKKPBKMM',
    '.....KKKKKKKKKKKKKKKKKKKMM',
    '......KKKKKKKKKKKKKKKKMM',
    '',
    '...DD...KKK.........DD....KKK',
    '..DD...KK............DD.....KK',
    '.DD...KK..............DD.....KK',
    'DD...KK................DD.....KK',
    'WW...WW.........................',
    '.....................WW......WW',
    '',
    '',
  ],
  // 2 — PULL: front legs planted and taking the ground, back legs swinging
  // through underneath, head dipping into the stride, tail levelling.
  [
    '',
    '.KKK',
    '..KKK...................DD',
    '...KKK.................KKKKKK',
    '....KK................KKKKKKKMM',
    '.....KKKKKKKKKKKKKKKKKKKKKKKMMM',
    '....KKKKKKKKKKKKKKKKKKKKKKKMMM',
    '....KKKKKKKKKKKKKKKKKKKPPKKMM',
    '.....KKKKKKKKKKKKKKKKKKPBKMM',
    '.....KKKKKKKKKKKKKKKKKKKMM',
    '......KKKKKKKKKKKKKKKKMM',
    '',
    '......DD..KKK.......DDKK',
    '......DD...KK.......DD.KK',
    '.....DD.....KK......DD..KK',
    '.....DD.....KK.....DD...KK',
    '............WW..........WW',
    '...........................',
    '',
    '',
  ],
  // 3 — GATHER: airborne with everything folded under her, back arched a
  // touch, tail flicked high, the moment of hang before the next drive.
  [
    '..KKK',
    '.KKKK',
    '.KK.....................DD',
    '..K....................KKKKKK',
    '......................KKKKKKKMM',
    '.....KKKKKKKKKKKKKKKKKKKKKKKMMM',
    '....KKKKKKKKKKKKKKKKKKKKKKKMMM',
    '....KKKKKKKKKKKKKKKKKKKPPKKMM',
    '.....KKKKKKKKKKKKKKKKKKPBKMM',
    '.....KKKKKKKKKKKKKKKKKKKMM',
    '......KKKKKKKKKKKKKKKKMM',
    '',
    '.......DDKKK......DDKKK',
    '........DDKK.......DDKK',
    '.........DDKK......DDKK',
    '.........DDKK.......DDKK',
    '...........WW..........WW',
    '',
    '',
    '',
  ],
  // 4 — DRIVE: back legs planted and pushing off behind her, front legs
  // folding up toward the chest, head rising out of the stride.
  [
    '....KK',
    '...KKK',
    '..KKK...................DD',
    '...KK..................KKKKKK',
    '....K.................KKKKKKKMM',
    '.....KKKKKKKKKKKKKKKKKKKKKKKMMM',
    '....KKKKKKKKKKKKKKKKKKKKKKKMMM',
    '....KKKKKKKKKKKKKKKKKKKPPKKMM',
    '.....KKKKKKKKKKKKKKKKKKPBKMM',
    '.....KKKKKKKKKKKKKKKKKKKMM',
    '......KKKKKKKKKKKKKKKKMM',
    '',
    '....DD..KKK.........DDKKK',
    '...DD..KK............DDKK',
    '..DD..KK..............DDKKK',
    '.DD..KK................DD.KK',
    '.....WW....................WW',
    '.WW',
    '',
    '',
  ],
].map((rows) => {
  if (rows.length > FRAME_H) throw new Error(`frame taller than ${FRAME_H}`);
  const grid = rows.map(pad);
  while (grid.length < FRAME_H) grid.push('.'.repeat(FRAME_W));
  return grid;
});

// --- emit ------------------------------------------------------------------

// One rect per pixel would be thousands of rects. Runs of the same colour on a
// row collapse into a single rect, which keeps the file small and readable.
function rowRects(row, y, xOffset) {
  const rects = [];
  let run = null;
  const flush = () => {
    if (run) {
      rects.push(
        `<rect x="${run.x + xOffset}" y="${y}" width="${run.w}" height="1" fill="${INK[run.ch]}"/>`
      );
      run = null;
    }
  };
  for (let x = 0; x < row.length; x++) {
    const ch = row[x];
    if (ch === '.') {
      flush();
      continue;
    }
    if (!INK[ch]) throw new Error(`unknown ink "${ch}"`);
    if (run && run.ch === ch && run.x + run.w === x) run.w += 1;
    else {
      flush();
      run = { ch, x, w: 1 };
    }
  }
  flush();
  return rects;
}

const rects = [];
FRAMES.forEach((grid, frame) => {
  const xOffset = frame * FRAME_W;
  grid.forEach((row, y) => rects.push(...rowRects(row, y, xOffset)));
});

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" ` +
  `width="${FRAME_W * FRAMES.length}" height="${FRAME_H}" ` +
  `viewBox="0 0 ${FRAME_W * FRAMES.length} ${FRAME_H}" ` +
  `shape-rendering="crispEdges">\n  ` +
  rects.join('\n  ') +
  '\n</svg>\n';

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, svg);
console.log(
  `wrote img/lucy-run.svg — ${FRAMES.length} frames, ${FRAME_W}×${FRAME_H} each, ` +
    `${rects.length} rects, ${(svg.length / 1024).toFixed(1)}KB`
);
