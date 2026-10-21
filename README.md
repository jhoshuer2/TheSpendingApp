# SPAL

A personal business companion for entrepreneurs in Nigeria. It shows one next step at a time and learns how each person works. See [`docs/VISION.md`](docs/VISION.md) for the product, [`docs/PRD-DO-IT-IN-SPAL.md`](docs/PRD-DO-IT-IN-SPAL.md) for where it is heading (every step doable inside SPAL, with an assistant), [`docs/LEARNING.md`](docs/LEARNING.md) for how it adapts, and [`docs/DESIGN-DIRECTION.md`](docs/DESIGN-DIRECTION.md) for the visual rules. The design system lives in `.claude/skills/spal-design/` and is the source of truth for colour, type (Satoshi) and components.

**Status:** writing tools (price list, WhatsApp greeting and away message, Instagram bio and captions; see [`docs/WRITE.md`](docs/WRITE.md)), business name registration (see [`docs/REGISTRATION.md`](docs/REGISTRATION.md)), stock counts (see [`docs/STOCK.md`](docs/STOCK.md)), customers with payment reminders and receipts you send on WhatsApp (see [`docs/CUSTOMERS.md`](docs/CUSTOMERS.md)), the SPAL Assistant (talk to it in English or Pidgin to record sales and expenses and ask about your numbers; see [`docs/ASSISTANT.md`](docs/ASSISTANT.md)), the records engine (Money tab: sales, expenses, products, what you kept; see [`docs/RECORDS.md`](docs/RECORDS.md)) on top of learning from use, the backend and adaptive onboarding: adaptive onboarding builds a profile (stage band plus a ranked needs map), and Today shows one next step with the reason for it. You can open a step, tick it off and finish it; Library, Journey and Profile are live. Accounts and saved data use Supabase (see [`docs/BACKEND.md`](docs/BACKEND.md)); with no Supabase settings it runs in local demo mode.

## Run

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # typecheck + production build (with service worker)
npm test               # unit tests
npm run preview -- --port 4173
npm run check:layout   # needs the preview server; screenshots land in tools/out/. Slow (96 screens x 7 sizes, several minutes): don't cap it with a short timeout
npm run check:flow     # needs the preview server; drives sign up > onboarding > finish a step > reload
npm run check:learning # needs the preview server; hide/undo, learning switch, welcome back
npm run check:money    # needs the preview server; records through the real screens, checks the arithmetic
npm run check:backend  # fake Supabase + real browser: accounts, sync, offline, password reset, learning data
npm run check:write             # your business facts and the Write-for-me drafts through the real screens
npm run check:customers         # customers, reminders, receipts through the real screens
npm run check:stock             # stock counts and low-stock warnings through the real screens
npm run check:register          # the business-name registration guide through the real screens
npm run check:assistant         # fake Supabase + scripted model: chat, cards, undo, Pidgin, limits
npm run check:assistant-layout  # the assistant screens at 7 phone sizes
node tools/eval-assistant.mjs   # YOUR Anthropic key: how well the real model handles English and Pidgin
npm run test:db        # migration + security rules on a disposable Postgres (PGURL=...)
```

`check:layout` loads each screen at 320, 360, 375, 390, 430, 768 and 1280 px wide and fails on horizontal overflow, touch targets under 44px, a primary action outside the viewport, content hidden behind the nav, or a non-Satoshi heading.

## Structure

| Path | What |
|---|---|
| `src/styles/` | Design tokens copied from the design system (colour, type, spacing, depth, motion), plus base, component and screen CSS. `effects.css` omits the atmosphere/gradient tokens on purpose. |
| `src/design-system/` | Components ported to TypeScript: AmountPad, BottomNav, Button, Field, Icon, Money, OptionCard, PageDots, ProgressBar, Segmented, SpalSymbol, Switch, Toast, WeekStrip. |
| `src/messages/` | Reminder and receipt wording (English and Pidgin), message preferences, clipboard helper. Pure TypeScript, unit tested. |
| `src/assistant/` | The assistant: tools that read your books and build proposals, the conversation engine, saved chat, the store. Pure TypeScript, unit tested. The server half is `supabase/functions/`. |
| `src/records/` | The books: sales, expenses, products. Money, period maths (what you kept), insights from real numbers, offline-first sync. Pure TypeScript, unit tested. |
| `src/learning/` | What SPAL notices and says about how someone is doing: weekly rhythm, areas, milestones, gaps, welcome back. Pure TypeScript, unit tested. |
| `src/profile/` | The product logic, pure TypeScript and unit tested: questions, scoring (band and needs map), the module library, the recommender, and the local store. |
| `src/screens/` | Splash, Welcome, Auth, Onboarding (questions, building, summary), Today, ModuleDetail, Library, Journey, Profile, Shell, Assistant, Business, Register, Write, WriteDraft, and `money/` (Money home, record a sale, add an expense, products, stock count, customers, message drafts, record detail). |
| `src/backend/` | Auth and server storage behind one interface: Supabase, or local demo mode. |
| `supabase/` | The database migration and its security tests. |
| `src/lib/` | Validation, formatting, the auth provider, toasts, back navigation and per-screen page titles. |

## Rules

- Every colour, size, space and radius comes from a token. No one-off values.
- One primary action per screen, in the thumb zone. Touch targets are at least 44x44px (the design system's 36px small button is not used).
- Inputs are 16px so iOS Safari does not zoom on focus.
- No gradients or photography in product UI.

## How personalisation works

1. **Questions** adapt: someone who hasn't started is never asked about team size or sales (`src/profile/questions.ts`).
2. **Scoring** turns answers into a stage band (starting, growing, scaling) and a ranked needs map. Every score keeps its plain-language reasons, which Today shows as "Why this step" (`scoring.ts`).
3. **Recommending** picks the next step and a short queue from the module library, limited to the person's band and business type, skipping finished steps and avoiding repeats of one need (`recommend.ts`).

To add a step, add an entry to `src/profile/modules.ts`; tests check the catalog. Behaviour signals and the coach arrive in later stages.
