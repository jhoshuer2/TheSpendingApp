# Lessons

- **Long checks and `timeout`.** `check:layout` runs 96 screens at 7 sizes (several minutes). Wrapping it in `timeout 250` killed it halfway and looked like a browser crash. Run it in the background with no short limit, and diagnose before calling something broken.
- **Preview servers die with the shell call.** A server started in one command is gone in the next. Start it, run the check and stop it in the same command (or one script).
- **Prove a candidate before fixing it.** Several review candidates did not reproduce (for example the offline retry screen). Write the failing test or browser step first, and drop what you cannot reproduce.
- **State what you checked.** Say which checks ran and which could not. Do not claim a check passes if it was never run to the end.
- **Shallow clones and hooks.** A stop hook reported unpushed commits because the shallow clone had no local remote-tracking ref. `git fetch origin +refs/heads/<b>:refs/remotes/origin/<b>` fixes the false alarm.
- **GitHub from this sandbox.** `gh pr create` uses GraphQL and is blocked; use `gh api repos/<o>/<r>/pulls` (REST). Deleting a remote branch is blocked from here.

## "Dynamic" means the content adapts, not just the layout

- **What happened:** The onboarding questions were asked "dynamic" earlier, and I only made the team and sales questions appear or disappear. After the visual pass, someone who picked "I haven't started yet" still saw "Earn more from what I sell", "Grow bigger" and "Hiring and managing people". It was found by the user, not by a check.
- **Rule:** When a flow is meant to feel personal, read each screen as the person who just answered the previous one. Ask of every option and every line of wording: could this person honestly choose it? If not, hide it or reword it.
- **Rule:** When an earlier answer can change, a later answer may stop fitting. Drop it and count it as unanswered, rather than keeping a value the screen can no longer show.
- **Rule:** Put the adaptive behaviour in the data (`only`, `say` on each question), with tests for each stage, and add a browser assertion for the main path. A visual pass alone won't catch it.
