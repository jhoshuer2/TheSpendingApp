// "Your business" facts and the Write-for-me drafts in a real browser (demo mode: local storage).
//   npm run build && node node_modules/vite/bin/vite.js preview --port 4173 &   then   node tools/check-write.mjs
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
const text = () => p.getByLabel("Message", { exact: true }).inputValue();
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

await step("the Money tab offers 'Write for me', which starts by asking about your business", async () => {
  await p.getByRole("link", { name: "Money", exact: true }).click();
  await p.getByRole("link", { name: /Write for me/ }).click();
  await p.getByRole("heading", { name: "Write for me" }).waitFor();
  await p.getByText("Tell SPAL about your business").waitFor();
});

await step("without products the price list asks you to add them; greetings are plain and say why", async () => {
  await p.goto(BASE + "/write/prices");
  await p.getByRole("link", { name: "Add a product" }).waitFor();
  assert.equal(await p.getByRole("link", { name: "Open WhatsApp" }).count(), 0);
  await p.goto(BASE + "/write/greeting");
  assert.equal(await text(), "Hello! Welcome. How can I help you today?");
  await p.getByText(/This is plain because SPAL doesn't know much yet/).waitFor();
});

await step("your business: a bad Instagram name is refused, good facts are saved and show on Profile", async () => {
  await p.goto(BASE + "/business");
  await p.getByLabel("Business name").fill("Ada's Kitchen");
  await p.getByLabel("What you sell").fill("Home-cooked jollof and zobo, made fresh daily");
  await p.getByLabel("Where you are").fill("Yaba, Lagos");
  await p.getByLabel("Opening hours").fill("Mon to Sat, 10am to 6pm");
  await p.getByLabel("Instagram").fill("not a handle!");
  await p.getByRole("button", { name: "Save" }).click();
  await p.getByText(/An Instagram name has only letters/).waitFor();
  assert.equal((await answers()).businessName, undefined, "nothing saved when it's invalid");
  await p.getByLabel("Instagram").fill("@ada.kitchen");
  await p.getByRole("button", { name: "Save" }).click();
  await p.getByText("Saved your business details.").waitFor();
  const a = await answers();
  assert.deepEqual([a.businessName, a.about, a.place, a.hours, a.instagram], ["Ada's Kitchen", "Home-cooked jollof and zobo, made fresh daily", "Yaba, Lagos", "Mon to Sat, 10am to 6pm", "ada.kitchen"]);
  assert.equal(a.stage, "y1to3", "the onboarding answers are untouched");
  await p.goto(BASE + "/app/profile");
  await p.getByText("Ada's Kitchen", { exact: true }).waitFor();
  await p.getByText("Home-cooked jollof and zobo, made fresh daily").waitFor();
});

await step("greeting and away messages are written from those facts, in English or Pidgin", async () => {
  await p.goto(BASE + "/write/greeting");
  assert.equal(await text(), "Hello! Welcome to Ada's Kitchen. Home-cooked jollof and zobo, made fresh daily. We're open Mon to Sat, 10am to 6pm. How can I help you today?");
  assert.equal(await p.getByRole("link", { name: "Open WhatsApp" }).count(), 0, "this is pasted into WhatsApp Business, not sent to a chat");
  await p.getByText(/Business tools/).waitFor();
  await p.getByRole("radio", { name: "Pidgin" }).click();
  assert.equal(await text(), "Hello, welcome to Ada's Kitchen! Home-cooked jollof and zobo, made fresh daily. We dey open Mon to Sat, 10am to 6pm. How I fit help you today?");
  await p.getByRole("radio", { name: "English" }).click();
  await p.goto(BASE + "/write/away");
  assert.equal(await text(), "Thanks for your message! Ada's Kitchen is closed right now. We're open Mon to Sat, 10am to 6pm. We'll reply as soon as we're back.");
});

await step("the price list has exactly your product prices, and you can change it, copy it and open WhatsApp with it", async () => {
  for (const [name, price] of [["Jollof rice (plate)", "2500"], ["Zobo (bottle)", "600"]]) {
    await p.goto(BASE + "/money/product/new");
    await p.getByLabel("Name").fill(name);
    await p.getByLabel("Price you sell it for").fill(price);
    await p.getByRole("button", { name: "Save product" }).click();
    await p.waitForURL("**/money/products");
  }
  await p.getByRole("button", { name: "Share your price list" }).click();
  await p.waitForURL("**/write/prices");
  const expected = ["Ada's Kitchen price list", "Yaba, Lagos", "", "Jollof rice (plate) — ₦2,500", "Zobo (bottle) — ₦600", "", "Open: Mon to Sat, 10am to 6pm", "To order, message me here."].join("\n");
  assert.equal(await text(), expected);
  await p.getByRole("radio", { name: "Pidgin" }).click();
  assert.match(await text(), /To order, just message me here\.$/);
  await p.getByRole("radio", { name: "English" }).click();
  await p.getByLabel("Message", { exact: true }).fill("Ada's Kitchen price list\nJollof rice — ₦2,500. Order today!");
  await p.getByRole("button", { name: "Copy" }).click();
  await p.getByText("Message copied.").waitFor();
  assert.equal(await p.evaluate(() => navigator.clipboard.readText()), "Ada's Kitchen price list\nJollof rice — ₦2,500. Order today!");
  assert.match(decodeURIComponent((await p.getByRole("link", { name: "Open WhatsApp" }).getAttribute("href")).split("text=")[1]), /Order today!/);
});

await step("a product price change shows up in the list the next time", async () => {
  await p.goto(BASE + "/money/products");
  await p.getByRole("link", { name: /Zobo/ }).click();
  await p.getByLabel("Price you sell it for").fill("700");
  await p.getByRole("button", { name: "Save product" }).click();
  await p.goto(BASE + "/write/prices");
  assert.match(await text(), /Zobo \(bottle\) — ₦700/);
});

await step("the WhatsApp step now offers to write your messages, and still finishes the usual way", async () => {
  await p.goto(BASE + "/module/online-whatsapp");
  await p.getByText("SPAL can write this").waitFor();
  await p.getByRole("button", { name: "Write my messages" }).click();
  await p.waitForURL("**/write");
  await p.goBack();
  for (const box of await p.getByRole("checkbox").all()) await box.click();
  await p.getByRole("button", { name: "Finish this step" }).click();
  await p.waitForURL("**/app/today");
});

await step("clearing your details leaves plain messages again, and the other answers stay", async () => {
  await p.goto(BASE + "/business");
  for (const l of ["Business name", "What you sell", "Where you are", "Opening hours", "Instagram"]) await p.getByLabel(l).fill("");
  await p.getByRole("button", { name: "Save" }).click();
  const a = await answers();
  assert.deepEqual([a.businessName, a.about, a.place, a.hours, a.instagram], [undefined, undefined, undefined, undefined, undefined]);
  assert.equal(a.stage, "y1to3");
  await p.goto(BASE + "/write/greeting");
  assert.equal(await text(), "Hello! Welcome. How can I help you today?");
});

await step("it all survives a reload", async () => {
  await p.goto(BASE + "/business");
  await p.getByLabel("Business name").fill("Ada's Kitchen");
  await p.getByRole("button", { name: "Save" }).click();
  await p.reload();
  await p.goto(BASE + "/business");
  assert.equal(await p.getByLabel("Business name").inputValue(), "Ada's Kitchen");
});

assert.deepEqual(errors, [], "no browser errors");
await browser.close();
console.log("Write check passed.");
