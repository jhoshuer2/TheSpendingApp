# SPAL Assistant (v1)

Talk to SPAL in English or Nigerian Pidgin. Tell it what you sold or spent and it writes it down; ask it how the business is doing and it answers from your own records. English is the default reply language; Pidgin is a setting.

This is step 3 of `PRD-DO-IT-IN-SPAL.md`: the first version of the agent. It records and answers. It does not draft bios, plan, or message customers yet.

## What it does

| You say | It does |
|---|---|
| "I sold 3 plates of jollof for ₦4,500" / "I sell 3 plate jollof for 4,500 naira" | Shows a card: **Save this?** You tap **Save** or **Not right**. |
| "I spent 2k on keke" | An expense card (category Transport). |
| "Chidi collect 2 bags for 25k, e never pay" | A sale marked *owed* by Chidi. |
| "Chidi don pay" | A card that marks what Chidi owes as paid. If two customers match it asks which; it never guesses. |
| "How much did I make this week?" / "Who dey owe me?" / "What sells best?" / "Who are my best customers?" | Looks it up in your books and answers. |
| "I'm in Yaba, open 10 to 6" | Offers to remember it about your business (a card; nothing saved until you tap Save). |
| "Write my Instagram bio" / "write three post captions" | Reads your business facts and product prices, then shows the writing for you to copy. Never an invented price (checked by code), never posted (see `WRITE.md`). |
| "Send Chidi a reminder" / "Send Mrs Bello a receipt" | Prepares a message from your books (see `CUSTOMERS.md`). You read it and send it yourself on WhatsApp. It never sends anything, and the assistant never sees the message text or phone numbers. |
| "I sold something" | Asks how much. It does not invent an amount. |

Every saved card has **Undo** (it soft-deletes, so other devices learn about it). Settings (the sliders icon):
- **Reply language:** English (default) or Pidgin. You can write in either regardless.
- **Save without asking:** off by default. When on, small, clear proposals are saved straight away (with Undo). Anything over ₦500,000 still asks.
- **What it knows:** your first name, kind of business and how many records you have. It only reads your books when you ask something.
- **Clear this chat.**

## How it works

```
Phone (React)                         Supabase Edge Function `assistant`             Anthropic API
chat screen, cards, undo  ─ messages ─▶ sign-in check, request checks,        ─────▶ model + our tools
reads your books locally              ◀─ model reply ─ daily limit, cost log   ◀─────
runs the read tools itself
```

