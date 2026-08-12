# Study plan

Two studies, run separately, answering different questions.

**The usability study** asks whether a household who has never seen this app can
do the things it exists for. It runs on the live site through an unmoderated
platform (Maze), using the `?study` URLs below.

**The comprehension survey** asks whether the 37 illustrations say what their
briefs claim. It is written out in full in
[comprehension-survey.md](comprehension-survey.md) and summarised at the end of
this document.

Do not merge them. The usability missions need a participant moving through the
product; the survey needs one looking at a picture with no context. Bolting the
survey onto the end of six missions buys tired answers to the questions with the
most at stake.

---

## Study mode: how participants all start in the same app

`js/study.js` exists because three things make two participants incomparable:
the welcome ends on a fork between an empty app and a demo history, nothing is
reachable before the welcome, and the splash holds five seconds inside every
task in a tool that reports time on task.

**Every page load with the parameter rebuilds the baseline from scratch.** A
participant who reloads, or backs out and re-enters from the study link, gets
the state the last one started from. Navigation inside the app leaves their work
alone — only a load resets.

| URL | Lands on |
| --- | --- |
| `…/lucy-learns/?study` | Past the welcome, eight sessions of demo history |
| `…/lucy-learns/?study=demo` | The same thing, said out loud |
| `…/lucy-learns/?study=empty` | Past the welcome, nothing logged |
| `…/lucy-learns/?study=welcome` | The very first launch — onboarding is the task |

Base URL: `https://adamdhickey-collab.github.io/lucy-learns/`

**The query string goes before the hash.** This is hash routing, so
`?study#/progress` works and `#/progress?study` silently does nothing — the
participant lands in whatever state their browser happened to be in, which is
the exact failure the parameter exists to prevent. Every URL below is written
out in full for that reason; do not hand-assemble them.

`?study=welcome` ignores whatever hash you give it and redirects to `#/welcome`,
because nothing is reachable before onboarding.

The splash holds **1.2 seconds** in study mode rather than five. It is still
inside every mission's time on task — a constant to subtract, not something to
read as hesitation.

---

## The usability study

**Six missions, roughly 10 minutes.** Fifteen participants, no dog-training
experience required — needing expertise to work out where the button is *is* the
finding. Mobile, since that is the only way this app is ever opened.

Order matters even though state does not. Each load resets the app, so mission 4
cannot be polluted by what mission 2 left behind — but the *participant* is not
reset, and someone who has already run a session knows where the tab bar goes.
The missions below run coldest-first for that reason.

### M1 — First run

> Your dog trainer has just sent you this app to use with your dog, Lucy. Get
> yourself set up and ready to practise.

Start: `https://adamdhickey-collab.github.io/lucy-learns/?study=welcome`

**Pass:** reaches Today having gone through the panels. **Skip** is on screen
throughout and taking it is a fail worth counting separately — it means the
first thing the app said did not earn thirty seconds.

Watch the last panel: it forks between starting empty and loading the demo
history. If participants stall there, that fork is asking a question they have
no basis to answer.

### M2 — Run the session the app is suggesting

> Do the practice the app is recommending for today, and record how it went.

Start: `https://adamdhickey-collab.github.io/lucy-learns/?study#/today`

**Pass:** reaches the result screen with a session saved.

This is the loop the whole product is built around, so it gets the most
attention. The player runs ready → step → practice → result → done. Two things
to watch: whether anyone quits during the step-by-step instructions before
reaching the rep tally, and whether the arousal question at the result screen
reads as required or optional.

### M3 — Find a specific activity

> Your trainer wants you to work on Lucy going to her bed when the doorbell
> rings. Find that in the app and start it.

Start: `https://adamdhickey-collab.github.io/lucy-learns/?study#/today`

**Pass:** reaches `#/activity/doorbell-means-place` or plays it.

The trap is deliberate. *Doorbell Predicts Rewards*, *Doorbell Means Place* and
*Stay While the Door Opens* are three protocols about a dog, a door and a bed,
and the brief above matches one of them. The Block C image work concluded that
no 56px picture can separate these — this mission asks whether the **names**
can, which is the part that was never tested.

If participants land on the wrong doorbell activity, the fix is the naming, not
the artwork.

### M4 — Record something that happened in real life

