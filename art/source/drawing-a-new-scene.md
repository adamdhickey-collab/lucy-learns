# Drawing a new scene

Every illustration in the app is drawn. This file is no longer a to-do list — it is
what the next scene should be drawn against, whenever there is one.

Paste **Block A** and **Block B** ahead of any scene prompt and attach
`trainer-reference.jpg`. They are what keeps forty illustrations looking like one
set rather than forty separate pictures, so they go in every time, unchanged, even
when it feels repetitive.

Give the new scene a **Must be true** line of its own. Each image sits on a step
that teaches something, and the picture is the instruction — a handler leaning over
the dog, or a taut leash where the point is a slack one, teaches the opposite of
what the words beside it say. Naming the one thing the picture has to get right is
what stopped that happening.

---

## Block A — style

> Painted digital illustration, warm and calm: soft airbrushed shading, clean
> confident linework, matte finish. Not photorealistic, not cartoonish, no heavy
> outlines, no harsh shadows, no lens blur or bokeh. Landscape 4:3, 1448×1086.
>
> Interior entryway of an ordinary suburban home: warm cream-peach walls, white
> baseboards, honey-toned wood floor, a charcoal-gray paneled front door with a
> four-pane window in its upper half, a coir doormat inside the threshold, a
> rectangular gray dog bed with a soft rolled edge. Even, soft daylight from the
> door. Muted palette — olive green, dusty blue, warm cream, charcoal, honey wood.
> Plenty of empty floor; the room is calm and uncluttered.

## Block B — the cast

> **THE HANDLER** — **attach `trainer-reference.jpg` and match her face to it.** The
> sheet is three views of her — three-quarter, near-frontal, profile — taken from
> art already in the app. Copy that likeness. Do not restyle her, do not re-age her,
> do not reinterpret her features, and do not substitute a generic type: this is one
> specific person drawn repeatedly, and a description in words is not enough to hold
> her steady across forty pictures.
>
> Everything else about her: early forties, dark brown hair worn in a low ponytail
> with a few loose strands at the temple, a warm olive-green pullover hoodie, dark
> navy jeans, gray sneakers, and a mustard-yellow treat pouch clipped at her right
> hip. Calm and unhurried. She never looms over the dog: she crouches or kneels to
> the dog's level, or stands straight and relaxed.
>
> **THE GUEST** — a man in his late forties, clear-framed glasses, a **black
> baseball cap**, a **medium-blue zip-up hoodie** over a white tee, dark navy
> trousers, dark shoes. Friendly, relaxed, unhurried. **He must wear the blue
> hoodie and black cap in every image. Do not draw him in a plaid or checked
> shirt** — that was an earlier version of this character and is being replaced
> everywhere.
>
> **LUCY** — a black Labrador mix with a glossy black coat, a small white flash on
> her chest, white tips on her toes, and a flat **purple collar with a round blue
> tag**. Medium-large and athletic, with a soft, gentle expression. Never anxious,
> never cowering.

---

## Notes for the generator

Attach `trainer-reference.jpg` to every request. It is the only thing holding her
face steady, and the one time this file described her in words instead, the words
drifted the character somewhere she should not have gone. There is no sentence that
can do the job; do not write one back into Block B.

Ask for one scene per image, at 1448×1086 — the app resizes to 1100×825 and cuts a
240×180 thumbnail from the same file. Covers get drawn at 84pt with `object-fit:
cover`, so a cover needs its subject grouped and centered or the square crop throws
it away.

Four errors are worth regenerating over: her likeness wandering off the reference
sheet, the guest in a plaid shirt, a taut leash where the prompt says slack, and the
handler bending over the dog from above. The last three change what the picture
teaches; the first breaks the person.

One warning about the `lucy-learns-updated-trainer-gaze-directed-v2` folder, since
it is the obvious place to look for spare scenes: **it still draws the guest in the
plaid shirt and the navy quilted jacket**, and its manifest disagrees with its own
images in several places. Nothing in it can fill a greeting slot, and nothing in it
should be trusted by filename.
