# The done screen's seven verdicts, as pictures

The done screen opens on a 72px circle with a stroke mark in it — check, shield
or chevrons — chosen by `recommendation()` in `js/metrics.js`. This sheet is for
replacing that circle with a full-width **3:1 letterbox** illustration of Lucy's
reaction, one per verdict, each on its own flat field colour so the state reads
from across the room before the title does.

Seven verdicts exist, not one. In the order `recommendation()` checks them:

| # | Title                   | When                                   | `suggest` | Field / ground band          |
|---|-------------------------|----------------------------------------|-----------|------------------------------|
| 1 | Good call stopping      | arousal 4+ (household ended it early)  | down      | slate `#f5f4f9` / denim `#4c6b9b`  |
| 2 | Session logged          | no reps counted                        | stay      | slate `#ededf4` / slate `#c1c0d4`  |
| 3 | Take the pressure off   | a nip was logged                       | stay      | rose `#f8e9ed` / rose `#92344e`    |
| 4 | Ready for the next step | 80%+ twice, calm, level opens          | up        | gold `#f9f0d8` / gold `#e3b448`    |
| 5 | Nice progress           | 80%+ this session, level not yet open  | stay      | spruce `#e2eeea` / spruce `#34735c` |
| 6 | Coming along            | 50–79%                                 | stay      | violet `#efe9f6` / violet `#a98fd0` |
| 7 | Make it easier          | under 50%                              | down      | rose `#f8e9ed` / rose `#c25e79`    |

Every hex is a token from `css/app.css` (`--slate-25`, `--denim-600`,
`--rose-700`, `--gold-400`, `--spruce-600`, `--violet-300` and so on) — the
picture is drawn in the interface's own palette, the same rule that let the art
grade be deleted.

**Why two colours and not one.** Lucy is a black dog. On a fully saturated
green field she is a silhouette with no edge, and a pale wash alone does not
"pop". So every picture is a pale field with a strong ground band along the
bottom third: the band carries the saturation, Lucy stands on the line between
them, and her coat has the light field behind it to read against. Green pops
because the band is the deepest spruce the palette has, not because the whole
frame is green.

**Why each pose is different.** At the moment the screen appears the household
has already answered how she was; the picture must not contradict that (see the
comment above `verdict()` in `js/metrics.js`). So the cautions do not show a
frightened dog — the brief forbids anxious or cowering Lucy anywhere — they
show real dog body language for "I need space": a shake-off, a walk away, a
weight shift back. And each silhouette is distinct at thumbnail size, because
the same sitting dog on seven colours would just be a colour swatch.

---

## How to use this

ChatGPT cannot output 3:1 directly, so every prompt asks for **1536×1024
landscape composed for a centred 3:1 crop**. Take the middle third of the
height and discard the rest:

    sips -c 512 1536 --cropOffset 256 0 in.png --out out.png

Check the pixel dimensions of the returned file before cropping — the pipeline
has seen 1397×1126 come back when 1448×1086 was asked for.

Paste **Block A** and **Block B** ahead of one **Prompt** in a single message,
and attach two images in this order:

1. `art/source/Calm Door Greetings/door-sound-02-self.png` — **first**, as the
   flat style exemplar. (The first live generation came back painterly because
   painterly references outranked the flat one.)
2. `art/source/lucy-reference.jpg` — for likeness only.

Then check the result against its **Must be true** line, zoomed in, before
generating the next one. Results land as `img/verdicts/<slug>.jpg`.

### Block A — style and format

