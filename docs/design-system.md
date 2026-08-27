# Design system

The UI's color system, written down: where every color comes from, what each
one is allowed to do, and the contrast floors each pairing has to keep.
`scripts/check-contrast.mjs` verifies the table at the bottom against the
tokens actually in `css/app.css` — run it after touching any color.

## The idea

Every accent in the chrome is sampled from the illustrations, and the chrome
runs cool while the art runs warm.

The anchor is Lucy's collar. Sampled from the artwork (`img/splash-mark.jpg`),
the lit strap reads `#4a216d` — a violet at hue ≈272° — and its shadow side
`#381a54`. The UI's primary is that same hue, lifted just far enough
(`#6a3d94`) to hold WCAG AA both as text on paper and under white text as a
button fill. The deeper steps of the ramp stay within arm's reach of the
sampled strap, so the buttons and the collar in the pictures read as the same
object.

Everything else follows from three rules:

1. **The chrome is cool; the art is warm.** The illustrations carry their own
   warm cream fields, wood floors, and olive greens. The app does not compete
   with that — it frames it. Paper, borders, and text are slate pulled a few
   degrees toward the collar's hue; the accents are violet and denim. Warm
   pictures on a cool field sit forward, the way they do on a gallery wall.
   On the old tan paper the art's cream dissolved into the UI's cream; now
   the picture starts where the warmth starts.
2. **Warmth in the chrome always means reward.** Gold — the treat pouch's
   ochre — is the one warm family the UI keeps, and it appears only on
   reward moments: mastery badges, the reward meter, the goal star. Because
   nothing else in the chrome is warm, warmth itself becomes a signal.
   (The player's cue callout learned this the hard way: it wore gold for a
   while, and a cue is an instruction, not a reward — it speaks violet now.)
3. **Violet marks what you can tap and where you are.** Buttons, links,
   focus rings, the current tab, the current step — violet is a promise of
   action or presence. Eyebrows, captions, and counts are metadata and speak
   slate; the activity marks are identity and speak denim. When everything
   is violet, nothing is.

The splash was redrawn *for* this palette, then given a gentle version of
the art grade baked into the source pixels (saturation ×0.85, 7% violet
blend — CSS cannot reach the OS launch images, so its treatment lives in
the file; the ungraded original is kept at
`art/source/splash-source-ungraded.png`). Its field is the graded art's own
lavender (`--splash-field: #e4dcec`, measured from a six-pixel ring around
the source and baked into the iOS launch images by
`scripts/make-splash.mjs`). The wordmark on it is `--primary-dark` — the
collar violet against the field the art was drawn on, at 7.53:1. The launch
now opens inside the cool system; the fade to the app is just the paper
arriving.

### The art grade

The illustrations were painted for the tan UI, so in the app they pass
through one grade: `--art-grade` (`saturate(0.62) brightness(0.97)` on the
`img`) and `--art-veil` (a 16% wash of the collar violet, painted by a
`::before` on each illustration container). The grade cools the art's
cream the same direction the paper went without touching the source
files, and it is two tokens — one decision, reversible by setting them to
`none` and `transparent`. It began gentler (`saturate(0.86)`, 7%) and was
strengthened on review, then lifted a step brighter; if it moves again,
these numbers and this sentence are the whole edit.

The avatars take the filter too — they are painted portraits from the same
set, on the same warm cream, and ungraded they were the one warm note left
in the chrome — but not the veil: at avatar size the filter alone carries
the grade. The one exemption is the splash art, which must stay
byte-identical to the baked iOS launch images — its gentler grade is baked
into the source pixels instead, as described above. If the illustration set
is ever regenerated with a cooler palette, delete the grade rather than
stacking the two.

## Token architecture

Three layers, top of `css/app.css`:

1. **Primitives** — raw ramps, named for where they live in the artwork.
   Nothing outside the token block may reference a primitive.
2. **Semantic roles** — `--background`, `--primary`, `--caution-text`, and so
   on. This is the only color vocabulary the rest of the stylesheet uses.
3. **Components** — the classes themselves (`.btn`, `.badge`, `.meter`, the
   tab bar), which consume semantic roles only.

To restyle the app, move layer 2's assignments. To retune a color, move
layer 1 and re-run the checks. Component CSS should never need to change for
a palette decision.

### Primitives

| Ramp | From the artwork | Steps |
| --- | --- | --- |
| `--violet-*` | Lucy's collar | `50 #efe9f6` · `100 #e0d5f0` · `300 #a98fd0` · `600 #6a3d94` · `700 #55307a` · `800 #452368` (the lit strap) · `900 #34204f` (its shadow) |
| `--slate-*` | neutrals, hue ≈245° at 2–8% saturation | `25 #f5f4f9` · `50 #ededf4` · `100 #e9e8f1` · `200 #dcdbe8` · `300 #c1c0d4` · `500 #5b5977` · `800 #24223a` · `900 #161428` |
| `--denim-*` | the blue hoodie, Lucy's tag | `600 #4c6b9b` |
| `--gold-*` | the treat pouch | `100 #f9f0d8` · `400 #e3b448` · `800 #755718` |
| `--spruce-*` | the yard through the open door | `100 #e2eeea` · `600 #34735c` |
| `--rose-*` | caution; magenta-side kin to the violet | `100 #f8e9ed` · `400 #c25e79` · `600 #a63d5b` · `700 #92344e` |

