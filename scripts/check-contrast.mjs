#!/usr/bin/env node
/* Does the palette still pass?
 *
 *   node scripts/check-contrast.mjs
 *
 * Reads the design tokens out of css/app.css — the stylesheet itself, so this
 * checks what ships rather than what docs/design-system.md remembers — and
 * verifies every color pairing the UI depends on against its WCAG floor:
 * 4.5:1 for normal text (AA), 3:1 for non-text indicators (1.4.11).
 *
 * The pair list is the contract. Adding a new semantic role that puts text on
 * a fill means adding its pairing here, or the check is silently not checking
 * it. Exits 1 on any failure so it can gate a commit.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const css = fs.readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../css/app.css'),
  'utf8'
);

/* Every `--name: value;` declaration in the file, comments stripped first so
   prose about tokens is not read as tokens. The value must reach its `;`
   without crossing a brace, which is what keeps `.btn--caution:hover {`
   from parsing as a definition of --caution. Later definitions win, which is
   fine: the token block comes first and nothing later redefines its names —
   except --splash-field, which only exists at .splash scope and is wanted
   here. */
const tokens = {};
const bare = css.replace(/\/\*[\s\S]*?\*\//g, '');
for (const m of bare.matchAll(/(?<=[{;\s])--([\w-]+)\s*:\s*([^;{}]+);/g)) {
  tokens[m[1]] = m[2].trim();
}

/* Resolve var() chains (semantic role → primitive) down to a hex literal. */
function resolve(name, depth = 0) {
  if (depth > 8) throw new Error(`token loop at --${name}`);
  const v = tokens[name];
  if (!v) throw new Error(`missing token --${name}`);
  const ref = v.match(/^var\(--([\w-]+)\)$/);
  if (ref) return resolve(ref[1], depth + 1);
  if (!/^#[0-9a-f]{6}$/i.test(v)) throw new Error(`--${name} is not a hex color: ${v}`);
  return v;
}

const lin = (c) => (c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const AA = 4.5; // normal text
const NT = 3; // non-text: borders, focus rings, meaningful fills

const pairs = [
  ['text-primary', 'background', AA, 'body text on paper'],
  ['text-primary', 'surface', AA, 'body text on card'],
  ['text-primary', 'surface-sunken', AA, 'body text on sunken well'],
  ['text-secondary', 'background', AA, 'secondary text on paper'],
  ['text-secondary', 'surface', AA, 'secondary text on card'],
  ['text-secondary', 'surface-sunken', AA, 'secondary text on badges'],
  ['primary', 'background', AA, 'links on paper'],
  ['primary', 'surface', AA, 'links on card'],
  ['text-on-dark', 'primary', AA, 'button label on primary fill'],
  ['text-on-dark', 'primary-dark', AA, 'button label on primary hover'],
  ['text-on-dark', 'secondary', AA, 'label on denim fill'],
  ['text-on-dark', 'text-primary', AA, 'toast text on dark pill'],
  ['primary-dark', 'surface', AA, 'quiet button label'],
  ['primary-dark', 'primary-wash', AA, 'current tab label on its fill'],
  ['primary-dark', 'splash-field', AA, 'splash wordmark on the artwork field'],
  ['reward-text', 'reward-wash', AA, 'reward text on its wash'],
  ['reward-text', 'background', AA, 'reward text on paper'],
  ['reward-text', 'surface', AA, 'reward text on card'],
  ['success', 'surface', AA, 'success text on card'],
  ['success', 'success-wash', AA, 'success text on its wash'],
  ['success', 'background', AA, 'success text on paper'],
  ['caution-text', 'background', AA, 'caution text on paper'],
  ['caution-text', 'caution-wash', AA, 'caution text on its wash'],
  ['caution-text', 'surface', AA, 'caution text on card'],
  ['primary', 'background', NT, 'focus ring against paper'],
  ['caution', 'surface', NT, 'caution border on card'],
  ['caution', 'background', NT, 'caution border on paper'],
  ['primary', 'surface-sunken', NT, 'meter fill against its track'],
  ['secondary', 'surface-sunken', NT, 'denim fill against its track'],
];
/* Not listed on purpose: --reward against its track. The gold meter fill is
   decorative by rule (never text, always beside a label with the value) and
   has sat under 2:1 since the tan palette. Listing it would mean either
   failing forever or lying about the floor. */

let failed = 0;
for (const [fg, bg, floor, label] of pairs) {
  const ratio = contrast(resolve(fg), resolve(bg));
  const ok = ratio >= floor;
  if (!ok) failed += 1;
  console.log(
    `  ${ok ? '✓' : '✗'} ${ratio.toFixed(2).padStart(5)}:1  (needs ${floor}:1)  ${label}`
  );
}

console.log(failed ? `\n  ${failed} pairing(s) below floor.` : '\n  All pairings hold.');
process.exit(failed ? 1 : 0);
