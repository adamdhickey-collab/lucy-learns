# Pilot prompts — Warm Instructional Vector

Ready to paste into ChatGPT. Five images, chosen in
[illustration-audit.md §6](illustration-audit.md) to exercise every hard part of
the new style once: a partial-figure setup, a moving leash, a three-figure
interaction, a corrective pair, and a wide multi-person room.

Nothing here has been generated or installed. These are prompts only.

---

## How to run it

**One image per message.** Paste **Block A + Block B + one Scene**. A and B never
change — that is what makes five images look like one set.

**Order matters:**

1. **Scene 1 first.** It is the simplest, and it establishes Lucy, the handler,
   the palette and the front-clip leash in one frame.
2. When Scene 1 is right, **attach it to every later message** and add:
   *"Match this image exactly for style, palette, character design, and the way
   the leash attaches. Same dog, same woman, same room."*
3. **Scene 4 must follow Scene 3 in the same conversation**, with Scene 3
   attached. It is the same room, camera, cast and distance — only Lucy's
   behaviour and the guest's reaction change. Generating it cold will not match.

**About the aspect ratio.** Ask for landscape; what comes back will most likely
be 3:2 (1536 × 1024), not 4:3. That is fine — every scene below is composed so
everything essential sits inside the middle 4:3, so trimming the sides costs
nothing. Crop and resize afterwards:

```bash
sips -c 1024 1365 raw.png --out cropped.png && sips -Z 1100 -s format jpeg -s formatOptions 72 cropped.png --out pilot-01.jpg
```

**Reject and regenerate if:** any letter, number, word, checkmark, cross or
arrow appears; Lucy is wearing a harness; the leash runs over her back; there is
white on her face; the background gains furniture nobody asked for; the image
comes back square rather than landscape; or it comes back as two panels.

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
> approachable, premium, adult. Landscape orientation, 4:3.
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
> Pointer mix: glossy black coat, a slightly scruffy muzzle and eyebrows, soft
> floppy ears, a white blaze on her chest, white toes on all four paws, and no
> white anywhere on her face.
>
> She wears **a flat purple collar with a small round blue tag, and no harness —
> never a harness, in any image, ever.** When a leash is attached it clips to the
> metal ring on the collar, at the front of her neck under her chin.
>
> She is an adult dog with accurate, real canine body language — never
> anthropomorphised, never given human expressions.
>
> **The handler** is a woman in her thirties with dark brown hair in a ponytail,
> an olive-green hoodie, dark navy jeans, grey sneakers, and a mustard-yellow
> treat pouch clipped at her right hip. Her face is in profile or turned away.
> Calm, unhurried, upright.
>
> **The guest** is a man in his thirties with short brown hair, a blue-grey
> checked shirt, tan trousers and brown boots. Relaxed, hands at his sides,
> never leaning over the dog. The same man in every image.
>
> **Props, only where a scene names them:** a flat grey rectangular dog bed, a
> black leash, a charcoal panelled front door with a small window, a woven
> doormat, pale warm oak floorboards, cream walls with a white baseboard.

---

## Scene 1 — Setup at the door
*Replaces `dg-02`. Generate this one first; it becomes the reference for the
other four.*

> Interior entry hall, three-quarter view. Lucy sits at the handler's left side
> facing a closed charcoal front door, calm, ears neutral, weight settled.
>
> The handler stands beside her in profile, **cropped by the top of the frame at
> the shoulders** so only her body from the shoulders down is visible. The black
> leash is clipped to the ring on Lucy's collar and runs down and forward to
> **under the handler's near shoe**, with a loose loop
> of slack lying on the floor. **Both of the handler's hands are empty, open and
> relaxed at her sides.** The mustard treat pouch is clipped at her hip.
>
> Background: the closed door, the woven doormat, one baseboard line, oak floor.
> Nothing else in the room.
>
> The single thing this image must make obvious: the leash is trapped under the
> foot and both hands are free.

## Scene 2 — Walking her over on a loose leash
*Replaces `dg-10`.*

