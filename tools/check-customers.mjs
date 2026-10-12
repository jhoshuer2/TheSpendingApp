// Customers and message drafts in a real browser (demo mode: local storage).
//   npm run build && node node_modules/vite/bin/vite.js preview --port 4173 &   then   node tools/check-customers.mjs
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
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block", permissions: ["clipboard-read", "clipboard-write"] });
const p = await ctx.newPage();
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
const step = async (label, fn) => { await fn(); console.log("ok -", label); };

const key = async (...ks) => { for (const k of ks) await p.getByRole("button", { name: k, exact: true }).click(); };
const books = () => p.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.startsWith("spal.records")); return JSON.parse(localStorage.getItem(k) ?? "{}"); });
const sale = async ({ digits, customer, owes, pick }) => {
  await p.goto(BASE + "/money/sale");
  await key(...digits);
  if (owes) await p.getByRole("radio", { name: "Owes me" }).click();
  if (pick) await p.getByRole("button", { name: pick, exact: true }).click();
  else if (customer) await p.getByLabel(/Customer|Who owes you/).fill(customer);
  await p.getByRole("button", { name: /^Record ₦/ }).click();
  await p.waitForURL("**/app/money");
};
const flat = async (loc) => (await loc.innerText()).replace(/₦\s+/g, "₦");
const waHref = () => p.getByRole("link", { name: "Open WhatsApp" }).getAttribute("href");
const text = () => p.getByLabel("Message", { exact: true }).inputValue();

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

await step("no customers yet: a friendly empty state", async () => {
  await p.goto(BASE + "/money/customers");
  await p.getByRole("heading", { name: "No customers yet" }).waitFor();
});

await step("a paid sale can carry a customer's name too, and it shows up in the list", async () => {
  await sale({ digits: ["4", "5", "Three zeros"], customer: "Chidi Okeke" });
  await p.goto(BASE + "/money/customers");
  await p.getByRole("link", { name: /Chidi Okeke/ }).waitFor();
  assert.equal(await p.getByRole("heading", { name: "Owe you" }).count(), 0, "paid, so nobody owes");
});

await step("suggestions: tap a name you've used instead of typing it again", async () => {
  await p.goto(BASE + "/money/sale");
  await key("2", "Three zeros");
  await p.getByRole("button", { name: "Chidi Okeke", exact: true }).waitFor();
  await p.getByLabel("Customer (optional)").fill("chi");
  await p.getByRole("button", { name: "Chidi Okeke", exact: true }).waitFor();
  await p.getByLabel("Customer (optional)").fill("zzz");
  assert.equal(await p.getByRole("button", { name: "Chidi Okeke", exact: true }).count(), 0, "narrowed away");
});

await step("a credit sale: the same person, typed differently, is still one customer who owes", async () => {
  await sale({ digits: ["2", "5", "Three zeros"], owes: true, customer: "chidi  okeke" });
  await sale({ digits: ["8", "Three zeros"], owes: true, customer: "Mrs Bello" });
  await p.goto(BASE + "/money/customers");
  await p.getByRole("heading", { name: "Owe you" }).waitFor();
  const owing = await flat(p.locator(".list").first());
  assert.match(owing, /Chidi Okeke[\s\S]*₦25,000/);
  assert.match(owing, /Mrs Bello[\s\S]*₦8,000/);
  assert.ok(owing.indexOf("Chidi") < owing.indexOf("Bello"), "biggest debt first");
  assert.equal(await p.getByRole("link", { name: /Chidi/ }).count() >= 2, true, "listed under 'Owe you' and 'Everyone'");
  assert.equal(Object.keys((await books()).customers ?? {}).length, 0, "no stored customer rows are needed");
});

await step("customer page: what they owe, totals, and their sales", async () => {
  await p.getByRole("link", { name: /Chidi Okeke/ }).first().click();
  await p.getByRole("heading", { name: "Chidi Okeke" }).waitFor();
  const t = await flat(p.locator("main"));
  assert.match(t, /Owes you[\s\S]*₦25,000/);
  assert.match(t, /Bought in total[\s\S]*₦70,000/);
  assert.match(t, /Sales[\s\S]*2/);
  await p.getByRole("link", { name: "Add phone number" }).waitFor();
});

