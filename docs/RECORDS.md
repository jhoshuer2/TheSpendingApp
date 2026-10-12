# Records: the in-app notebook

The first "Do it in SPAL" tool (see `PRD-DO-IT-IN-SPAL.md`). Sales, expenses and products, recorded by tapping, with what you actually keep worked out for you. No AI involved. Code is in `src/records/` and `src/screens/money/`.

## What you can do
- **Record a sale** by typing the amount on a big keypad, or by picking products. Say whether the customer **paid** or **owes** you (and who), and **when** it was (today, yesterday, or any earlier day: people often write things down later).
- **Add an expense** with an amount, what it was for (stock, transport, rent, staff, data, packaging, power and water, other), and an optional note.
- **Keep products**: name, price, and optionally what it costs you, so SPAL can show how much you keep on each one.
- **See the picture** on the Money tab: what you kept today / this week / this month, what's still owed to you, what SPAL notices, and a day-by-day list. Tap any entry to see it, mark an owed sale as paid, or delete it (with Undo).
- **Steps tick themselves.** "Write down every sale" and "Work out what you really keep" are now real tools. Their steps tick when you actually record a sale, record sales on three days, or add an expense. You never have to say "done".

## What the numbers mean
| Word on screen | How it's worked out |
|---|---|
| **Sold** | Everything sold in the period, including what customers still owe. |
| **Received** | Sales that have been paid. A credit sale counts on the day it was **paid**, not the day it was sold. |
| **Spent** | Expenses in the period. |
| **Kept** | Received minus spent. This is the headline number. A negative shows as "You spent more than you received", with no red and no alarm. |
| **Owed to you** | All unpaid sales, whenever they were made. |

Weeks start on **Monday**. Periods follow the phone's own clock (Lagos time for people in Lagos). Money is stored as whole **kobo** so sums are exact; the screens show naira.

"What SPAL sees" only speaks with enough data (for example, a best day needs 15+ sales in eight weeks and a clear winner), so it never claims a pattern from a handful of sales.

## How it saves
Same approach as the rest of SPAL: you always see a copy on the phone (instant, works offline), and changes are saved to the account in the background and retried until they get through. Each record gets its own id on the phone, so sending it twice can't create a duplicate. Deleting is a "soft delete", which is why Undo works and why other devices learn about it. Big books load a page at a time, and later loads only fetch what changed.

If the server **refuses a record for good** (for example, a phone whose clock is far in the future), that one record is set aside, kept on the phone, and Profile says so. It never holds up the others, and it gets one more try each visit.

## Setup
Run `supabase/migrations/20261013000000_records.sql` in the Supabase SQL editor (after the earlier migrations). **Run it before deploying the code that uses it**; the live app is unaffected until then. Details in `BACKEND.md`.

## Known limits (deliberate for now)
- **No editing a sale or expense.** Delete it and record it again. Products can be edited; past sales keep the price they were sold at.
- **Books live in the phone's storage** (about 5 MB), roughly 20,000 records. Plenty for a small business for years; a move to a bigger store is planned if anyone gets near it.
- **No limit on how many rows an account can add** yet. Needs rate limiting at the edge before wide release.
- **Dates**: the database refuses records dated more than a day in the future or more than ten years back.
- **One currency (naira), one business per account.**
- **Not yet**: customers list, stock counts, receipts and invoices, export, voice entry, and the assistant that records for you ("sold three plates for 4,500"). Those are next in `PRD-DO-IT-IN-SPAL.md`.
