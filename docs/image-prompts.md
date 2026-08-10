# Image prompts

Everything needed to generate new artwork that matches what is already in the
app, with the filename each one has to land under.

> **Superseded for new work — see [illustration-audit.md](illustration-audit.md).**
> The style block below describes the painted picture-book look the app is
> moving away from, and the character sheet gets Lucy's equipment wrong: it
> offers "purple collar **or** harness", and that *or* is why the current set
> changes equipment three times inside a single five-minute session. Lucy wears
> **the harness only, no collar**, and the leash clips to the **ring on the
> front of the harness at her chest**, never the back. Do not generate from the
> character sheet below. This file stays as the record of how today's set was
> made.

## Why these images

`img/` currently holds twelve illustrations, and they are stretched thin. One
of them, `dg-07`, is doing the work of **twelve different moments**: the whole
progression in Stay While the Door Opens, from "one step away" to "crack the
door", is the same picture four times over. The levels are the product, and
right now they look identical.

Priority A below fixes that. Priority B covers the four programs that are named
but not written yet.

---

## How to use this

Paste **Style block** + **Character sheet** + one **Prompt** into ChatGPT as a
single message. The first two never change; that is what keeps a set of images
looking like one set.

### Style block

> Painted digital illustration in a warm, gentle picture-book style. Soft even
> lighting, no harsh shadows, no photographic realism. Muted domestic palette:
> cream and warm tan walls, honey-toned oak floorboards, white baseboards and
> trim. Clean uncluttered interior with generous empty space. Flat, calm
> composition, everything at eye level, viewed straight on. 4:3 landscape.
> No text, no lettering, no logos, no watermarks, no UI, no borders.

### Character sheet

> **Lucy** is a medium-large black dog, a Labrador and German Wirehaired
> Pointer mix: glossy black coat, a white blaze on her chest, white toes on all
> four paws, soft floppy ears, a slightly scruffy muzzle. She wears a **purple
> collar or purple harness with a round blue tag**. She is calm and relaxed in
> every image unless the prompt says otherwise. Never cartoonish, never
> anthropomorphised, no human expressions.
>
> **The handler** is a woman in her thirties with dark brown hair in a
> ponytail, an olive-green hoodie, dark navy jeans, and grey sneakers. Her face
> is usually turned away or in profile. Calm, unhurried body language.
>
> **The guest** is a man in his thirties in a grey-blue checked shirt and
> brown boots. Relaxed, hands at his sides, never leaning toward the dog.
>
> Recurring props: a **flat grey rectangular dog bed**, a black leash, a
> mustard-yellow treat pouch, a dark grey panelled front door with a small
> window, a woven doormat, a potted plant, a framed landscape on the wall.

---

## Filenames

The app loads a 1100px JPEG from `img/` and a 240px thumb beside it. Originals
live in `img/source/<Program Name>/`.

1. Save each generated image as the **source** filename below.
2. Run the resize for that group.
3. Register the key in the `IMAGES` map in `js/content.js` with its alt text.

```bash
cd "/Users/ahickey/dev/claude-local/Lucy Learns" && for f in img/source/Calm\ Door\ Greetings/*.png; do sips -Z 1100 -s format jpeg -s formatOptions 72 "$f" --out "img/dg-$(basename "$f" .png).jpg"; done
```

```bash
cd "/Users/ahickey/dev/claude-local/Lucy Learns" && for f in img/source/Next\ Programs/*.png; do sips -Z 1100 -s format jpeg -s formatOptions 72 "$f" --out "img/$(basename "$f" .png).jpg"; done
```

Then regenerate thumbs:

```bash
cd "/Users/ahickey/dev/claude-local/Lucy Learns" && for f in img/dg-*.jpg img/cg-*.jpg img/sr-*.jpg img/wp-*.jpg img/fd-*.jpg; do [ -f "$f" ] && case "$f" in *thumb*) ;; *) sips -Z 240 "$f" --out "img/thumb-$(basename "$f")";; esac; done
```

---

## Priority A — make the door progression visible

These are the eleven that stop the same picture repeating. Highest value first.

### A1 · One step away from the bed
- **Source** `img/source/Calm Door Greetings/13.png` → **App** `img/dg-13.jpg` → **Key** `dg-13`
- **Replaces** `dg-07` on Stay While the Door Opens, level 1
- **Prompt** — Lucy lies settled on a flat grey dog bed on a wooden floor in a
  home entryway. The handler stands very close, only one short step away from
  the bed, her body turned slightly toward a dark grey front door in the
  background. The door is closed and still far off. Lucy is calm and watching
  her. Emphasise how small the distance is.
- **Alt** — "Lucy lies on her bed while a handler takes a single step away from her toward the closed front door."

### A2 · Halfway to the door
- **Source** `img/source/Calm Door Greetings/14.png` → `img/dg-14.jpg` → `dg-14`
- **Replaces** `dg-07` on level 2
- **Prompt** — Same entryway. Lucy holds a down-stay on her grey bed in the
  foreground. The handler has walked roughly halfway across the room toward the
  closed front door and is pausing mid-stride, glancing back over her shoulder
  at Lucy. Clear open floor between them.
