// Stock counts through the real screens (demo mode: local storage).
//   npm run build && node node_modules/vite/bin/vite.js preview --port 4173 &   then   node tools/check-stock.mjs
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

const books = () => p.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.startsWith("spal.records")); return JSON.parse(localStorage.getItem(k) ?? "{}"); });
const jollof = async () => Object.values((await books()).products).find((x) => /^Jollof/.test(x.name));
const productsText = async () => { await p.goto(BASE + "/money/products"); await p.getByRole("heading", { name: "Your products" }).waitFor(); return (await p.locator("main").innerText()).replace(/₦\s+/g, "₦"); };
const addProduct = async (name, price, track) => {
  await p.goto(BASE + "/money/product/new");
  await p.getByLabel("Name").fill(name);
  await p.getByLabel("Price you sell it for").fill(price);
  if (track) {
    await p.getByRole("switch", { name: /Track how many I have/ }).click();
    await p.getByLabel("How many do you have now?").fill(String(track.count));
    if (track.low !== undefined) await p.getByLabel(/Tell me when it gets low/).fill(String(track.low));
  }
  await p.getByRole("button", { name: "Save product" }).click();
  await p.waitForURL("**/money/products");
};
const sellPicked = async (qty) => {
  await p.goto(BASE + "/money/sale");
  await p.getByRole("radio", { name: "Pick products" }).click();
  for (let i = 0; i < qty; i++) await p.getByRole("button", { name: "Add one Jollof rice (plate)" }).click();
};
const record = async () => { await p.getByRole("button", { name: /^Record ₦/ }).click(); await p.waitForURL("**/app/money"); };
const countOf = async () => (await jollof()).stock;

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

await step("tracking is a choice per product: counted ones show what's left, others show nothing", async () => {
  await addProduct("Jollof rice (plate)", "2500", { count: 20, low: 5 });
  await addProduct("Zobo (bottle)", "600");
  const t = await productsText();
  assert.match(t, /Jollof rice \(plate\)[\s\S]*20 left/);
  assert.doesNotMatch(t.split("Zobo")[1] ?? "", /left|Out of stock/);
  const j = await jollof();
  assert.equal(j.stock, 20);
  assert.equal(j.lowAt, 5);
  assert.ok(j.countedAt);
});

await step("the form asks for a count when tracking is on, and says what's wrong", async () => {
  await p.goto(BASE + "/money/product/new");
  await p.getByLabel("Name").fill("Fanta");
  await p.getByLabel("Price you sell it for").fill("300");
  await p.getByRole("switch", { name: /Track how many I have/ }).click();
  await p.getByRole("button", { name: "Save product" }).click();
  await p.getByText(/Enter how many you have/).waitFor();
  await p.getByRole("switch", { name: /Track how many I have/ }).click(); // off: no count needed
  await p.getByRole("button", { name: "Save product" }).click();
  await p.waitForURL("**/money/products");
});

await step("picking products on a sale shows what's left and takes it off; a typed amount doesn't", async () => {
  await sellPicked(3);
  await p.getByText(/20 left/).waitFor();
  await record();
  assert.match(await productsText(), /17 left/);
  await p.goto(BASE + "/money/sale");
  for (const k of ["9", "Three zeros"]) await p.getByRole("button", { name: k, exact: true }).click();
  await record();
  assert.equal((await jollof()).stock, 20, "the count itself is untouched");
  assert.match(await productsText(), /17 left/, "a typed amount says nothing about what was sold");
});

await step("selling more than you have warns, never blocks, and shows 'Out of stock'", async () => {
  await sellPicked(18);
  await p.getByText("You only have 17 left. You can still record it.").waitFor();
  assert.equal(await p.getByRole("button", { name: /^Record ₦/ }).isEnabled(), true);
  await record();
  assert.match(await productsText(), /Out of stock/);
});

