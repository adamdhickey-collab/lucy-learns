# Lucy Learns

A private, mobile-first dog-training PWA. No build step and **no dependencies** —
plain ES modules, a service worker, and Node's own standard library. There is no
package.json and none should be added; if something needs a package, that is a
sign to reconsider it.

Serve it with any static server (`python3 -m http.server 3478`) over
`http://localhost`, never `file://` — the service worker and localStorage both
need a real origin.

## Checks

    node --test scripts/lib/*.test.mjs     the illustration pipeline (152 tests)
    node scripts/pilot.mjs verify          every image the app references resolves
    node scripts/check-contrast.mjs        every colour pairing against WCAG AA

Run all three before committing anything that touches art, colour or the
pipeline. The directory form `node --test scripts/lib/` does not work on every
Node build; the glob always does.

## The illustration restyle

Thirty-seven illustrations are being redrawn flat and cool to match the purple
UI. Full reference: [`docs/illustration-pipeline.md`](docs/illustration-pipeline.md).

    node scripts/pilot.mjs status                     where all 37 stand
    node scripts/pilot.mjs plan <scene>               free, reads the request
    node --env-file=.env.local scripts/pilot.mjs generate <scene> --yes
    node scripts/pilot.mjs approve <scene> --yes      installs it

Rules that are not negotiable:

- **Never commit or push unless asked.** Not after generate, not after approve.
- **The key.** `OPENAI_API_KEY` is read from the environment by `request.mjs`
  and nowhere else. Never print it, never put it in a command line, a log, a
  manifest or a commit. Supply it with `--env-file=.env.local`, never `export`.
  Do not read or display `.env.local`.
- **`generate` spends money.** It needs `--yes` and it is the only command that
  costs anything. Look at a result before generating the next one.
- **Approval is a human step.** Never run `approve` on a picture the user has
  not looked at, and never hand-copy anything into `img/` or
  `art/pilot/approved/`.
- **The ladder is generated in order.** Seven Stay scenes are one composition
  sampled at seven points; each needs the previous one approved. `generate`
  refuses out of order — do not work around it.
- **Two prompt briefs exist and one is live.** `art/source/drawing-a-new-scene.md`
  is current. `docs/pilot-prompts.md` is the superseded tan-era brief, kept for
  its post-mortems — read it for lessons, never for prompts.
- **Attachment 1 is always the flat style exemplar.** The first live generation
  came back painterly because two painterly sheets outranked one flat scene.

Read the post-mortems in `docs/pilot-prompts.md` before writing a scene spec for
an activity. They record which pictures failed, why, and which pairs collide —
that history is why the specs say what they say.

## The finish line

While the set is half redrawn, `css/app.css` cools the warm art with
`--art-grade` and `--art-veil`, and every redrawn file opts out through the
pilot ledger. When the last worklist row is ticked, delete both tokens, the
rules that apply them and the whole ledger block **in one commit** — not one at
a time, or the stragglers get graded alone. That deletion is when the branch
merges.

## House style

Comments explain **why**, not what, and name the failure they prevent — most of
this codebase's comments are the record of something that went wrong once. Crops
are expressed as ratios and a focal fraction, never pixels, because `sips` pads
rather than refuses an oversized crop and produces a confident wrong answer.
Anything that exists twice drifts: prompts are read from markdown, the worklist
is parsed rather than duplicated, and the ledger's container list is read off
the block.
