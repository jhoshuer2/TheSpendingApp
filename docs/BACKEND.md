# SPAL backend (Supabase)

SPAL uses [Supabase](https://supabase.com) for accounts and saved data: email + password sign-in, a `profiles` table (the answers from onboarding) and a `step_progress` table (which steps you've ticked or finished). Each person can only read and change their own rows (row-level security).

Without Supabase settings the app runs in **demo mode**: nothing is verified or sent anywhere, and data stays in that browser. The sign-in screens say so. Set the two environment variables below to switch to real accounts.

## Set it up (about 10 minutes)

**1. Create a project.** supabase.com > New project. Choose the region closest to your users and a strong database password (store it somewhere safe; the app never needs it).

**2. Create the tables.** Dashboard > SQL Editor > New query. Paste `supabase/migrations/20261011000000_init.sql` and run it, then do the same for each later file in that folder, **in date order** (`20261012000000_learning.sql` adds the learning columns; `20261013000000_records.sql` adds products, sales and expenses; `20261014000000_assistant.sql` adds the assistant's daily limits; `20261015000000_customers.sql` adds customers). Then open Table Editor and check both `profiles` and `step_progress` show **RLS enabled**.

**3. Configure sign-in.** Dashboard > Authentication:
- **Sign In / Providers > Email:** enabled. Set **minimum password length to 8** (the app asks for 8).
- **Confirm email:** leave it **off** while testing. Supabase's built-in email sender is heavily rate-limited, so confirmation and reset emails will fail after a few. Turn it on once you've set up your own email sender (Authentication > SMTP Settings, e.g. Resend). The app already handles both settings.
- **URL Configuration:**
  - **Site URL:** `https://thespendingapp.vercel.app`
  - **Redirect URLs:** add `https://thespendingapp.vercel.app/reset-password`, `http://localhost:5173/reset-password`, and your Vercel preview pattern, e.g. `https://*-<your-team>.vercel.app/reset-password`. Password-reset links only work for addresses on this list.

**4. Give the app the keys.** Dashboard > Project Settings > API. Copy the **Project URL** and the **anon / public key**.
- **Vercel:** Project > Settings > Environment Variables. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for **Production and Preview**, then redeploy (these are baked in at build time).
- **Locally:** copy `.env.example` to `.env.local` and fill both in, then `npm run dev`.

**5. Try it.** Sign up on the live site. In Supabase, Table Editor > `profiles` should show your row, and `step_progress` fills in as you tick steps. Log in on a second device or browser and your business should be there.

> The **anon key is meant to be public**; it ships in the browser. The security comes from row-level security in the database. **Never put the `service_role` key in this app or in Vercel's `VITE_` variables.**

## Updating the database later
New migrations are always safe to run **before** deploying the code that uses them (they only add columns with defaults, so the live app keeps working). **Run the migration first, then merge.** Doing it the other way round means the new app asks for columns that don't exist yet and people see "We couldn't load your data". Run each file once.

## How saving works
- The screen always reads a local copy, so it's instant and works offline.
- Changes are sent to Supabase a moment later, and retried (when you're back online, or every 20 seconds) until they get through. Profile > "All changes saved" shows the state.
- Unsent changes are kept if you close the tab, and merged with the server copy next time.
- On a new device with no local copy, if the server can't be reached the app shows a "Try again" screen rather than starting you from scratch, so it can't overwrite real data.
- Signing out sends anything pending and then clears the local copy.

## Known limits (deliberate for now)
- **Two devices changing the same step at once:** the last one to save wins for that step. Offline changes made on one device are merged (ticked steps combined, a finished step stays finished), but there is no live sync between devices; the app refreshes when you return to it.
- **No account deletion screen yet.** Deleting a user in the Supabase dashboard removes their profile and progress automatically.
- **Reset links** use Supabase's default flow, which works across browsers and in-app email viewers. Links work once and expire.
- **Google or phone sign-in** isn't built. Phone codes need an SMS provider and cost per message.

## Testing
| Command | What it proves | Needs |
|---|---|---|
| `npm test` | Sync merging, data cleaning, error messages | nothing |
| `npm run test:db` | The migration and the security rules (one user can't touch another's data), on a **disposable** Postgres | `PGURL` |
| `npm run check:backend` | The real Supabase client in a real browser: sign-up, second device, offline saving and retry, errors, password reset, email confirmation | a built browser; uses a **fake Supabase** (`tools/fake-supabase.mjs`) |

The fake server imitates Supabase's API, so it proves the app behaves correctly against that API, **not** that your Supabase project is set up correctly. Step 5 above is the real end-to-end check.

The assistant needs one extra step (an Edge Function and an Anthropic key); see `docs/ASSISTANT.md`.

Also: `npm run check:money` covers the records engine in demo mode (see `docs/RECORDS.md`), and `npm run check:learning` covers the hide / undo / learning-switch behaviour in demo mode; see `docs/LEARNING.md`.
