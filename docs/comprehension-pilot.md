# Block A pilot — synthetic, 4 viewers

A dry run of [Block A of the comprehension survey](comprehension-survey.md)
before spending a panel on it.

## What this was, and what it was not

Four language models, each with no memory of this project, each shown the eight
Block A images in a **different order**, each asked one question per image:

> What is the person doing, and what is the dog doing?

They were told only that these are illustrations from a dog-training app, and
were instructed to describe what they could see, to say so when something was
ambiguous, and not to read any other file in the repository. None of them saw
the briefs, the scoring keys, or each other's answers. Scoring was done
afterwards against the keys.

> **This run's results are not safe, and the second run below says why.** Viewers
> here saw the real filenames, and a name like `door-sound-03-name-distant.jpg`
> states the answer to the question being asked. At least one pass in the table
> below is the filename talking rather than the picture working. Later runs blind
> the filenames; this section is left as written because the correction is worth
> more than a tidy record.

**This is not user research and the numbers must not be reported as if it
were.** Models are not people; they describe more thoroughly than a participant
skimming a survey, and they may be systematically better or worse than a human
at particular things — a subtle transition of weight, for instance, is exactly
the kind of detail a careful describer might miss and a dog owner might catch,
or the reverse.

What a dry run like this is genuinely good for is the two things a pilot is for:
finding out whether the **scoring keys are written tightly enough to score
against**, and whether any image fails so badly that it is not worth putting in
front of a paid panel. It found both, which is a good return on something free.

## Results

| Image | Pass | What they said |
| --- | --- | --- |
| `plan-mat` | 4/4 | "asleep, curled on its side", "eyes closed" |
| `door-greet-04-open` | 4/4 | door open, man outside not moving, leash held, dog on the bed |
| `door-greet-05-reward` | 4/4 | a treat at the dog's mouth in every one |
| `door-sound-03-name-distant` | 4/4 | "farther away down a hallway… the dog looking toward her" |
| `door-sound-03-name` | 3/4 | three saw mutual gaze; one described position only |
| `door-stay-03-pretend` | 3/4 | one read the door as **closed**, the hand as "about to knock" |
| `door-stay-05-release` | **0/4** | every viewer: the dog is "standing **on** the mat" |
| `door-stay-03-onestep` | **0/4** | every viewer: "**walking away** toward the door" |

### What passed, and why it counts

Three of the four clean passes are images that replaced a recorded §5 defect,
and each one confirms the specific fix landed rather than the picture merely
being pleasant:

- **`door-greet-05-reward`** — the treat is in frame for all four. That was the
  defect §5 recorded against `dg-12` ("no treat is visible"), and it is also the
  defect the *first replacement* reproduced with a closed hand at the dog's
  muzzle. Two attempts to get one object into a picture, now confirmed from
  outside.
- **`door-sound-03-name-distant`** — all four have the dog turned toward the
  handler. `dg-05` had her facing away from the person calling her, which meant
  the picture illustrated the step failing.
- **`door-stay-03-pretend`** — nobody invented a visitor. The old `dg-08`
  painted the imaginary guest as a translucent figure; the empty porch reads as
  empty.

### The two failures

Both are images this project flagged at review and consciously declined to
re-run. Both failed unanimously.

**`door-stay-03-onestep`** was accepted with the note that it "shows a full
stride past the bed rather than one foot lifted" but reads correctly "in
sequence against 29". Out of sequence it does not read as one step at all — all
four said *walking away*, which is `door-stay-03-cross`, an image from a
different activity. The near-duplicate this ladder was written to avoid.

**`door-stay-05-release`** asked for front feet down and hind feet still on the
bed. All four read the open inviting hands correctly and all four described a
dog **standing on** the mat. Front-feet-down is a pose, not a departure.

### And a flaw in two of the keys

The pilot's most useful finding is not about the pictures.

**"One step, and no more" is unscoreable.** It asks a still image to prove an
absence — you cannot see that no second step follows. The image was set a bar
nothing could clear. The claim is now *"she has barely moved — the bed is still
right at her heel"*, which is a thing a single frame can carry, and the brief
gives her a reference object to be near.

**"Coming off the bed, invited, toward open hands"** bundles three claims and
the viewers got two of them. The key stands — a dog leaving a bed is visible if
she is drawn leaving it — so this one is a picture problem, and the brief now
asks for most of her off the bed rather than a two-foot transition.

