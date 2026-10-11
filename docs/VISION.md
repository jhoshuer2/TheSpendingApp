# SPAL — Vision, Model and Screen Map (draft v0.1)

Status: draft for creative-director review. Visual language is defined by the design system in `.claude/skills/spal-design/` (tokens, Satoshi, components). This doc defines *product*, not visuals.

## 1. Vision
SPAL is a personal business companion for entrepreneurs in Nigeria. It is not a feature catalogue. It is **modular**: the full library exists, but each person sees only the one thing they need right now. It learns how each entrepreneur works, tracks their journey, spots gaps, celebrates progress, and encourages (never forces) them to come back.

> Two people at the same stage can need different things. SPAL responds to the person, not the level.

## 2. Principles
1. **One thing at a time.** Home is a single "next step", not a menu.
2. **Never show what they're not ready for.** More is unlocked or asked for, never pushed.
3. **Explain every suggestion** ("Because you said demand is higher than you can supply") and let users correct their profile.
4. **Encourage, never shame.** Celebrate progress; nudges are kind. (Matches design system voice: plain language, 3-second rule, no accounting jargon, so "average monthly sales", not "revenue".)
5. **Learn continuously.** Onboarding is the first read, not the last.
6. **Calm and fast.** Mobile-first PWA, light on data, works on low-end phones and weak networks.

## 3. User model: profile, not levels
Levels are derived, loose and revisable. The Figma "Level 0–5" sketch is replaced by:

**Stage band** (sets tone and defaults; never a hard gate)
- **Starting** — not started, or in roughly the first year
- **Growing** — running, not yet scaled
- **Scaling** — established and expanding

**Needs map** (what actually drives suggestions). A live, ranked list of gaps and goals per person, e.g. brand/logo, website or online store, social presence, structure and registration, customers, hiring, supply vs demand, records, mentorship. Two Growing users will have different needs maps.

**Signals** that update both: onboarding answers, check-in answers, modules opened/finished/skipped, return patterns, items ticked off.

## 4. Onboarding (first read)
Splash → pre-onboarding → sign up / login → onboarding questions → first Today card.
Core questions (from the flow sketch): primary business goal; team size; average monthly sales; biggest pain point in their sector. Likely additions: how long running (or not started), business type, what they already have (logo, website, registration, bank account, social), how they like to be guided (quick tips vs deep guides).

## 5. Modules
A module is a small, self-contained guide or tool with: id, title, why-it-matters, steps, completion criteria, and the needs it addresses. Surfaced one at a time; the user can unlock the next or ask for more; completed items are ticked off.

Starting: set up a business, online store, brand and logo, website, social presence, mentorship.
Growing: attract customers, reach more users, meet demand, hire rightly, structure.
Scaling: staff, inventory, sales and expense records, reporting, scaling playbooks.
Records and operations are *modules*, shown only when relevant.

## 6. The brain (built in layers)
1. Rules + scoring: needs map, band transitions, next-step selection. Deterministic and testable.
2. Behaviour signals: tune order and timing.
3. Encouragement: thumbs-up on progress, gentle return nudges, growth recaps ("your journey").
4. Conversational coach (LLM via Claude API): reads the user's own profile/history. Added last.

## 7. Journey and growth
Progress tracking, badges and unlocks, growth recaps. This is the emotional/intelligent side of the flow sketch.

## 8. Screen map (v0.1)
- Splash
- Pre-onboarding → Sign up | Login
- Onboarding (question sequence) → Profile summary ("here's how we see you", editable)
- **Today** (home): one next-step card, "up next" (2–3), progress/encouragement strip
- Module detail (steps, tick off)
- Library (browse/ask for more; unlock)
- Journey (progress, badges, recaps)
- Coach (later)
- Profile and settings (edit profile, notifications, privacy)
- States: empty, loading (skeletons), offline, error

## 9. Design system usage
- Tokens, Satoshi, and components from `.claude/skills/spal-design/` are the source of truth.
- Open item: the system's "aura" gradient backgrounds. Default for now is **no aura in product UI** (flat paper/night surfaces); revisit when the creative director decides the gradient direction.
- Components are JSX and will be ported to TSX in the app.

## 10. Tech (proposed)
React + TypeScript + Vite, installable PWA with offline support; hosted backend (auth + database, e.g. Supabase); rules engine in typed TypeScript; Claude API for the coach in a later stage. Nigeria first: NGN, light payloads, local payment options when needed.

## 11. Build stages
0 Vision and tokens · 1 Foundation (scaffold, tokens, shell, splash, auth) · 2 Onboarding and profile · 3 Module engine · 4 First modules (Starting, then Growing) · 5 Journey (progress, badges, nudges) · 6 Operations modules · 7 Coach · 8 Polish (offline, accessibility, performance)

## 12. Open questions
- Gradient direction (replace, soften or drop the aura)
- Backend choice and auth methods (phone number / email / Google)
- Mentorship: real people, content, or both
- Monetisation
- Privacy and data-control commitments
