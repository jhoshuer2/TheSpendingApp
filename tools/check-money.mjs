// The records engine in a real browser (demo mode: local storage). Checks the arithmetic through the real screens.
//   npm run build && node node_modules/vite/bin/vite.js preview --port 4173 &   then   node tools/check-money.mjs
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

const key = async (...ks) => { for (const k of ks) await p.getByRole("button", { name: k, exact: true }).click(); };
const kept = async () => (await p.locator(".kept").innerText()).replace(/\s+/g, " ");
const money = async () => {
  const tab = p.getByRole("link", { name: "Money", exact: true });
  if (await tab.count()) await tab.click(); // the focused step screens have no tab bar
  else await p.goto(BASE + "/app/money");
  await p.getByRole("heading", { name: "Money", exact: true }).waitFor();
};
const today = async () => p.getByRole("radio", { name: "Today" }).click();
const dayKey = (back) => { const d = new Date(); d.setDate(d.getDate() - back); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const books = () => p.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.startsWith("spal.records")); return JSON.parse(localStorage.getItem(k) ?? "{}"); });

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

await step("Money starts empty and encouraging", async () => {
  await money();
  await p.getByText("Record your first sale").waitFor();
});

await step("the keypad builds an amount, can correct it, and shows it back plainly", async () => {
  // Start from the step's own "Record a sale" button, so we also prove we come back to the step afterwards.
  await p.getByRole("link", { name: "Library" }).click();
  await p.getByRole("link", { name: /Write down every sale/ }).click();
  await p.getByRole("button", { name: "Record a sale" }).click();
  await p.waitForURL("**/money/sale");
  assert.equal(await p.getByRole("button", { name: /^Record sale$/ }).isDisabled(), true, "can't record ₦0");
  await key("4", "5", "Three zeros");
  assert.equal(await p.getByLabel("45,000 naira").count() > 0, true, "amount is announced as plain words");
  await key("Delete last digit");
  await p.getByLabel("4,500 naira").first().waitFor();
  await key("0");
  await p.getByLabel("45,000 naira").first().waitFor();
  await p.getByRole("button", { name: "Record ₦45,000" }).click();
  await p.waitForURL("**/module/records-sales"); // back where we started, not somewhere new
  await p.getByRole("status").filter({ hasText: "Recorded ₦45,000." }).waitFor();
  assert.equal(await p.getByRole("checkbox").first().getAttribute("aria-checked"), "true", "the first step ticked itself");
  assert.equal(await p.getByRole("checkbox").nth(1).getAttribute("aria-checked"), "false");
});

await step("what you kept adds up: a sale, then an expense", async () => {
  await money();
  await today();
  assert.match(await kept(), /You kept today.*45,000/);
  await p.getByRole("button", { name: "Add an expense" }).click();
  await key("1", "2", "Three zeros");
  await p.getByRole("button", { name: /^Save/ }).click();
  await p.getByText("Pick what it was for.").waitFor();
  await p.getByRole("radio", { name: "Stock or ingredients" }).click();
  await p.getByRole("button", { name: "Save ₦12,000" }).click();
  await p.waitForURL("**/app/money");
  await p.getByRole("status").filter({ hasText: "Recorded ₦12,000 spent." }).waitFor();
  await today();
  const k = await kept();
  assert.match(k, /You kept today.*33,000/);
  assert.match(k, /Sold.*45,000/);
  assert.match(k, /Spent.*12,000/);
});

await step("a sale on credit counts as sold but not as kept, until it is paid", async () => {
  await p.getByRole("button", { name: "Record a sale" }).first().click();
  await key("1", "8", "5", "0", "0");
  await p.getByRole("radio", { name: "Owes me" }).click();
  await p.getByRole("button", { name: /^Record/ }).click();
  await p.getByText("Who owes you? Add their name so you remember.").waitFor();
  await p.getByLabel("Who owes you?").fill("Mrs Bello");
  await p.getByRole("button", { name: "Record ₦18,500" }).click();
  await p.waitForURL("**/app/money");
  await today();
  let k = await kept();
  assert.match(k, /33,000/, "owed money is not kept yet");
  assert.match(k, /Sold.*63,500/);
  await p.getByRole("heading", { name: /Owed to you/ }).waitFor();
  await p.getByText("Mrs Bello").first().waitFor();
  await p.getByRole("button", { name: "Paid", exact: true }).click();
  await p.getByRole("heading", { name: /Owed to you/ }).waitFor({ state: "detached" });
  await today();
  k = await kept();
  assert.match(k, /51,500/, "now it is paid, it is kept");
});

await step("deleting a record can be undone, and the totals follow", async () => {
  await p.getByRole("link", { name: /Transport|Stock or ingredients/ }).first().click();
  await p.getByRole("button", { name: /Delete this expense/ }).click();
  await p.waitForURL("**/app/money");
  await p.getByRole("status").filter({ hasText: "Deleted that expense" }).waitFor();
  await today();
  assert.match(await kept(), /63,500/, "without the ₦12,000 expense");
  await p.getByRole("button", { name: "Undo" }).click();
  await today();
  assert.match(await kept(), /51,500/, "undo brings the expense back");
});