The general lesson, and it applies to the other 28 briefs: **a claim that names
a transition needs the picture to show a body most of the way through it, not
balanced at the moment of change.** Stills are bad at "about to" and "just
beginning to".

## Re-runs

### `door-stay-05-release` — fixed and installed at 1.62.0

Redrawn against the amended brief: most of her off the bed, one back foot still
touching its edge, weight over the floor. Checked blind again, three viewers,
none of whom had seen the first attempt.

- *"The dog is off the bed — standing on the wood floor beside it"*
- *"standing on the wood floor with one front paw still resting on the edge of a
  gray dog bed"*
- Shown against `door-place-03-send` and asked which sends her **to** the bed
  and which invites her **off** it, a third viewer got both right — so Block B's
  pair **P1** works as well.

That clause failed 4/4 before and passes now. One thing to watch: a viewer who
saw only this picture said the gesture's purpose was "unclear — inviting the dog
forward or something else", where all four viewers of the first version read the
open hands as an invitation without prompting. The departure was bought at a
little cost to the invitation. Not enough to reject, worth watching in the
panel.

### `door-stay-03-onestep` — fixed and installed at 1.63.0

Redrawn against both the amended brief and the amended claim. Checked blind,
three viewers, none of whom had seen the first attempt:

- *"The person has taken only one small step away from the dog's bed — she's
  standing right beside/just in front of it… a modest, one-step distance, not
  across the room."* That is the amended claim, in a stranger's words.
- *"A woman stands…"* — the "walking away toward the door" reading that failed
  4/4 is gone.
- Shown all three rungs of the ladder and asked to order them by distance
  moved, a third viewer got it right and called this one *"unmistakable at a
  glance"*.

Two things recorded rather than smoothed over.

**Pair P2 is still the closest call, but it is a different pair now.** With this
image fixed, the viewer named `door-stay-03-halfway` vs `door-stay-03-cross` as
the hard one: *"same crop, framing, and background… the only real
differentiators are distance and pose."* They separated them correctly when
asked, so it is a near-miss rather than a failure — but P2 earns its place in
Block B and should go to a panel.

**A small regression in the dog.** Her gaze is now ambiguous — *"looking off to
the side/toward the door rather than at the woman"* — where the brief asks for
eyes on the handler. It does not touch this image's claim, which is about how
little the person has moved, so it was not worth a fourth generation. If this
one is ever redrawn again, fix the gaze at the same time.

## Where Block A stands

Eight images, two redrawn, all eight now passing their claim under blind check.
Worth putting in front of a paid panel — which is the only question this dry run
was ever able to answer.

---

# Block A, second run — 15 images, and a hole in the first run's method

Re-run after batch 8, against the corrected Block A: the survey generator had
been reporting 8 images when the real answer is 15 (see the batch 8 notes in
[pilot-prompts.md](pilot-prompts.md) — a parser bug read only the first line of
each scene's note, so seven pictures that replaced a recorded §5 defect were
never in the panel).

Four viewers, no memory of this project, each shown the same 15 in a **different
order**, one question per image: *what is the person doing, and what is the dog
doing?*

## The method changed, and it mattered more than the images did

**This run stripped the filenames.** Every image was copied to `image-01.jpg`
… `image-15.jpg`, in a different order per viewer, so nobody saw a path.

The first run did not do that. Viewers there were handed
`door-sound-03-name-distant.jpg` and asked what the dog was doing — and the
filename says *name*, and says *distant*. That is the answer to the question,
written on the thing being tested.

It changed a result. `door-sound-03-name-distant` **passed 4/4 in the first run
and failed 0/4 here**, on a file that has not been touched since it was
installed (verified: one commit in its history, and the checksum of what the
viewer opened matches what ships). Looking at it myself, the viewers are right —
her gaze goes up and past, the handler is at floor level far down the hall, and
the two never meet. The first run's pass was the filename talking.

So one of the eight results in the section above is unsafe, and it is recorded
here rather than quietly corrected. Blinded filenames are the method from now
on; the cost is one `cp` loop.

## Results

