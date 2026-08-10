# Pilot prompts — Warm Instructional Vector

Ready to paste into ChatGPT. Five images, chosen in
[illustration-audit.md §6](illustration-audit.md) to exercise every hard part of
the new style once: a partial-figure setup, a moving leash, a three-figure
interaction, a corrective pair, and a wide multi-person room.

**This is round 2.** Round 1 landed in `img/pilot/` and its results are written
up in [§7 of the audit](illustration-audit.md). The prompts below are the
current ones — corrected, not additional. Nothing has been installed; no
`IMAGES` key points at any pilot image.

---

## What changed since round 1

Round 1 settled the things that mattered most: the style holds, no text or
symbol appeared in any of the five, and the taut coral leash in Scene 4 proved
an error can read as an error without a checkmark or an X. Six things need
fixing, and they are folded into the prompts below.

| Fix | Affects |
| --- | --- |
| **Add the round blue tag** on the collar | all five |
| **Return 4:3 landscape, not square** | Scenes 3, 4 |
| **Same dog as the paired image** — scruffy muzzle, same head | Scene 4 |
| **Guest is clean-shaven**, no beard | Scene 5 |
| **Lucy's shoulder level with the knee**, not ahead of it | Scene 2 |
| **Lucy watches the handler**, not the guest | Scene 5 |

**All five get re-run, including Scene 1.** Scene 1 was otherwise a keeper —
correct equipment, exact 4:3, hands free, leash under the foot — but the tag has
to be in every frame or in none, and a set where one image is missing it is the
same continuity break this whole exercise exists to close. It is the cheapest
scene to re-run, and the round 1 version stays as the style reference.

---

## How to run it

**One image per message.** Paste **Block A + Block B + one Scene**. A and B never
change — that is what makes five images look like one set.

**Order matters:**

1. **Scene 1 first**, with `img/pilot/pilot-1-setup.png` attached and the note:
   *"Match this exactly for style, palette, room and character. Change one thing
   only: add a small round blue tag hanging from the collar ring."*
2. When Scene 1 is right, **attach the new Scene 1 to every later message** and
   add: *"Match this image exactly for style, palette, character design, the
   collar and tag, and the way the leash attaches. Same dog, same woman, same
   room."*
3. **Scene 4 must follow Scene 3 in the same conversation**, with the approved
   Scene 3 attached. It is the same room, camera, cast and distance — only
   Lucy's behaviour and the guest's reaction change. Round 1 generated it
   loosely and came back with a visibly different dog.

**About the aspect ratio.** Round 1 returned three different shapes from the same
instruction: exact 4:3 for Scenes 1 and 2, square for 3 and 4, 3:2 for 5. Say it
twice — it is in Block A and again at the end of every scene. A square image is a
reject, not a crop job: these compositions use the full height, so removing 25%
of it takes either the guest's head or everyone's feet.

If what comes back is 3:2 (1536 × 1024) rather than 4:3, that is fine — every
scene is composed so everything essential sits inside the middle 4:3. Trim the
sides and resize:

```bash
sips -c 1024 1365 raw.png --out cropped.png && sips -Z 1100 -s format jpeg -s formatOptions 72 cropped.png --out pilot-1.jpg
```

**Reject and regenerate if:** any letter, number, word, checkmark, cross or
arrow appears; Lucy is wearing a harness; the collar has no blue tag; the leash
runs over her back; there is white on her face; the background gains furniture
nobody asked for; the image comes back square rather than landscape; or it comes
back as two panels.

---

## Block A — Style

> Contemporary dog-training instruction manual illustration. Simplified,
> vector-like forms with crisp clean edges and restrained detail. Mostly flat
> colour with subtle dimensional shading — soft minimal gradients only where
> they describe form. Warm cream background. Muted palette: sage and forest
> green, teal, dusty blue, charcoal, warm neutral oak. Coral or red appears only
> to flag a warning and never otherwise. Even, directionless light with no cast
> shadows beyond a soft contact shadow under feet and furniture. Side or
> three-quarter view at standing eye level. One clearly understandable action
> per image. Minimal background — only the objects the scene names. Warm,
> approachable, premium, adult.
>
> **Landscape orientation, 4:3 — clearly wider than it is tall. Do not return a
> square image.**
>
> No text, letters, numbers, labels, captions, watermarks, logos or interface
> elements anywhere in the image. No checkmarks, crosses, X marks, arrows,
> circles or any instructional symbol. No photorealism. No painterly or
> watercolour texture, no visible brush strokes, no grain. No childish or cutesy
> cartoon styling, no oversized eyes, no anthropomorphism. No decorative
> flourishes, no patterned wallpaper, no clutter, no extra furniture, plants,
> pictures or props beyond those named. No borders, no frames, no split panels —
> one single scene.

