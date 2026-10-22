// Learning-from-use behaviour in a real browser (demo mode: local storage, no backend).
//   npm run build && npx vite preview --port 4173 &   then   node tools/check-learning.mjs
import { chromium } from "playwright-core";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";

const BASE = process.env.BASE_URL ?? "http://localhost:4173";
function chromePath() {
  if (process.env.CHROME) return process.env.CHROME;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH ?? "/opt/pw-browsers";
  const dirs = readdirSync(root).filter((d) => d.startsWith("chromium")).sort((a) => (a.includes("headless_shell") ? -1 : 1));
  for (const d of dirs) for (const r of ["chrome-linux/headless_shell", "chrome-linux/chrome"]) { const p = join(root, d, r); if (existsSync(p)) return p; }
  throw new Error("No Chromium found; set CHROME=<path>");
}

const browser = await chromium.launch({ executablePath: chromePath(), args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
const p = await ctx.newPage();
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
const step = async (label, fn) => { await fn(); console.log("ok -", label); };

const KEY = "spal.profile.v1:ada@example.com";
const cache = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "{}"), KEY);
const heroTitle = async () => (await p.getByRole("article").getByRole("heading").innerText()).trim();
const pick = (name) => p.getByRole("radio", { name }).click();
const next = () => p.getByRole("button", { name: /^(Continue|Finish)/ }).click();
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

await step("set up an established customer-focused business", async () => {
  await p.goto(BASE + "/signup");
  await p.getByLabel("Your name").fill("Ada Okafor");
  await p.getByLabel("Email").fill("ada@example.com");
  await p.getByLabel("Password", { exact: true }).fill("correct-horse");
  await p.getByRole("button", { name: "Create account" }).click();
  await p.waitForURL("**/onboarding");
  for (const a of [/running 1 to 3/, /Get more customers/, /Shop or trading/, /Just me/, /Under/]) { await pick(a); await next(); }
  await p.getByRole("checkbox", { name: /registered business name/ }).click();
  await next();
  await pick(/Getting customers/); await next();
  await p.waitForURL("**/onboarding/summary", { timeout: 5000 });
  await p.getByText(/SPAL learns from the steps you open/).waitFor();
  await p.getByRole("button", { name: "See my first step" }).click();
  await p.waitForURL("**/app/today");
});

let first;
await step("'Not now' hides the step, says so, and Undo brings it back", async () => {
  first = await heroTitle();
  await p.getByRole("button", { name: "Not now" }).click();
  await p.getByRole("status").filter({ hasText: "back in a week" }).waitFor();
  const second = await heroTitle();
  assert.notEqual(second, first);
  assert.ok((await cache()).progress && Object.values((await cache()).progress).some((x) => x.snoozedUntil));
  await p.getByRole("button", { name: "Undo" }).click();
  assert.equal(await heroTitle(), first);
  assert.ok(!Object.values((await cache()).progress).some((x) => x.snoozedUntil), "snooze should be cleared by Undo");
});

await step("'Not for me' hides it for good, lists it in Profile, and 'Bring back' restores it", async () => {
  await p.getByRole("button", { name: "Not for me" }).click();
  await p.getByRole("status").filter({ hasText: "won't suggest" }).waitFor();
  assert.notEqual(await heroTitle(), first);
  await p.getByRole("link", { name: "Profile" }).click();
  await p.getByRole("heading", { name: "Hidden steps" }).waitFor();
  await p.getByText("Hidden for good").waitFor();
  await p.getByRole("link", { name: "Library" }).click();
  await p.getByText("Hidden from suggestions").waitFor();
  await p.getByRole("link", { name: "Profile" }).click();
  await p.getByRole("button", { name: "Bring back" }).click();
  await p.getByRole("heading", { name: "Hidden steps" }).waitFor({ state: "detached" });
  await p.getByRole("link", { name: "Today" }).click();
  assert.equal(await heroTitle(), first);
});

await step("opening and ticking a step records an active day and when it was opened", async () => {
  await p.getByRole("button", { name: /^Start$/ }).click();
  await p.waitForURL("**/module/**");
  await p.getByRole("checkbox").first().click();
  const c = await cache();
  assert.ok(c.activity.days.includes(todayKey()), "today should count as active");
  assert.ok(Object.values(c.progress).some((x) => x.openedAt), "openedAt should be recorded");
  assert.ok(c.activity.lastSeen, "lastSeen should be recorded");
  await p.getByRole("button", { name: "Back" }).click();
  await p.getByRole("link", { name: "Today" }).click();
  await p.getByRole("img", { name: /0 days in a row/ }).waitFor(); // Today shows the recording streak; nothing recorded yet
  await p.getByRole("link", { name: "Journey" }).click(); // the weekly rhythm lives on Journey
  await p.getByRole("img", { name: /Active on 1 of the last 7 days/ }).waitFor();
  await p.getByRole("link", { name: "Today" }).click();
});

