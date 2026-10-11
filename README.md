# SPAL

A personal business companion for entrepreneurs in Nigeria. It shows one next step at a time and learns how each person works. See [`docs/VISION.md`](docs/VISION.md) for the product and [`docs/DESIGN-DIRECTION.md`](docs/DESIGN-DIRECTION.md) for the visual rules. The design system lives in `.claude/skills/spal-design/` and is the source of truth for colour, type (Satoshi) and components.

**Status:** Stage 3 (backend) on top of Stage 2: adaptive onboarding builds a profile (stage band plus a ranked needs map), and Today shows one next step with the reason for it. You can open a step, tick it off and finish it; Library, Journey and Profile are live. Accounts and saved data use Supabase (see [`docs/BACKEND.md`](docs/BACKEND.md)); with no Supabase settings it runs in local demo mode.

## Run

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # typecheck + production build (with service worker)
npm test               # unit tests
npm run preview -- --port 4173
npm run check:layout   # needs the preview server; screenshots land in tools/out/
npm run check:flow     # needs the preview server; drives sign up > onboarding > finish a step > reload
npm run check:backend  # fake Supabase + real browser: accounts, sync, offline, password reset
npm run test:db        # migration + security rules on a disposable Postgres (PGURL=...)
```

`check:layout` loads each screen at 320, 360, 375, 390, 430, 768 and 1280 px wide and fails on horizontal overflow, touch targets under 44px, a primary action outside the viewport, content hidden behind the nav, or a non-Satoshi heading.

## Structure

| Path | What |
|---|---|
| `src/styles/` | Design tokens copied from the design system (colour, type, spacing, depth, motion), plus base, component and screen CSS. `effects.css` omits the atmosphere/gradient tokens on purpose. |
| `src/design-system/` | Components ported to TypeScript: Button, Field, Icon, SpalSymbol, PageDots, BottomNav. |
| `src/profile/` | The product logic, pure TypeScript and unit tested: questions, scoring (band and needs map), the module library, the recommender, and the local store. |
| `src/screens/` | Splash, Welcome, Auth, Onboarding (questions, building, summary), Today, ModuleDetail, Library, Journey, Profile, Shell. |
| `src/backend/` | Auth and server storage behind one interface: Supabase, or local demo mode. |
| `supabase/` | The database migration and its security tests. |
| `src/lib/` | Validation, formatting and the auth provider. |

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