> Interior entry hall, side view, handler and dog both moving left to right
> toward an open front door.
>
> Lucy walks at the handler's side with her shoulder level with the handler's
> knee — **not ahead of it**. Head up, ears forward, tail level, relaxed gait.
> The black leash clips to the ring on her collar and runs up to the handler's
> near hand, held low and short, with a clear J of slack hanging between them.
> **The line stays clear of her back and shoulders.**
>
> The handler walks in profile, near arm low with the leash, far arm relaxed.
> The guest stands still in the open doorway, feet together, hands at his sides,
> body turned slightly away from the dog, daylight behind him.
>
> Background: the open door with pale daylight beyond, the doormat, one wall
> plane. Nothing else.
>
> The single thing this image must make obvious: the leash is slack, and it
> comes off her chest.

## Scene 3 — The calm greeting
*Replaces `dg-11`. Also an activity cover, so composition is tighter than the
others.*

> Interior entry hall, three-quarter view. Lucy sits square with **all four paws
> on the floor**, weight settled back, head level, calm and still.
>
> The guest is **crouched down to one side of her**, at her level, with his open
> palm flat on her chest — **not over her head**. His eyes are soft and his
> shoulders are turned slightly away from her. The handler stands just behind
> Lucy holding the leash in a loose loop at hip height; the line runs back to
> the ring on Lucy's collar, passing beside her rather than over her.
>
> **Composition: group all three subjects tightly together, centred, so that a
> square crop taken from the middle of the frame still contains Lucy's head, the
> guest's hand on her chest, and the handler's hand on the leash.** Keep them
> within the central horizontal band of the picture.
>
> Background: the edge of the door and the floor only. Nothing else.
>
> The single thing this image must make obvious: four paws down, and a hand on
> the chest rather than over the head.

## Scene 4 — The same greeting going wrong
*New image. Generate immediately after Scene 3, in the same conversation, with
Scene 3 attached.*

> Same room, same camera angle, same distance, same two people, same clothing,
> same lighting as the previous image. Everything in the frame is identical
> except Lucy and the guest's reaction.
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

## Scene 5 — Guest at the door, Lucy holding her bed
*Replaces `dg-01`. The programme cover and the first illustration anyone sees;
it takes the widest crops in the app, so keep everything central.*

> Interior entry hall, wide three-quarter view, three subjects at three depths.
>
> Lucy sits square on a flat grey rectangular dog bed several feet inside the
> room, **watching the handler rather than the guest**, ears neutral, calm.
>
> The handler stands side-on near the bed with the leash slack in her low near
> hand, the line running to the ring on Lucy's collar. The guest stands in the open doorway with pale daylight behind him,
> feet still, hands at his sides, not leaning in.
>
> **Composition: place all three inside a horizontal band across the middle 60%
> of the frame**, with clear empty cream wall above and clear oak floor below,
> so the image can be cropped to a very wide letterbox without losing anyone.
>
> Background, and nothing more than this: the open front door with daylight
> beyond, the woven doormat, one wall plane, and at most one simple potted
> plant. No shelf, no framed picture, no side table, no candle, no coat hooks.
>
> The single thing this image must make obvious: a guest has arrived and nothing
> has gone wrong.

---

## Landing the files

Only after all five are approved. Save the raw generations into
`img/source/Pilot/` and keep them out of the served directory until the style is
signed off — these are a test, not a replacement set, and none of the current
`IMAGES` keys should be repointed at them yet.

```bash
cd "/Users/ahickey/dev/claude-local/Lucy Learns" && mkdir -p img/source/Pilot
```

```bash
cd "/Users/ahickey/dev/claude-local/Lucy Learns/img/source/Pilot" && for f in *.png; do sips -c 1024 1365 "$f" --out "crop-$f" && sips -Z 1100 -s format jpeg -s formatOptions 72 "crop-$f" --out "../../pilot-$(basename "$f" .png).jpg"; done
```

Under the naming scheme proposed in the audit (§3.8) the approved five would
eventually land as `door-sound-01-setup`, `door-greet-07-approach`,
`door-greet-08-petting`, `door-greet-08-jumping` and `door-cover`.