await step("Money shows 'Running low', and deleting that sale puts the stock back", async () => {
  await p.goto(BASE + "/app/money");
  await p.getByRole("heading", { name: /Running low/ }).waitFor();
  assert.match((await p.locator("main").innerText()), /Jollof rice \(plate\)[\s\S]*Out of stock/);
  const big = Object.values((await books()).sales).find((s) => s.items.some((i) => i.qty === 18));
  await p.goto(BASE + `/money/record/sale/${big.id}`);
  await p.getByRole("button", { name: "Delete this sale" }).click();
  assert.match(await productsText(), /17 left/);
  await p.goto(BASE + "/app/money");
  assert.equal(await p.getByRole("heading", { name: /Running low/ }).count(), 0, "nothing is low any more");
});

await step("'Count your stock': type what you counted, and the count restarts from now", async () => {
  await p.goto(BASE + "/money/stock");
  await p.getByRole("heading", { name: "Count your stock" }).waitFor();
  assert.equal(await p.getByRole("button", { name: "Save counts" }).isDisabled(), true, "nothing to save yet");
  await p.getByLabel("How many Jollof rice (plate)").fill("40");
  await p.getByRole("button", { name: "Save 1 count" }).click();
  await p.getByText("Saved your count.").waitFor();
  assert.equal(await countOf(), 40);
  assert.match(await productsText(), /40 left/);
  await p.goto(BASE + "/money/stock");
  await p.getByRole("link", { name: /Zobo/ }).waitFor(); // listed under "Not counting yet"
});

await step("running low is flagged at your level (5), with a plain warning", async () => {
  await sellPicked(35);
  await record();
  assert.match(await productsText(), /Running low: 5 left/);
  await p.goto(BASE + "/app/money");
  await p.getByRole("heading", { name: /Running low/ }).waitFor();
});

await step("opening a product and saving without changing the count keeps counting down from before", async () => {
  const before = (await jollof()).countedAt;
  await p.goto(BASE + "/money/products");
  await p.getByRole("link", { name: /Jollof rice/ }).click();
  assert.equal(await p.getByLabel("How many do you have now?").inputValue(), "5", "shows what is left now");
  await p.getByLabel("Price you sell it for").fill("2600");
  await p.getByRole("button", { name: "Save product" }).click();
  await p.waitForURL("**/money/products");
  assert.equal((await jollof()).countedAt, before, "the earlier count still stands");
  assert.equal((await jollof()).stock, 40);
  assert.match(await productsText(), /Running low: 5 left/);
  await p.getByRole("link", { name: /Jollof rice/ }).click();
  await p.getByLabel("How many do you have now?").fill("25");
  await p.getByRole("button", { name: "Save product" }).click();
  await p.waitForURL("**/money/products");
  assert.equal((await jollof()).stock, 25, "a changed number is a new count");
  assert.match(await productsText(), /25 left/);
});

await step("turning tracking off clears the count, and turning it on again asks for one", async () => {
  await p.goto(BASE + "/money/products");
  await p.getByRole("link", { name: /Jollof rice/ }).click();
  await p.getByRole("switch", { name: /Track how many I have/ }).click();
  await p.getByRole("button", { name: "Save product" }).click();
  await p.waitForURL("**/money/products");
  const j = await jollof();
  assert.equal(j.stock, undefined);
  assert.equal(j.countedAt, undefined);
  assert.doesNotMatch(await productsText(), /left|Out of stock/);
  await p.getByRole("link", { name: /Jollof rice/ }).click();
  await p.getByRole("switch", { name: /Track how many I have/ }).click();
  assert.equal(await p.getByLabel("How many do you have now?").inputValue(), "");
});

await step("it all survives a reload", async () => {
  await p.goto(BASE + "/money/product/" + (await jollof()).id);
  await p.getByLabel("Name").waitFor();
  await p.reload();
  await p.getByLabel("Name").waitFor();
  assert.equal(await p.getByLabel("Name").inputValue(), "Jollof rice (plate)");
});

assert.deepEqual(errors, [], "no browser errors");
await browser.close();
console.log("Stock check passed.");