| Image | Claim confirmed | |
| --- | --- | --- |
| `door-stay-03-cross` | 4/4 | |
| `door-greet-04-open` | 4/4 | |
| `door-greet-05-reward` | 4/4 | the treat is in frame for all four, again |
| `door-sound-03-name` | 4/4 | up from 3/4 |
| `door-place-cover` | 4/4 | |
| `plan-mat` | 4/4 | the batch 8 coat redraw broke nothing |
| `door-stay-03-halfway` | 4/4 | but see P2 below |
| `door-stay-05-release` | 4/4 departure | **0/4 read the hands as an invitation** |
| `door-greet-06-enter` | 4/4 inside and stopped | **4/4 could not tell arriving from leaving** |
| `door-stay-cover` | 4/4 she stayed | 2/4 called the door only *part* open |
| `door-sound-cover` | 4/4 mutual attention | **0/4 "the sound happened"** |
| `door-stay-03-onestep` | 3/4 | one read "a couple of paces", not at her heel |
| `door-place-03-send` | 3/4 | **4/4 flagged the direction; one read it as leaving** |
| `door-stay-03-pretend` | 4/4 door open | **0/4 "onto nobody"** |
| `door-sound-03-name-distant` | **0/4** | her gaze does not meet the handler |

### The one outright failure

**`door-sound-03-name-distant`.** Every viewer: *"looking up and off to the
side"*, *"looking upward at nothing I can see"*, *"looking up and away toward
the upper right rather than at her"*. The claim is that she heard her name and
turned toward it, and the picture does not carry it. All four also could not
read what the distant handler's raised hand is doing — signal, wave, or reaching
for a light switch.

This is the same defect §5 recorded against `dg-05`, which this image was
commissioned to replace: *the dog facing away from the person calling her.* The
redraw turned her head part of the way and stopped.

### Three claims the pictures cannot carry as written

Not picture problems. Key problems, and the same shape as *"one step, and no
more"* from the first run.

- **`door-sound-cover` — "the sound happened and she has turned to her person."**
  All four described a close, warm two-shot with the dog looking into the
  handler's face. None mentioned a sound, because **there is no sound in it** —
  no bell, no door, no hand at a button. A still cannot show that an event
  occurred a moment ago with nothing in frame to indicate it. The cover works;
  it is the archetype that fixed Block C. The claim should be about attention.
- **`door-stay-03-pretend` — "wide open onto nobody."** All four saw the open
  door. None could confirm nobody was there: *"a plain white glare"*, *"a
  featureless pale glare"*, *"flat pale white with no detail"*. Nobody invented a
  visitor, which is what the first run tested and what `dg-08` got wrong — but
  an unrendered white void reads as *cannot tell*, not as *empty porch*. An
  absence needs something drawn to be an absence of.
- **`door-greet-06-enter` — "he is inside, he has stopped."** All four placed him
  inside and stopped, and all four then said they could not tell whether he had
  just arrived or was about to leave. The door behind him is shut in both
  readings. This collides with *The guest leaves* in Block D and both should go
  to a panel together.

### `door-place-03-send` is not fixed

Scored 3/4, and the number flatters it: **all four volunteered that they could
not tell whether she is getting on the bed or off it**, and the one who chose
said *"walking away from her off the far side"*. One called it *"the image I was
least sure about"* of the fifteen.

That is `dg-06`'s recorded defect — *the direction backwards* — surviving its own
replacement. Looking at the picture: only her front paws are on the bed, her
whole body is still on the floor, and her head is low and turned away from the
handler. Nothing in it says *sent*.

It also breaks the rule the first run produced: *a claim that names a transition
needs the body most of the way through it.* Front-paws-on is the same pose that
failed for `door-stay-05-release`, drawn from the other side.

### And the invitation is now confirmed lost

`door-stay-05-release` passes its departure clause 4/4 — she is clearly coming
off the bed, which is what the first re-run bought. But **all four could not read
the open hands as an invitation**: *"inviting or blocking"*, *"inviting it in,
offering something, or signalling to stop"*, *"holding something, inviting the
dog to come, or gesturing it back"*.

The first re-run saw this in one viewer of three and recorded it as *"worth
watching in the panel"*. Four of four is no longer worth watching. The claim is
*"coming off the bed, **invited**, toward open hands"* and half of it is gone.

### P2 confirmed, and it is a trio

The three-rung ladder still does not separate. One viewer, unprompted:
*"this reads as very similar to image-03 with a slightly larger gap"* (halfway
vs onestep). Another: *"images 05, 07 and 11 are near-identical setups differing
mainly in the woman's distance and posture, and I could not reliably tell them
apart on direction of travel"* — cross, halfway and onestep.

