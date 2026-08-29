# Lucy Learns

A private, mobile-first dog-training PWA. No build step and **no dependencies** —
plain ES modules, a service worker, and Node's own standard library. There is no
package.json and none should be added; if something needs a package, that is a
sign to reconsider it.

Serve it with any static server (`python3 -m http.server 3478`) over
`http://localhost`, never `file://` — the service worker and localStorage both
need a real origin.

## Checks

    node --test scripts/lib/*.test.mjs     the illustration pipeline (180 tests)
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

One scoped remnant survives on purpose: `--avatar-grade`. The avatars and
`lucy-portrait.jpg` are outside the thirty-seven and still tan-era warm, so
deleting the grade outright left them as the only warm note in the chrome. It
goes when they are redrawn on the brand-marks track.

## House style

Comments explain **why**, not what, and name the failure they prevent — most of
this codebase's comments are the record of something that went wrong once. Crops
are expressed as ratios and a focal fraction, never pixels, because `sips` pads
rather than refuses an oversized crop and produces a confident wrong answer.
Anything that exists twice drifts: prompts are read from markdown, the worklist
is parsed rather than duplicated.