- **Alt** — "Lucy holds her bed while a handler pauses halfway across the room and glances back at her."

### A3 · Hand on the handle
- **Source** `img/source/Calm Door Greetings/15.png` → `img/dg-15.jpg` → `dg-15`
- **Replaces** `dg-07` on level 3
- **Prompt** — Same entryway. Lucy holds a down-stay on her grey bed in the
  foreground, some distance away. The handler has reached the closed dark grey
  front door and rests one hand on the lever handle without turning it. She is
  looking back toward Lucy.
- **Alt** — "A handler rests a hand on the front door handle while Lucy holds her bed across the room."

### A4 · Door cracked a few inches
- **Source** `img/source/Calm Door Greetings/16.png` → `img/dg-16.jpg` → `dg-16`
- **Replaces** `dg-07` on level 4
- **Prompt** — Same entryway. The front door is open just a few inches, a
  narrow bright vertical slice of daylight showing at the gap. Nobody is
  outside. The handler holds the edge of the door, looking back at Lucy, who is
  lying calmly on her grey bed in the foreground.
- **Alt** — "The front door is open a few inches onto daylight while Lucy stays lying on her bed."

### A5 · Paying for the sound
- **Source** `img/source/Calm Door Greetings/17.png` → `img/dg-17.jpg` → `dg-17`
- **Replaces** `dg-04` on Doorbell Predicts Rewards, step 4 (currently shares an
  image with the step before it)
- **Prompt** — Close, warm view. The handler crouches slightly beside Lucy just
  inside the front door and feeds her two small treats from an open palm. Lucy
  takes them gently, looking up at the hand rather than at the door. A
  mustard-yellow treat pouch is visible at the handler's waist. The door is
  closed behind them.
- **Alt** — "A handler feeds Lucy two small treats from an open palm while Lucy looks up at her hand."

### A6 · The quiet gap between reps
- **Source** `img/source/Calm Door Greetings/18.png` → `img/dg-18.jpg` → `dg-18`
- **Fills** Doorbell Predicts Rewards, step 5 — currently has no image at all
- **Prompt** — A quiet pause. Lucy stands loosely on the wooden floor of the
  entryway with a relaxed body and a soft open mouth, no tension. The handler
  stands beside her doing nothing in particular, leash slack and looped in one
  hand, looking down at her fondly. The door is closed. The mood is deliberately
  uneventful.
- **Alt** — "Lucy stands relaxed on a loose leash beside her handler in a quiet moment between repetitions."

### A7 · The release
- **Source** `img/source/Calm Door Greetings/19.png` → `img/dg-19.jpg` → `dg-19`
- **Fills** Stay While the Door Opens step 5 and Doorbell Means Place step 6 —
  neither currently has an image
- **Prompt** — Lucy is just getting up off her flat grey dog bed, front paws
  stepping forward, ears lifted, released from a stay. The handler stands a
  couple of steps away with an open, welcoming posture and a small smile. Warm
  and light in mood, clearly the end of something rather than the middle.
- **Alt** — "Lucy steps up off her bed as her handler releases her from the stay."

### A8 · You make the sound, right beside her
- **Source** `img/source/Calm Door Greetings/20.png` → `img/dg-20.jpg` → `dg-20`
- **Replaces** `dg-03` on Doorbell Predicts Rewards, level 1, which currently
  shows a generic doorbell and knock
- **Prompt** — Interior view beside the closed front door. The handler stands
  right next to Lucy, close enough to touch her, and knocks on the inside of
  the door frame with her knuckles while standing on the end of the slack
  leash. Lucy is directly at her side, looking up at her. Emphasise how close
  together they are.
- **Alt** — "A handler knocks on the door frame while standing right beside Lucy with the leash under her foot."

### A9 · Guest steps inside and stands still
- **Source** `img/source/Calm Door Greetings/21.png` → `img/dg-21.jpg` → `dg-21`
- **Replaces** `dg-09` on Controlled Real Greeting, level 2
- **Prompt** — The front door is open. A guest has stepped just inside onto the
  doormat and stands still with his hands at his sides, not looking at the dog.
  Lucy holds a down-stay on her grey bed several feet away, watching. The
  handler stands between them, calm.
- **Alt** — "A guest stands just inside the open front door without approaching while Lucy stays on her bed."

### A10 · Guest sits down and ignores her
- **Source** `img/source/Calm Door Greetings/22.png` → `img/dg-22.jpg` → `dg-22`
- **Replaces** `dg-09` on Controlled Real Greeting, level 3
- **Prompt** — A guest sits in an armchair in a warm living room, turned away
  from Lucy, relaxed, looking at nothing in particular. Lucy lies on her grey
  bed a few feet away, settled and calm, not approaching. The handler is
  nearby. The room is quiet and ordinary.
