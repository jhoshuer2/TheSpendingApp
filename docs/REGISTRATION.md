# Business name registration (guide and verify)

SPAL gets a person ready to register a business name with the Corporate Affairs Commission (CAC) and checks what it can. **It never registers anything for them, never sends anything, and cannot look up CAC's records.** Screen: `/business/register` (`src/screens/Register.tsx`), content and checks in `src/registration/guide.ts`.

## What the screen does
1. **Pick your name**: up to three choices, the first filled from "Your business". A gentle nudge appears when a word CAC may want consent for is used (Federal, National, State, Government and a few more). The list is not complete and only ever nudges.
2. **Have these ready**: a tick list (ID, passport photo, signature photo, email, address, start date, what the business does). Ticks are not saved.
3. **Your pack**: the names, "what you sell" and "where you are" with Copy buttons.
4. **On the CAC website**: four plain steps and a button to the portal, opening in a new tab.
5. **Check it and save it**: type the number from the certificate. SPAL checks the shape (an optional BN/RC/IT/LP/LLP prefix and 5 to 8 digits), tidies it, and saves it with an optional date. A link opens CAC's public search so the person can see it is real.
6. Once saved: a "You're registered" card, a link to opening a business account, and a note that business names usually have a yearly filing, often due by 30 June (confirm on the CAC website).

Also reachable from the **Register your business name** library step ("Get ready with SPAL") and from **Your business**.

## Data
`registeredAs` and `registeredOn` live in the profile `answers` (they sync with the rest of the profile; no SQL change). Saving a number also adds "registered" to what the person already has. **SPAL never asks for, stores or sends an NIN, BVN, ID number or ID image.** The assistant is not given these fields.

## Keeping it honest
- No fee is stated anywhere: sources disagree and fees change. The screen says to check the CAC website before paying.
- The screen shows "Steps last checked {date}" (`CHECKED_ON` in `guide.ts`). Update it whenever the steps are re-checked against CAC's own site.
- The portal and search links (`CAC_PORTAL`, `CAC_SEARCH`) must be confirmed by a person before release; they were taken from public sources, not tested from here.
- **A lawyer or CAC-accredited agent should review the wording before this is promoted to customers.** It is a guide, not legal advice.

## Checks
Unit tests in `src/registration/guide.test.ts` and `src/profile/state.test.ts`; `npm run check:register` (browser); registration screens in `check:layout`.
