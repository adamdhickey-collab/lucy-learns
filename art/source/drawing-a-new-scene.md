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

### The porch, for the scenes set outside

A few steps are shot from outside the closed front door — a helper ringing or
knocking. That is a second background vocabulary and it is deliberately spare,
so it gets pinned the same way the interior is. Use these and nothing else:

> Exterior, on the porch: flat pale grey-green house siding **#c9ccc8** with
> thin horizontal lap lines and no texture; a plain porch floor in cool grey
> **#b8b4b0**; the same charcoal **#3a3a46** front door with the same panelling
> and the same four-pane window; its off-white frame **#f5f4f9**; a small
> doorbell button on that frame at about chest height; and soft spruce
> **#34735c** foliage as a flat silhouette at one edge. **No sky detail, no
> porch furniture, no potted plants, no house numbers, no light fixture, no
> mailbox, no steps, no railing.**

The glass reads green from this side, and that is right rather than an error:
in daylight the panes reflect the garden instead of showing the dim hall
behind them. From inside the same window shows foliage for the opposite
reason. Both are the same flat green fill.

A picture with no dog in it has no collar, so the "one saturated note" rule
above cannot apply — say so explicitly in the prompt and hand the job to the
guest's blue hoodie instead, or the instruction contradicts itself.

### The garden and the street, for the scenes set away from the door

Two of the planned covers happen outdoors and away from the house — a dog
ignoring a squirrel on the grass, a dog walking past a stranger. The porch block
above does not cover that, and `docs/illustration-audit.md` calls it out as a
separate background vocabulary, which is why the pilot left those scenes alone.
It gets pinned exactly the way the porch is, and it is deliberately just as
spare: flat fills, no scenery, nothing to look at but the two figures.

> Exterior, away from the house: flat lawn in a muted spruce **#5b8f78** with no
> blades, no mowing stripes and no texture; where a path or pavement is needed, a
> plain cool grey **#b8b4b0** in flat slabs with thin joint lines and no kerb;
> a plain flat band of soft spruce **#34735c** foliage across the background as a
> silhouette, with no individual trees, trunks or branches; and above it a flat
> pale wash **#e2eeea** standing in for sky. **No sky detail, no clouds, no sun,
> no birds, no flowers, no fences, no benches, no bins, no parked cars, no
> buildings, no house, no road markings and no horizon line drawn as a stroke** —
> the lawn meets the foliage band directly.

Same rule as everywhere else: one saturated note, and it is Lucy's purple collar.
Nothing in the outdoor palette competes with it, which is why the greens are
muted and the sky is a wash rather than a colour.

This block is opt-in. No scene written before it existed asks for it, so adding
it changed no prompt and no picture, and `BRIEF_ID` did not move.

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
>
> **ANATOMY.** Every person has exactly two arms, two hands and two legs, and no
> more. Each hand is joined to a visible arm and each arm to a shoulder. Lucy has
> four legs and one tail. Draw nothing that reads as a spare limb — in particular
> no third hand near the handler's hip, where the mustard treat pouch sits and a
> stray hand shape can pass for part of it. If a limb is hidden, hide it behind
> something and leave it out; never resolve it by drawing an extra one.

---

## Do the pilot first

Forty images is too many to commit to a style on faith, and
`docs/illustration-audit.md` §6 already chose the five that exercise every hard
part of it exactly once: a partial-figure close-up, a moving leash, a three-figure
interaction, a corrective pair, and a wide multi-person room. Its five scene briefs
still stand — only Block A's temperature and finish changed. Draw those five, put
them in the app beside the graded old ones, and only then decide about the rest.

**The pilot is done, and both of its questions came back yes.**

*Do flat fills survive the crops?* Better than the painterly set did. Scene 6.3
still reads at 84px — three figures distinct, the collar still a violet note —
where soft rendering turned to mush at that size. Scene 6.5 survives the 21:9
letterbox, which throws away 43% of the height, with all three figures intact,
and holds the 5:4 and square crops as well. Flat is the right call for this app
on its own merits, not only for the palette.

*Does a cool room still read as a home?* Yes, and the floor and doormat are why.
They are the only warm-grey values in Block A and they carry all the domestic
warmth; the lavender walls read as calm rather than clinical because those two
props sit under them. If a future scene ever does come back cold, warm those two
a step and leave the walls alone.

Two more things the pilot settled that were not on its list. An error reads as
an error with no symbol in the frame — scene 6.4 works purely on body language
and a taut rose line, which is what lets the app supply the label instead of the
picture carrying its own verdict. And attaching a finished scene as a third
reference is what holds a pair in the same room; use it for any two pictures
that will be shown side by side.

The decision after the pilot was **not** to ship it alone. All thirty-seven
registered scenes get redrawn before any of them go live, so the app changes
style once instead of carrying two vocabularies at the same time. The list is
[restyle-worklist.md](restyle-worklist.md).

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

**A black leash on a black dog needs an edge, and scene 6.2 proved it.** The
first take of the walking scene came back with the leash attached to nothing:
it ran from the hand diagonally across Lucy's chest and foreleg and trailed off
at the floor, with the collar ring bare. That is the same equipment error the
audit's §3.2 is entirely about, arriving in a third new form — first a harness,
then equipment changing mid-session, now a clip that is simply absent. Two
lines fixed it on the redraw, and both belong in any scene with a leash:

> The leash must be visibly clipped to the metal ring on Lucy's collar at the
> front of her neck — **draw the clip.** The line runs from that clip to the
> handler's hand hanging in a loose J below, and must not cross her back or
> shoulders. Since Lucy is black and the leash is black, draw the leash with a
> thin lighter outline where it passes near her body so the line stays readable
> against her coat.

The second sentence is the cause rather than the symptom: a black line on a
black coat has no edge to read against, so there is nothing anchoring where it
ends up.

**Flat art survives the thumbnail, which was half of what the pilot set out
to learn.** Scene 6.3 is a cover, so it gets cut to a centred square and then
down to 84px and 56px. At 84px all three figures still read — the standing
handler, the sitting dog, the crouching guest — and the collar still registers
as a violet note. Painterly art at that size turned to mush. The flat style is
the right call for this app and not only for its palette.

For any scene that will be cropped square, say so in the prompt and give the
number: **everything essential inside the middle 75% of the width**, nothing
important in the outer 12% either side. Vaguer wording ("group them tightly")
was what the audit used and it is not a constraint anyone can check.

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
