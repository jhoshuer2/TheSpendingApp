# SPAL — Design Direction (draft v0.1)

Source of truth for visuals: `.claude/skills/spal-design/` (tokens, Satoshi, components). References informed *craft and layout only*, not colors, photography or gradients. Flow and structure come from `VISION.md`.

## Decisions
- Colors, type (Satoshi) and components come from the design system. Nothing outside the tokens.
- No photography, sky/gradient backdrops or saturated multicolor fills. Product UI is flat paper/night surfaces. (The design system's "aura" is off until a gradient direction is decided.)
- Celebration moments may use the SPAL mascot/symbol and illustration in system colors.

## Layout principles
1. **One focal element per screen** (big number, headline or hero card), everything else clearly secondary.
2. **One primary action per screen**, placed in the thumb zone (bottom), full width where it is the main action.
3. **Grouped surfaces:** one raised card holds a list; rows are icon tile, title, quiet subtitle, value at right; hairlines inset past the icon tile.
4. **Big numbers, quiet labels.** Tabular figures; secondary and timestamp text is always the quietest on screen.
5. **Color means something:** status dots, tinted icon tiles, thin progress bars. Large fills only for key moments.
6. **Sentence case**, short plain copy, no jargon (design system voice).

## Patterns to build
| Pattern | Use in SPAL |
|---|---|
| Today card (big focal card + grouped list) | Home: one next step, "up next" |
| Detail screen (back/more in circles, status pill, big title, quiet subtitle, grouped card, vertical timeline, bottom action) | Module detail with steps, current step marked |
| Horizontal stepper + summary tiles | Module / journey progress |
| Filling pill row | Steps completed, weekly consistency |
| Tinted suggestion card (icon, short title, one-line reason, single dark action) | "SPAL suggests... because..." |
| Icon-tile quick grid (2x2) | Quick access / ask for more |
| Recommended cards (duration chip, title, line, Start) | Up next queue |
| Floating glass pill bottom nav; content fades beneath and scrolls clear | Primary navigation |
| Chat: avatar, large readable bubbles, starter prompts, voice + send | Coach (later) |
| Keypad + quick-amount chips + full-width confirm | Fast numeric entry (e.g. team size, sales) |
| One-idea onboarding screens: large headline, short line, page dashes, one button | Onboarding |
| Empty / 404 / offline: symbol, one sentence, one action | System states |

## Responsiveness
- Fluid layouts, no fixed widths. Test at 320, 360, 390, 430 px and tablet.
- Safe areas (notch, home indicator); dynamic viewport units.
- Bottom nav and sticky actions never overlap content: reserve space for nav + safe area.
- Survive large system text and long names (wrap/truncate deliberately).

## Accessibility
- Touch targets at least 44x44px with spacing between.
- Contrast WCAG AA or better; meaning never by color alone.
- Visible focus, keyboard operable, semantic headings and labels.
- Reduced-motion respected; motion is purposeful (design system "settle").
- Forms: correct input types, visible labels, clear errors.

## Quality bar (no "AI slop")
- Every size, space, radius and color from tokens; no near-miss values.
- Small strict type scale, no ad-hoc sizes.
- No decoration without purpose; no lorem ipsum.
- Check each screen at several viewport sizes before review.

## Addendum: onboarding, auth and stat patterns (final reference batch)

### Onboarding screens
- Structure: visual at top, page indicator (small dash/pill row, current one filled) above the headline, centred headline, one short grey line, stacked actions at the bottom.
- Actions: primary pill (full width) with a secondary quieter pill below ("Skip"/"Back"). Skip stays visible and reachable, never hidden or tiny.
- One idea per screen. Copy is short, plain and benefit-led.
- Visual slot: a system-colour illustration, the SPAL symbol or a product preview. No photography or gradient backdrops.

### Question-per-screen flow (profile building)
Taken from the onboarding video: one question per screen, big question headline, selectable option cards or tiles with a clear selected state, a single Continue button, then a short "building your plan" transition screen before the first Today card. This is how SPAL's profile questions run. Add a progress indicator and a Back affordance. Selection never relies on colour alone (check mark plus border).

### Sign up / login
Primary "Continue with email" pill, a quiet divider ("or continue with"), Google and Apple as secondary buttons, "Already have an account? Log in" as a text link. Short reassurance line under the title.

### Stat tiles and charts
- 2x2 tiles: small label with icon above a big tabular number and a small delta ("+12.5%") in the semantic colour with an arrow or sign, not colour alone.
- Bar chart idea worth keeping: filled bar for actual, hatched/lighter bar for remaining capacity or goal. Suits "progress toward your goal".
- Charts follow the dataviz rules: tokens only, labelled, accessible.

### Not adopting
Photographic or gradient backgrounds, saturated per-screen palettes, dark-by-default screens, paywall screens (later stage), and italic-serif accent words in headlines. The design system is Satoshi only. If you want an emphasis style in headlines, Satoshi Italic is available in the system; this is an open question.
