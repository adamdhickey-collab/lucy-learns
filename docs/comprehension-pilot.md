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
the briefs, the scoring keys, the filenames beyond the paths, or each other's
answers. Scoring was done afterwards against the keys.

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
