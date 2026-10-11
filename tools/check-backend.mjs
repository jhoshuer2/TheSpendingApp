// Backend behaviour in a real browser, against tools/fake-supabase.mjs (a test double of Supabase's API).
//   node tools/fake-supabase.mjs 54321 &
//   VITE_SUPABASE_URL=http://localhost:54321 VITE_SUPABASE_ANON_KEY=fake npx vite build --outDir dist-fake
//   npx vite preview --outDir dist-fake --port 4174 &
//   node tools/check-backend.mjs
import { chromium } from "playwright-core";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";

const APP = process.env.APP_URL ?? "http://localhost:4174";
const FAKE = process.env.FAKE_URL ?? "http://localhost:54321";

function chromePath() {
  if (process.env.CHROME) return process.env.CHROME;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH ?? "/opt/pw-browsers";
  const dirs = readdirSync(root).filter((d) => d.startsWith("chromium")).sort((a) => (a.includes("headless_shell") ? -1 : 1));
  for (const d of dirs) for (const r of ["chrome-linux/headless_shell", "chrome-linux/chrome"]) { const p = join(root, d, r); if (existsSync(p)) return p; }
  throw new Error("No Chromium found; set CHROME=<path>");
}

const fake = (path) => fetch(FAKE + "/__fake/" + path).then((r) => r.json());
const state = () => fake("state");
const poll = async (what, fn, ms = 6000) => {
  const end = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > end) throw new Error("timed out waiting for: " + what);
    await new Promise((r) => setTimeout(r, 100));
  }
};

const browser = await chromium.launch({ executablePath: chromePath(), args: ["--no-sandbox"] });
const errors = [];
const device = async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  // Network failures are expected while the fake is "offline"; anything else is a real error.
  p.on("console", (m) => m.type() === "error" && !/Failed to load resource|net::ERR|503/.test(m.text()) && errors.push(m.text()));
  return { ctx, p };
};
const step = async (label, fn) => { await fn(); console.log("ok -", label); };