> Someone rang the doorbell this morning. Lucy barked and jumped at them, then
> settled down after about a minute. Record that in the app.

Start: `https://adamdhickey-collab.github.io/lucy-learns/?study#/today`

**Pass:** reaches `#/moment` and saves an incident.

The most likely failure in the set. Moment logging is not a tab — it is reached
from a card, and a participant who has spent three missions in the Activities
and Today tabs has no reason to expect a fifth kind of thing. If this one comes
back under 60%, real-life logging is effectively unshipped, and the Progress
tab's incident trends are being fed by a feature nobody finds.

### M5 — Read the data

> Is Lucy getting better at staying calm? What in the app tells you that?

Start: `https://adamdhickey-collab.github.io/lucy-learns/?study#/progress`

**This is a question, not a click path** — set it as an open-text mission and
score the answer, not the route.

**Pass:** names something specific — 83% stayed calm against 57% last week, the
settle time down from 56s to 40s, or the per-activity trend labels. A general
"it looks like she is doing well" is a fail: the screen is dense with numbers
and the test is whether any of them land.

### M6 — Hand something to the trainer

> You have a lesson with your trainer tomorrow and they want to see how the last few weeks have gone. Find the summary you would hand them.

Start: `https://adamdhickey-collab.github.io/lucy-learns/?study#/today`

**Pass:** reaches `#/report`.

The lesson report is the app's argument for existing — the first ten minutes of
every follow-up, prepared. Its one entry point is a quiet button at the bottom
of the Progress tab ("Prepare for your next lesson"), below the recent-activity
list. Progress is the right tab to look in, so the question this mission asks is
narrower: does anyone scroll far enough to meet it.

---

## What would change the product

Written before the data, so the result cannot be reinterpreted into agreement.

| Result | What changes |
| --- | --- |
| M1 skip rate over 30% | The welcome is too long or opens with the wrong panel |
| M2 under 80% | Stop everything else; this is the product |
| M3 wrong-doorbell errors | Rename the activities — artwork cannot fix this |
| M4 under 60% | Moment logging needs a real entry point, not a card |
| M5 vague answers | Progress is showing numbers rather than an answer |
| M6 under 60% | The report needs a visible entry point, not a button below the fold |

Anything that passes comfortably is done. The point of writing the thresholds
down is to be able to stop.

---

## Before you launch

- **Deploy first, then launch.** The service worker's cache name rotates with
  `APP_VERSION`, so a participant who somehow loaded the site earlier gets the
  new build only after a deploy. Launching a study and then pushing a fix mid-
  panel gives you two products in one dataset.
- **Dry-run one mission yourself on a phone** before opening the panel. Maze
  drives the live site, and two things about this app are worth confirming in
  its environment rather than assuming: that the hash route changes register as
  navigation, and that localStorage survives (study mode is entirely built on
  it — if it is blocked, every participant lands in a broken app).
- **Check the URLs resolve with the query before the hash.** Paste each one; do
  not retype.
- Record the version tested in the run log so results stay attached to a build.

---

## Synthetic first-tap run, before any panel

Twelve viewers, three per mission, each shown one mission cold and nothing else.
They were given the screen as a faithful text listing — every line in order,
every tappable marked — and asked **where they would tap first**, plus whether
they were confident or guessing.

**Why first tap and not completion.** An earlier synthetic run drove the whole
app and finished 6/6, which measured nothing: models do not give up, do not
skim, and will scroll to the bottom of the longest page in the app. First
instinct is the part that transfers. It is also what M3, M4 and M6's thresholds
are actually about.

| Mission | First tap correct | Confident |
| --- | --- | --- |
| M3 find the activity | 3/3 (via Activities) | 0/3 on the tab, **3/3 on the activity** |
| M4 record a moment | **3/3** | 3/3 |
| M5 read the data | n/a — answered correctly 3/3 | immediate |
| M6 something for the trainer | **0/3** | 0/3 — every one guessing |

### Two predictions of mine were wrong

**M4 was supposed to be the likeliest failure.** The plan says moment logging
"is not a tab — it is reached from a card" and warns it may be effectively
unshipped. All three went straight to it, confidently, quoting the card's own
subtitle back: *"a real arrival … is exactly what this control is described as
capturing."* The copy is doing the work.