## Block B — Cast

> **Lucy** is a medium-large adult black dog, a Labrador and German Wirehaired
> Pointer mix: glossy black coat, a **slightly scruffy muzzle and eyebrows**,
> soft floppy ears, a white blaze on her chest, white toes on all four paws, and
> no white anywhere on her face. The scruff on her muzzle is what makes her
> recognisable — she is never smooth-faced.
>
> She wears **a flat purple collar with a small round blue tag hanging from the
> ring, and no harness — never a harness, in any image, ever.** The tag is
> visible in every image. When a leash is attached it clips to the metal ring on
> the collar, at the front of her neck under her chin.
>
> She is an adult dog with accurate, real canine body language — never
> anthropomorphised, never given human expressions.
>
> **The handler** is a woman in her thirties with dark brown hair in a ponytail,
> an olive-green hoodie, dark navy jeans, grey sneakers, and a mustard-yellow
> treat pouch clipped at her right hip. Her face is in profile or turned away.
> Calm, unhurried, upright.
>
> **The guest** is a man in his thirties with short brown hair, **clean-shaven,
> no beard and no stubble**, a blue-grey checked shirt, tan trousers and brown
> boots. Relaxed, hands at his sides, never leaning over the dog. The same man,
> with the same face, in every image.
>
> **Props, only where a scene names them:** a flat grey rectangular dog bed, a
> black leash, a charcoal panelled front door with a small window, a woven
> doormat, pale warm oak floorboards, cream walls with a white baseboard.

---

## Scene 1 — Setup at the door
*Replaces `dg-02`. Round 1: correct in every respect except the missing tag.
Attach `pilot-1-setup.png` and change only that.*

> Interior entry hall, three-quarter view. Lucy sits at the handler's left side
> facing a closed charcoal front door, calm, ears neutral, weight settled. **A
> small round blue tag hangs from the ring on her purple collar.**
>
> The handler stands beside her in profile, **cropped by the top of the frame at
> the shoulders** so only her body from the shoulders down is visible. The black
> leash is clipped to the ring on Lucy's collar and runs down and forward to
> **under the handler's near shoe**, with a loose loop of slack lying on the
> floor. **Both of the handler's hands are empty, open and relaxed at her
> sides.** The mustard treat pouch is clipped at her hip.
>
> Background: the closed door, the woven doormat, one baseboard line, oak floor.
> Nothing else in the room.
>
> The single thing this image must make obvious: the leash is trapped under the
> foot and both hands are free.
>
> Landscape 4:3, wider than tall.

## Scene 2 — Walking her over on a loose leash
*Replaces `dg-10`. Round 1 came back at the right ratio but with Lucy ahead of
the handler, which reads as pulling.*

> Interior entry hall, side view, handler and dog both moving left to right
> toward an open front door.
>
> **Lucy's shoulder is level with the handler's knee — she is beside the
> handler, never ahead of her. Her nose must not be further forward than the
> handler's leading foot.** Head up, ears forward, tail level, relaxed gait. A
> small round blue tag hangs from her purple collar.
>
> The black leash clips to the ring on her collar and runs up to the handler's
> near hand, held low and short, with a **deep, obvious J of slack** hanging
> between them — the line is visibly loose, not straight. It stays clear of her
> back and shoulders.
>
> The handler walks in profile, near arm low with the leash, far arm relaxed.
> The clean-shaven guest stands still in the open doorway, feet together, hands
> at his sides, body turned slightly away from the dog, daylight behind him.
>
> Background: the open door with pale daylight beyond, the doormat, one wall
> plane. Nothing else.
>
> The single thing this image must make obvious: the leash is slack and she is
> walking *with* the handler, not out in front of her.
>
> Landscape 4:3, wider than tall.

## Scene 3 — The calm greeting
*Replaces `dg-11`. Round 1's composition was right; it came back square. Also an
activity cover, so it takes both the wide band and the square crop.*

