# Write for me: your business details and ready-made writing

SPAL writes the things a small business keeps meaning to write: a price list, a WhatsApp greeting and away message, an Instagram bio, post captions, a WhatsApp business description. This is the "Draft" kind from `PRD-DO-IT-IN-SPAL.md`: SPAL writes it, you read it and change the words, and **you** send or post it. SPAL never posts or sends anything.

## Your business (Profile > Your business, or Money > Write for me)

Five optional facts, in your own words: **business name, what you sell, where you are, opening hours, Instagram name.** Everything below is written from these and from your products. They are saved with your profile (so they follow you to another device), and nothing is shared with customers until you send something. The assistant can also fill them in from conversation: tell it "I'm in Yaba, open 10 to 6" and it offers a card to save; tap Save (or Undo afterwards).

## What it writes

| Where | What | How |
|---|---|---|
| Money > Write for me, or Products > Share your price list | **Price list** | Plain template. Your products and prices exactly as in your product list, your place and hours, and "To order, message me here." Open WhatsApp, Copy or Share. |
| Money > Write for me | **WhatsApp greeting** and **away message** | Plain templates from your facts. You paste them into WhatsApp Business (usually Settings > Business tools). |
| Assistant ("Write my Instagram bio", or the rows under Write for me) | **Instagram bio**, **post captions**, **WhatsApp business description** | Written by the assistant from your facts and product prices, shown as a card with Copy (and Share). Ask for changes in the chat ("shorter", "more friendly"). |

English or Pidgin (your choice on each screen, remembered). Price list, greeting and away messages never involve the AI, so their wording and prices cannot be wrong or invented. The two WhatsApp steps in the Library ("Set up WhatsApp Business", "Start a page customers can trust") now offer to write these for you.

## Guardrails on what the assistant writes

- It first reads your facts (`get_business`). If something it needs is missing (what you sell, where you are) it is told to ask **one short question** instead of guessing.
- **No invented prices.** Before a text is shown, the app checks every naira amount in it (₦2,500, N2500, 2,500 naira) against your real product prices. Any other amount makes the draft refuse; the assistant is told why and rewrites it. With no products saved, no prices can appear at all.
- An Instagram bio over 150 characters is refused (Instagram's own limit). Text over 1,500 characters or empty text is refused.
- The assistant's instructions forbid inventing addresses, years in business, awards, reviews or promises. That part is an instruction, not a hard check: only prices are verified by code.
- A fact you tell it is saved **only when you tap Save**, and Undo restores exactly what was there before. (With "Save without asking" on, small clear proposals, facts included, save straight away with Undo.)
- Nothing is posted or sent; the assistant is told that, and never says otherwise.

## Privacy

Your facts and products are sent to the AI only when the assistant needs them to answer (it reads them with a tool, as with your sales). Customers' phone numbers are never sent. The text it writes is shown on your phone and not stored on the server.

## Turn it on

No database change is needed (the facts live in the existing profile answers). **Redeploy the assistant function** for the three new tools and instructions: `npx supabase functions deploy assistant`. Until then everything on the Write screens works; only the assistant's bio and captions and "remember this" are missing.

## Tests

| Command | Proves |
|---|---|
| `npm test` | Wording of every template (exact text, with and without facts, long lists, Pidgin), cleaning of facts, the assistant's fact card (clean, bounded, undoable), the bio length limit, invented prices blocked in every written form, amounts found however written, conversation flow, and saved chats |
| `npm run check:write` | Real screens: facts saved and shown on Profile, bad Instagram name refused, greeting/away/price list exact, Pidgin, edit/Copy/Open WhatsApp, price changes flow through, the Library step offers it, clearing details |
| `npm run check:assistant` | "I'm in Yaba, open 10 to 6" gives a Save card (nothing saved before, Undo restores), a bio from your facts, an invented price refused before you see it, a link prefilling but never sending |
| `npm run check:backend` | Facts sync to the server next to your onboarding answers and appear on another device (this also fixed a stale-form bug) |
| `npm run test:db` | Facts fit in the profile answers and the size limit still holds |
| `node tools/eval-assistant.mjs` | **With your key:** how the real models do on bios, captions and saving facts, English and Pidgin: length, invented prices, using the facts you gave |

**Not tested:** the real model's writing quality (the scripted model proves the app's handling, not its prose) and real WhatsApp / Instagram.

## Known limits
- Facts are free text; hours aren't structured, so the app can't say "open now".
- No saved library of drafts: copy what you want, or ask the assistant again.
- No logo, image or post-photo help; no scheduling or posting to Instagram (that is a "Connect" step needing Meta's approval).
- One-page business plan and offers are still to come.