- **Your books never live on the server for the assistant.** When the model asks "how much did they make this week?", the *phone* computes it from the local copy and sends back just that answer. So it works on exactly what you see, including records not yet synced.
- **The model can only propose.** `propose_records` and `propose_mark_paid` build a card. Nothing is saved until you tap Save (or you turned on auto-save). The phone re-validates every proposal (amount bounds, categories, dates not in the future, customer matching) before showing it, so a confused model can't write a bad record.
- **Tool results are data, not instructions.** The system prompt says so, and the only things the model can do are the seven tools.
- **The conversation is append-only.** Earlier turns are sent back exactly as received (including the model's reasoning blocks), as the API requires. Today's date and your reply language are added to each *new* message, never edited into old ones. The static instructions and tool list are cached.
- **Fresh chat** each day, or after 30 messages / about 80,000 characters, so it stays fast and cheap. Your records are untouched.
- **The key lives only on the server** (`ANTHROPIC_API_KEY` as an Edge Function secret). The app never sees it.

Files: `supabase/functions/_shared/assistant-protocol.ts` (instructions, tools, request validation), `supabase/functions/assistant/` (the function: `core.ts` logic, `index.ts` Deno glue), `supabase/migrations/20261014000000_assistant.sql` (limits), `src/assistant/` (tools, engine, state, store), `src/screens/Assistant.tsx`.

## Turn it on

Do these once, **before merging** the code (the app calls the function; without it people see "The assistant isn't available right now", nothing else breaks).

1. **Run the migration.** Supabase > SQL Editor > paste `supabase/migrations/20261014000000_assistant.sql` > Run. (Earlier migrations first, in date order.)
2. **Create an Anthropic API key** at console.anthropic.com > API keys. Set a **monthly spend limit** there too. Keep the key private; never paste it into chat, a commit, or a `VITE_` variable.
3. **Install the Supabase CLI** and link the project: `supabase login`, then `supabase link --project-ref <your project ref>` (the ref is in your project URL).
4. **Set the secrets** (on your machine, not in the repo):
   ```
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   supabase secrets set ASSISTANT_MODEL=claude-opus-5-5 ASSISTANT_DAILY_LIMIT=25
   ```
   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided to Edge Functions automatically.
5. **Deploy:** `supabase functions deploy assistant`. (The function checks the person's own sign-in token itself, so leave JWT verification on.)
6. Open SPAL signed in, tap the sparkle button, and send "I sold 2 bags of rice for 3k".

Settings (all optional, all Edge Function secrets): `ASSISTANT_MODEL` (default `claude-opus-5-5`), `ASSISTANT_EFFORT` (`low`/`medium`/`high`, default `medium`), `ASSISTANT_MAX_TOKENS` (default 4000), `ASSISTANT_DAILY_LIMIT` (messages per person per day, default 25), `ASSISTANT_GLOBAL_DAILY_LIMIT` (all people together, default 2000), `ASSISTANT_ENABLED=false` (kill switch). Days roll over at midnight Lagos time.

## Cost: choose the model

Measured with `tools/eval-assistant.mjs` on 37 realistic messages (short, one message each, medium effort), at list prices from the Claude API model table (check Anthropic's pricing page before relying on them):

| Model | Price per million tokens (in / out) | Score | Cost per message | Worst case: 25 messages a day for 30 days |
|---|---|---|---|---|
| `claude-opus-5-5` (default) | $4 / $20 | 33/37 | about $0.0036 | about $2.70 per person |
| `claude-sonnet-5-5` | $2 / $10 | 34/37 | about $0.0012 | about $0.90 per person |
| `claude-haiku-5-5` | $0.10 / $0.50 | 33/37 | about $0.0001 | about $0.08 per person |

No model got an amount wrong. The misses were an explanation line left out, a sale with no item named, and one genuinely ambiguous message, which the instructions and test now handle (see `Known limits`). English was 19/19 for all three; Pidgin 14 to 15 of 18.

**After the instruction fixes** (49 cases, Sonnet 5.5): 45/49, English 24/26, Pidgin 21/23, about $0.0015 per message. None of the misses was about money. All four were "send a reminder or receipt" cases, judged before the assistant's line after the draft; the eval now carries on after a draft the way the app does (see `tools/eval-assistant.mjs`), so re-run it to get the corrected score.

These are short chats. Real conversations carry history and tool results, so expect somewhat more per message, but nothing close to the 10x I first estimated. The two daily limits (per person and global) are your safety net: with the defaults the whole product can't spend more than about `2000 × cost per message` a day.

**Recommendation:** Sonnet 5.5 (best score, still cheap). Haiku 5.5 is a fair choice if cost matters most: it scored the same as Opus at roughly 1/36 of the price. Switch with `npx supabase secrets set ASSISTANT_MODEL=claude-sonnet-5-5` (no redeploy needed). 37 short messages cannot prove how a model copes with long or messy real chats, and you tap Save on every card, so a wrong guess is caught either way. Re-run the eval after any change to the instructions.

## Test Pidgin and English before you trust it

```
ANTHROPIC_API_KEY=sk-ant-... node tools/eval-assistant.mjs
```
Runs 56 realistic messages (30 English, 26 Pidgin) against Opus, Sonnet and Haiku with the real instructions and tools, and prints accuracy for each language, what it got wrong, and cost per message. It costs a few cents per model. Add cases to `tools/eval-assistant-lib.mjs` as you find real phrases, especially from your own customers. `node tools/eval-assistant.mjs --self-test` checks the scoring without a key.

The model-facing instructions explain Pidgin money and phrasing ("don pay", "dey owe me", "5k", "two thousand five hundred") and include examples, but **understanding Pidgin well is unproven until that eval is run**. Yoruba, Igbo and Hausa aren't in v1.

## Safety and privacy

- **Asks first** by default, shows amounts back, never guesses a missing number, and refuses to store IDs (NIN, BVN) or PINs.
- **Not legal, tax or financial advice.** It organises and explains and says to check with CAC or an accountant. **This wording needs review by a Nigerian lawyer before launch**, as does data-protection compliance (NDPA 2023).
- **What leaves the phone:** your messages, your first name, kind of business, today's date, and the figures needed to answer a question you asked (for example this week's totals). Email and password are never sent. The first time, the app says this on a screen and asks for agreement; nothing is sent before that.
- **What the server keeps:** a count of messages per person per day and token totals (for limits and cost). It does not store conversations. It logs only error status codes, never message text.
- **Where the chat lives:** on that phone only (local storage), cleared on sign out. Clear it any time from settings.
- **Abuse:** per-person and global daily limits; requests must carry a valid sign-in; the function re-checks the shape, size and roles of everything the phone sends (it can't be used to send arbitrary prompts or tools); the model gets no way to read other people's data.

## Tests

| Command | Proves |
|---|---|
| `npm test` | Request validation and limits order, config, tool proposals (amounts, dates, customers), the conversation loop (card answers, failures, resets), stored-chat cleaning, error mapping |
| `npm run test:db` | The usage/limit functions: atomic, daily rollover, only the server role can call them, people can't read usage |
| `npm run check:assistant` | The real app in a browser against a fake Supabase **with a scripted stand-in for the model**: consent, cards, undo, "not right", ignored cards, Pidgin, reload, offline retry, limits, switched-off, refusal, sign-out |
| `npm run check:assistant-layout` | The assistant screens at 7 phone sizes: no overflow, 44px targets |
| `node tools/eval-assistant.mjs` | **What the real model does** with English and Pidgin (needs your key) |

**Not tested:** the deployed function against real Anthropic and a real Supabase project, real phones, and real Pidgin. The scripted model proves the app handles replies correctly; it says nothing about what the real model will say.

## Known limits
- Text only. Voice, drafting (bios, messages), reminders and customer lists come later (PRD steps 4 to 7).
- It needs a connection (the books don't).
- No cross-device chat history (the chat lives on one phone; the records sync as always).
- No streaming: you see the reply when it's complete (a few seconds).
- The model's per-message price depends on your choice above.
- "2 bag beans 60k" is genuinely ambiguous (60k for both bags, or each?). The assistant may ask instead of recording; the eval counts either a correct total or a clear question as a pass.
