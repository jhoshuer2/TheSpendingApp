// Business registration guide through the real screens (demo mode: local storage).
//   npm run build && node node_modules/vite/bin/vite.js preview --port 4173 &   then   node tools/check-register.mjs
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

const answers = () => p.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.startsWith("spal.profile")); return JSON.parse(localStorage.getItem(k) ?? "{}").answers ?? {}; });

await step("set up an account", async () => {
  await p.goto(BASE + "/signup");
  await p.getByLabel("Your name").fill("Ada Okafor");
  await p.getByLabel("Email").fill("ada@example.com");
  await p.getByLabel("Password", { exact: true }).fill("correct-horse");
  await p.getByRole("button", { name: "Create account" }).click();
  await p.waitForURL("**/onboarding");
  for (const a of [/running 1 to 3/, /Get more customers/, /Food and drinks/, /Just me/, /Under/]) { await p.getByRole("radio", { name: a }).click(); await p.getByRole("button", { name: /^(Continue|Finish)/ }).click(); }
  await p.getByRole("checkbox", { name: /None of these/ }).click();
  await p.getByRole("button", { name: "Continue" }).click();
  await p.getByRole("radio", { name: /Getting customers/ }).click();
  await p.getByRole("button", { name: /^Finish/ }).click();
  await p.waitForURL("**/onboarding/summary", { timeout: 5000 });
  await p.getByRole("button", { name: "See my first step" }).click();
  await p.waitForURL("**/app/today");
});

await step("the guide opens from Your business and says what SPAL does and doesn't do", async () => {
  await p.goto(BASE + "/business");
  await p.getByLabel("Business name").fill("Ada Kitchen");
  await p.getByLabel("What you sell").fill("Home-cooked jollof and zobo");
  await p.getByLabel("Where you are").fill("Yaba, Lagos");
  await p.getByRole("button", { name: "Save" }).click();
  await p.goto(BASE + "/business");
  await p.getByRole("link", { name: /Register your business name/ }).click();
  await p.getByRole("heading", { name: "Register your business name" }).waitFor();
  const t = await p.locator("main").innerText();
  assert.match(t, /doesn't send anything for you/);
  assert.match(t, /Steps last checked/);
  assert.match(t, /never asks for your ID number/);
  assert.doesNotMatch(t, /₦\s?\d/, "no fee figures are stated");
});

await step("your name is filled in, and a sensitive word gets a gentle nudge", async () => {
  assert.equal(await p.getByLabel("First choice").inputValue(), "Ada Kitchen");
  await p.getByLabel("Second choice").fill("Ada National Foods");
  await p.getByText(/may need CAC's permission/).waitFor();
  await p.getByLabel("Second choice").fill("Ada Cakes");
  assert.equal(await p.getByText(/may need CAC's permission/).count(), 0);
});

await step("the checklist ticks and counts", async () => {
  await p.getByRole("checkbox", { name: /A valid ID/ }).click();
  assert.equal(await p.getByRole("checkbox", { name: /A valid ID/ }).getAttribute("aria-checked"), "true");
  await p.getByText("1 of 7").waitFor();
});

await step("the pack has copy buttons for the name, what you do and the address", async () => {
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {});
  for (const l of ["Copy your name choices", "Copy what you do", "Copy your address"]) await p.getByRole("button", { name: l }).waitFor();
  await p.getByRole("button", { name: "Copy your name choices" }).click();
  await p.getByText("Copied your name choices.").waitFor();
});

await step("the CAC links open in a new tab, safely", async () => {
  for (const [name, host] of [[/Open the CAC website/, "icrp.cac.gov.ng"], [/Search on CAC/, "search.cac.gov.ng"]]) {
    const a = p.getByRole("link", { name });
    assert.match(await a.getAttribute("href"), new RegExp(host));
    assert.equal(await a.getAttribute("target"), "_blank");
    assert.match(await a.getAttribute("rel"), /noopener/);
  }
});

await step("a bad number is refused with a plain reason, nothing is saved", async () => {
  await p.getByLabel("Registration number").fill("my NIN 12345678901");
  await p.getByRole("button", { name: "Save", exact: true }).click();
  await p.getByText(/doesn't look like a CAC number/).waitFor();
  assert.equal((await answers()).registeredAs, undefined);
});

await step("a good number is tidied and saved, and now counts as registered", async () => {
  await p.getByLabel("Registration number").fill("bn 1234567");
  await p.getByLabel("Date registered (optional)").fill("2026-09-01");
  await p.getByRole("button", { name: "Save", exact: true }).click();
  await p.getByText("You're registered: BN 1234567").waitFor();
  const a = await answers();
  assert.equal(a.registeredAs, "BN 1234567");
  assert.equal(a.registeredOn, "2026-09-01");
  assert.ok(a.have.includes("registered"));
  await p.getByRole("link", { name: "Open a business account" }).waitFor();
});

await step("it survives a reload, and the Your business row shows it", async () => {
  await p.reload();
  await p.getByText("You're registered: BN 1234567").waitFor();
  await p.goto(BASE + "/business");
  await p.getByText("Registered: BN 1234567").waitFor();
});

await step("the Library step links to the guide", async () => {
  await p.goto(BASE + "/module/setup-register");
  await p.getByRole("button", { name: "Open the registration guide" }).click();
  await p.waitForURL("**/business/register");
});

assert.deepEqual(errors, [], "no browser errors");
await browser.close();
console.log("Registration check passed.");
