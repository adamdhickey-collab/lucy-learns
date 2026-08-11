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

## What happens next

Both briefs are amended in [pilot-prompts.md](pilot-prompts.md) — Scenes 25 and
28 — and carry a note recording why. Re-run those two, install, and re-run this
dry run before booking a panel; if they pass here, Block A is worth paying for.

Pair **P2** in Block B (`door-stay-03-cross` vs `door-stay-03-halfway`) should
be expected to fail until `onestep` is redrawn — three images currently read as
the same picture of a person walking toward a door.