**M3's naming trap did not catch anyone.** Three activities are protocols about
a dog, a door and a bed, and I expected people to land on the wrong doorbell
one. All three picked *Doorbell Means Place*, all confident, and all three named
*Stay While the Door Opens* as the runner-up while correctly explaining the
difference — that one starts with her already on the bed. **The one-line
descriptions separate them even though the names do not.** Do not shorten those
descriptions.

### M6 fails, but the mission may be at fault

Nobody's first tap was Progress. Two went to *Start session*, one to *Record a
moment*, and **all three flagged themselves as guessing** — because "get to
something you could show them" reads two ways: *do* something new worth showing,
or *find* a summary. Two said so explicitly.

So this is not yet evidence that the report is unfindable. It is evidence that
**the mission wording is ambiguous**, which would have burned a real panel. The
Maze block has been reworded to name the artefact without naming the button.
Worth noting that two of three named Progress as their *second* guess.

The quantified version of the original worry stands regardless: *"Prepare for
your next lesson"* is **line 88 of 89** on the Progress screen.

### The finding that is worth the whole run

All three M5 viewers answered "yes, she is getting calmer" **immediately**, off
`83% Stayed calm` against `57% last week`. Then, unprompted, all three produced
the same critique — and it is about the product, not the picture of it:

- **`Jumping — 2 sessions — New this week`** sits directly under a calm rate
  that supposedly rose 26 points.
- **The two weeks are not the same difficulty.** Last week's logged work was
  Level 5; this week is mostly Levels 1–3. Verified in code:
  [js/metrics.js](js/metrics.js) computes `calmRate` as `calm / sessions.length`
  for the week, **with no weighting by level**. So part of 57% → 83% is easier
  drills, and the screen offers no way to see that.
- **The only real-life event went badly** — the guest who arrived unannounced —
  and it is buried sixth in a reverse-chronological list with nothing tying it
  to the headline.
- **83% has not met the app's own "Reliable" bar** of 90%, which is stated on
  the same screen.

One viewer put it in a sentence worth keeping: *"The screen makes the optimistic
read effortless and the skeptical read work."*

That is a real problem for a screen whose job is to prepare an honest handover
to a trainer. It is not a usability defect and a panel would probably never
surface it — participants answer the question asked. It is exactly what careful
readers are good at finding, and it is the strongest argument for running this
kind of pass at all.

**Not acted on yet.** Weighting the comparison, or labelling which levels each
week covered, is a product decision rather than a copy fix.

### What this run cannot tell you

Every caveat in the section below still applies, plus one specific to the
method: these viewers saw the screen as *text*. They cannot tell you what
someone's eye lands on, whether the illustration pulls attention away from the
button, or whether a 60px tap target is comfortable. Twelve viewers agreeing on
a first tap is a signal about **wording and information scent**, and nothing
more.

## What this cannot tell you

Unmoderated testing measures whether someone can find a button under
instruction. It cannot tell you whether a household opens this app on a Tuesday
with nothing prompting them, whether the sessions are the right length for a
real dog, or whether any of it changes Lucy's behaviour at the door. Those are
questions for the household using it and for the trainer — and they are the
questions that actually decide whether the app worked.

---

## The comprehension survey

Separate panel, ~15 participants, roughly 8 minutes for Blocks A–C. Full
question text, images and scoring keys in
[comprehension-survey.md](comprehension-survey.md) — regenerate it with `node
scripts/make-survey.mjs` after any brief changes, since the keys follow the
briefs.

- **Block A** (8 images) — the redraws. Panel-ready: every one passes its claim
  under the blind pilot recorded in [comprehension-pilot.md](comprehension-pilot.md).
- **Block B** (4 pairs) — images that could be confused with each other.
- **Block C** — the four covers at 56px. The pilot took this to its ceiling and
  concluded the residual errors are not visual. Run it only to confirm that on
  humans; do not redraw on its result alone.
- **Block D** (29 images) — everything else. Its own panel.

Scoring is by hand, open text, against the key. Below 80% on a Block A image is
a redraw, and what they said instead is the brief for it.

**The pilot was models, not people.** Its numbers are recorded as a dry run that
found two bad images and two unscoreable scoring keys — which is what a pilot is
for — and must not be reported as user research.
