# Business registration (guide and verify)

Plan agreed in chat: guide the person, check what SPAL can, never register or send anything, never touch ID numbers.

- [x] Pure logic: sensitive-word nudge, loose registration-number check, day check (`src/registration/guide.ts`) + tests
- [x] Profile answers `registeredAs` / `registeredOn` (sanitised, synced with the profile, no SQL)
- [x] Screen `/business/register`: name ideas, ready list, pack with Copy, portal steps, check and save
- [x] Entry points: library step `setup-register` ("Get ready with SPAL"), Your business row
- [x] Browser check `npm run check:register`
- [ ] Layout screens at 7 viewports (running)
- [ ] Full sweep, docs, PR

## Review (to fill in)