> Contemporary instructional illustration for a dog-training manual.
> **Simplified, vector-like forms: crisp clean edges, flat colour fills, at
> most two tones per surface — one light, one shadow — with no gradient
> between them.** No airbrushed or painterly rendering, no soft blurred
> shading, no photorealistic fur, no glossy highlights, no lens blur, no drop
> shadows, no outline heavier than a hairline. Not childish or cartoonish: the
> shapes are simplified but the proportions and the anatomy stay accurate and
> adult. Viewed straight on at the dog's eye level, or in clean three-quarter.
> One clearly readable pose per image. Nothing anthropomorphised: no human
> expressions, no smiling mouths drawn as a curve, no raised eyebrows.
>
> **Format: 1536×1024 landscape, composed for a 3:1 crop.** The finished
> picture will be the middle third of this canvas's height — a wide letterbox
> strip. So: the whole dog, every prop, and everything that matters sits
> inside the horizontal band between 33% and 67% of the canvas height, with
> clear air above and below her inside that band. The top third and bottom
> third of the canvas contain only flat colour and will be thrown away.
>
> **Background: two flat colours and nothing else.** The upper part of the
> canvas is one flat field colour, edge to edge, with no gradient, no
> vignette, no texture, no room, no walls, no skirting, no horizon line drawn
> as a stroke. The lower part is a single flat ground band in the second
> colour. The boundary between them is a clean horizontal line at **55% of the
> canvas height** — so inside the crop the band is the bottom third. Lucy
> stands, sits or lies on that line as if it were the floor, with one soft
> flat contact shadow under her and no other shadow anywhere. The two colours
> are named in the prompt; match them exactly.
>
> **The one saturated note is Lucy's purple collar #4a216d**, a deep violet,
> not lilac. The ground band may be strong but it is a field, not a note; do
> not lift it brighter than the hex given.
>
> No text, lettering, labels, numbers, checkmarks, X marks, ticks, arrows,
> hearts, stars, sparkles, motion lines, logos, watermarks, borders, frames
> or UI of any kind anywhere in the image.

### Block B — Lucy

> **LUCY — attach `lucy-reference.jpg` and match the dog to it.** Three views
> of one specific dog. The sheet is for **likeness only** — her head shape,
> beard, markings and build. Do **not** copy its rendering, shading or
> background: it is painted in an older style being replaced. Draw this same
> dog in the flat vector style above, matching the attached flat scene.
>
> A black Labrador mix: matte black coat **#1b1a22** with cool grey highlights
> rather than glossy reflections, the scruffy wire-haired beard along the jaw
> and chin, soft floppy triangular ears, a modest dark-amber eye, a small white
> flash on her chest, white tips on her toes. She wears a flat **purple collar
> #4a216d with a round blue tag #2f6fb0, and no harness — never a harness.**
> No leash in any of these pictures. Medium-large and athletic. Four legs, one
> tail, no more.
>
> She is alone in every picture. No handler, no guest, no hands, no feet at
> the edge of frame.

---

## The prompts

### 1 · Good call stopping — `good-call-stopping`

Field `#f5f4f9`, band `#4c6b9b`. The household ended it because she was over
threshold; the picture is the tension leaving. A full-body shake-off is what a
dog does when she is done, and it is a silhouette nothing else here has.

> **Prompt.** Field colour **#f5f4f9**, ground band **#4c6b9b**. Lucy alone,
> standing in a side view facing left, mid **shake-off**: the whole body
> twisting along its length as a dog shakes water off, head and shoulders
> turned slightly one way and hindquarters the other, both ears flung
> outward, loose skin of the neck and the collar swung a little off centre,
> tail out straight and relaxed. All four paws on the ground line. Her eyes
> are soft and half-closed, mouth closed. This is release, not distress: she
> is not crouched, her tail is not tucked, her ears are not pinned back.
> Draw the motion with the shapes alone — no motion lines, no blur, no
> droplets. She is centred horizontally and fills about half the width of
> the frame.
>
> **Must be true:** the field above the line is one flat #f5f4f9 and the
> band below it one flat #4c6b9b with a clean horizontal boundary at 55% of
> the canvas height, Lucy's whole body lies inside the middle third of the
> canvas height, the body is visibly twisting in a shake with both ears
> flung out, the tail is not tucked, there is no leash, no harness, no
> motion lines and no second figure.

### 2 · Session logged — `session-logged`

Field `#ededf4`, band `#c1c0d4`. Nothing was scored, so nothing is claimed:
she is simply at rest. Neutral on purpose; this is the only verdict that says
nothing about her.

