# Drawing a new scene

Every illustration in the app is drawn. This file is no longer a to-do list — it is
what the next scene should be drawn against, whenever there is one.

Paste **Block A** and **Block B** ahead of any scene prompt and attach both
reference sheets, `trainer-reference.jpg` and `lucy-reference.jpg`. They are what
keeps forty illustrations looking like one set rather than forty separate pictures,
so they go in every time, unchanged, even when it feels repetitive.

Give the new scene a **Must be true** line of its own. Each image sits on a step
that teaches something, and the picture is the instruction — a handler leaning over
the dog, or a taut leash where the point is a slack one, teaches the opposite of
what the words beside it say. Naming the one thing the picture has to get right is
what stopped that happening.

---

## What changed, and why this file was rewritten

The set in `img/` today is **matte painterly and warm**: soft airbrushed shading,
cream-peach walls, honey oak. It was drawn for a tan UI that no longer exists. The
app now runs on the collar palette — cool slate paper, violet accents — and the
gap is currently papered over in CSS by the art grade (`--art-grade` and
`--art-veil` in `css/app.css`), which desaturates each picture and lays a thin
violet wash over it. That grade is a bridge, not a destination, and
`docs/design-system.md` says so.

Block A below is the destination: **flat, drawn cool, in the app's own colors.**
It merges two decisions that were made separately and never written down together
— the flat instructional style prescribed in `docs/illustration-audit.md` §6 (as
"Warm Instructional Vector"), and the collar palette that replaced the tan one
afterwards. The style survives; the temperature inverts.

**When the set is replaced, delete the art grade** rather than stacking the two.
Art drawn cool and then graded cooler goes grey.

---

## Block A — style

> Contemporary instructional illustration for a dog-training manual. **Simplified,
> vector-like forms: crisp clean edges, flat color fills, at most two tones per
> surface — one light, one shadow — with no gradient between them.** No airbrushed
> or painterly rendering, no soft blurred shading, no photorealistic fur or fabric
> texture, no lens blur, no drop shadows, no outline heavier than a hairline. Not
> childish or cartoonish either: the shapes are simplified but the proportions and
> the anatomy stay accurate and adult. Flat, calm composition, everything at eye
> level, viewed straight on or in clean three-quarter. One clearly readable action
> per image. Landscape 4:3, 1448×1086.
>
> **Cool palette, and these are the actual colors — match them.** Interior entryway
> of an ordinary suburban home:
>
> - walls a pale lavender-grey **#eae7f0**, flat, no texture
> - baseboards and door trim off-white **#f5f4f9**
> - floor a desaturated oak that reads as warm grey rather than honey, **#c3b5a8**,
>   with plank lines as thin flat strokes and no wood grain
> - the front door a cool charcoal **#3a3a46**, panelled, with a small four-pane
>   window in its upper half
> - daylight through that window a pale spruce **#34735c** for foliage, no sky detail
> - a rectangular dog bed in cool grey **#b6b4c0**
> - a woven doormat in muted taupe **#b0a394**
>
> Light is even and ambient. No cast shadows except a single soft contact shadow
> under each figure. Generous empty floor; the room is calm and uncluttered.
>
> **The one saturated note in every image is Lucy's purple collar, #4a216d — a
> deep violet, not a bright lilac.** Nothing else competes with it: desaturate
> the mustard treat pouch a step so it never out-saturates the collar. Where a
> picture needs a warning or a "not this" reading, use rose **#c25e79** and
> nothing more urgent than that.
>
> No text, lettering, labels, numbers, checkmarks, X marks, arrows, logos,
> watermarks, borders or UI of any kind anywhere in the image.

Those hexes are not decorative precision — they are the app's own tokens. The
lavender wall is kin to `--slate-100`, the mustard pouch in Block B is literally
`--gold-400`, the guest's hoodie is `--denim-600`, the foliage is `--spruce-600`,
the warning rose is `--rose-400`. Drawing the pictures out of the interface's own
palette is what will let the grade be deleted instead of merely reduced.

## Block B — the cast