The slate cast is the quiet load-bearer: enough violet that the grays belong
to the collar's family, not so much that secondary text reads purple.

### Semantic roles

| Role | Primitive | Allowed to |
| --- | --- | --- |
| `--background` | slate-25 | the paper behind every screen |
| `--field` | slate-100 | behind the column on wide windows |
| `--surface` | white | cards, sheets, the tab bar |
| `--surface-sunken` | slate-50 | wells, tracks, inactive chips |
| `--text-primary` | slate-800 | body text; also the dark fill behind toasts |
| `--text-primary-dark` | slate-900 | hover only |
| `--text-secondary` | slate-500 | supporting text, inactive tabs |
| `--primary` | violet-600 | actions: fills under white text, links, focus rings, meters |
| `--primary-dark` | violet-700 | hover, current tab, quiet-button labels, the splash wordmark |
| `--primary-wash` | violet-50 | tints behind current/selected states |
| `--secondary` | denim-600 | informational accents — the activity marks — and the second series where one accent is not enough |
| `--reward` / `--reward-text` / `--reward-wash` | gold | reward moments only; `--reward` is fills and accents, never text |
| `--success` / `--success-wash` | spruce | "that held", improvement deltas |
| `--caution` / `--caution-text` / `--caution-text-dark` / `--caution-wash` | rose | "too excited", regressions; `--caution` is fills and borders, `--caution-text` is the text-safe step |
| `--border` / `--border-strong` | slate-200/300 | hairlines and control outlines |

Shadow ink is slate-900 (`rgba(22, 20, 40, …)`), so depth cools with
everything else.

## Contrast

Verified floors, not aspirations — `node scripts/check-contrast.mjs` fails the
build if any pairing drops below its floor. Normal text needs 4.5:1 (WCAG AA),
non-text indicators 3:1 (WCAG 1.4.11).

| Pairing | Floor | Measured |
| --- | --- | --- |
| body text on paper / card / sunken | 4.5 | 14.06 / 15.39 / 13.20 |
| secondary text on paper / card / sunken | 4.5 | 6.11 / 6.69 / 5.74 |
| primary as link on paper / card | 4.5 | 7.09 / 7.75 |
| white text on primary / primary-dark | 4.5 | 7.75 / 10.05 |
| primary-dark on card / primary-wash | 4.5 | 10.05 / 8.45 |
| white on secondary (denim) | 4.5 | 5.41 |
| reward-text on wash / paper / card | 4.5 | 5.90 / 6.13 / 6.70 |
| success on card / wash / paper | 4.5 | 5.60 / 4.70 / 5.11 |
| caution-text on paper / wash / card | 4.5 | 5.58 / 5.19 / 6.10 |
| splash wordmark (primary-dark) on `--splash-field` | 4.5 | 7.53 |
| denim activity mark on card | 3 | 5.41 |
| focus ring (primary) vs paper | 3 | 7.09 |
| caution border vs card / paper | 3 | 4.06 / 3.71 |
| primary or secondary meter fill vs track | 3 | 6.65 / 4.64 |

Known and accepted: the gold reward meter fill sits at ~1.7:1 against its
track, the same ratio the previous tan palette had there. `--reward` is
decorative by rule — every reward meter renders beside a text label carrying
the value — so nothing is communicated by that fill alone.

## Type, space, shape, motion

Unchanged by the palette work and documented here because they are the rest
of the system: Fraunces for display (`--font-display`, SOFT/WONK tuned per
heading level), Karla for everything small (`--font`); a six-step type scale
(`--step--1` … `--step-4`); a seven-step space scale (`--s-1` … `--s-7`);
radii `--r-sm/md/lg/pill`; two motion curves only (`--spring` to arrive,
`--ease-soft` to leave — a third has to argue its way into the tokens);
48px minimum tap targets (`--tap`).

## Changing a color

1. Move the primitive in `css/app.css`, not the component.
2. `node scripts/check-contrast.mjs` — it reads the stylesheet itself, so it
   checks what shipped, not what this document remembers.
3. If `--background` moved: update `theme_color` in both `index.html` and
   `manifest.webmanifest`, and the two transparent gradient stops
   (`rgba(245, 244, 249, 0)`) that fade the sticky action bar into the paper.
4. If the splash field moved (it belongs to the art, not to this palette):
   `scripts/make-splash.mjs` and `manifest.webmanifest`'s `background_color`
   carry the same value, and the launch images need regenerating.
