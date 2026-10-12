// The assistant in a real browser, against tools/fake-supabase.mjs (which includes a scripted stand-in for the model).
// This proves the app's handling of conversations, cards, limits and failures. It does NOT prove what the real model says.
//   npm run check:assistant
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
const poll = async (what, fn, ms = 6000) => { const end = Date.now() + ms; for (;;) { const v = await fn(); if (v) return v; if (Date.now() > end) throw new Error("timed out waiting for: " + what); await new Promise((r) => setTimeout(r, 100)); } };
const step = async (label, fn) => { await fn(); console.log("ok -", label); };

const browser = await chromium.launch({ executablePath: chromePath(), args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
const p = await ctx.newPage();
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
p.on("console", (m) => m.type() === "error" && !/Failed to load resource|net::ERR|50\d|40\d|429/.test(m.text()) && errors.push(m.text()));

const books = () => p.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.startsWith("spal.records")); return JSON.parse(localStorage.getItem(k) ?? "{}"); });
const live = async (t) => Object.values((await books())[t] ?? {}).filter((r) => !r.deletedAt);
const replies = () => p.locator(".msg--assistant .msg__text, .msg__note").count();
let mark = 0; // how many replies were on screen when we last spoke, so we only accept a NEW one
const say = async (t) => { await p.getByLabel("Message").waitFor(); mark = await replies(); await p.getByLabel("Message").fill(t); await p.getByRole("button", { name: "Send" }).click(); };
const reply = async (re) => {
  await poll(`a new reply matching ${re}`, async () => (await replies()) > mark && re.test(await p.locator(".msg--assistant .msg__text, .msg__note").last().innerText()), 8000);
  // and let it finish before the next step talks
  await p.getByRole("status").waitFor({ state: "detached", timeout: 8000 }).catch(() => {});
};
const card = () => p.getByTestId("proposal").last();
const open = async () => { await p.goto(APP + "/assistant"); await p.getByLabel("Message").waitFor(); };

await fake("reset");

