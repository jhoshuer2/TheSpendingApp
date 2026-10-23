---
name: calm-ui
description: Keeps SPAL screens clean, calm and easy on the eye, in the style of a modern to-do app. Near-white canvas, soft white cards with generous radius, one accent colour, polished icons in quiet tiles, lots of breathing room, and no heavy gradients. Use when building or reviewing any SPAL screen or component, when someone says a screen feels busy, cramped, cluttered, harsh, loud or hard to read, or before shipping UI work. Composition and finish only; tokens and components still come from spal-design.
---

# Calm UI

The bar: a screen should feel like a clean desk. You can see what matters in one second, nothing shouts, and every element has room.

The reference is a to-do app: a near-white canvas, white pill-shaped cards, a polished icon on the left, a bold title with one grey meta line, a thin circle on the right, and a floating tab bar. There is no gradient anywhere. Colour is rare, so when it shows up it means something.

## Scope in this repo

`spal-design` owns tokens (Satoshi, colours, spacing, radius) and `art-director` owns composition and motion. This skill is the **finish layer**: how calm, light and spacious the result feels. Where they disagree about restraint, this skill wins. Use SPAL's tokens for every value below; the numbers are the target, not new constants.

## The rules

### 1. Canvas and cards
- Page background is one flat, near-white tone (`--surface-page`). Cards are plain white (`--surface-card`). The contrast between the two is subtle, and the card does the separating.
- Cards are **soft, not boxed**: large radius (`--radius-lg` or `--radius-xl`; rows about 24px, never under 16px), no border, and at most one faint, wide shadow. Never a border and a shadow together.
- One card per item or group. Do not nest a card inside a card. Group with space, not with more boxes.

### 2. Breathing room
- Space is the main design tool. Page gutter 20 to 24px. Gap between cards 12px. Gap between sections 32px or more. Inside a row, padding of 16px, and the row is about 72 to 80px tall.
- If a screen feels busy, **remove** something before you shrink anything. Cut the label, the second line, the divider, the border.
- Show one thing at a time. A list shows the next 5, not 30. A card shows one number, not three. Move the rest behind a tap.
- Never fill empty space just because it is empty.

### 3. Colour
- Neutral by default: ink text on white and near-white. **One accent** (SPAL green) for the primary action, the done state and the selected item. Nothing else gets the accent.
- Semantic colour only where it carries meaning (SPAL rules: green in, clay out, ochre owed, blue info), and only as a small dot, a ring or a figure. Never as a full card background.
- Tints are pale and quiet: use them as a tile behind an icon, not as a section background. At most three hues on screen at once.
- **No gradients.** Use a flat colour. A flat ink or flat surface hero is fine. The diffusion mesh is reserved for the splash and first-run moments and does not belong on working screens.
- No glow, no neon, no coloured shadows, no stripes behind text.

### 4. Type
- One weight jump creates hierarchy: bold title (600 to 700) against regular grey meta (400 to 500). Do not add a third level of emphasis.
- Title 16 to 17px, meta 13 to 14px in `--text-secondary`. Page title 28 to 32px, bold, left-aligned.
- Sentence case. No all-caps labels, no letter-spacing tricks, no underlines.
- Numbers use tabular figures. Money is the largest thing on the screen it belongs to.
- Say it in 2 to 6 words. A line that needs a second line should usually be a chart or an icon.

### 5. Icons
- Icons must look **made**, not borrowed. One family, one stroke weight (SPAL's 24px grid, 1.6 stroke), one corner style. Never mix filled and outline, and never mix emoji with the set.
- An icon sits in a **quiet tile**: about 48px square, radius 14 to 16px, a pale tint or `--surface-sunken`, the icon centred at 24px. The tile is quieter than the text next to it.
- Small meta icons (clock, pin) are 14px, grey, and sit directly before the text.
- One icon per row. If every row needs an icon to be understood, the labels are too weak.

### 6. Controls
- The primary action is one solid shape: a pill button or a single round button. There is only one per screen.
- Secondary actions are light grey pills (`Add +`), with no outline.
- Selection and completion use a thin circle (1.5 to 2px, grey) on the right of a row. Done turns it green with a check. The row then fades to about 40% and moves to the bottom.
- The tab bar floats: a rounded pill with a few icons and labels, the selected item as a dark pill. Keep the label on the selected item only.
- Touch targets stay at least 44px even when the visual is smaller.

### 7. Charts and data
- Keep charts flat and light: thin rings, soft bars on a pale track. The hatched-stripe signature stays for **data** (bars, donut, stack) and never decorates cards, buttons or headers.
- Progress for a day or week is a small ring (pink or grey track, green when complete), not a paragraph.

### 8. Motion
- Quiet and short (200 to 300ms). Rows slide and fade; the check pops once. Nothing loops, nothing bounces, nothing competes with the content. Reduced motion still ends complete.

## Review before you call a screen done

Look at the screenshot, then answer each question honestly. Fix every "no".

1. Can I name the one thing this screen is for within a second?
2. Is there any gradient, glow, border-plus-shadow or nested card? (There should be none.)
3. Would removing any element make it better? Remove it and look again.
4. Is the gap between sections clearly larger than the gap between rows?
5. Is there more than one accent colour, or more than three hues in total?
6. Do all icons look like one family, in tiles of one size?
7. Does each row read as title, then grey meta, and nothing else?
8. Is there exactly one primary action?
9. At 320px wide, is it still calm, with no wrapping crowd and no clipped label?
10. In the night theme, are the same rules true (flat surfaces, one accent, quiet tiles)?

If you changed a screen, say which of these you fixed. If you could not fix one, say so.

## Common slips

| Slip | Do this instead |
|---|---|
| A gradient hero for emphasis | A flat ink or white card with a large number |
| A border on every card | Drop the border; let white on near-white do it |
| Chips and pills everywhere | One status dot and one word |
| Four coloured icon tiles in a row | Same pale tile for all, colour only where meaning demands it |
| A caption under every title | Keep the caption only when it adds a fact |
| Dense lists with dividers | Separate rows with space; remove the divider |
| A long scroll of sections | Show the top one or two; link to the rest |