- **Alt** — "A guest sits in an armchair ignoring Lucy while she settles on her bed a few feet away."

### A11 · Real conversation at the open door
- **Source** `img/source/Calm Door Greetings/23.png` → `img/dg-23.jpg` → `dg-23`
- **Replaces** `dg-08` on Stay While the Door Opens, level 7, distinguishing a
  short conversation from a bare "hello"
- **Prompt** — The handler stands in the open front doorway mid-conversation,
  one hand resting on the door frame, weight relaxed, talking to someone
  unseen just off frame outside. Warm daylight spills in. Lucy holds a
  down-stay on her grey bed well back in the room, watching but settled.
- **Alt** — "A handler holds a relaxed conversation in the open doorway while Lucy stays settled on her bed."

### A12 · The other three "too excited" images
- **Source** `img/source/Calm Door Greetings/24.png` … `26.png` → `img/dg-24.jpg` … `dg-26.jpg` → keys `dg-24`, `dg-25`, `dg-26`
- **Replaces** `dg-12`, which is currently the `fallbackImage` for **all four**
  activities. One picture stands behind four different escalations, and the
  sheet is the screen someone opens when it is going badly — the moment worth
  getting right.
- **Prompts** — one each, all in the same entryway:
  - **dg-24 (for Doorbell Predicts Rewards)** — The handler has moved Lucy
    several feet further back from the front door, crouched beside her with a
    hand resting calmly on her shoulder, feeding a treat. The door is shut and
    quiet. Distance is the point of the image.
  - **dg-25 (for Stay While the Door Opens and Doorbell Means Place)** — Lucy
    lies on her grey bed being fed a treat in place by a handler kneeling right
    beside the bed. The door is closed in the background, forgotten. Rewarding
    the position, not the door.
  - **dg-26 (for Controlled Real Greeting)** — A guest steps back out through
    the front door with a friendly raised hand, leaving, while the handler
    stays beside Lucy with a hand in her collar. Nobody is upset; the greeting
    is simply being ended.
- **Alt** —
  - "A handler crouches beside Lucy well back from the closed front door and feeds her a treat."
  - "A handler kneels beside Lucy's bed and feeds her a treat for staying in place."
  - "A guest steps back out of the doorway with a friendly wave while a handler stays beside Lucy."

---

## Priority B — covers for the four planned programs

One each. These are what the placeholder cards in the library will use once
those programs are written.

### B1 · Four Paws on the Floor
- **Source** `img/source/Next Programs/cg-01.png` → `img/cg-01.jpg` → `cg-01`
- **Prompt** — Lucy stands squarely on all four paws on a wooden floor in a
  bright hallway, front feet clearly planted on the ground, looking up at a
  person who is turned slightly toward her with hands held calmly at chest
  height, not reaching down. The moment reads as restraint and patience rather
  than action.
- **Alt** — "Lucy stands with all four paws on the floor, looking up at a person who keeps their hands to themselves."

### B2 · Settle on a Mat
- **Source** `img/source/Next Programs/sr-01.png` → `img/sr-01.jpg` → `sr-01`
- **Prompt** — Lucy lies fully relaxed on her side on a flat grey mat in the
  corner of a warm, lived-in living room, eyes soft and half closed, hips
  rolled over. In the background the household carries on ordinarily: someone
  reading in an armchair, a mug on a side table. Lucy is not the centre of
  anyone's attention.
- **Alt** — "Lucy lies fully relaxed on her mat while the household carries on around her."

### B3 · People Passing on Walks
- **Source** `img/source/Next Programs/wp-01.png` → `img/wp-01.jpg` → `wp-01`
- **Prompt** — Outdoor scene on a quiet suburban pavement, soft daylight,
  trees and low hedges. Lucy walks on a loose leash beside her handler,
  looking up at her rather than ahead. A stranger walks past in the opposite
  direction a comfortable distance away, not interacting. Calm, everyday,
  unremarkable.
- **Alt** — "Lucy walks on a loose leash looking up at her handler as a stranger passes by on the pavement."

### B4 · Name Response Around Distractions
- **Source** `img/source/Next Programs/fd-01.png` → `img/fd-01.jpg` → `fd-01`
- **Prompt** — Lucy turns her head sharply toward her handler, ears forward,
  clearly responding to her name, while something mildly interesting happens
  behind her in the soft-focus background: a squirrel on a lawn, or another dog
  far off. Outdoors in a garden or park, warm light. The point of the image is
  the turn of the head.
- **Alt** — "Lucy turns her head toward her handler at the sound of her name while a distraction sits behind her."

---

## After generating

Every image key in `js/content.js` carries alt text, and the whole app is
instructional pictures, so the alt has to work read aloud. The alt lines above
are written to be used as-is. Register each one:

```js
'dg-13': {
  src: 'img/dg-13.jpg',
  alt: 'Lucy lies on her bed while a handler takes a single step away from her toward the closed front door.',
},
```

Then point the level or step at it via `overrides` on the level, or `image` on
the step. Nothing else needs touching.
