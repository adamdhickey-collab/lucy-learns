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
   with that — it frames it. Paper, borders, and text are a neutral slate;
   the accents are violet, denim and spruce. Pictures on a quiet field sit
   forward, the way they do on a gallery wall.
   On the old tan paper the art's cream dissolved into the UI's cream; now
   the picture starts where the warmth starts.
2. **Warmth in the chrome always means reward.** Gold — the treat pouch's
   ochre — is the one warm family the UI keeps, and it appears only on
   reward moments: mastery badges, the reward meter, the goal star. Because
   nothing else in the chrome is warm, warmth itself becomes a signal.
   (The player's cue callout learned this the hard way: it wore gold for a
   while, and a cue is an instruction, not a reward — it speaks violet now.)
3. **Violet marks what you can tap and where you are; spruce marks what is
   behind you; denim marks what is merely true.** Buttons, links, focus rings,
   the current tab, the live pip, the level being practiced — violet is a
   promise of action or presence. Progress already banked — meters, the
   practice-frequency bars, cleared pips and ticks, reached rungs on the
   mastery ladder — is spruce: green says behind you, violet says you are
   here. Denim is the third claim and the one that was missing: information
   that is neither, and cannot be acted on — the activity and goal marks, the
   difficulty pips, the metric values, the rung one short of mastery. Eyebrows,
   captions and counts are metadata and stay slate. When everything is violet,
   nothing is.

   That last sentence was written before it was true. Violet held 103 of the
   colour declarations in `app.css` against denim's two, so denim named a role
   the stylesheet did not actually staff, and every chart, badge and section
   mark defaulted to violet for want of anywhere else to go. The redistribution
   moved the practice-frequency chart to spruce (it is seven days already
   practiced — the `.meter` rule, applied), and the goal marks, metric values
   and the "almost there" badge to denim. Violet lost no role it was ever
   supposed to have.

The splash has been redrawn through the pilot pipeline, flat and cool like
the rest of the set, with nothing baked into its pixels. An earlier version
carried a gentle copy of the art grade in the file itself (saturation ×0.85,
7% violet blend) because CSS cannot reach the OS launch images; both that
grade and the workaround for it are gone. Its field is the artwork's own
lavender (`--splash-field: #e6deed`), the mean of a six-pixel ring around the
source, measured by `scripts/lib/splashfield.mjs` and written into
`css/app.css` and `manifest.webmanifest` by `pilot.mjs approve` at the same
time `scripts/make-splash.mjs` bakes it into the iOS launch images — one
measurement, three files, so they cannot drift. The wordmark on it is `--primary-dark` — the
collar violet against the field the art was drawn on, at 7.53:1. The launch
now opens inside the cool system; the fade to the app is just the paper
arriving.

### The art grade, and why it is gone

For most of this project the illustrations were painted for the tan UI, so in
the app they passed through one grade: `--art-grade`
(`saturate(0.78) brightness(1.05) contrast(1.06)` on the `img`) and `--art-veil`
(an 8% wash of the collar violet, painted by a `::before` on each illustration
container). It cooled the art's cream the same direction the paper went without
touching the source files, and it was two tokens — one decision, reversible by
setting them to `none` and `transparent`.

All thirty-seven illustrations have since been redrawn flat and cool, in the
app's own palette, so there is nothing left to correct in them: `--art-grade`,
`--art-veil`, the rules that applied them and the pilot ledger that let redrawn
files opt out were all deleted together. The illustrations are the colour they
are.

**One piece of it survived for two releases, and is now gone too.** The avatars
were never part of the thirty-seven — `art/source/restyle-worklist.md` lists them
as outside it — and they stayed tan-era warm after the scenes were redrawn:
`img/avatars/dog-01.jpg` grounded at `#fce8d0` and `img/lucy-portrait.jpg` at
`#fdcda5`, both warm cream against paper that is `#f5f4f9` and cool. Deleting the
grade outright would have left them as the one warm note in the chrome, which is
exactly what the filter existed to prevent, so it was kept as `--avatar-grade` on
the avatar surfaces only, with the same numbers.

The twenty-four have since been redrawn flat and cool — they ground around
`#e2dce7` now — and `lucy-portrait.jpg` was dropped rather than redrawn, since
the redrawn `dog-01` is the same dog. With nothing warm left to correct, the
token and its rule went with it. No filter is applied to any picture in this app
at render time; what a file contains is what appears.

Three passes got the grade to where it ended, and the middle one is worth
keeping on the record even though the code is gone, because the lesson is about
translucent washes generally. It began gentle (`saturate(0.86)`, 7%), was
strengthened to `saturate(0.62) brightness(0.97)` at 16% because the first pass
still read warm against the slate — and at 16% the pictures went drab. A flat
translucent wash does not only tint, it lifts the blacks, and lifted blacks are
what haze *is*. The fix was not more brightness on top of the wash but less
wash: 8%, saturation back up to a still-disciplined 0.78, and `contrast(1.06)`
to cancel what the wash still costs. Measured on the hero portrait, that
restored the ungraded luminance (value 72.5 against 72.2 raw) while holding
saturation about 30% under it.

**Reach for the veil before the brightness.** That is the part to keep.

### Primitives