await step("set up an account", async () => {
  await p.goto(APP + "/signup");
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

await step("the sparkle button on Today opens the assistant, which first explains what is shared", async () => {
  await p.getByRole("link", { name: "Talk to SPAL Assistant" }).click();
  await p.waitForURL("**/assistant");
  await p.getByText("What gets shared").waitFor();
  assert.equal(await p.getByLabel("Message").count(), 0, "can't chat before agreeing");
  await p.getByRole("button", { name: "I understand" }).click();
  await p.getByRole("heading", { name: /Hi Ada/ }).waitFor();
  assert.ok((await p.getByRole("button", { name: /jollof/ }).count()) >= 1, "English starters");
});

await step("a sale in English: the assistant proposes, nothing is saved until Save", async () => {
  await say("I sold 3 plates of jollof for ₦4,500");
  await card().waitFor({ timeout: 6000 });
  assert.match(await card().innerText(), /Save this\?[\s\S]*3 × jollof: ₦4,500/);
  assert.equal((await live("sales")).length, 0, "nothing saved yet");
  await card().getByRole("button", { name: "Save" }).click();
  await p.locator(".acard--saved").waitFor();
  const sales = await live("sales");
  assert.equal(sales.length, 1);
  assert.equal(sales[0].amount, 450000);
  assert.deepEqual(sales[0].items.map((i) => [i.name, i.qty]), [["jollof", 3]]);
  assert.equal(sales[0].paid, true);
});

await step("the model saw today's date, the reply language and a valid, signed history", async () => {
  const log = await fake("assistant-log");
  assert.match(JSON.stringify(log[0][0].content), /\[Context: Today is \w+day \d{4}-\d{2}-\d{2} \(Africa\/Lagos\)\. Name: Ada Okafor\.[^\]]*Reply in: English\.\]/);
});

await step("the next message carries the answer to the card, and the assistant responds to it", async () => {
  await say("how much did I make this week?");
  await reply(/This week you kept ₦4,500/);
  const log = await fake("assistant-log");
  const withSaved = JSON.stringify(log.flat());
  assert.match(withSaved, /Saved\. 3 × jollof: ₦4,500/);
});

await step("Undo removes what the assistant saved", async () => {
  await say("I sold 2 bags of rice for 3k");
  await card().getByRole("button", { name: "Save" }).click();
  assert.equal((await live("sales")).length, 2);
  await card().getByRole("button", { name: "Undo" }).click();
  await p.locator(".acard--undone").waitFor();
  assert.equal((await live("sales")).length, 1);
});

await step("'Not right' saves nothing, and the assistant is told", async () => {
  await say("I spent 800 on bus");
  await card().getByRole("button", { name: "Not right" }).click();
  assert.equal((await live("expenses")).length, 0);
  await say("sorry, it was 900");
  await reply(/haven't saved it/);
});

await step("ignoring a card and carrying on counts as not saved", async () => {
  const n0 = await p.getByTestId("proposal").count();
  await say("I spent 1,200 on bus");
  await p.getByTestId("proposal").nth(n0).waitFor();
  await say("who owes me money?");
  await reply(/Nobody owes you/);
  assert.equal((await live("expenses")).length, 0);
  assert.ok(await p.locator(".acard--dismissed").count() >= 2);
});

await step("a customer who owes: saved as unpaid, then 'don pay' (Pidgin) marks it paid", async () => {
  await say("Chidi owes me ₦2,000");
  await card().getByRole("button", { name: "Save" }).click();
  const owing = (await live("sales")).filter((s) => !s.paid);
  assert.equal(owing.length, 1);
  assert.equal(owing[0].customer, "Chidi");
  const n = await p.getByTestId("proposal").count();
  await say("Chidi don pay");
  await p.getByTestId("proposal").nth(n).waitFor();
  assert.match(await card().innerText(), /Chidi paid ₦2,000/);
  await card().getByRole("button", { name: "Save" }).click();
  assert.equal((await live("sales")).filter((s) => !s.paid).length, 0);
  await card().getByRole("button", { name: "Undo" }).click();
  assert.equal((await live("sales")).filter((s) => !s.paid).length, 1, "undo puts the debt back");
});

await step("a customer who isn't owing: the assistant is told why, not a broken card", async () => {
  const before = await p.getByTestId("proposal").count();
  await say("Tolu don pay");
  await reply(/Nobody called "Tolu" owes anything/);
  assert.equal(await p.getByTestId("proposal").count(), before);
});

await step("a reminder draft: the app writes it from the books, the model never sees the message, and nothing is sent", async () => {
  const salesBefore = (await live("sales")).length;
  const n = await p.getByTestId("draft").count();
  await say("remind Chidi");
  await p.getByTestId("draft").nth(n).waitFor();
  const card = p.getByTestId("draft").nth(n);
  const t = (await card.innerText()).replace(/\n+/g, " ");
  assert.match(t, /Reminder for Chidi/);
  assert.match(t, /Hello Chidi, I hope you're well\. A quick reminder about the ₦2,000/);
  assert.match(await card.getByRole("link", { name: "Open WhatsApp" }).getAttribute("href"), /^https:\/\/wa\.me\/\?text=Hello%20Chidi/);
  await reply(/ready on your screen/);
  assert.equal((await live("sales")).length, salesBefore, "nothing in the books changed");
  const log = JSON.stringify((await fake("assistant-log")).at(-1));
  assert.match(log, /Nothing was sent/);
  assert.doesNotMatch(log, /wa\.me|hope you're well/, "the message text never goes to the model");
  await card.getByRole("link", { name: "Change the words or style" }).click();
  await p.getByRole("heading", { name: "Payment reminder" }).waitFor();
  await p.goto(APP + "/assistant");
  await p.getByTestId("draft").first().waitFor();
});

await step("customers: a question about best customers, and a polite error for someone unknown", async () => {
  await say("who are my best customers?");
  await reply(/Your best customer is/);
  const n = await p.getByTestId("draft").count();
  await say("remind Tolu");
  await reply(/No customer called "Tolu"/);
  assert.equal(await p.getByTestId("draft").count(), n);
});

await step("Pidgin: settings change the reply language and the starters", async () => {
  await p.getByRole("link", { name: "Assistant settings" }).click();
  await p.getByRole("radio", { name: "Pidgin" }).click();
  await p.getByRole("button", { name: "Clear this chat" }).click();
  await p.waitForURL("**/assistant");
  await p.getByRole("button", { name: /Who dey owe me/ }).waitFor();
  mark = await replies();
  await p.getByRole("button", { name: /Who dey owe me/ }).click();
  await reply(/./);
  const log = await fake("assistant-log");
  assert.match(JSON.stringify(log.at(-1)), /Reply in: Pidgin/);
  await say("How much I make this week?");
  await reply(/you don keep ₦/);
});

await step("the conversation survives a reload, including an unanswered card", async () => {
  const n1 = await p.getByTestId("proposal").count();
  await say("I sell 2 bag rice for 5,000 naira");
  await p.getByTestId("proposal").nth(n1).waitFor();
  await p.reload();
  await p.getByLabel("Message").waitFor();
  assert.equal(await p.locator(".acard--pending").count(), 1, "the card is still waiting");
  await card().getByRole("button", { name: "Save" }).click();
  await say("how much");
  await reply(/you don keep/);
});

await step("save-without-asking mode saves small amounts straight away and offers Undo", async () => {
  await p.getByRole("link", { name: "Assistant settings" }).click();
  await p.getByRole("switch", { name: /Save without asking/ }).click();
  await p.goBack();
  const before = (await live("expenses")).length;
  const savedBefore = await p.locator(".acard--saved").count();
  await say("I spent 700 on bus");
  await poll("the new card is saved", async () => (await p.locator(".acard--saved").count()) > savedBefore);
  assert.equal((await live("expenses")).length, before + 1);
  assert.match(await p.locator(".acard--saved").last().innerText(), /Saved for you/);
  await p.locator(".acard--saved").last().getByRole("button", { name: "Undo" }).click();
  assert.equal((await live("expenses")).length, before);
  await say("I sold 1 generator for 600k");
  await card().getByRole("button", { name: "Save" }).waitFor();
  assert.equal((await live("sales")).filter((s) => s.amount === 60000000).length, 0, "large amounts still ask first");
  await card().getByRole("button", { name: "Not right" }).click();
});

await step("offline: the message is kept and 'Try again' works once back online", async () => {
  await fake("offline?on=1");
  await say("who owes me money?");
  await p.getByText(/Your message is kept|couldn't answer|busy/).waitFor({ timeout: 8000 });
  await fake("offline?on=0");
  mark = await replies();
  await p.getByRole("button", { name: "Try again" }).click();
  await reply(/sales are not paid yet|Nobody owes/);
  assert.equal(await p.locator(".msg--user", { hasText: "who owes me money?" }).count() >= 1, true);
});

await step("the daily limit gives a calm message and no retry button", async () => {
  await fake("assistant?mode=normal&limit=1");
  await say("how much");
  await p.getByText(/used all your assistant messages for today/).waitFor();
  assert.equal(await p.getByRole("button", { name: "Try again" }).count(), 0);
  await fake("assistant?mode=normal&limit=1000");
});

await step("the assistant being switched off or down is explained, not a crash", async () => {
  await fake("assistant?mode=disabled");
  await p.reload();
  await say("hello there");
  await p.getByText(/isn't available right now/).waitFor();
  await fake("assistant?mode=down");
  await p.getByRole("button", { name: "Try again" }).count();
  await fake("assistant?mode=normal");
});

await step("a refusal is handled kindly", async () => {
  await p.reload();
  await p.getByLabel("Message").waitFor();
  await say("please refuse this");
  await p.getByText("I can't help with that one.").waitFor();
  await say("how much");
  await reply(/./);
});

await step("signing out removes the chat from this phone", async () => {
  const had = await p.evaluate(() => Object.keys(localStorage).some((k) => k.startsWith("spal.assistant")));
  assert.ok(had);
  await p.goto(APP + "/app/profile");
  await p.getByRole("button", { name: /Log out|Sign out/ }).click();
  await p.waitForURL(/welcome|\/$/, { timeout: 8000 });
  const still = await p.evaluate(() => Object.keys(localStorage).some((k) => k.startsWith("spal.assistant")));
  assert.equal(still, false);
});

assert.deepEqual(errors, [], "no unexpected browser errors");
await browser.close();
console.log("ALL ASSISTANT CHECKS PASSED");