> **Prompt.** Field colour **#ededf4**, ground band **#c1c0d4**. Lucy alone,
> **curled up asleep** on a flat rectangular dog bed in cool grey **#b6b4c0**,
> the bed drawn as a simple low rectangle with a slightly raised rim, seen
> from the side, sitting on the ground line. She is curled nose-to-tail, her
> chin resting on her hind leg, eyes closed, ears relaxed against her head,
> the collar and blue tag visible at the curve of her neck. Completely at
> ease, breathing not drawn. Bed and dog centred horizontally, together
> about half the width of the frame.
>
> **Must be true:** the field above the line is one flat #ededf4 and the band
> below it one flat #c1c0d4 with a clean boundary at 55% of the canvas
> height, the bed and the whole dog lie inside the middle third of the canvas
> height, her eyes are closed and she is curled nose to tail on a grey bed,
> the collar with blue tag is visible, and there is no leash, no harness and
> no second figure.

### 3 · Take the pressure off — `take-the-pressure-off`

Field `#f8e9ed`, band `#92344e`. The advice is literally "more distance from
the door", so the picture is that: the door at one edge, her bed at the
other, and Lucy walking from one to the other. The widest use of the strip.

> **Prompt.** Field colour **#f8e9ed**, ground band **#92344e**. At the far
> left edge of the crop band, the lower half of a closed charcoal **#3a3a46**
> panelled front door with an off-white **#f5f4f9** frame, cut off by the
> left edge of the frame and by the top of the crop band — no window, no
> handle detail beyond a simple round knob. At the far right, a flat
> rectangular dog bed in cool grey **#b6b4c0** on the ground line. Between
> them Lucy alone, **walking calmly away from the door toward the bed**, in
> side view facing right, one forepaw lifted mid-step, head level with her
> back, ears soft, tail hanging in a relaxed low curve — not tucked, not
> high. She is nearer the bed than the door: about two-thirds of the way
> across. She is not looking back. Nothing else in the frame.
>
> **Must be true:** the field above the line is one flat #f8e9ed and the band
> below it one flat #92344e with a clean boundary at 55% of the canvas
> height, a charcoal door is cut by the left edge and a grey bed sits at the
> right, Lucy is walking toward the bed and facing right with her tail not
> tucked and her head not lowered, everything sits inside the middle third
> of the canvas height, and there is no leash, no harness and no person.

### 4 · Ready for the next step — `ready-for-next-step`

Field `#f9f0d8`, band `#e3b448`. Gold is the app's reward colour and this is
the only verdict that earns it. She is going somewhere.

> **Prompt.** Field colour **#f9f0d8**, ground band **#e3b448**. Lucy alone,
> **trotting purposefully to the right** in side view: a clean diagonal trot
> with the left fore and right hind paws touching the ground line and the
> other two lifted, head carried high and forward, ears lifted and swung
> slightly back by her own movement, mouth just open in a relaxed pant, tail
> up in a confident curve above the line of her back. Chest forward, weight
> forward. Eager and athletic, never frantic; she is not leaping, not
> bounding, not stretched flat out. Centred horizontally, filling about
> three-fifths of the frame width. The collar's blue tag swings a little
> forward.
>
> **Must be true:** the field above the line is one flat #f9f0d8 and the band
> below it one flat #e3b448 with a clean boundary at 55% of the canvas
> height, Lucy is in a trot facing right with two paws on the ground and two
> lifted, her tail is carried above her back and her head is high, she lies
> wholly inside the middle third of the canvas height, and there is no
> leash, no harness, no motion lines and no second figure.

### 5 · Nice progress — `nice-progress`

Field `#e2eeea`, band `#34735c`. The green one, and the band is the deepest
spruce in the palette so it carries. The pose is the sit the whole program is
built on, done well: tall, loose, pleased.

