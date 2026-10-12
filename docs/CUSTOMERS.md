# Customers, reminders and receipts

Know who you sell to, who still owes you, and send a kind reminder or a receipt in a few taps. This is the "Draft" kind from `PRD-DO-IT-IN-SPAL.md`: SPAL writes the message from your books, you read it, change it if you like, and **you** send it.

## What you can do

- **Customers list** (Money > Your customers): everyone you sell to. People appear as soon as you put their name on a sale (the sale screen now has an optional *Customer* field for paid sales too, with your past customers as one-tap suggestions). Search appears once the list is longer than eight. "Owe you" comes first, biggest debt at the top.
- **A customer page:** what they owe and since when, what they bought in total, their sales, and Call / WhatsApp buttons if you saved a phone number. Add details (phone, a note like "pays on Fridays") with the pencil.
- **Payment reminder:** "Remind Chidi" opens a ready message with the exact amount, what it was for and the date. Pick the sound (Friendly, Short, Firm) and the language the customer will read (English or Pidgin). Edit the words freely. Then **Open WhatsApp** (to their number if you saved one, otherwise WhatsApp asks who to send it to), **Copy**, or **Share**. Several unpaid sales become one message with a short list and the total.
- **Receipt:** from any sale, **Send a receipt**: business name, date, items, total, paid or still to pay, a thank you.
- **Business name:** type it once on a message screen; it signs reminders and heads receipts. It is saved with your profile.
- **Ask the assistant:** "send Chidi a reminder", "send Mrs Bello a receipt", "who are my best customers?" (English or Pidgin). The assistant prepares the same draft in the chat; it never writes the message itself and never sends anything. See `ASSISTANT.md`.

## How it works

- **Sales still store the name as text** (as before). A `customers` table holds only the extra details: name, phone, note. So nothing about your existing books changes, and a customer needs no setup: names on sales are matched without caring about capitals, punctuation or spaces ("chidi  okeke." is "Chidi Okeke"). Saving details for someone just attaches a phone and a note to that name.
- **Renaming** a customer renames them on their past sales too, so the history stays together.
- **Removing** a customer takes them off your list; their sales stay in your books, and a name that is still on sales keeps showing up.
- **Phone numbers:** typed the Nigerian way (`0803 123 4567`, `+234 803 123 4567`, `8031234567`) they become WhatsApp numbers (`234…`). Anything that doesn't look like a real number is refused when saving, and never used to open a chat, so a typo can't send a debt reminder to a stranger.
- **Nothing is ever sent from SPAL.** WhatsApp opens with the text filled in; you tap send.
- **Sync:** customers sync exactly like products (works offline, retried, safe to repeat). Row-level security keeps them private to the owner, with bounds on name, phone (digits and `+ ( ) -`, up to 20) and note.

## Privacy

Your customers' names, amounts and phone numbers are other people's information. They live in your account only. **Phone numbers are never sent to the AI assistant:** its customer list gives names, totals and what each owes, and the message text it prepares is written and shown on your phone; the assistant is told only that a draft is ready and that nothing was sent. Review the wording of the messages and how you tell customers their details are kept with a Nigerian lawyer before launch (NDPA 2023).

## Turn it on

Run `supabase/migrations/20261015000000_customers.sql` in the Supabase SQL editor **before merging** (otherwise the app asks for a table that doesn't exist and shows "We couldn't load your data"). To use the assistant side, redeploy the function afterwards: `npx supabase functions deploy assistant` (it has two new tools and new instructions).

## Tests

| Command | Proves |
|---|---|
| `npm test` | Message wording (amounts, titles, tones, Pidgin, long lists), customer matching by name, owed totals, sorting, link-safe keys, phone numbers (including typos that must be refused), assistant drafts and the customer question |
| `npm run test:db` | Customers are private, bounded, idempotent; the server sets `updated_at`; deleting an account deletes them |
| `npm run check:customers` | The real screens in a browser: list, suggestions, one customer however the name was typed, reminder with and without a phone, tone and language (remembered), editing, Copy, business name, receipt, rename carrying to sales, removal, search |
| `npm run check:backend` | Customers and a rename sync through the Supabase client to a second device |
| `npm run check:assistant` | Asking the assistant for a reminder: the draft appears, nothing in the books changes, the model never sees the message text |
| `npm run check:layout` / `check:assistant-layout` | The new screens at 7 phone sizes |

**Not tested:** real WhatsApp (links are checked, not opened), real phones, and how the real model phrases things around the draft (`node tools/eval-assistant.mjs` now includes drafting cases).

## Known limits
- No "last reminded" memory yet, so SPAL won't tell you that you already nagged someone this week.
- SMS isn't offered (WhatsApp, Copy and Share are).
- No bulk reminders ("remind everyone who owes") on purpose: each message is read and sent by you.
- Customers have no stock of their own credit, discounts or loyalty yet.
