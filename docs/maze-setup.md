# Maze setup sheet

Everything to type into the Maze builder, in the order the builder asks for it.
The reasoning behind each mission — why it exists, what result changes what — is
in [study-plan.md](study-plan.md); this file is just the fields.

**Do not recruit or launch from this file.** Build the draft, run the dry-run
checks at the bottom yourself, and only then buy a panel.

---

## Study settings

| Field | Value |
| --- | --- |
| Type | Usability test → **live website** (not prototype) |
| Device | **Mobile only.** This app is never opened on a desktop. |
| Participants | 15 |
| Screener | None. Needing dog-training experience to find a button *is* the finding. |
| Recording | Screen + click path. Audio not needed — nothing here is think-aloud. |

## Welcome screen

> **Practising with Lucy**
>
> This is a real app that a dog trainer gives to a household to use at home
> between lessons. You will be doing six short tasks in it.
>
> For all of them you are **Fabiola**, and **Lucy** is your dog — the app will
> greet you by that name. There are no wrong answers and nothing you do can
> break anything. If you get stuck, say so and move on; that is the most useful
> thing you can tell us.

*The Fabiola line is not decoration. The handler's name is hardcoded and
onboarding never asks for one, so every participant gets "Hello, Fabiola" and an
"FH" avatar. Without warning, that reads as having logged into a stranger's
account.*

---

## The six missions

Each is a **Mission** block. Paste the URL into the block's URL field and the
prompt into the instruction field. Keep them in this order — state resets on
every load, but the *participant* does not, and these run coldest-first.

### M1 — First run

**URL** `https://adamdhickey-collab.github.io/lucy-learns/?study=welcome`

> Your dog trainer has just sent you this app to use with your dog, Lucy. Get yourself set up and ready to practise.

Pass: reaches Today. Count "Skip" separately — taking it means the first thing
the app said did not earn thirty seconds.

### M2 — Run the session the app is suggesting

**URL** `https://adamdhickey-collab.github.io/lucy-learns/?study#/today`

> Do the practice the app is recommending for today, and record how it went.

Pass: reaches the result screen with a session saved. This is the loop the whole
product is built around.

### M3 — Find a specific activity

**URL** `https://adamdhickey-collab.github.io/lucy-learns/?study#/today`

> Your trainer wants you to work on Lucy going to her bed when the doorbell rings. Find that in the app and start it.

Pass: reaches *Doorbell Means Place*. The trap is deliberate — three activities
are protocols about a dog, a door and a bed. If people land on the wrong
doorbell activity, the fix is the naming, not the artwork.

### M4 — Record something that happened in real life

**URL** `https://adamdhickey-collab.github.io/lucy-learns/?study#/today`

> Someone rang the doorbell this morning. Lucy barked and jumped at them, then settled down after about a minute. Record that in the app.

Pass: saves a moment. The likeliest failure in the set — moment logging is not a
tab, it is a card.

### M5 — Read the data

**URL** `https://adamdhickey-collab.github.io/lucy-learns/?study#/progress`

> Is Lucy getting better at staying calm? What in the app tells you that?

**Set this as an open-text question, not a mission.** Score the answer, not the
route. A pass names something specific — the "stayed calm" percentage against
last week, the settle time coming down, or a per-activity trend. "It looks like
she's doing well" is a fail: the screen is dense with numbers and the test is
whether any of them land.

### M6 — Hand something to the trainer

**URL** `https://adamdhickey-collab.github.io/lucy-learns/?study#/today`

> You see your trainer tomorrow. Get to something you could show them.

Pass: reaches the lesson report. Its only entry point is a button at the very
bottom of Progress, below the whole recent-activity list.

---

## Exit questions

1. *If you had this app and a dog, what would make you open it on a Tuesday
   evening?* (open text)
2. *Was there anything you expected to find and couldn't?* (open text)

Two questions, both open. Resist adding a satisfaction rating — fifteen people
rating an app they used for ten minutes measures politeness.

---

## Before you launch — four checks

1. **Dry-run M2 on your own phone through Maze.** Not on desktop, and not
   outside Maze. This is the check that matters most.
2. **Confirm the URL survives Maze.** The app uses hash routing and the query
   string must stay *before* the hash. If Maze appends its own tracking
   parameter and produces `…#/today?maze=…`, the route breaks and every
   participant lands on a blank or default screen. Check the address bar on the
   first mission and stop if the hash has anything after it.
3. **Confirm localStorage works in Maze's browser.** Study mode is built
   entirely on it. If it is blocked, the app shows a red "Sessions are not
   saving" banner across the top — if you see that banner, do not launch.
4. **Deploy nothing while the panel is live.** The service worker cache is keyed
   to `APP_VERSION`, so pushing mid-panel gives you two products in one dataset.

## Reading the results

Thresholds were written before the data, so a result cannot be reinterpreted
into agreement. Full table in [study-plan.md](study-plan.md); the short version:

| Result | What changes |
| --- | --- |
| M1 skip rate over 30% | The welcome is too long, or opens on the wrong panel |
| M2 under 80% | Stop everything else; this is the product |
| M3 wrong-doorbell errors | Rename the activities |
| M4 under 60% | Moment logging needs a real entry point |
| M5 vague answers | Progress shows numbers rather than an answer |
| M6 under 60% | The report needs an entry point above the fold |

Anything that passes comfortably is done. The point of writing the thresholds
down is to be able to stop.
