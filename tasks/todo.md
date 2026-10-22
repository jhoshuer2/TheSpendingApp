# Review and art-direction passes

Skills in `.claude/skills/`: `code-reviewer` (sweep, verify, fix one at a time, report) and `art-director` (composition, scale and motion; `spal-design` owns tokens).

## Done (PR #17)
- [x] Code review sweep: seven dimensions, every candidate verified or discarded. Six proven fixes (assistant card race, calendar days, duplicate customer spellings, assistant 503, reduced-motion loops, not-found h1)
- [x] `react-router-dom` 6.30.6, security headers in `vercel.json`
- [x] Entry-screen limits: ₦1bn total, products per sale, 5 years back
- [x] Art direction: Today hero, Journey and Money empty states, Profile restructure, list hairlines, type and space tokens
- [x] `check:layout` 96 screens x 7 sizes

## Done (second pass)
- [x] Emoji-only names no longer match every product or customer in the assistant
- [x] Profile "Forget" confirm card takes focus and gives it back
- [x] Each screen sets the page title
- [x] A sent backlog settles in one write, not one per record
- [x] Removed two unused exports; README and docs brought up to date

## Open (needs a decision)
- [ ] Arrow-key handling for the three radio-style groups (Segmented, OptionCard, expense categories)
- [ ] Content-Security-Policy (can break Supabase and font loads; needs its own pass)
- [ ] Shared assistant quota: is email confirmation or a captcha on for sign-ups?
- [ ] `react-router` moderate advisories are only fixed in v7 (not reachable here)

## Review
Every fix above has a test or browser check that failed before the change. Checks: typecheck, unit tests, `check:flow/learning/money/customers/stock/register/write/assistant/backend/layout`.
