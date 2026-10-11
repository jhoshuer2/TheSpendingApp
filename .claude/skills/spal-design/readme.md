# Spal Design System

A design system for **SPAL** — *Spending • Profiting • Analysing • Looping* — a mobile-first, voice-first business companion for informal and small entrepreneurs across Africa (food sellers, market traders, salon/kiosk/bar owners, fashion vendors). It replaces spreadsheets and mental math with a friendly, conversational assistant: record a sale or expense in seconds, see your real (cash-basis) profit, chat with an AI coach, and grow.

This system was built by exploring SPAL's production codebase and its own design roadmap. **v2** (current) re-art-directs the visual language after studying Mercury, Linear, Ramp and Monzo: custom ink neutrals instead of Tailwind defaults, one accent instead of five, lines instead of shadows, medium-weight type instead of black, and a recognizable signature. Product structure and flows are unchanged. Where the shipped app and its own design roadmap disagreed on a value, the shipped code won (ground truth); the roadmap's *philosophy* shaped how existing tokens were organized and used.

## Sources
- **GitHub:** [github.com/MrItrends/spal](https://github.com/MrItrends/spal) (branch `master`) — a Next.js 16 / Tailwind v4 / Framer Motion PWA. Explore it directly for the full product: API routes, Supabase schema, the AI advisor system, gamification, voice recording, etc. — everything not reflected here (this system focuses on visual language + a representative UI kit, not full functional parity).
- Two documents inside that repo shaped this system directly: `DESIGN.md` (the product's own aspirational "Design Operating System" — v2 vision for a more premium, distinctive SPAL) and `SPAL_DESIGN_SYSTEM.md` (a build reference reflecting what's actually implemented today). Both are worth reading in full if you continue this work.
- If you have write access to the repo, treat this design system as a companion reference — pull real component code from `components/ui/`, `components/shared/`, `components/records/` etc. for anything beyond the primitives rebuilt here.

## Fonts
**Satoshi** is the only typeface, self-hosted from `assets/fonts/` (static 300–900 + italics, plus `Satoshi Variable`). v1 paired it with Inter Tight; v2 drops the second family — one family with disciplined weights reads more crafted than two.

## Iconography — flagged substitution
Production SPAL uses **`hugeicons-react`** (not browser-distributable). v2 ships an `Icon` component with a curated set of **Lucide** geometry (ISC licence) redrawn at a 1.6 stroke with round caps — Lucide is already a dependency in the repo and matches hugeicons' stroke style closely. Rules: every functional glyph is an `Icon`; never emoji or unicode arrows (v1's 🔔 / ↑ / ☰ are gone). Money in = `arrow-down-left`, money out = `arrow-up-right`. Leading row icons sit in a 40px sunken tile. Brand marks (`SpalSymbol`) are separate from icons and never used as buttons.

## Content fundamentals
- **Voice:** a friendly, encouraging business coach — never a spreadsheet. Plain WhatsApp-level language, the "3-second rule" (a user should understand any line in 3 seconds).
- **You, not I:** copy speaks directly to the owner — "Your Sales Today", "Track your sales, understand your profit, and grow."
- **Celebrate, never shame:** *"You spent more money than you made today"* — not *"Your expenditure exceeded your revenue."*
- **Banned words:** expenditure, revenue, liabilities, assets, ledger, reconcile — any accounting jargon.
- **Buttons are short action phrases:** "Record Sale", "Mark paid", "Head Back Home" — verb-first, no punctuation.
- **Empty states are encouraging, not apologetic:** *"No activity yet today"* + a direct next step, never a guilt trip.
- **Emoji:** used sparingly and only in celebratory microcopy ("Welcome to {Business}! 🎉", "Nice one! 🎉") — never as functional icons or in persistent UI chrome.
- **Numbers carry weight:** currency defaults to ₦ (NGN) via `formatCurrency()`; big figures always get the bold/tabular treatment — they're the emotional core of every screen.
- **Casing (v2):** sentence case everywhere — titles, buttons, labels ("Save sale", "Recent activity", "How much?"). No uppercase overlines, no Title Case.

