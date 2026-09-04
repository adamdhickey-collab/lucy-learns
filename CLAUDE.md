# Lucy Learns

A private, mobile-first dog-training PWA. No build step and **no dependencies** —
plain ES modules, a service worker, and Node's own standard library. There is no
package.json and none should be added; if something needs a package, that is a
sign to reconsider it.

Serve it with any static server (`python3 -m http.server 3478`) over
`http://localhost`, never `file://` — the service worker and localStorage both
need a real origin.

## Git, and what a push to `main` does

`.github/workflows/deploy-pages.yml` uploads the repository root — `path: .` —
and publishes it on every push to `main`. There is no build step and no gate in
between, so a merge is live about a minute later. **Work on a branch and never
push to `main` directly.** That is not ceremony borrowed from a larger project;
it is the only thing standing between an edit and the published app.

The rule the illustration pipeline states — never commit or push unless asked,
not after `generate`, not after `approve` — holds everywhere in this repository,
and the deploy is why.

`.github/workflows/checks.yml` runs the three checks below on every pull
request, so a change that breaks one fails in the pull request rather than after
it. Run them locally first anyway; they take seconds and need nothing installed.

## Where your session is running, and what changes

| | Sees | Use it for |
| --- | --- | --- |
| **Local** (`claude` on the Mac) | The whole filesystem: this repo, `.env.local`, Downloads, the neighbouring project repos | Anything touching art, the pipeline, or a picture you want to look at |
| **Remote Control** (`claude --rc`, or `/rc` mid-session) | The same — Claude still runs on the Mac; claude.ai and the phone are windows onto it. A photo attached from either is seen directly in the message; other files are downloaded to the Mac | Steering that same work from away |
| **Cloud** (`claude --cloud`, or claude.ai/code) | A fresh clone of this repository only | Well-defined batch jobs: a test failure, a refactor, an audit across the app |

A cloud session has no `.env.local` and therefore **cannot run `generate` at
all**, which is the correct outcome rather than a limitation — the one command
that spends money is the one command that cannot run where nobody is watching.
It also cannot see anything on the Mac that is not committed here, so it should
say so rather than guess. `claude --teleport` pulls a cloud session down to the
Mac, branch and history intact.

## Checks

    node --test scripts/lib/*.test.mjs     the illustration pipeline
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
- **Approve against `mustBeTrue`, not by asking.** Check the generated picture
  against every clause of its `mustBeTrue` line, zooming in on the load-bearing
  details rather than judging at full size — a third hand, an unclipped leash and
  a head cut off by the Today band all survived a glance. If every clause holds,
  run `approve` and move to the next picture without stopping. If one fails,
  amend the spec to name the failure and regenerate; keep iterating. **Stop and
  ask only when three rounds have not fixed the same fault, or when the call is a
  genuine judgement** — which picture to ship when each is wrong differently, or
  whether to relax a claim the art cannot meet. Bring numbers to those, not
  impressions. Never hand-copy anything into `img/` or `art/pilot/approved/`.

  Approval is still a human step; it just happens once, over the whole set,
  rather than picture by picture. The point of `mustBeTrue` is that it lets the
  machine hold the line between those reviews, so what reaches the batch review
  is a set that already passes its own written questions — and anything a
  reviewer then rejects is a question that was wrong, not a check that was
  skipped.
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

## The finish line, crossed

All thirty-seven illustrations are redrawn. `--art-grade`, `--art-veil`, the
rules that applied them, the whole pilot ledger block and `scripts/lib/ledger.mjs`
were deleted together in one commit, which is what the finish line always meant:
the pictures are drawn in the app's own palette now, so nothing is corrected at
render time and `approve` no longer touches `css/app.css`.

Nothing survives it. `--avatar-grade` outlived the art grade for as long as the
avatars were tan-era warm; the twenty-four pickable portraits have since been
redrawn flat and cool, and `lucy-portrait.jpg` — the last warm picture, and the
reason the token was kept — was dropped rather than redrawn, because the
redrawn dog-01 is the same black Labrador in the same palette. Every picture in
the app is now the colour it was drawn, and no filter is applied to any of them
at render time.

## The room, redrawn — `cool-flat-v2`

The finish line above was crossed under `cool-flat-v1`, whose room had a
lavender wall drawn as kin to `--slate-100` while the slate still ran violet.
With the paper neutralised, that wall — a third of each picture by pixel count,
and the first thing on every step screen — was the purple that was left. `v2`
changes the room and nothing else: walls to a warm plaster, trim to the new
paper, the violet out of the dog bed, and the same field under the avatars,
the icon and the splash.

A spec carries two briefs: `briefId`, the one the request is written for, and
`shippedUnder`, the one the master in `img/` was drawn under — `approve` writes
the second and nobody types it. Under `v2` every `v1` spec is **stale**:
`status` marks it `↻`, and `generate`, `plan` and `approve` refuse it until you
re-declare its `briefId` — per picture, on purpose, as you get to it. A ladder
rung then waits for the rung before it to *ship* under `v2`, not merely to be
re-declared. The exemplar trap is the one to watch: attachment 1 is a `v1`
scene until a `v2` one is approved, so Block A carves the wall out by name.
`door-sound-02-self` goes first, as it did before.

## House style

Comments explain **why**, not what, and name the failure they prevent — most of
this codebase's comments are the record of something that went wrong once. Crops
are expressed as ratios and a focal fraction, never pixels, because `sips` pads
rather than refuses an oversized crop and produces a confident wrong answer.
Anything that exists twice drifts: prompts are read from markdown, the worklist
is parsed rather than duplicated.
