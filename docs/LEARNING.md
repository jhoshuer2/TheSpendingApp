# How SPAL learns from use

SPAL adapts to how each person uses it, with a small amount of data and full control. This page is the plain-language contract; the code is in `src/learning/` and `src/profile/recommend.ts`.

## What is kept
Per person, stored with their own account (and visible only to them):
- **Per step:** when they first opened it, which sub-steps they ticked, when they finished it, and whether they chose "Not now" (hidden for a week) or "Not for me" (hidden for good).
- **Overall:** the calendar days they did something in a step (last 90), when they last opened the app, and whether learning is switched on.

There is **no event log**. Nothing else is recorded: not what they type, not screens they look at, not location. Everything the app says about them is worked out from the fields above, so it can always be shown to them.

## What it changes
| Signal | Effect |
|---|---|
| "Not for me" on a step | That step never comes back (until they restore it). With learning on, its area is also turned down a little. |
| "Not now" | The step is hidden for 7 days, then returns. |
| Steps finished in an area | With learning on, an area they've worked on steps back a little, so they get variety. What they said matters most still wins when it is clearly ahead. |
| Started but unfinished steps | A step already started is favoured, with learning on or off. |
| Finishing short steps but letting long ones stall | With learning on, short steps are favoured, and the screen says so. |
| Days active | The "This week" strip, and a gentle "rhythm" milestone. |
| Opened and finished times | "You usually finish a step within about N days." |
| Top areas they haven't touched, after they've settled in | A "worth a look" note (never a warning). |
| A few days away | A "welcome back" note offering to pick up where they left off. No streaks, no loss, no guilt. |

Every suggestion shows **why** (from what they told us), and, separately, anything that came from **how they use SPAL**.

## Control
Profile > **What SPAL has noticed**:
- **Learn from how I use SPAL** switch. Off means no new activity is recorded, behavioural adjustments stop, and the weekly rhythm is hidden. Steps they hid stay hidden.
- A plain list of what SPAL has noticed.
- **Hidden steps** with "Bring back".
- **Forget what SPAL has noticed** clears active days and opened-times. Finished and hidden steps are kept.

## Principles
1. **Encourage, never pressure.** Praise progress, including small progress. Never show a lost streak, a count of days missed, or "you haven't...".
2. **Explain everything it does.**
3. **Their words beat our guesses.** Stated needs outrank inferred ones; explicit hides are always honoured.
4. **Keep only what we use.**
5. **Let them see it and clear it.**

## Not built yet
- **Reminders when the app is closed** (push notifications). These need a server job and a push service, and a decision on how often is too often.
- **Learning from what people record** (sales trends, best sellers, profit). That arrives with the in-app tools described in `PRD-DO-IT-IN-SPAL.md` and is where the insights become most useful.