Every one passes its own claim in isolation. The set does not separate. That is
Block C's lesson arriving in Block A: **each was tested against its own key and
never against its neighbours.**

## The three keys, rewritten

Done. Each was rewritten to claim what its picture can actually carry:

| Image | Was | Now |
| --- | --- | --- |
| `door-sound-cover` | the sound happened and she has turned to her person | she and her person have each other's complete attention |
| `door-stay-03-pretend` | the door is wide open onto nobody, and she is still on her bed | she has her back to the dog and her attention out of the open door, and the dog is holding her bed anyway |
| `door-greet-06-enter` | he is inside, he has stopped, and nobody is paying her any attention | nobody is paying the dog any attention, and she has stayed on her bed anyway |

Scored against the transcripts already collected, all three now pass **4/4** —
every viewer's description satisfies the new wording.

**That number is worth less than it looks, and the reason is worth writing
down.** A key rewritten in front of the answers will always pass them; the
transcripts informed the wording, so this is a consistency check and not a
test. What stops it being circular is that each new claim is still falsifiable
by a *different picture*: "nobody is paying the dog any attention" fails if
anyone looks at her, "her back to the dog" fails if she turns around, "each
other's complete attention" fails if either looks away. None of them is true of
just any illustration.

But they have not been read by anyone who has not already been read. **These
three need a fresh blind check before their pass counts**, and it should be a
run that has never seen the old wording.

`door-stay-03-pretend`'s new claim also does a second job. It is the same room
and the same two figures as `door-stay-cover`, and the old wording gave them
nearly the same key. The new one names what actually separates them: here she
is small, in profile, and looking out at a porch that is drawn; in the cover she
is a large foreground figure against a blank white slab.

## What to do

Nothing here is urgent enough to jump the usability study. The keys above are
done; what is left is two redraws and one deliberate refusal.

1. **Redraw `door-sound-03-name-distant`** — the one clear failure, and it is
   the second attempt at this defect. Her eyes must meet the handler's, and the
   handler needs to be doing something legible at that distance.
2. **Redraw `door-place-03-send`** — most of her on the bed, head up and turned
   back to the handler.
3. **Leave the ladder alone for now.** Fixing `cross`/`halfway`/`onestep` means
   redrawing three images to be different from each other, which is the batch 6
   problem, and they are correctly ordered when seen in sequence — which is how
   the app shows them.

---

# Batch 9, checked blind before installing

Both redraws were blind-checked with the filenames stripped before either went
near the app. One passed and shipped; one is on its third failure and is
recorded here unfixed.

## `door-place-03-send` — passed, and its claim was rewritten

Three viewers, both images, two orders. All three: four feet on the bed, high
confidence she is on it, attention on the handler. **Nobody read her as
leaving** — the previous version had a viewer say "walking away off the far
side", and that is gone.

All three also said they could not tell whether she had just stepped on, was
holding, or was about to step off. That is the transition problem for the
fourth time in this document, so the claim was rewritten rather than the
picture redrawn again: *"she is standing on her bed, all four feet, looking up
at the person pointing at it"*. Arrival is a transition and "sent" is a cause;
a still frame reports neither.

Installed at 1.71.0.

## `door-sound-03-name-distant` — improved, still failing, and now three deep

| Version | What three blind viewers said |
| --- | --- |
| Shipped | *"looking up at nothing I can see"* — 0/4 |
| Body squared to the door, head turned back | *"roughly 180 degrees away from her"*, *"definitely not looking at her"* — 0/3 |
| Whole body turned down the hallway | *"I cannot tell"* — 0/3 |

Wrong became unclear, which is progress, and the reason is in every transcript:
**her face is no longer visible.** Turning her body to face the handler put the
camera behind her. *"The dog is drawn from behind and slightly to the side …
its eyes are not visible."* *"A rear three-quarter view of a black dog, so a
first-time viewer gets no expression or eye contact to read."*

So the two fixes are in opposition as the shot is currently framed:

- Face visible → body squared to the door → reads as *looking at the door*.
- Body turned to the handler → camera behind her → reads as *cannot tell*.

Neither is a drawing failure. **The camera is in the wrong place.** It sits
beside the door looking down the hall, which is the one position where a dog
facing down the hall must have her back to it. The shot that resolves it puts
the camera side-on to the hallway axis — her flank to the lens, sitting upright
facing the handler, muzzle and eye in clear profile, the handler beyond her in
the same plane. Body, head, gaze and camera then all agree.

