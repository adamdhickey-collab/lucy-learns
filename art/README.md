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

## art/pilot/round-N/ — gitignored working rounds

Every generation, kept or rejected, in the order it arrived. `pilot.mjs` files
new downloads into the highest-numbered round.

**Rounds 1–19 were deleted on 2026-08-12** — 264 MB, every one superseded.
Numbering was deliberately not reset: the per-batch post-mortems in
[`../docs/pilot-prompts.md`](../docs/pilot-prompts.md) cite rounds by number
("round 4 and round 5 of Scene 6 differed only in the human's pose"), and
renumbering would turn those into references to the wrong thing.

Before deleting a round, check that every shipped image still has its master in
`approved/`. The check that cleared the 2026-08-12 deletion:

    for f in img/*.jpg; do b=$(basename "$f" .jpg); case "$b" in thumb-*) continue;; esac
      [ -f "art/pilot/approved/$b.png" ] || echo "NO MASTER: $b"; done

It reports `lucy-portrait` and `splash-mark`, and both are fine: the portrait
predates the pilot process, and the splash mark's master is
`art/source/splash-source.png`. Any other name in that output means the round
holds the only high-resolution original of a shipped image, and deleting it is
not recoverable — these are **not in git**.

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