await step("finishing a step unlocks a milestone on Journey, and the recap counts it", async () => {
  await p.getByRole("button", { name: /^Continue/ }).click();
  const boxes = p.getByRole("checkbox");
  for (let i = 0; i < (await boxes.count()); i++) if ((await boxes.nth(i).getAttribute("aria-checked")) === "false") await boxes.nth(i).click();
  await p.getByRole("button", { name: "Finish this step" }).click();
  await p.waitForURL("**/app/today");
  await p.getByRole("link", { name: "Journey" }).click();
  await p.getByText("1 step finished so far.").waitFor();
  await p.getByRole("img", { name: /1 step finished this week/ }).waitFor();
  await p.getByText("First step done").waitFor();
  await p.getByText("Milestones").waitFor();
  assert.equal(await p.getByText("Milestones").locator("..").getByText("1 of 5").count(), 1);
});

await step("turning learning off stops recording, hides the rhythm, and keeps hidden steps hidden", async () => {
  await p.getByRole("link", { name: "Profile" }).click();
  await p.getByRole("switch", { name: /Learn from how I use SPAL/ }).click();
  assert.equal(await p.getByRole("switch", { name: /Learn from how I use SPAL/ }).getAttribute("aria-checked"), "false");
  await p.getByText(/Learning is off/).waitFor();
  const before = await cache();
  await p.getByRole("link", { name: "Today" }).click();
  await p.getByRole("button", { name: /^Start$/ }).click();
  await p.getByRole("checkbox").first().click();
  const after = await cache();
  assert.deepEqual(after.activity.days, before.activity.days, "no new active days while learning is off");
  const newlyOpened = Object.entries(after.progress).filter(([id, v]) => v.openedAt && !before.progress[id]?.openedAt);
  assert.equal(newlyOpened.length, 0, "no openedAt while learning is off");
  await p.getByRole("button", { name: "Back" }).click();
  await p.getByRole("link", { name: "Today" }).click();
  assert.equal(await p.getByText("Based on how you use SPAL").count(), 0);
  await p.getByRole("link", { name: "Journey" }).click();
  await p.getByText(/Learning is off, so your weekly rhythm isn't shown/).waitFor();
});

await step("the learning choice survives a reload", async () => {
  await p.reload();
  await p.getByRole("link", { name: "Profile" }).click();
  assert.equal(await p.getByRole("switch", { name: /Learn from how I use SPAL/ }).getAttribute("aria-checked"), "false");
});

await step("'Forget what SPAL has noticed' needs confirming, then clears days and opened-times but keeps finished steps", async () => {
  await p.getByRole("switch", { name: /Learn from how I use SPAL/ }).click(); // back on
  await p.getByRole("button", { name: "Forget what SPAL has noticed" }).click();
  assert.equal(await p.evaluate(() => !!document.activeElement?.closest('[role="alertdialog"]')), true, "focus moves into the confirm card, so a keyboard user hears it");
  await p.getByRole("button", { name: "Cancel" }).click();
  assert.match(await p.evaluate(() => document.activeElement?.textContent ?? ""), /Forget what SPAL has noticed/, "closing it puts focus back on the row that opened it");
  assert.ok((await cache()).activity.days.length > 0, "cancel must not clear anything");
  await p.getByRole("button", { name: "Forget what SPAL has noticed" }).click();
  await p.getByRole("button", { name: "Forget", exact: true }).click();
  const c = await cache();
  assert.deepEqual(c.activity.days, []);
  assert.ok(!Object.values(c.progress).some((x) => x.openedAt));
  assert.ok(Object.values(c.progress).some((x) => x.doneAt), "finished steps must be kept");
});

await step("after days away, a warm welcome back (no guilt, nothing lost)", async () => {
  await p.evaluate((k) => {
    const c = JSON.parse(localStorage.getItem(k));
    c.activity.lastSeen = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(k, JSON.stringify(c));
  }, KEY);
  await p.goto(BASE + "/app/today");
  await p.getByText("Welcome back.").waitFor();
  const text = await p.locator(".voice").first().innerText();
  assert.ok(!/miss|lost|streak|behind|haven't been/i.test(text), "welcome back must not use guilt language: " + text);
  await p.reload(); // same visit again soon after: the note should not nag on every load
  assert.equal(await p.getByText("Welcome back.").count(), 0);
});

await browser.close();
assert.deepEqual(errors, [], "browser errors:\n" + errors.join("\n"));
console.log("\nLearning check passed.");