const signUp = async (p, name, email, password) => {
  await p.goto(APP + "/signup");
  await p.getByLabel("Your name").fill(name);
  await p.getByLabel("Email").fill(email);
  await p.getByLabel("Password", { exact: true }).fill(password);
  await p.getByRole("button", { name: "Create account" }).click();
};
const logIn = async (p, email, password) => {
  await p.goto(APP + "/login");
  await p.getByLabel("Email").fill(email);
  await p.getByLabel("Password", { exact: true }).fill(password);
  await p.getByRole("button", { name: "Log in" }).click();
};
const answer = async (p, labels) => { for (const l of labels) { await p.getByRole("radio", { name: l }).click(); await p.getByRole("button", { name: /^(Continue|Finish)/ }).click(); } };
const onboard = async (p) => {
  await p.waitForURL("**/onboarding");
  await answer(p, [/haven't started/, /Start properly/, /Fashion and beauty/]);
  await p.getByRole("checkbox", { name: /None of these/ }).click();
  await p.getByRole("button", { name: "Continue" }).click();
  await answer(p, [/Knowing what to do next/]);
  await p.waitForURL("**/onboarding/summary", { timeout: 5000 });
  await p.getByRole("button", { name: "See my first step" }).click();
  await p.waitForURL("**/app/today");
};
const tickAll = async (p) => { const b = p.getByRole("checkbox"); for (let i = 0; i < (await b.count()); i++) await b.nth(i).click(); };
const profileText = async (p) => { await p.getByRole("link", { name: "Profile" }).click(); return p; };

await fake("reset");
const A = await device();

await step("sign up creates a real account, the profile row and a session", async () => {
  await signUp(A.p, "Ada Okafor", "ada@example.com", "correct-horse");
  await onboard(A.p);
  const s = await state();
  assert.equal(s.users.length, 1);
  assert.equal(s.users[0].meta.name, "Ada Okafor");
  await poll("answers saved", async () => (await state()).profiles[0].completed === true);
  const prof = (await state()).profiles[0];
  assert.equal(prof.answers.stage, "idea");
  assert.deepEqual(prof.answers.have, ["none"]);
});

let title;
await step("finishing a step is saved to the server", async () => {
  title = (await A.p.getByRole("article").getByRole("heading").innerText()).trim();
  await A.p.getByRole("button", { name: /^Start$/ }).click();
  await tickAll(A.p);
  await A.p.getByRole("button", { name: "Finish this step" }).click();
  await A.p.waitForURL("**/app/today");
  const row = await poll("progress row", async () => (await state()).step_progress.find((r) => r.done_at));
  assert.ok(row.steps.length >= 3);
});

await step("the account's own password never reaches the app's storage", async () => {
  const dump = await A.p.evaluate(() => JSON.stringify({ ...localStorage }));
  assert.ok(!dump.includes("correct-horse"), "password found in localStorage");
});

const B = await device();
await step("a second device logs in and sees the same business, with no onboarding", async () => {
  await logIn(B.p, "ada@example.com", "correct-horse");
  await B.p.waitForURL("**/app/today", { timeout: 8000 });
  await B.p.getByText("Why this step").waitFor();
  await B.p.getByRole("link", { name: "Journey" }).click();
  await B.p.getByText(title).first().waitFor();
});

await step("wrong password and duplicate sign-up show clear messages", async () => {
  const C = await device();
  await logIn(C.p, "ada@example.com", "wrong-password");
  await C.p.getByText("That email and password don't match.").waitFor();
  await signUp(C.p, "Ada Again", "ada@example.com", "another-pass1");
  await C.p.getByText("There's already an account with that email. Try logging in.").waitFor();
  await C.ctx.close();
});

await step("offline: changes are kept, shown as waiting, and sent when back online", async () => {
  await A.p.goto(APP + "/module/setup-register");
  await fake("offline?on=1");
  await A.p.getByRole("checkbox").first().click();
  await A.p.getByRole("checkbox").nth(1).click();
  await A.p.waitForTimeout(1500);
  assert.ok(!(await state()).step_progress.some((r) => r.module_id === "setup-register"), "offline write reached the server");
  await A.p.goBack();
  await A.p.getByRole("link", { name: "Profile" }).click();
  await A.p.getByText(/Waiting for a connection/).waitFor();
  await fake("offline?on=0");
  await A.p.evaluate(() => window.dispatchEvent(new Event("online")));
  const row = await poll("synced after reconnect", async () => (await state()).step_progress.find((r) => r.module_id === "setup-register"));
  assert.deepEqual(row.steps, [0, 1]);
  await A.p.getByText("All changes saved").waitFor();
});

await step("unsent changes survive closing the tab", async () => {
  await A.p.goto(APP + "/module/setup-register");
  await fake("offline?on=1");
  await A.p.getByRole("checkbox").nth(2).click();
  await A.p.waitForTimeout(900);
  await A.p.reload(); // simulates the tab closing and reopening while still offline
  assert.equal(await A.p.getByRole("checkbox").nth(2).getAttribute("aria-checked"), "true");
  await fake("offline?on=0");
  await A.p.evaluate(() => window.dispatchEvent(new Event("online")));
  await poll("synced after reopen", async () => (await state()).step_progress.find((r) => r.module_id === "setup-register")?.steps.includes(2));
});

await step("a new device that can't reach the server shows a retry screen, not an empty account", async () => {
  const D = await device();
  await logIn(D.p, "ada@example.com", "correct-horse");
  await D.p.waitForURL("**/app/today", { timeout: 8000 });
  await D.p.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith("spal.profile")) localStorage.removeItem(k); });
  await fake("offline?on=1");
  await D.p.goto(APP + "/app/today");
  await D.p.getByText("We couldn't load your data").waitFor({ timeout: 8000 });
  await fake("offline?on=0");
  await D.p.getByRole("button", { name: "Try again" }).click();
  await D.p.getByText("Why this step").waitFor({ timeout: 8000 });
  await D.ctx.close();
});