## Visual foundations
What changed from v1, and why it read as "AI": Tailwind default hues (#22C55E, #2563EB, #8B5CF6) at full saturation, three vivid filled stat cards competing on one screen, weight-800 headlines, uppercase labels, stacked shadowed cards for every list row, and emoji/unicode as icons. v2 removes each of these.

- **Color — Ink & Paper, one living green.** Custom green-tinted neutrals (`--ink-*`) do almost all the work. The canvas is `--paper` (#F6F6F1, warm and faintly green — successor to the sage canvas). **Spal Green 600** (#107843) is the single accent: primary actions, active states, money in. Direction colors — clay (out), ochre (owed) — tint *text and small glyphs only*, never fills. Iris is reserved for SPAL AI. Money figures are ink.
- **Night theme.** `data-theme="night"` on any container inverts the semantic tokens (#0C110F canvas, #151B18 cards). Used for onboarding, the profit hero and celebrations, and as a full app theme.
- **Typography — quiet type, loud numbers.** Satoshi 500 is the loudest weight in normal UI; 400 for body; 700 only for inline emphasis. Body is 15px minimum on mobile. Tight negative tracking scales with size (−0.035em at 48px). Tabular figures everywhere.
- **Quiet currency (signature).** In every amount the ₦ is set at ~0.5em, raised, in a tertiary tone; the figure is loud. See `Money` and `guidelines/type-numbers.html`.
- **Spacing — the ledger rhythm.** 4-pt grid. Tight inside components (4/8/12), 36px between sections, 20px gutters. Lists are 60px ledger rows on one raised surface with hairlines inset past the 40px icon tile — not a stack of shadowed cards.
- **Radius.** Five concentric steps: 6 (badges) / 10 (inputs, tiles) / 14 (cards) / 20 (hero) / 28 (sheets), plus full for buttons and segmented controls.
- **Depth — lines over shadows.** Level 0 hairline, 1 ring (`--shadow-1`, a 1px ring + 1px contact), 2 float (menus, toasts, FAB), 3 lift (sheets). Light surfaces carry a 1px white top highlight. No colored glows anywhere.
- **Tactile controls.** Primary buttons: lit top edge + weighted bottom edge + contact ring (`--shadow-tactile`). Secondary: white with hairline ring. Selected chips are ink, not color.
- **Backgrounds — the aura (signature motif).** Large, soft color fields in *analogous* hues that settle low in the frame like light on a horizon, inspired by ElevenLabs' atmospheric gradients. Night: forest, teal, mint and a touch of ember on #0B100E. Dawn: mint, lime, sand and sky on paper. Mist: white into mint. Three things keep it from looking cheap: (1) blobs are blurred shapes whose blur scales with the container, not hard-edged radial ellipses; (2) static tokens use *eased* gradient stops (11-stop ease-out falloff) so there's no visible ring or banding; (3) fine grain is layered on top (screen on night, multiply on light). Live version: `<Aura variant="night|dawn|mist">`, drifting 22–32s per blob, off under reduced motion. Static: `var(--texture-grain), var(--atmos-night)`. One aura per screen, never behind dense lists. `--horizon-line` (a 1px fading green line) for dividers inside aura surfaces and the undo-toast timer. No other gradients. No photography in product UI.
- **Motion — settle.** `cubic-bezier(0.2,0,0,1)` for nearly everything; durations 120 (press) / 200 (state) / 320 (enter, sheets) / 560 (numbers, screens). Entrances fade + rise 6px with a 30ms stagger. Hero figures count up and settle. Segmented thumbs glide. The quick-menu plus rotates 45°. No spring, no bounce, no overshoot.
- **Press & hover.** Press scales to 0.98 in 120ms; rows dim to 60% opacity. Hover (desktop) is a 4% brightness lift or a sunken background — color never changes hue.
- **Transparency & blur.** Only the glass tab bar (`--surface-glass` + 20px blur). Backdrops behind sheets are 36% ink.
- **Empty & loading states.** A hairline `SpalSymbol` on the horizon atmosphere, one sentence, one action. Loading is a skeleton in the exact content shape with a slow 1.8s sheen; never spinners.
- **Logo.** The supplied wordmark is multicolor (green/blue/orange/purple) and conflicts with v2's single-accent system. In product it is used **monochrome** (ink on paper, white on night) via CSS filter; the original is marketing-only. The logo itself was not redrawn.

## The signature — five things that make it recognizably SPAL
1. **Spacing:** the ledger rhythm — 60px rows, inset hairlines, 36px between sections.
2. **Color:** ink & paper with one living green; color only ever means direction.
3. **Motion:** settle — fast out, long gentle stop, 0.98 press, numbers that count up and land.
4. **Typography:** Satoshi 500, tabular, quiet raised currency.
5. **Motif:** the aura (soft, low, analogous color fields with grain) and hairline symbols with a single accent point.

## Components
- **Core** (`components/core/`) — Button, Card, Badge, Input, PillChip, Money, Icon
- **Feedback** (`components/feedback/`) — InsightCard, UndoToast, Skeleton, SkeletonRow
- **Navigation** (`components/navigation/`) — BottomNav, TopNavPills, QuickMenuFab
- **Brand** (`components/brand/`) — Aura, SparkAvatar, SpalSymbol
- **Gamification** (`components/gamification/`) — WeeklyChallengeCard

**Intentional additions:** `Aura` (the signature atmosphere as a live component), `Money` (formalizes the money treatment; source formats inline), `Icon` (Lucide wrapper standing in for hugeicons), `Skeleton`/`SkeletonRow` (DESIGN.md mandates skeletons), `TopNavPills` (factored from a pattern repeated on 3 screens), `SpalSymbol` (DESIGN.md's symbol system, not yet in code).

**Not yet built** from source: `AddRecordSheet`, `ExportSheet`, `SwipeableRow`, `CameraCapture`, `VoiceRecorder`, `PaywallGate`, `AchievementsSection`, `BadgeCelebration`, `DateTimePicker`, `HomeCoachmarks`, `PWAInstallPrompt`, `RegisterSW`. The Add sale/expense sheet exists as a composition in the UI kit.

Legacy v1 token names (`--spal-green`, `--neutral-*`, `--shadow-card`, …) still resolve, mapped onto v2 values. Prefer the v2 names.

## UI kit
`ui_kits/mobile-app/` — click-through of the SPAL PWA: splash → welcome → Home (profit hero on the night horizon, sales/expenses split, owed row, ledger) ⇄ Records (filters, day groups with net totals, owed summary, empty state) → Add sale/expense sheet (hero amount field, category chips, paid/owes segmented control, saved state). Quick menu and Ask SPAL orb throughout; Paper/Night toggle top-right. Built from the real screen source (`app/(main)/home`, `app/(main)/records`, `app/(onboarding)/welcome`, `components/records/AddRecordSheet.tsx`).

## Index
```
styles.css            root stylesheet — @imports every token file
tokens/
  fonts.css            Satoshi @font-face (self-hosted)
  colors.css           ink, paper, green, direction colors, semantics, night theme, legacy aliases
  typography.css       type scale, quiet-currency params
  spacing.css          4-pt scale, ledger row, controls, radius
  effects.css          depth, tactile, motion, atmosphere (horizon)
guidelines/            foundation cards — Colors, Type, Spacing, Depth, Motion, Brand
assets/                logo, AI orb, illustrations, backgrounds, icons, fonts
components/            core · feedback · navigation · brand · gamification
ui_kits/mobile-app/    interactive click-through
templates/design-system-overview/   overview deck (still describes v1 — see caveats)
exports/               standalone v1 snapshots (pre-v2 reference)
thumbnail.html · SKILL.md · github.md
```

## Caveats & next steps
- **Icons** are a Lucide substitution for hugeicons. Send hugeicons assets for exact parity.
- **The multicolor wordmark** is the largest remaining conflict with v2. It's used monochrome in product; a refined brand mark would be a separate brand exercise.
- **The overview deck template** still shows v1 and needs rebuilding on v2.
- **Component coverage is partial** (see "Not yet built") and only Home, Records, Welcome and the Add sheet are recreated.
