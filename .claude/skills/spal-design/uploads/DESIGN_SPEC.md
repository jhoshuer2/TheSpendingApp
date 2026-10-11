# Mercury · Design system migration spec

> Source: https://mercury.com  ·  Curated by OpenDesign  ·  en

> A strong example of how premium fintech branding can use editorial photography and refined typography to stand out in a crowded market.

## 1. Identity DNA

The design system for Mercury builds a premium fintech interface with the deliberate precision of a high-end photography studio. Its identity rests on cinematic depth and a restrained palette, creating a space where complex financial tools feel calm, focused, and fundamentally trustworthy.

**One-liner:** Premium fintech interface combining cinematic photography with refined, humanist typography.
**Keywords:** fintech · banking · startup · trust · modernity
**Analogy:** A premium fintech startup that blends editorial photography with clean SaaS UI to project reliability and modern innovation.

## 2. Color

The color system is built on a dark, cinematic foundation, using deep charcoals and near-blacks to establish a premium, low-glare environment. A single high-chroma blue accent acts as the sole beacon of interaction, guiding the user’s eye with surgical clarity.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#171721` | main background |
| `--bg-soft` | `#1E1E2A` | card background |
| `--bg-quiet` | `#9CB4E8` | quiet area |
| `--ink` | `#EDEDF3` | body text |
| `--ink-soft` | `#C3C3CC` | secondary text |
| `--muted` | `#C3C3CC` | placeholder |
| `--accent` | `#5266EB` | single accent |
| `--line` | `rgba(237,237,243,0.1)` | divider |

**Color principle:** Deep, muted dark backgrounds with high-contrast light text and a single vibrant blue accent.

This restrained, single-accent approach prioritizes legibility and lets the brand’s immersive photographic imagery take center stage.

## 3. Typography

Typography is handled with a single refined humanist-sans family, Arcadia, creating a cohesive and elegant voice across the interface. The consistent use of a medium weight for headlines avoids visual weight, ensuring the tone remains modern and aspirational rather than heavy.

- **Display:** transitional-serif
- **Body:** humanist-sans

| Token | Size | Line-height | Weight | Letter-spacing | Use |
|---|---|---|---|---|---|
| display | 56px | 1.0 | 500 | -1px | Hero headline |
| h2 | 42px | 1.1 | 500 | -0.5px | Section headers |
| subtitle | 28px | 1.4 | 400 | 0 | Hero subhead |
| body | 16px | 1.5 | 420 | 0.24px | General text |
| caption | 12px | 1.3 | 400 | 0.42px | Navigation and small labels |

**Type rules:**
- Use transitional-serif for prominent display headlines to establish a premium editorial tone.
- Use humanist-sans for body text and navigation to ensure high readability and a friendly demeanor.
- Avoid decorative or overly stylized typefaces that might detract from the refined aesthetic.

## 4. Spacing

An 8-pixel base rhythm establishes a predictable and calm spatial structure throughout the layout.

- **Base unit:** 4px
- **Scale:** 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80 / 96 / 128 px
- **Rhythm:** Standard 4px base grid with specific horizontal and vertical padding increments.

## 5. Surfaces

Depth is communicated through restrained, almost imperceptible shadows, giving elements a subtle lift without breaking the dark, cinematic plane. Borders are thin, 1px lines used sparingly, reinforcing a minimalist ethos where separation is suggested rather than declared.

- **Radius:** sm 4px · md 8px · lg 12px · pill 999px
- **Shadows:**
  - 0px 0px 6px 0px rgba(86, 86, 118, 0.1)
- **Borders:** 1px solid rgba(237,237,243,0.1)

## 6. Layout

The layout skeleton begins with a fluid, edge-to-edge hero section that immerses the user in a full-viewport photographic landscape. This transitions into a structured, column-based grid, providing order and breathing room for feature-rich content blocks.

- **Container max:** 1280px
- **Paragraph max:** 680px
- **Grid:** 12 columns, gutter 24px
- **Breakpoints:** 768 / 1024 px

**Skeleton:** Full-bleed photographic hero followed by constrained grid sections.

## 7. Motion & Interaction

Motion philosophy favors subtlety and purpose, using smooth, 300ms transitions for standard UI feedback. More complex animations are refined and slightly longer, ensuring every movement feels intentional and supports the overall refined aesthetic.

- **Durations:** micro 220ms · small 300ms · medium 500ms
- **Easing:** `cubic-bezier(0, 0, 0.2, 1)`
- **Patterns:**
  - Smooth background-color and text-color transitions on hover states.
  - Subtle transform transitions for interactive elements.

- **Hover:** Color and background-color transitions over 300ms.
- **Click:** Transform scale transitions over 300ms.
- **Transition:** Unified transition properties applied globally for consistency.
- **Keyboard:** Standard focus management, though specific focus styles are not highly visible.

## 8. Voice & Don'ts

The editorial voice is confident and refined, matching the system’s visual tone with direct, benefit-oriented language. This tone, coupled with a strict avoidance of clutter and casualness, reinforces the platform's position as a premium, modern choice.

- **Tone:** Confident, professional, and forward-thinking.
- **Headline style:** Bold, concise, and declarative (e.g., 'Radically different banking').
- **CTA style:** Direct and action-oriented (e.g., 'Open account').
- **Avoid:** Jargon-heavy language / Overly aggressive sales pitches / Cluttered visual layouts

### Don'ts
- ❌ don't use bright, saturated backgrounds — screenshot shows deep, muted dark backgrounds instead.
- ❌ don't use purely geometric or grotesque sans-serif for headlines — screenshot shows a refined transitional serif font.
- ❌ don't use sharp, boxy corners — screenshot shows consistently rounded corners (4px to pill-shaped).
- ❌ don't use multiple competing accent colors — screenshot shows a single dominant blue (#5266EB) accent.
- ❌ don't use dense, cluttered layouts — screenshot shows generous whitespace and centered alignment.
- ❌ don't use harsh, high-contrast borders — screenshot shows very subtle, semi-transparent dividers.

The system deliberately rejects visual noise and aggressive sales language in favor of spacious, purpose-driven clarity.

## System Prompt (paste into AI tool)

```
A premium fintech SaaS design system characterized by deep, muted dark backgrounds and a single vibrant blue accent. It features a mix of transitional-serif for display headlines and humanist-sans for body text, creating an editorial yet modern feel. The layout is clean and spacious, utilizing generous whitespace and centered alignment. Key colors include a dark navy background (#171721), light off-white text (#EDEDF3), and a signature blue (#5266EB) for primary actions. Critical constraints: maintain the refined, uncluttered aesthetic; avoid multiple accent colors; and ensure high readability through proper type contrast and spacing.
```
