# Acceptance criteria

What this app has to do before it is worth handing to a household. Written to
be tested against, not admired: every line below is either observably true or
observably false on a real phone, and a tester who has never seen the code
should be able to reach the same verdict I would.

## How to use this

Each criterion has an id, a statement, and the observation that settles it.
There is no partial credit. If a criterion cannot be settled without reading
the source, it is written wrong and should be rewritten.

Test on a **375 x 812 phone viewport** unless a criterion says otherwise. That
is the tightest common screen and the one everything here was measured on.

Two starting states matter, and several criteria only exist in one of them:

- **Empty** — clear storage, complete the welcome, choose *Start empty*.
- **Seeded** — clear storage, complete the welcome, choose *Fill in example
  data first*. Twelve days across three activities.

Marks: **[v]** verified in a browser during development. **[ ]** never yet
tested — these are the ones a UAT pass is actually for.

---

## 1. First run

**AC-1.1** [v] A new household reaches the first screen that offers a session
without being asked to create an account, name anything, or configure anything.
*Observe:* from a cleared install, the only inputs before Today are three
Next taps and one choice between empty and example data.

**AC-1.2** [v] The welcome explains what the app is, how a session runs, and
the shape of the whole program, in that order, in under a minute of reading.
*Observe:* three panels, each readable without scrolling at 375x812.

**AC-1.3** [v] Nothing is written to storage until the household chooses empty
or example data.
*Observe:* storage key `lucy-learns/v1` is absent until the choice is made.

**AC-1.4** [v] A household that picks *Start empty* is never shown a number
that implies they have done something they have not.
*Observe:* no zero-scores, no empty progress bars presented as a score, no
"0%" anywhere on Today, Progress, or the program map.

**AC-1.5** [v] On the first Today screen, the primary action is fully visible
without scrolling.
*Observe:* the Start session button clears the tab bar completely.

**AC-1.6** [ ] A household that picks example data can tell it is example data,
and can remove it in one action.
*Observe:* the Lucy tab offers removal; after removal no seeded session
survives anywhere, including the trainer's report.

## 2. Running a session

**AC-2.1** [v] A handler can complete a full session one-handed, with a leash
in the other, without pinching, zooming, or typing.
*Observe:* every control used during a session is at least 48px and reachable
in the lower two-thirds of the screen.

**AC-2.2** [ ] A first session takes about five minutes, as the app claims.
*Observe:* time a real run of Doorbell Predicts Rewards level 1 end to end.
Pass if between three and eight minutes.

**AC-2.3** [v] At every step the handler is told exactly one thing to do, and
the exact words to say when there are words.
*Observe:* one instruction heading per step screen; cues appear only on the
step they belong to, never as a list up front.

**AC-2.4** [v] During the repetition count, the handler can see what a
repetition consists of without leaving the screen.
*Observe:* the rep list is visible on the counting screen without scrolling.

**AC-2.5** [v] "Lucy is too excited" is reachable at any point in a session
without scrolling, and produces an easier next step rather than a dead end.
*Observe:* on every step and on the counting screen.

**AC-2.6** [ ] The screen does not sleep during a session on a device that
supports Wake Lock, and the session survives the screen being locked manually
and reopened.
*Observe:* run a session, lock and unlock, confirm no progress is lost.

**AC-2.7** [v] A session can be abandoned midway without logging anything.
*Observe:* close the player before the arousal question; no session appears in
Progress or the report.

## 3. Progress and advancement

**AC-3.1** [v] After one session that meets the bar — at least 80% of reps
successful, calm, no nipping — the next level is queued automatically, and the
handler is told it happened and offered a way back.
*Observe:* the done screen names the new level and offers to stay.

**AC-3.2** [v] A session that does not meet the bar does not advance the level,
and says what would.
*Observe:* the done screen keeps the level and states the gap.

**AC-3.3** [v] A handler can override the app's choice of level at any time,
and the override survives a reload.
*Observe:* pick a different level on the activity screen, reload, confirm.

**AC-3.4** [v] Exactly one activity is ever marked as the next thing to do.
*Observe:* on Today, the program map, and the welcome route, exactly one mark
carries the live ring.