await step("signing out clears the cached data; another account starts fresh", async () => {
  await B.p.getByRole("link", { name: "Profile" }).click();
  await B.p.getByRole("button", { name: "Log out" }).click();
  await B.p.waitForURL("**/welcome");
  assert.equal(await B.p.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("spal.profile")).length), 0);
  await signUp(B.p, "Kemi Bello", "kemi@example.com", "kemi-password");
  await B.p.waitForURL("**/onboarding");
  const s = await state();
  assert.equal(s.profiles.length, 2);
  assert.equal(s.profiles.find((p) => p.name === "Kemi Bello").completed, false);
});

await step("forgot password: email link lets you set a new password", async () => {
  const E = await device();
  await E.p.goto(APP + "/login");
  await E.p.getByRole("button", { name: "Forgot your password?" }).click();
  await E.p.getByLabel("Email").fill("ada@example.com");
  await E.p.getByRole("button", { name: "Send link" }).click();
  await E.p.getByText("Check your email").waitFor();
  const mail = (await fake("outbox")).at(-1);
  assert.equal(mail.email, "ada@example.com");
  assert.equal(new URL(mail.redirectTo).pathname, "/reset-password");
  const F = await device();
  await F.p.goto(APP + "/reset-password" + mail.link);
  await F.p.getByRole("heading", { name: "Choose a new password" }).waitFor({ timeout: 8000 });
  await F.p.getByLabel("New password").fill("short");
  await F.p.getByRole("button", { name: "Save password" }).click();
  await F.p.getByText("Use at least 8 characters").waitFor();
  await F.p.getByLabel("New password").fill("correct-horse");
  await F.p.getByRole("button", { name: "Save password" }).click();
  await F.p.getByText("Choose a password you haven't used before.").waitFor();
  await F.p.getByLabel("New password").fill("a-brand-new-pass");
  await F.p.getByRole("button", { name: "Save password" }).click();
  await F.p.waitForURL("**/app/today", { timeout: 8000 });
  const G = await device();
  await logIn(G.p, "ada@example.com", "correct-horse");
  await G.p.getByText("That email and password don't match.").waitFor();
  await logIn(G.p, "ada@example.com", "a-brand-new-pass");
  await G.p.waitForURL("**/app/today", { timeout: 8000 });
  for (const d of [E, F, G]) await d.ctx.close();
});

await step("an expired reset link says so and offers a new one", async () => {
  const H = await device();
  await H.p.goto(APP + "/reset-password");
  await H.p.getByRole("heading", { name: "This link has expired" }).waitFor();
  await H.p.getByRole("button", { name: "Send a new link" }).click();
  await H.p.waitForURL("**/forgot-password");
  await H.ctx.close();
});

await step("with email confirmation on: sign-up asks to check email, login waits until confirmed", async () => {
  await fake("confirm-mode?on=1");
  const I = await device();
  await signUp(I.p, "Tunde Ade", "tunde@example.com", "tunde-password");
  await I.p.getByText("Check your email").waitFor();
  await I.p.getByText(/tunde@example.com/).waitFor();
  await I.p.getByRole("button", { name: "Go to log in" }).click();
  await I.p.getByLabel("Email").fill("tunde@example.com");
  await I.p.getByLabel("Password", { exact: true }).fill("tunde-password");
  await I.p.getByRole("button", { name: "Log in" }).click();
  await I.p.getByText("Confirm your email first. Check your inbox for the link.").waitFor();
  await fake("confirm?email=tunde@example.com");
  await I.p.getByRole("button", { name: "Log in" }).click();
  await I.p.waitForURL("**/onboarding", { timeout: 8000 });
  await fake("confirm-mode?on=0");
  await I.ctx.close();
});

await step("signed-out visitors are sent to the welcome screen", async () => {
  const J = await device();
  await J.p.goto(APP + "/module/setup-name");
  await J.p.waitForURL("**/welcome");
  await J.ctx.close();
});

await browser.close();
assert.deepEqual(errors, [], "unexpected browser errors:\n" + errors.join("\n"));
console.log("\nBackend check passed.");
