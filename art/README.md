# art/ — where the pictures come from

None of this is served. The app never loads a byte from here; these are the
masters and the working history behind the 6 MB in [`../img/`](../img/).

Kept separate because they were not: 395 MB of process used to sit inside the
folder the app serves from, which meant a listing of `img/` was 99% noise and
the shipped set was impossible to see.

## art/pilot/approved/ — committed, and the thing to protect

The full-resolution PNG master of every shipped illustration, plus
`lucy-run-sheet.png` (the commissioned sprite sheet). One per key in
`js/content.js`.

These matter more than they look. Every new image is generated with an
approved one attached as the style reference — that attachment is what holds
the dog, the room, the palette and the camera steady across 40-odd scenes
drawn months apart. Lose these and the style is unreproducible; the shipped
JPGs are downsampled and re-compressed and are not a substitute.

They are committed for exactly that reason. They spent most of this project's
life on one laptop.

### They are out of date, as of 2026-08-19

Every file in `approved/` is dated 12 August. The art was regenerated on the
19th across two commits — "Twenty scenes redrawn with the new trainer" and "The
last seven, and the handler is one person again" — and this folder was not
updated with it. Compare each master against its shipped JPG and **roughly
three quarters of them are a different picture**, not a larger one:
`door-place-cover`'s master is a dog alone on a bed, `door-greet-cover`'s is
the previous handler with a crouching guest in a plaid shirt.

Two things follow, and both bite:

- **Attaching a master now re-introduces the pre-restyle cast.** The whole
  point of the attachment is to hold the cast steady, and for most keys it
  would currently drag it backwards. Attach the shipped `img/*.jpg` instead
  until this is repaired — see Scene 48 in
  [`../docs/pilot-prompts.md`](../docs/pilot-prompts.md), which says so in the
  prompt itself.
- **The current art has no high-resolution original anywhere.** Not here, not
  in the surviving rounds — 20, 21 and 22 are all from 12 August — and not in
  git. The 1100px JPGs in `img/` are all there is. That is the exact loss this
  folder exists to prevent, and it has already happened.

The old check did not catch it, because it asked whether a master *exists*
rather than whether it is the same picture. There is a command for the real
question now:

    node scripts/pilot.mjs masters

It compares every shipped image against its master and sorts them into match,
check and differs, writing the pairs it is unsure about to
`art/pilot/masters.html` so a verdict costs one look. It exits non-zero when
anything differs or is missing, so it can gate a batch. Run it before deleting
a round and before starting one.

## art/pilot/round-N/ — gitignored working rounds

Every generation, kept or rejected, in the order it arrived. `pilot.mjs` files
new downloads into the highest-numbered round.

**Rounds 1–19 were deleted on 2026-08-12** — 264 MB, every one superseded.
Numbering was deliberately not reset: the per-batch post-mortems in
[`../docs/pilot-prompts.md`](../docs/pilot-prompts.md) cite rounds by number
("round 4 and round 5 of Scene 6 differed only in the human's pose"), and
renumbering would turn those into references to the wrong thing.

Before deleting a round, check that every shipped image still has its master in
`approved/` — **and that the master is still the same picture.** Use:

    node scripts/pilot.mjs masters

The check that cleared the 2026-08-12 deletion asked only the first half:

    for f in img/*.jpg; do b=$(basename "$f" .jpg); case "$b" in thumb-*) continue;; esac
      [ -f "art/pilot/approved/$b.png" ] || echo "NO MASTER: $b"; done

Every file was where it should be, so it passed, and it would pass today with
three quarters of the folder holding superseded art. `lucy-portrait` and
`splash-mark` are the two exemptions either way — the portrait predates the
pilot process and the splash mark's master is `art/source/splash-source.png` —
and `masters` knows about both rather than reporting them every run.

Anything else reported means the round may hold the only high-resolution
original of a shipped image, and deleting it is not recoverable — these are
**not in git**.

## art/source/ — the original painted illustrations

The pre-restyle artwork: 26 Calm Door Greetings scenes and 4 program covers, as
delivered. Every one has been replaced — the app has 37 keys and no `dg-NN`
image remains.

Kept anyway, for two reasons. `splash-source.png` is still live —
`scripts/make-splash.mjs` bakes the iOS launch images from it. And the audit
that drove the whole restyle
([`../docs/illustration-audit.md`](../docs/illustration-audit.md)) argues
against these specific pictures; deleting them turns its §5 defect list into
claims about files nobody can look at.

They are committed, so removing them from the working tree would not shrink a
clone anyway — git history keeps them either way.