await step("products: add one with a cost, see what you keep, and record a sale from it", async () => {
  await p.getByRole("link", { name: /Add your products|Manage your products/ }).click();
  await p.getByRole("button", { name: "Add a product" }).click();
  await p.getByRole("button", { name: "Save product" }).click();
  await p.getByText("Enter the product's name").waitFor();
  await p.getByText("Enter a price, like 2500").waitFor();
  await p.getByLabel("Name").fill("Jollof rice (plate)");
  await p.getByLabel("Price you sell it for").fill("2500");
  await p.getByLabel(/What it costs you/).fill("1400");
  await p.getByRole("button", { name: "Save product" }).click();
  await p.waitForURL("**/money/products");
  await p.getByText("Costs ₦1,400 · you keep ₦1,100").waitFor();
  await p.goBack(); // back to Money
  await p.getByRole("button", { name: "Record a sale" }).first().click();
  await p.getByRole("radio", { name: "Pick products" }).click();
  await p.getByRole("button", { name: "Add one Jollof rice (plate)" }).click();
  await p.getByRole("button", { name: "Add one Jollof rice (plate)" }).click();
  await p.getByRole("button", { name: "Record ₦5,000" }).click();
  await p.waitForURL("**/app/money");
  await p.getByText("2 × Jollof rice (plate)").waitFor();
  await today();
  assert.match(await kept(), /56,500/);
});

await step("editing a price doesn't rewrite past sales; removing a product keeps history", async () => {
  await p.getByRole("link", { name: /Manage your products/ }).click();
  await p.getByRole("link", { name: /Jollof rice/ }).click();
  await p.getByLabel("Price you sell it for").fill("3000");
  await p.getByRole("button", { name: "Save product" }).click();
  await p.waitForURL("**/money/products");
  await p.goBack();
  await p.getByRole("link", { name: /2 × Jollof rice/ }).click();
  await p.getByText("₦5,000").first().waitFor();
  await p.goBack();
  await p.getByRole("link", { name: /Manage your products/ }).click();
  await p.getByRole("link", { name: /Jollof rice/ }).click();
  await p.getByRole("button", { name: "Remove this product" }).click();
  await p.getByRole("heading", { name: "Removed" }).waitFor();
  await p.getByRole("button", { name: "Bring back" }).click();
  await p.getByRole("heading", { name: "Removed" }).waitFor({ state: "detached" });
  await p.goBack();
});

await step("you can record things you forgot, for earlier days, but not for the future", async () => {
  for (const back of [1, 2]) {
    await p.getByRole("button", { name: "Record a sale" }).first().click();
    await key("2", "Three zeros");
    await p.getByRole("radio", { name: "Another day" }).click();
    await p.getByLabel("Date").fill(dayKey(back));
    await p.getByRole("button", { name: "Record ₦2,000" }).click();
    await p.waitForURL("**/app/money");
  }
  await p.getByRole("button", { name: "Record a sale" }).first().click();
  await key("2", "Three zeros");
  await p.getByRole("radio", { name: "Another day" }).click();
  await p.getByLabel("Date").fill(dayKey(-3));
  await p.getByRole("button", { name: "Record ₦2,000" }).click();
  await p.getByText("Choose a date from the last 5 years, not in the future.").waitFor();
  await p.getByLabel("Date").fill("2010-01-01"); // the server refuses anything over 10 years old, for good
  await p.getByRole("button", { name: "Record ₦2,000" }).click();
  await p.getByText("Choose a date from the last 5 years, not in the future.").waitFor();
  await p.getByRole("button", { name: "Back" }).click();
  await p.getByText("Yesterday").first().waitFor();
});

await step("'Write down every sale' ticks itself, and can be finished", async () => {
  await p.getByRole("link", { name: "Library" }).click();
  await p.getByRole("link", { name: /Write down every sale/ }).click();
  await p.getByText("Do it in SPAL").waitFor();
  const boxes = p.getByRole("checkbox");
  assert.equal(await boxes.count(), 3);
  for (let i = 0; i < 3; i++) assert.equal(await boxes.nth(i).getAttribute("aria-checked"), "true", `step ${i + 1} should have ticked itself`);
  await p.getByRole("button", { name: "Finish this step" }).click();
  await p.waitForURL("**/app/today");
});

await step("everything survives a reload, and the numbers are the same", async () => {
  await p.goto(BASE + "/app/money");
  await today();
  assert.match(await kept(), /56,500/);
  const b = await books();
  assert.equal(Object.values(b.sales).filter((s) => !s.deletedAt).length, 5);
  assert.equal(Object.keys(b.products).length, 1);
});

await browser.close();
assert.deepEqual(errors, [], "browser errors:\n" + errors.join("\n"));
console.log("\nMoney check passed.");