| Ramp | From the artwork | Steps |
| --- | --- | --- |
| `--violet-*` | Lucy's collar | `50 #e7e2f3` · `100 #e0d5f0` · `300 #a98fd0` · `600 #6a3d94` · `700 #55307a` · `800 #452368` (the lit strap) · `900 #34204f` (its shadow) |
| `--slate-*` | neutrals, hue 240° at 6–8% saturation | `25 #f6f6f7` · `50 #efeff1` · `100 #eaeaed` · `200 #dedee3` · `300 #c4c4cc` · `500 #5c5c68` · `800 #26262f` · `900 #17171d` |
| `--denim-*` | the blue hoodie, Lucy's tag | `100 #e5ecf5` · `600 #4c6b9b` · `700 #3f5c86` |
| `--gold-*` | the treat pouch | `100 #f9f0d8` · `400 #e3b448` · `800 #755718` |
| `--spruce-*` | the yard through the open door | `100 #e2eeea` · `600 #34735c` |
| `--rose-*` | caution; magenta-side kin to the violet | `100 #f8e9ed` · `400 #c25e79` · `600 #a63d5b` · `700 #92344e` |

**The slate is neutral now, and it was not always.** It used to run 19–29%
saturation at the light end, pulled toward the collar so the grays would
"belong to its family" — a decision made while the art was warm and the paper
had to read cool against it. Once the illustrations were redrawn cool with
lavender walls of their own, that cast became a third purple under two others:
violet-tinted paper, under a violet-walled picture, under a violet button. The
paper is the largest surface on every screen, so it is the one surface that has
to carry none of the hue. The ramp sits at hue 240 and 6–8% now, and every
contrast floor that touches it rose a little when it moved.

**The 50 step is a blend, not a dilution.** `--violet-50` was `#efe9f6`, hue
268° — the collar's own hue with the saturation taken out, which is a lilac,
and a screenful of lilac pills is where the palette's one persistent complaint
came from. A wash is the collar mixed *into the paper*, so its hue belongs
between the two: the collar is 271°, the slate 252°, and the wash now sits at
258° and about 3% deeper (`#e7e2f3`). The selected pill separates from its card
slightly better as a side effect. Nothing else on the violet ramp moved — the
anchor is a sampled object and does not get retuned for taste.

Denim grew from one step to three for the same reason its role grew: a colour
with no wash and no text-safe step cannot carry a badge, so it could not take
work off violet even where the rules said it should. `700` exists because `600`
lands at 4.54:1 on the new wash — over the floor, but not far enough over to
survive anyone nudging either value.

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
| `--primary` | violet-600 | actions: fills under white text, links, focus rings, the live pip and the practiced level's arrow |
| `--primary-dark` | violet-700 | hover, current tab, quiet-button labels, the splash wordmark |
| `--primary-wash` | violet-50 | tints behind current/selected states |
| `--secondary` | denim-600 | informational accents: the activity marks, the difficulty pips, the metric values, and the second series where one accent is not enough |
| `--secondary-text` | denim-700 | denim as text or a stroked mark — the goal marks, the "almost there" badge |
| `--secondary-wash` | denim-100 | tints behind denim-carried states |
| `--reward` / `--reward-text` / `--reward-wash` | gold | reward moments only; `--reward` is fills and accents, never text |
| `--success` / `--success-wash` | spruce | "that held", improvement deltas, and banked progress: meters, the practice-frequency bars, cleared pips and ticks, reached rungs |
| `--caution` / `--caution-text` / `--caution-text-dark` / `--caution-wash` | rose | "too excited", regressions; `--caution` is fills and borders, `--caution-text` is the text-safe step |
| `--border` / `--border-strong` | slate-200/300 | hairlines and control outlines |

Shadow ink is slate-900 (`rgba(23, 23, 29, …)`), so depth stays in the ramp's
family.

## Contrast

Verified floors, not aspirations — `node scripts/check-contrast.mjs` fails the
build if any pairing drops below its floor. Normal text needs 4.5:1 (WCAG AA),
non-text indicators 3:1 (WCAG 1.4.11).

| Pairing | Floor | Measured |
| --- | --- | --- |
| body text on paper / card / sunken | 4.5 | 13.88 / 14.99 / 13.06 |
| secondary text on paper / card / sunken | 4.5 | 6.10 / 6.59 / 5.74 |
| primary as link on paper / card | 4.5 | 7.18 / 7.75 |
| white text on primary / primary-dark | 4.5 | 7.75 / 10.05 |
| primary-dark on card / primary-wash | 4.5 | 10.05 / 7.93 |
| white on secondary (denim) | 4.5 | 5.41 |
| metric value (denim) on card | 4.5 | 5.41 |
| secondary-text on paper | 4.5 | 6.30 |
| secondary-text on secondary-wash | 4.5 | 5.72 |
| reward-text on wash / paper / card | 4.5 | 5.90 / 6.21 / 6.70 |
| success on card / wash / paper | 4.5 | 5.60 / 4.70 / 5.18 |
| caution-text on paper / wash / card | 4.5 | 5.65 / 5.19 / 6.10 |
| splash wordmark (primary-dark) on `--splash-field` | 4.5 | 7.67 |
| denim activity mark on card | 3 | 5.41 |
| goal mark (secondary-text) on its disc | 3 | 5.92 |
| practice-frequency bar (spruce) on its card | 3 | 5.60 |
| tick on a cleared spruce disc | 4.5 | 5.60 |
| spruce meter fill vs track | 3 | 4.80 |
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
   (`rgba(246, 246, 247, 0)`) that fade the sticky action bar into the paper.
4. If the splash field moved (it belongs to the art, not to this palette):
   `scripts/make-splash.mjs` and `manifest.webmanifest`'s `background_color`
   carry the same value, and the launch images need regenerating.
