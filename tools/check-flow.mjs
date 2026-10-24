// End-to-end journey against the preview server: sign up, onboard, finish a step, reload, switch accounts.
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

const pick = (name) => p.getByRole("radio", { name }).click();
const next = () => p.getByRole("button", { name: /^(Continue|Finish)/ }).click();
const step = async (label, fn) => { await fn(); console.log("ok -", label); };

await step("splash goes to welcome, then sign up", async () => {
  await p.goto(BASE + "/");
  await p.waitForURL("**/welcome", { timeout: 4000 });
  await p.getByRole("button", { name: "Skip" }).click();
  await p.waitForURL("**/signup");
});

await step("sign up validates, then creates the account", async () => {
  await p.getByRole("button", { name: "Create account" }).click();
  await p.getByText("Enter your name").waitFor();
  await p.getByLabel("Your name").fill("Ada Okafor");
  await p.getByLabel("Email").fill("ada@example.com");
  await p.getByLabel("Password", { exact: true }).fill("correct-horse");
  await p.getByRole("button", { name: "Create account" }).click();
  await p.waitForURL("**/onboarding");
});

await step("a person who hasn't started is not asked about team or sales", async () => {
  await pick(/haven't started/);
  assert.equal(await p.getByRole("progressbar").getAttribute("aria-valuemax"), "5");
  await next();
  // The goals fit someone who hasn't started: no "grow bigger", and the wording is about starting.
  await p.getByRole("heading", { name: "What do you want to get done first?" }).waitFor();
  assert.equal(await p.getByRole("radio", { name: /Grow bigger/ }).count(), 0);
  assert.equal(await p.getByRole("radio", { name: /Earn more from what I sell/ }).count(), 0);
  await pick(/Get set up properly/); await next();
  await p.getByRole("heading", { name: "What kind of business will it be?" }).waitFor();
  await pick(/Fashion and beauty/); await next();
  await p.getByRole("heading", { name: "What do you already have ready?" }).waitFor();
  assert.equal(await p.getByRole("checkbox", { name: /A way to track my sales/ }).count(), 0);
});

await step("'None of these' clears the others, and picking one clears 'None'", async () => {
  await p.getByRole("checkbox", { name: /logo/ }).click();
  await p.getByRole("checkbox", { name: /None of these/ }).click();
  assert.equal(await p.getByRole("checkbox", { name: /logo/ }).getAttribute("aria-checked"), "false");
  await p.getByRole("checkbox", { name: /A page on social media/ }).click();
  assert.equal(await p.getByRole("checkbox", { name: /None of these/ }).getAttribute("aria-checked"), "false");
  await p.getByRole("checkbox", { name: /A page on social media/ }).click();
  await p.getByRole("checkbox", { name: /None of these/ }).click();
  await next();
  await p.getByRole("heading", { name: "What feels hardest about starting?" }).waitFor();
  assert.equal(await p.getByRole("radio", { name: /Hiring and managing people/ }).count(), 0);
  assert.equal(await p.getByRole("radio", { name: /Keeping up with demand/ }).count(), 0);
  await pick(/Knowing where to begin/); await next();
});

await step("building, then the summary explains the profile", async () => {
  await p.waitForURL("**/onboarding/summary", { timeout: 5000 });
  await p.getByText("Getting ready to launch").first().waitFor();
  await p.getByText("You said knowing what to do next is the hardest part right now").first().waitFor();
});

await step("Today shows one next step with the reason for it", async () => {
  await p.getByRole("button", { name: "See my first step" }).click();
  await p.waitForURL("**/app/today");
  await p.getByText("Why this step").waitFor();
  assert.equal(await p.title(), "Today · SPAL", "each screen names itself in the tab");
  assert.equal(await p.getByRole("article").count(), 1);
  // Nothing to record yet: no streak, and the steps are about starting.
  assert.equal(await p.getByRole("img", { name: /days? in a row/ }).count(), 0);
});

await step("the library and the money tab suit someone who hasn't started", async () => {
  await p.getByRole("link", { name: "Library" }).click();
  await p.getByRole("heading", { name: "Library", level: 1 }).waitFor();
  await p.getByText("Test your idea with five people").waitFor();
  assert.equal(await p.getByText("Write down every sale").count(), 0, "no sales to write down yet");
  assert.equal(await p.getByText("Ask happy customers to tell others").count(), 0, "no customers to ask yet");
  await p.getByRole("link", { name: "Money" }).click();
  await p.getByRole("heading", { name: "Your books start here" }).waitFor();
  assert.equal(await p.getByRole("link", { name: "Your customers" }).count(), 0);
  await p.getByRole("link", { name: "Today" }).click();
  await p.waitForURL("**/app/today");
});

const title = (await p.getByRole("article").getByRole("heading").innerText()).trim();
await step(`opening "${title}": Finish stays disabled until every step is ticked`, async () => {
  await p.getByRole("button", { name: /^Start$/ }).click();
  await p.waitForURL("**/module/**");
  const finish = p.getByRole("button", { name: "Finish this step" });
  assert.equal(await finish.isDisabled(), true);
  const boxes = p.getByRole("checkbox");
  const n = await boxes.count();
  for (let i = 0; i < n; i++) { assert.equal(await finish.isDisabled(), true); await boxes.nth(i).click(); }
  assert.equal(await finish.isDisabled(), false);
});

await step("progress survives a reload", async () => {
  await p.reload();
  const boxes = p.getByRole("checkbox");
  for (let i = 0; i < (await boxes.count()); i++) assert.equal(await boxes.nth(i).getAttribute("aria-checked"), "true");
});

await step("finishing moves Today on to a different step and celebrates", async () => {
  await p.getByRole("button", { name: "Finish this step" }).click();
  await p.waitForURL("**/app/today");
  await p.getByRole("status").filter({ hasText: /Your first step done!|Step done!/ }).waitFor(); // the reward lands
  await p.getByText("Nice work.").waitFor();
  const newTitle = (await p.getByRole("article").getByRole("heading").innerText()).trim();
  assert.notEqual(newTitle, title);
});

await step("Journey lists it as finished", async () => {
  await p.getByRole("link", { name: "Journey" }).click();
  await p.getByRole("heading", { name: "Finished" }).waitFor();
  await p.getByText(title).first().waitFor();
});

await step("a reload keeps you signed in and onboarded", async () => {
  await p.goto(BASE + "/app/today");
  await p.getByText("Why this step").waitFor();
});

await step("a different account starts with its own onboarding", async () => {
  await p.getByRole("link", { name: "Profile" }).click();
  await p.getByRole("button", { name: "Log out" }).click();
  await p.goto(BASE + "/login");
  await p.getByLabel("Email").fill("kemi@example.com");
  await p.getByLabel("Password", { exact: true }).fill("another-password");
  await p.getByRole("button", { name: "Log in" }).click();
  await p.waitForURL("**/onboarding");
});

await step("signed-out visitors can't reach app pages", async () => {
  await p.evaluate(() => localStorage.removeItem("spal.session"));
  await p.goto(BASE + "/module/setup-name");
  await p.waitForURL("**/welcome");
});

await browser.close();
assert.deepEqual(errors, [], "browser console/page errors:\n" + errors.join("\n"));
console.log("\nFlow check passed.");