> **THE HANDLER** — **attach `trainer-reference.jpg` and match her face to it.** The
> sheet is three views of her — three-quarter, near-frontal, profile — taken from
> art already in the app. Copy that likeness. Do not restyle her, do not re-age her,
> do not reinterpret her features, and do not substitute a generic type: this is one
> specific person drawn repeatedly, and a description in words is not enough to hold
> her steady across forty pictures. Simplify her rendering to the flat style in
> Block A without changing who she is.
>
> Everything else about her: early forties, dark brown hair worn in a low ponytail
> with a few loose strands at the temple, a warm olive-green pullover hoodie
> **#6b7150**, dark navy jeans **#2f3f5c**, grey sneakers **#b9b6bd**, and a
> mustard-yellow treat pouch **#e3b448** clipped at her right hip in every image.
> Calm and unhurried. She never looms over the dog: she crouches or kneels to the
> dog's level, or stands straight and relaxed.
>
> **LUCY** — **attach `lucy-reference.jpg` and match the dog to it.** Three views of
> one specific dog, cropped from art already in the app. A black Labrador mix: matte
> black coat **#1b1a22** with cool grey highlights rather than glossy reflections,
> the scruffy wire-haired beard along the jaw and chin, a soft floppy triangular
> ear, a modest dark-amber eye, a small white flash on her chest, white tips on her
> toes. She wears a flat **purple collar #4a216d with a round blue tag #2f6fb0, and
> no harness — never a harness, in any image.** Where a leash is attached it clips
> to the ring on that collar at the front of her neck. Medium-large and athletic,
> with a soft, gentle expression. Never anxious, never cowering, never
> anthropomorphised.
>
> **THE GUEST** — a man in his late forties, clear-framed glasses, a **black
> baseball cap**, a **medium-blue zip-up hoodie #4c6b9b** over a white tee, dark
> navy trousers, dark shoes. Friendly, relaxed, unhurried. **He must wear the blue
> hoodie and black cap in every image. Do not draw him in a plaid or checked
> shirt** — that was an earlier version of this character and is being replaced
> everywhere.
>
> Recurring props: the flat grey dog bed, a black leash, the mustard treat pouch,
> the charcoal panelled front door, the woven doormat. Nothing else unless the
> scene brief names it.

---

## Do the pilot first

Forty images is too many to commit to a style on faith, and
`docs/illustration-audit.md` §6 already chose the five that exercise every hard
part of it exactly once: a partial-figure close-up, a moving leash, a three-figure
interaction, a corrective pair, and a wide multi-person room. Its five scene briefs
still stand — only Block A's temperature and finish changed. Draw those five, put
them in the app beside the graded old ones, and only then decide about the rest.

Two things the pilot is really testing. Whether flat fills survive the 84pt
thumbnail crop — they should do better than painterly ones, not worse, since flat
shapes hold at small sizes and soft rendering turns to mush. And whether a cool
room still reads as a *home*. If it comes back clinical, warm the floor and the
doormat one step and leave the walls alone: those two props carry all the domestic
warmth in this palette, which is exactly why they are the only warm-grey values in
Block A.

## What the first pilot scene taught

`door-sound-01-setup` is drawn and in the app (pilot 1 of 5). Two things are
worth knowing before the other four.

**Naming the hexes worked.** Sampled off the returned file, the wall came back
`#e3dce8` against the specified `#eae7f0`, the floor `#c7b8b1` against
`#c3b5a8`, the door `#45464f` against `#3a3a46`, the hoodie `#6c6a4d` against
`#6b7150`, the jeans `#303d51` against `#2f3f5c` — every one inside tolerance.
Keep the hex list in Block A; it is doing real work.

**Two things missed, and both are now written into Block A above.** The collar
came back lighter and bluer than the sampled strap — `#573578` and `#5f3483`
against `#4a216d` — and it was not the most saturated thing in the frame: of
the most-saturated pixels in each take, 83–87% sat in the orange-yellow band,
which is the treat pouch and the floor. The "one saturated note" line was in
the brief and still did not survive, so it now names the hex and calls out the
pouch by name.

**Check the pixel dimensions before doing anything else with a returned file.**
One of the two takes arrived at 1397×1126 — a 1.24 ratio the app cannot use,
since it cuts both a 4:3 and a square from the same file. It cropped cleanly to
1397×1048 because the trim came off the bottom, which held nothing but floor,
but a scene with content at both edges would have had to be redrawn.

## Notes for the generator

Attach both reference sheets to every request. They are the only thing holding the
two faces steady, and the one time this file described the handler in words instead,
the words drifted the character somewhere she should not have gone. There is no
sentence that can do the job; do not write one back into Block B.

**Both sheets are painted in the old style, and that is the one trap in this
brief.** They were cropped from the existing warm, painterly set, because that is
where the likenesses live — but it means every request now carries an example of
exactly the rendering Block A is trying to leave behind, and a generator asked to
match a face will happily match the brushwork with it. If a scene comes back
painterly, say so explicitly and regenerate:

> The reference sheets are for **likeness only** — the faces, the hair, the build,
> the clothing, Lucy's markings and beard. Do **not** copy their rendering style,
> shading or background: they are painted in an older style being replaced. Draw
> these same two characters in the flat, vector-like style described above, on the
> cool palette described above.

Once the pilot produces a flat scene that holds both likenesses, recrop the sheets
from *it* and this trap closes for good.

Ask for one scene per image, at 1448×1086 — the app resizes to 1100×825 and cuts a
240×180 thumbnail from the same file. Covers get drawn at 84pt with `object-fit:
cover`, so a cover needs its subject grouped and centered or the square crop throws
it away.

Five errors are worth regenerating over: her likeness wandering off the reference
sheet, Lucy drawn glossy and photorealistic instead of flat, the guest in a plaid
shirt, a taut leash where the prompt says slack, and the handler bending over the
dog from above. The last three change what the picture teaches; the first two break
the set.

One warning about the `lucy-learns-updated-trainer-gaze-directed-v2` folder, since
it is the obvious place to look for spare scenes: **it still draws the guest in the
plaid shirt and the navy quilted jacket**, and its manifest disagrees with its own
images in several places. Nothing in it can fill a greeting slot, and nothing in it
should be trusted by filename.