**AC-3.5** [v] Today's card and the program strip above it never name different
activities.
*Observe:* in both empty and seeded states.

**AC-3.6** [ ] Finishing the last level of an activity visibly finishes it, and
moves the household to the next activity.
*Observe:* the strip shows a check on that activity; Today moves on.

**AC-3.7** [v] Mastery never claims reliability from a single day.
*Observe:* three good sessions on one day do not produce "Reliable".

## 4. What the trainer reads

**AC-4.1** [v] Every number the trainer sees is derived from a session the
household actually logged. Nothing is estimated, rounded up, or seeded.
*Observe:* reconcile the report against the session list by hand.

**AC-4.2** [ ] The report says what changed since the last one, not just
totals.
*Observe:* readable in under two minutes and answers "what should I change".

**AC-4.3** [ ] The CSV export opens in Excel and Google Sheets with correct
characters and one row per session.
*Observe:* download, open in both, check a session with a note containing an
apostrophe and an accented character.

**AC-4.4** [ ] Example data is never presented to the trainer as real practice.
*Observe:* in the seeded state, the report either excludes it or labels it.

## 5. Trust

**AC-5.1** [ ] The app never shows progress the household did not earn.
*Observe:* no pre-filled streaks, no credited levels on install, no "welcome
bonus" of any kind.

**AC-5.2** [v] The app never claims a training outcome the trainer has not
sanctioned, and points back to the trainer when a session goes badly.
*Observe:* the fallback path names the trainer and offers contact.

**AC-5.3** [ ] Nothing leaves the device.
*Observe:* run a full session with the network tab open; no requests to any
origin other than the app's own.

**AC-5.4** [ ] Losing storage loses data but never corrupts the app.
*Observe:* clear storage mid-session; the app returns to a usable first-run
state rather than an error.

## 6. Device and access

**AC-6.1** [ ] A whole session completes with the network off.
*Observe:* install to the home screen, enable airplane mode, run a session
including images.

**AC-6.2** [ ] Installed to an iPhone home screen, the app opens to its own
splash and not a browser chrome.
*Observe:* on a real iPhone, not a simulator.

**AC-6.3** [v] All text meets WCAG AA contrast, and every mark that carries
meaning meets 3:1.
*Observe:* sweep each screen. Currently verified on Today, Activities,
Progress, Lucy, and the program map.

**AC-6.4** [v] Every tap target is at least 48px.
*Observe:* sweep each screen.

**AC-6.5** [ ] The whole app is operable by keyboard and announces each screen
change to a screen reader.
*Observe:* tab through every screen; run VoiceOver through a full session.

**AC-6.6** [ ] With reduced motion enabled, no entrance animation, view
transition, or tween runs, and every control still shows its pressed state.
*Observe:* enable the OS setting and repeat a session.

**AC-6.7** [v] No console errors during a complete session.
*Observe:* run the full flow with the console open.

---

## Run log

**2026-08-09, browser at 375x812.** Worked every untested criterion a browser
can settle. Ten moved to verified; one failed and was fixed in the same pass.

- **AC-2.1 failed.** The player's close button was 44x44 — Apple's minimum
  rather than this app's 48 — and it is the one control a handler reaches for
  with a dog on the other arm. Now `var(--tap)`, re-tested, passing.
- **AC-4.1** was recorded FAIL by a first run of the harness and the harness
  was wrong: the CSV opens with a seven-line summary block, so "rows minus one"
  is not the session count. Read properly, three sessions produce three data
  rows and the summary reconciles exactly (15 of 15 repetitions). Passing.
- **AC-4.3** is partial: the CSV carries a BOM and a title row, but nobody has
  opened it in Excel.

## Known gaps

Recorded rather than hidden, because a criterion that quietly does not apply is
worse than one that fails honestly.

- **AC-6.2** has never been checked on real hardware. Everything to date is a
  desktop browser at a phone viewport, which cannot settle iOS home-screen
  behaviour, Wake Lock, or true offline install.
- **AC-2.2** has never been timed with an actual dog.
- **AC-4.3** has never been opened in Excel.
- The four remaining activities beyond Doorbell Predicts Rewards have had their
  content verified structurally — every level has steps, every image resolves —
  but no one has run a session in them start to finish.