> Interior entry hall, three-quarter view. Lucy sits square with **all four paws
> on the floor**, weight settled back, head level, calm and still. A small round
> blue tag hangs from her purple collar.
>
> The clean-shaven guest is **crouched down to one side of her**, at her level,
> with his open palm flat on her chest — **not over her head**. His eyes are soft
> and his shoulders are turned slightly away from her. The handler stands just
> behind Lucy holding the leash in a loose loop at hip height; the line runs back
> to the ring on Lucy's collar, passing beside her rather than over her.
>
> **Composition: group all three subjects tightly together, centred, so that a
> square crop taken from the middle of the frame still contains Lucy's head, the
> guest's hand on her chest, and the handler's hand on the leash.** Keep them
> within the central horizontal band of the picture, with clear space above and
> below.
>
> Background: the edge of the door and the floor only. Nothing else.
>
> The single thing this image must make obvious: four paws down, and a hand on
> the chest rather than over the head.
>
> **Landscape 4:3, clearly wider than tall. Not square.**

## Scene 4 — The same greeting going wrong
*New image. Generate immediately after Scene 3, in the same conversation, with
the approved Scene 3 attached. Round 1 came back square and with a visibly
different dog — smooth-faced, wrong head shape.*

> Same room, same camera angle, same distance, same two people, same clothing,
> same lighting as the previous image. **The dog is the same dog: same scruffy
> muzzle and eyebrows, same head shape, same purple collar with the round blue
> tag.** Everything in the frame is identical except Lucy and the guest's
> reaction.
>
> **Lucy is up on her hind legs with both front paws planted on the guest's
> chest**, mouth open, ears back, weight thrown forward, front feet clearly off
> the floor. The black leash — still clipped to the ring on her collar — is
> **pulled tight in a straight line** from her neck to the handler's hand.
>
> The guest leans back away from her, both arms raised out to the sides and away
> from the dog, face turned aside. The handler's arm is extended, taking the
> weight of the tight leash.
>
> **The taut leash is the only coral or red element in the image.** Everything
> else keeps the standard palette.
>
> No X, no cross, no red circle, no border, no warning symbol, no text of any
> kind.
>
> The single thing this image must make obvious: this is the same greeting as
> before, and it has gone wrong.
>
> **Landscape 4:3, clearly wider than tall. Not square. It must match the
> previous image's framing exactly.**

## Scene 5 — Guest at the door, Lucy holding her bed
*Replaces `dg-01`. The programme cover and the first illustration anyone sees.
Round 1 gave the guest a beard and had Lucy watching him instead of the
handler — the same fault the image it replaces has.*

> Interior entry hall, wide three-quarter view, three subjects at three depths.
>
> Lucy sits square on a flat grey rectangular dog bed several feet inside the
> room, **her head turned toward the handler on her left, looking at her and not
> at the man in the doorway.** Ears neutral, calm. A small round blue tag hangs
> from her purple collar.
>
> The handler stands side-on near the bed with the leash slack in her low near
> hand, the line running to the ring on Lucy's collar. The guest — **clean-shaven,
> no beard** — stands in the open doorway with pale daylight behind him, feet
> still, hands at his sides, not leaning in.
>
> **Composition: place all three inside a horizontal band across the middle 60%
> of the frame**, with clear empty cream wall above and clear oak floor below, so
> the image can be cropped to a very wide letterbox without losing anyone.
>
> Background, and nothing more than this: the open front door with daylight
> beyond, the woven doormat, one wall plane, and at most one simple potted plant.
> No shelf, no framed picture, no side table, no candle, no coat hooks.
>
> The single thing this image must make obvious: a guest has arrived, Lucy is
> checking in with her handler, and nothing has gone wrong.
>
> Landscape 4:3, wider than tall.

---

## Still unproven after round 1

Both cover candidates — Scenes 3 and 5 — needed re-running, so nothing has yet
been tested against the two crops most likely to send an image back:

- **16:7** on Today, which letterboxes a cover to a horizontal band.
- **56 × 56** on the program map rail, a centred square from the thumb.

Check an approved Scene 3 and Scene 5 against both before generating anything
beyond the pilot. See [§2 of the audit](illustration-audit.md) for the full crop
table.

---

## Landing the files

Only after all five are approved. Raw generations stay in `img/pilot/`; none of
the current `IMAGES` keys should be repointed until the style is signed off.

```bash
cd "/Users/ahickey/dev/claude-local/Lucy Learns/img/pilot" && for f in pilot-*.png; do sips -Z 1100 -s format jpeg -s formatOptions 72 "$f" --out "${f%.png}.jpg"; done
```

Under the naming scheme proposed in the audit (§3.8) the approved five would
eventually land as `door-sound-01-setup`, `door-greet-07-approach`,
`door-greet-08-petting`, `door-greet-08-jumping` and `door-cover`.
