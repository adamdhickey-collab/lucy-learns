# Restyling the avatars

Twenty-four square portraits — ten dogs a household picks from for their own
dog, fourteen people they pick for themselves — redrawn flat and cool against
[Block A in `drawing-a-new-scene.md`](drawing-a-new-scene.md).

They are **not** part of the 37-illustration worklist. `status`'s total and the
finish line both count worklist rows, so giving these rows would move a finish
line that has already been crossed — the thirty-seven are done and the art grade
is gone. These run on the `avatar` profile; see
[`../../docs/illustration-pipeline.md`](../../docs/illustration-pipeline.md).

## What is different about these

They are the only pictures in the app a household **chooses**, so the thing that
must survive the restyle is recognisability. Somebody who picked the beagle
because it looks like their beagle must still find it after the redraw. The
identity is the spec; the rendering is what changes.

- **1:1, not 4:3.** Shipped at 400×400. The scene pipeline's canvas, crops and
  master size do not apply — an avatar has no 21:9 hero and no Today band.
- **No thumbnail pair.** `js/content.js` derives `thumb-` paths for scene assets
  only; avatars are their own list and ship one file each.
- **One flat field behind every one of them.** Currently a warm cream. It
  becomes the cool ground, and it has to be the *same* ground across all
  twenty-four or the picker grid reads as a patchwork.
- **No ledger row.** When this was written the app still cooled its warm art
  with `--art-grade`, and every redrawn file had to opt out of it. The finish
  line has since deleted the grade, the rules that applied it and the ledger
  together, so there is nothing left to opt out of. An avatar arriving now is
  simply the picture.

## Format: back to PNG

`js/content.js` records why these became JPEG, and the reasoning is sound and
about to be reversed by this work:

> The old set was flat vector-style work with crisp edges on a flat field,
> which is the one case JPEG handles worst. These are painted — soft fur,
> graded light, no hard edges to ring around — and that reverses the answer:
> the set weighs 340KB as JPEG against 2MB as PNG.

Redrawing them flat puts the crisp edges and the flat field back, so the format
goes back with them. **Measure before committing to it**: the 8× penalty was
recorded against *painted* PNGs, and flat two-tone fills compress far better —
the expectation is that PNG comes out both crisper and lighter than the painted
JPEGs, but that is a prediction, not a measurement.

The change is not only the files. `js/content.js` carries 24 `.jpg` paths and
the rationale comment above; `sw.js` precaches every one by name; and the pilot
ledger matches on `src$="<key>.jpg"`. All three move together or the app breaks
offline, which is the failure mode with no visible symptom until someone is on
a train.

## The dogs

Chosen for coverage of shape, not registration numbers — the question is "which
looks like my dog", not "which breed is mine". Side profile, head and neck, one
subject large and centred.

| ✓ | key | who |
| --- | --- | --- |
| [ ] | `dog-01` | Black Labrador — the one Lucy herself is drawn from |
| [ ] | `dog-02` | Golden Retriever |
| [ ] | `dog-03` | German Shepherd |
| [ ] | `dog-04` | French Bulldog |
| [ ] | `dog-05` | Poodle or doodle |
| [ ] | `dog-06` | Dachshund |
| [ ] | `dog-07` | Beagle |
| [ ] | `dog-08` | Border Collie |
| [ ] | `dog-09` | Staffordshire or pit type |
| [ ] | `dog-10` | Shih Tzu or small fluffy |

## The people

Head and shoulders, three-quarter or profile. Each is a character with a name
the app shows, and the name is the brief — the picture has to earn it.

| ✓ | key | who |
| --- | --- | --- |
| [ ] | `person-01` | The Handler — the same woman as the illustrations, olive hoodie |
| [ ] | `person-02` | Pixel Whisperer — cap, glasses |
| [ ] | `person-03` | Professor Fetch — white moustache, goggles |
| [ ] | `person-04` | Disco Dog Coach — white curls, headband, big glasses |
| [ ] | `person-05` | Zen Leash Master — bald, long white moustache |
| [ ] | `person-06` | Treat Detective — dark natural hair, glasses |
| [ ] | `person-07` | Barkitect — beard, bow tie, dark-framed glasses |
| [ ] | `person-08` | Agility Rockstar — silver crest, track jacket |
| [ ] | `person-09` | Fetch Cowboy — hat, moustache, neckerchief |
| [ ] | `person-10` | Canine Cosmonaut — high collar, close-cropped hair |
| [ ] | `person-11` | Woodland Sage — grey beard, knitted hat |
| [ ] | `person-12` | Retro Aerobics Ace — headband, ponytail |
| [ ] | `person-13` | Oracle of Obedience — silver curls, round glasses |
| [ ] | `person-14` | Duke of Drool — white hair swept up, bow tie |

## Before generating any of them

The set has to be internally consistent in a way the scenes do not: twenty-four
pictures seen **side by side in a grid**, which is a far harsher test of shared
style than thirty-seven pictures seen one at a time. Two consequences, both
learned from `prompts-dog-avatars.txt`:

1. **Generate the first one alone and iterate until it is right**, then attach
   it to every subsequent one. It sets the background, the light, the crop and
   the line weight for the other twenty-three.
2. **Check them as a grid, circle-masked, at the size the picker actually draws
   them** — and one on the profile card at 76px. A portrait that reads at 400px
   and turns to mush in a circle at 56px has failed at the only size it is ever
   seen.