await step("reminder without a phone number: a friendly message with the exact amount, WhatsApp asks who to send to", async () => {
  await p.getByRole("button", { name: /^Remind Chidi/ }).click();
  await p.getByRole("heading", { name: "Payment reminder" }).waitFor();
  const m = await text();
  assert.match(m, /^Hello Chidi, I hope you're well\. A quick reminder about the ₦25,000/);
  assert.match(await waHref(), /^https:\/\/wa\.me\/\?text=Hello%20Chidi/);
  await p.getByText(/No phone number saved for Chidi Okeke/).waitFor();
});

await step("tone and language rewrite the message, and the choice is remembered", async () => {
  await p.getByRole("radio", { name: "Firm" }).click();
  assert.match(await text(), /is still outstanding\. Please pay today/);
  await p.getByRole("radio", { name: "Pidgin" }).click();
  assert.match(await text(), /never enter yet/);
  await p.reload();
  await p.getByRole("heading", { name: "Payment reminder" }).waitFor();
  assert.equal(await p.getByRole("radio", { name: "Pidgin" }).getAttribute("aria-checked"), "true");
  assert.equal(await p.getByRole("radio", { name: "Firm" }).getAttribute("aria-checked"), "true");
  await p.getByRole("radio", { name: "English" }).click();
  await p.getByRole("radio", { name: "Friendly" }).click();
});

await step("you can change the words, and 'Copy' copies exactly what is on screen", async () => {
  await p.getByLabel("Message", { exact: true }).fill("Hi Chidi, small thing: the ₦25,000 for the cake. Thanks!");
  await p.getByRole("button", { name: "Copy" }).click();
  await p.getByText("Message copied.").waitFor();
  assert.equal(await p.evaluate(() => navigator.clipboard.readText()), "Hi Chidi, small thing: the ₦25,000 for the cake. Thanks!");
  assert.match(decodeURIComponent((await waHref()).split("text=")[1]), /small thing: the ₦25,000/);
});

await step("your business name signs messages, and is remembered", async () => {
  await p.getByRole("radio", { name: "Short" }).click(); // rewrites, dropping the edit
  assert.doesNotMatch(await text(), /—/);
  await p.getByLabel("Your business name (optional)").fill("Ada's Kitchen");
  await p.getByRole("button", { name: "Save name" }).click();
  assert.match(await text(), /\n— Ada's Kitchen$/);
  await p.reload();
  assert.match(await text(), /— Ada's Kitchen/);
});

await step("add a phone number: WhatsApp opens that chat (Nigerian numbers get 234)", async () => {
  await p.goBack(); // customer page
  await p.goBack().catch(() => {});
  await p.goto(BASE + "/money/customers");
  await p.getByRole("link", { name: /Chidi Okeke/ }).first().click();
  await p.getByRole("link", { name: "Add phone number" }).click();
  await p.getByLabel("Phone number (optional)").fill("0803 123 4567");
  await p.getByLabel("A note (optional)").fill("Pays on Fridays");
  await p.getByRole("button", { name: "Save customer" }).click();
  await p.getByRole("heading", { name: "Chidi Okeke" }).waitFor();
  await p.getByText("Pays on Fridays").waitFor();
  assert.equal(await p.getByRole("link", { name: "Call" }).getAttribute("href"), "tel:+2348031234567");
  assert.equal(await p.getByRole("link", { name: "WhatsApp" }).getAttribute("href"), "https://wa.me/2348031234567");
  await p.getByRole("button", { name: /^Remind Chidi/ }).click();
  assert.match(await waHref(), /^https:\/\/wa\.me\/2348031234567\?text=/);
  assert.equal(await p.getByText(/No phone number saved/).count(), 0);
  const b = await books();
  assert.equal(Object.keys(b.customers).length, 1, "now one stored customer");
  assert.equal(Object.values(b.sales).filter((s) => s.customer === "Chidi Okeke" || s.customer === "chidi  okeke").length, 2, "sales untouched");
});

await step("a wrong phone number is refused, and a duplicate name too", async () => {
  await p.goto(BASE + "/money/customer/new/edit");
  await p.getByLabel("Name").fill("Tolu");
  await p.getByLabel("Phone number (optional)").fill("0803");
  await p.getByRole("button", { name: "Save customer" }).click();
  await p.getByText(/doesn't look like a phone number/).waitFor();
  await p.getByLabel("Name").fill("chidi okeke");
  await p.getByLabel("Phone number (optional)").fill("");
  await p.getByRole("button", { name: "Save customer" }).click();
  await p.getByText("You already have Chidi Okeke").waitFor();
  await p.getByLabel("Name").fill("Tolu Bakare");
  await p.getByRole("button", { name: "Save customer" }).click();
  await p.getByRole("heading", { name: "Tolu Bakare" }).waitFor();
  await p.getByText(/No sales yet/).waitFor();
});

await step("renaming a customer carries the new name to their past sales", async () => {
  await p.goto(BASE + "/money/customers");
  await p.getByRole("link", { name: /Chidi Okeke/ }).first().click();
  await p.getByRole("link", { name: "Edit details" }).click();
  await p.getByLabel("Name").fill("Chidi Okeke-Smith");
  await p.getByRole("button", { name: "Save customer" }).click();
  await p.getByRole("heading", { name: "Chidi Okeke-Smith" }).waitFor();
  assert.match(await flat(p.locator("main")), /Owes you[\s\S]*₦25,000/, "the debt followed the new name");
  const names = Object.values((await books()).sales).map((s) => s.customer).filter(Boolean);
  assert.ok(!names.some((n) => /^chidi/i.test(n) && n !== "Chidi Okeke-Smith"), "no sale kept the old spelling");
});

await step("a receipt from a sale, with the customer and business name", async () => {
  await p.getByRole("link", { name: /₦45,000|₦20,000/ }).first().click().catch(() => {});
  await p.goto(BASE + "/app/money");
  await p.getByRole("link", { name: /Chidi Okeke-Smith/ }).first().click().catch(() => {});
  const first = await p.evaluate(() => { const b = JSON.parse(localStorage.getItem(Object.keys(localStorage).find((x) => x.startsWith("spal.records")))); return Object.values(b.sales).find((s) => s.paid && s.customer)?.id; });
  await p.goto(BASE + `/money/record/sale/${first}`);
  await p.getByRole("button", { name: "Send a receipt" }).click();
  await p.getByRole("heading", { name: "Receipt" }).waitFor();
  const m = await text();
  assert.match(m, /^Ada's Kitchen\nReceipt · \d+ \w+ 2\d{3}\nFor: Chidi Okeke-Smith\n/);
  assert.match(m, /Total: ₦\d[\d,]*\nPaid ✔\n\nThank you for your business!$/);
  assert.equal(await p.getByRole("radio", { name: "Firm" }).count(), 0, "no tone for receipts");
  assert.match(await waHref(), /^https:\/\/wa\.me\/2348031234567\?text=/, "goes to the customer's chat");
});

await step("a sale that isn't paid offers a reminder from its own page", async () => {
  await p.goto(BASE + "/app/money");
  await p.getByRole("link", { name: /Mrs Bello/ }).first().click();
  await p.getByRole("button", { name: "Remind Mrs Bello" }).click();
  assert.match(await text(), /^Hi Mrs Bello, please remember the ₦8,000/); // "Short" was chosen earlier and is remembered
});

await step("removing a customer keeps their sales; their name still shows up", async () => {
  await p.goto(BASE + "/money/customers");
  await p.getByRole("link", { name: /Tolu Bakare/ }).click();
  await p.getByRole("link", { name: "Edit details" }).click();
  await p.getByRole("button", { name: "Remove from my list" }).click();
  await p.waitForURL("**/money/customers");
  assert.equal(await p.getByRole("link", { name: /Tolu Bakare/ }).count(), 0, "no sales, so gone");
  await p.getByRole("link", { name: /Chidi Okeke-Smith/ }).first().click();
  await p.getByRole("link", { name: "Edit details" }).click();
  await p.getByRole("button", { name: "Remove from my list" }).click();
  await p.waitForURL("**/money/customers");
  await p.getByRole("link", { name: /Chidi Okeke-Smith/ }).first().waitFor();
});

await step("search appears once the list is long", async () => {
  for (let i = 0; i < 8; i++) {
    await p.goto(BASE + "/money/customer/new/edit");
    await p.getByLabel("Name").fill(`Customer ${i}`);
    await p.getByRole("button", { name: "Save customer" }).click();
    await p.getByRole("heading", { name: `Customer ${i}` }).waitFor();
  }
  await p.goto(BASE + "/money/customers");
  await p.getByLabel("Search").fill("bello");
  assert.equal(await p.getByRole("link", { name: /Customer \d/ }).count(), 0);
  await p.getByRole("link", { name: /Mrs Bello/ }).first().waitFor();
  await p.getByLabel("Search").fill("zzzz");
  await p.getByText(/Nobody matches/).waitFor();
});

await step("it all survives a reload", async () => {
  await p.reload();
  await p.getByLabel("Search").fill("");
  await p.getByRole("link", { name: /Mrs Bello/ }).first().waitFor();
});

assert.deepEqual(errors, [], "no browser errors");
await browser.close();
console.log("Customers check passed.");