**Two things worth saying against my own conclusion.** These are language
models, and left/right spatial reading is a known weak spot for them; I zoomed
in and her muzzle genuinely *is* turned down the hallway in both versions, so a
human panel might well score this differently. And the app never shows this
picture alone — it sits under the instruction "call her from another room".

Neither gets it off the hook. It is the only Block A image that has never once
been read correctly by anyone who did not commission it, across three attempts
and ten viewers. But it is also the point at which the honest options are a
camera move or a rewritten claim, **not** a fourth attempt at the same shot.

---

# Block C, second run — the covers as a set

## First run: three of four were the same picture

Four covers at 56px, three viewers, matching each to its activity. Ten of twelve
right, but **six of the twelve were self-reported guesses**, one viewer swapped
two covers, and all three named a pair they could not separate. Only
`door-greet-cover` was identified confidently by everyone, and what saved it is
structural: it is the only one with two people in it.

The cause was a rule from batch 3 — *nobody stands in a cover*, derived because
a standing adult and a floor-level bed will not both fit in the 16:7 band. It is
correct, it is why every cover passes its crops, and it turned three of them
into the same silhouette. **Each was tested against the crops alone and never
against the others**, so four separately-correct images became one composition
drawn four times.

## Second run: one fixed, one half-fixed, one still to do

Two redrawn — `door-sound-cover` as a close two-shot, `door-stay-cover` as the
open door — and re-tested the same way.

| Cover | Correct | Guessed | First run |
| --- | --- | --- | --- |
| `door-sound-cover` (new) | 3/3 | 1 | 3/3, 2 guesses |
| `door-greet-cover` | 3/3 | 1 | 3/3, 0 guesses |
| `door-stay-cover` (new) | 2/3 | 1 | — |
| `door-place-cover` | 2/3 | 1 | 2/3, 1 guess |

**The close two-shot worked.** Nobody confused it with the bed pictures any
more, which was the whole point of the archetype.

**The open door half-worked.** It is distinct from the close-up and from the
greeting, and two viewers described its bright doorway accurately — but all
three still named it and `door-place-cover` as the hard pair:

> *"Both are 'door + dark dog-on-a-mat' compositions in the same beige room with
> the same orange floor… the distinguishing detail — whether the person is right
> next to the dog or over at the door — is exactly the kind of positional cue
> that gets lost at thumbnail size."*

That is a mistake I made knowingly. I left place alone because earlier viewers
had described it as "a dog alone on a mat", and treated that as the archetype
already being in place. It is not: it has a door in the corner and a crouching
person, and those are precisely what collide with a cover whose whole subject is
a door.

**The lesson is the same one, one level up.** Redrawing half of a confusable
pair does not fix the pair. Both members define the collision, so both have to
move — or the one that moves has to move much further than the other.

## Third run: the defect is fixed, and the score cannot move

`door-place-cover` redrawn as the dog alone on her bed — no door, no person —
and all four re-tested as a set.

Still 10/12, the same as both earlier runs. But the shape of the result changed:

| Run | Pairs named as confusable |
| --- | --- |
| First | 2&3, 2&3, 1&2 — converging |
| Second | 2&3, 2&3, 2&3 — unanimous |
| Third | 1&3, 4&1, 2&3 — no agreement |

And every viewer described all four **distinctly and accurately**: a close-up of
two heads, a pale door with the dog set back from it, a dog alone on a bed with
no people or door, two figures at a doorway. In the first run three of the four
came back in the same words. That was the defect and it is gone.

**The residual errors are not visual.** One viewer read both pictures correctly
and still mapped them to the wrong names; another said why:

> *"The difference between those two activities is behavioural/narrative, not
> visual, so the thumbnail can't carry it."*

That is right, and it is the ceiling. *Doorbell Predicts Rewards*, *Doorbell
Means Place* and *Stay While the Door Opens* are three protocols about a dog, a
door and a bed. No 56px picture encodes which protocol is which.

**The matching task is also harder than the app.** On the program map every
cover sits beside its activity name and its own icon. The picture never has to
identify the activity alone — it only has to not be a duplicate of its
neighbour, and it no longer is. Chasing 12/12 would mean optimising against a
test stricter than the product.

Stop here. If a fifth activity is added it needs a fifth *shape*, and this set
test must be re-run — not the crop tests on the new cover by itself.
