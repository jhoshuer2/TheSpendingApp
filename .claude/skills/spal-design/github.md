repo: MrItrends/spal
branch: master
## Last sync
date: 2026-08-01T04:39:56Z

### Updated in this project
- Rebuilt core/feedback/navigation/brand/gamification component primitives from `components/ui/`, `components/shared/`, `components/gamification/`
- Extracted color/typography/spacing/shadow/motion tokens from `app/globals.css` and `DESIGN.md`/`SPAL_DESIGN_SYSTEM.md`
- Copied real brand assets (wordmark, mascot orb, onboarding illustrations, nav icons, app icons) into `assets/`
- Built an interactive mobile-app UI kit (onboarding → Home → Records → Add Sale/Expense sheet) from `app/(main)/home`, `app/(main)/records`, `app/(onboarding)/welcome`, `components/records/AddRecordSheet.tsx`

## Screen map
| Design system screen | Repo source |
|---|---|
| ui_kits/mobile-app/WelcomeScreen.jsx | app/(onboarding)/welcome/page.tsx |
| ui_kits/mobile-app/HomeScreen.jsx | app/(main)/home/page.tsx |
| ui_kits/mobile-app/RecordsScreen.jsx | app/(main)/records/page.tsx |
| ui_kits/mobile-app/AddRecordSheet.jsx | components/records/AddRecordSheet.tsx |
| components/core/* | components/ui/Button.tsx, Card.tsx, Badge.tsx, Input.tsx, PillChip.tsx |
| components/feedback/* | components/ui/InsightCard.tsx, UndoToast.tsx |
| components/navigation/* | components/ui/BottomNav.tsx, components/shared/QuickMenuFab.tsx |
| components/brand/SparkAvatar.jsx | components/shared/SparkAvatar.tsx |
| components/gamification/WeeklyChallengeCard.jsx | components/gamification/WeeklyChallengeCard.tsx |
| tokens/colors.css, tokens/typography.css | app/globals.css @theme |