> **Prompt.** Field colour **#e2eeea**, ground band **#34735c**. Lucy alone,
> **sitting tall** in a clean three-quarter view turned slightly toward the
> viewer, haunches square on the ground line, forelegs straight. Her head is
> up and turned to face the viewer, ears lifted and forward, mouth open in a
> soft relaxed pant with the tongue just visible, eyes bright and soft. Her
> tail is swept out along the ground to one side in a wide relaxed curve on
> the band — one sweep, drawn once, no motion lines. The white chest flash
> shows between her forelegs; the purple collar and blue tag sit at the front
> of her neck. Centred horizontally, about half the frame width.
>
> **Must be true:** the field above the line is one flat #e2eeea and the band
> below it one flat #34735c with a clean boundary at 55% of the canvas
> height, Lucy is sitting upright with her head turned to the viewer and her
> mouth open in a relaxed pant, the tail lies along the ground, the white
> chest flash is visible, she lies wholly inside the middle third of the
> canvas height, and there is no leash, no harness and no second figure.

### 6 · Coming along — `coming-along`

Field `#efe9f6`, band `#a98fd0`. Half to four-fifths of the reps landed. She
is working on it: a sphinx down, listening, head tilted.

> **Prompt.** Field colour **#efe9f6**, ground band **#a98fd0**. Lucy alone,
> lying in a **sphinx position** — chest down, both forelegs extended
> straight ahead along the ground line, hindquarters tucked under so she
> could rise in one movement. Side-on but with her head turned toward the
> viewer and **tilted noticeably to one side**, the way a dog listens to a
> sound she is working out; one ear lifted higher than the other, mouth
> closed, eyes on the viewer. Attentive and settled, not tense. Tail resting
> along the ground behind her. Centred horizontally, about three-fifths of
> the frame width.
>
> **Must be true:** the field above the line is one flat #efe9f6 and the band
> below it one flat #a98fd0 with a clean boundary at 55% of the canvas
> height, Lucy is lying with her chest down and both forelegs extended, her
> head is visibly tilted with one ear higher than the other and her mouth
> closed, she lies wholly inside the middle third of the canvas height, and
> there is no leash, no harness and no second figure.

### 7 · Make it easier — `make-it-easier`

Field `#f8e9ed`, band `#c25e79`. Under half landed. Not a failure picture: a
dog whose weight has gone back, asking for a smaller ask.

> **Prompt.** Field colour **#f8e9ed**, ground band **#c25e79**. Lucy alone,
> **standing with her weight shifted back** onto her hindquarters, in side
> view facing right, all four paws on the ground line, forelegs straight but
> the body leaning subtly away from the direction she faces. Her head is
> turned back over her shoulder toward the viewer on the left, held a little
> below the line of her back, ears soft and half-lowered — not pinned flat —
> and her mouth closed. Tail hanging low and still, not tucked between the
> legs. She is unsure, not afraid: no crouch, no whale-eye, no lip curl.
> Centred horizontally, about half the frame width.
>
> **Must be true:** the field above the line is one flat #f8e9ed and the band
> below it one flat #c25e79 with a clean boundary at 55% of the canvas
> height, Lucy is standing with all four paws down and her head turned back
> over her shoulder below the line of her back, her tail is low but not
> tucked between the legs and her ears are not pinned flat, she lies wholly
> inside the middle third of the canvas height, and there is no leash, no
> harness and no second figure.

---

## How it went, and where the pictures are

All seven were drawn on 4 September 2026 and are in the app. The masters are
`art/source/verdicts/<slug>.png`; the installed files are
`img/verdicts/<slug>.jpg`, registered in `VERDICT_ART` in `js/content.js`
and precached in `sw.js`. `recommendation()` in `js/metrics.js` now returns a
`key` naming the picture, and `pilot.mjs verify` checks that every key has
one. How they are installed is in `img/README.md`.

Two things worth knowing for the next time:

**ChatGPT returned 3:1 directly** — 2172×724, all seven — so the 1536×1024
canvas and the crop were never needed. The "middle third" composition
instructions did no harm, but the next version of this sheet can just ask for
the strip.

**The colours held; the boundary did not.** Sampled off the files, every field
and band came back within a few units of its token (the spruce band `#397868`
against `#34735c` was the furthest). But the ground line landed anywhere from
56% to 73% of the height rather than at the 55% asked for, so the band is a
different depth in each picture. Seen one at a time it does not show; seen
side by side it would. If a state is ever redrawn, match the boundary to its
neighbours by measurement rather than to the number in Block A.
