# SPAL

A personal business companion for entrepreneurs in Nigeria. It shows one next step at a time and learns how each person works. See [`docs/VISION.md`](docs/VISION.md) for the product and [`docs/DESIGN-DIRECTION.md`](docs/DESIGN-DIRECTION.md) for the visual rules. The design system lives in `.claude/skills/spal-design/` and is the source of truth for colour, type (Satoshi) and components.

**Status:** Stage 1 (foundation): installable mobile-first PWA with splash, welcome, sign up / log in, app shell and floating nav. Auth is a local placeholder (no backend yet) and onboarding is a stub.

## Run

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # typecheck + production build (with service worker)
npm test               # unit tests
npm run preview -- --port 4173
npm run check:layout   # needs the preview server; screenshots land in tools/out/
```

`check:layout` loads each screen at 320, 360, 375, 390, 430, 768 and 1280 px wide and fails on horizontal overflow, touch targets under 44px, a primary action outside the viewport, content hidden behind the nav, or a non-Satoshi heading.

## Structure

| Path | What |
|---|---|
| `src/styles/` | Design tokens copied from the design system (colour, type, spacing, depth, motion), plus base, component and screen CSS. `effects.css` omits the atmosphere/gradient tokens on purpose. |
| `src/design-system/` | Components ported to TypeScript: Button, Field, Icon, SpalSymbol, PageDots, BottomNav. |
| `src/screens/` | Splash, Welcome, Auth, Onboarding (stub), Shell (Today, Library, Journey, Profile). |
| `src/lib/` | Validation and the placeholder session store. |

## Rules

- Every colour, size, space and radius comes from a token. No one-off values.
- One primary action per screen, in the thumb zone. Touch targets are at least 44x44px (the design system's 36px small button is not used).
- Inputs are 16px so iOS Safari does not zoom on focus.
- No gradients or photography in product UI.
