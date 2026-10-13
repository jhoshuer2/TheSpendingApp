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

await step("learning data is saved on the server and follows you to another device", async () => {
  const saved = await poll("activity saved", async () => {
    const st = await state();
    return st.profiles.find((x) => x.name === "Ada Okafor")?.active_days?.length ? st : null;
  });
  const prof = saved.profiles.find((x) => x.name === "Ada Okafor");
  assert.equal(prof.learning, true);
  assert.ok(prof.last_seen, "last_seen should be saved");
  assert.ok(saved.step_progress.some((r) => r.opened_at), "opened_at should be saved");

  // Device A says "not for me" to the next step; it reaches the server and device B sees it hidden.
  await A.p.goto(APP + "/app/today");
  await A.p.getByRole("button", { name: "Not for me" }).click();
  await poll("dismissal saved", async () => (await state()).step_progress.some((r) => r.dismissed === true));
  await B.p.goto(APP + "/app/profile");
  await B.p.getByText("Hidden for good").waitFor({ timeout: 8000 });

  // B brings it back; the server follows.
  await B.p.getByRole("button", { name: "Bring back" }).click();
  await poll("restore saved", async () => !(await state()).step_progress.some((r) => r.dismissed === true));

  // Turning learning off is saved too (and back on, so later steps behave normally).
  const sw = () => B.p.getByRole("switch", { name: /Learn from how I use SPAL/ });
  await sw().click();
  await poll("learning off saved", async () => (await state()).profiles.find((x) => x.name === "Ada Okafor").learning === false);
  await sw().click();
  await poll("learning on saved", async () => (await state()).profiles.find((x) => x.name === "Ada Okafor").learning === true);
});

const sales = async () => (await state()).sales;
const key = async (p, ...ks) => { for (const k of ks) await p.getByRole("button", { name: k, exact: true }).click(); };

await step("a sale recorded on one device appears on another, and a deletion follows", async () => {
  await A.p.goto(APP + "/app/money");
  await A.p.getByRole("button", { name: "Record a sale" }).first().click();
  await key(A.p, "4", "5", "0", "0");
  await A.p.getByRole("button", { name: "Record ₦4,500" }).click();
  await A.p.waitForURL("**/app/money");
  const row = await poll("sale saved", async () => (await sales()).find((r) => r.amount === 450000));
  assert.equal(row.paid, true);
  assert.deepEqual(row.items, []);
  assert.equal(row.deleted_at, null);
  assert.ok(row.id && row.user_id);
  await B.p.goto(APP + "/app/money");
  await B.p.getByText("Sale", { exact: true }).first().waitFor({ timeout: 8000 });
  await B.p.getByRole("link", { name: /4,500 naira/ }).first().waitFor();
  // Delete on A; B learns about it.
  await A.p.getByRole("link", { name: /4,500 naira/ }).first().click();
  await A.p.getByRole("button", { name: /Delete this sale/ }).click();
  await poll("deletion saved", async () => (await sales()).find((r) => r.amount === 450000)?.deleted_at);
  await B.p.reload();
  await B.p.getByText("Record your first sale").waitFor({ timeout: 8000 });
});

await step("offline: sales and expenses are kept on the phone and sent once, when back online", async () => {
  await fake("offline?on=1");
  await A.p.getByRole("button", { name: "Record a sale" }).first().click();
  await key(A.p, "2", "Three zeros");
  await A.p.getByRole("button", { name: "Record ₦2,000" }).click();
  await A.p.waitForURL("**/app/money");
  await A.p.getByRole("link", { name: /2,000 naira/ }).first().waitFor();
  await A.p.waitForTimeout(1200);
  assert.ok(!(await sales()).some((r) => r.amount === 200000), "offline sale reached the server");
  await A.p.getByRole("link", { name: "Profile" }).click();
  await A.p.getByText(/Waiting for a connection/).waitFor();
  await fake("offline?on=0");
  await A.p.evaluate(() => { window.dispatchEvent(new Event("online")); window.dispatchEvent(new Event("online")); });
  await poll("offline sale synced", async () => (await sales()).some((r) => r.amount === 200000));
  await A.p.waitForTimeout(1500);
  assert.equal((await sales()).filter((r) => r.amount === 200000).length, 1, "sent more than once");
  await A.p.getByText("All changes saved").waitFor();
});

await step("a big set of books loads completely (2,500 sales, three pages), and the next load only asks for what changed", async () => {
  await fake("seed-sales?email=ada@example.com&n=2500");
  const C = await device();
  await logIn(C.p, "ada@example.com", "correct-horse");
  await C.p.waitForURL("**/app/today", { timeout: 10000 });
  const count = () => C.p.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.startsWith("spal.records")); return Object.keys(JSON.parse(localStorage.getItem(k) ?? "{}").sales ?? {}).length; });
  await poll("all 2,500 loaded", async () => (await count()) >= 2500, 15000);
  const full = (await state()).log.filter((l) => l.startsWith("GET /rest/v1/sales") && !l.includes("updated_at=gte"));
  assert.ok(full.length >= 3, `a full load should page (saw ${full.length} requests)`);
  await C.p.getByRole("link", { name: "Money", exact: true }).click();
  await C.p.getByRole("button", { name: "Show earlier" }).waitFor();
  await C.p.reload();
  await C.p.getByRole("heading", { name: "Money", exact: true }).waitFor().catch(() => {});
  await poll("incremental pull", async () => (await state()).log.some((l) => l.startsWith("GET /rest/v1/sales") && l.includes("updated_at=gte")), 8000);
  await C.ctx.close();
});

await step("one record the server refuses for good doesn't block the others, and the person is told", async () => {
  await A.p.goto(APP + "/app/money");
  await fake("reject-amount?amount=777700");
  const record = async (digits, label) => {
    await A.p.getByRole("button", { name: "Record a sale" }).first().click();
    await key(A.p, ...digits);
    await A.p.getByRole("button", { name: label }).click();
    await A.p.waitForURL("**/app/money");
  };
  await record(["7", "7", "7", "7"], "Record ₦7,777");
  await record(["3", "Three zeros"], "Record ₦3,000"); // recorded after the bad one
  await poll("the good sale still reached the server", async () => (await sales()).some((r) => r.amount === 300000));
  assert.ok(!(await sales()).some((r) => r.amount === 777700), "the refused row should not be on the server");
  await A.p.goto(APP + "/app/profile");
  await A.p.getByText(/1 record couldn't be saved to your account/).waitFor({ timeout: 8000 });
  // A fresh visit gives it one more try; after that it is left alone, not retried forever. It is still on the phone.
  await A.p.waitForTimeout(3000);
  const before = (await state()).log.length;
  await A.p.waitForTimeout(2500);
  assert.equal((await state()).log.slice(before).filter((l) => l.startsWith("POST /rest/v1/sales")).length, 0, "refused row keeps being retried");
  await A.p.goto(APP + "/app/money");
  await A.p.getByRole("link", { name: /7,777 naira/ }).first().waitFor();
  await fake("reject-amount");
});

await step("products sync to the server", async () => {
  await A.p.goto(APP + "/money/product/new");
  await A.p.getByLabel("Name").fill("Jollof rice (plate)");
  await A.p.getByLabel("Price you sell it for").fill("2500");
  await A.p.getByLabel(/What it costs you/).fill("1400");
  await A.p.getByRole("button", { name: "Save product" }).click();
  const prod = await poll("product saved", async () => (await state()).products.find((r) => r.name === "Jollof rice (plate)"));
  assert.equal(prod.price, 250000);
  assert.equal(prod.cost, 140000);
  assert.equal(prod.archived, false);
});

await step("a stock count syncs to the server and appears on another device", async () => {
  await A.p.goto(APP + "/money/products");
  await A.p.getByRole("link", { name: /Jollof rice/ }).first().click();
  await A.p.getByRole("switch", { name: /Track how many I have/ }).click();
  await A.p.getByLabel("How many do you have now?").fill("12");
  await A.p.getByLabel(/Tell me when it gets low/).fill("3");
  await A.p.getByRole("button", { name: "Save product" }).click();
  const prod = await poll("stock saved", async () => (await state()).products.find((r) => r.name === "Jollof rice (plate)" && r.stock === 12));
  assert.equal(prod.low_at, 3);
  assert.ok(prod.counted_at, "a count always has a time");
  await B.p.goto(APP + "/money/products");
  await B.p.reload();
  await B.p.getByText("12 left").first().waitFor();
});

await step("customers (with a phone number) sync to the server and appear on another device; a rename follows the sales", async () => {
  await A.p.goto(APP + "/money/sale");
  await A.p.getByRole("button", { name: "Four" }).waitFor().catch(() => {});
  for (const k of ["3", "Three zeros"]) await A.p.getByRole("button", { name: k, exact: true }).click();
  await A.p.getByRole("radio", { name: "Owes me" }).click();
  await A.p.getByLabel("Who owes you?").fill("Chidi Okeke");
  await A.p.getByRole("button", { name: /^Record ₦/ }).click();
  await A.p.waitForURL("**/app/money");
  await A.p.goto(APP + "/money/customers");
  await A.p.getByRole("link", { name: /Chidi Okeke/ }).first().click();
  await A.p.getByRole("link", { name: "Add phone number" }).click();
  await A.p.getByLabel("Phone number (optional)").fill("0803 123 4567");
  await A.p.getByRole("button", { name: "Save customer" }).click();
  const cust = await poll("customer saved", async () => (await state()).customers.find((r) => r.name === "Chidi Okeke"));
  assert.equal(cust.phone, "0803 123 4567");
  assert.equal(cust.archived, false);
  await B.p.goto(APP + "/money/customers");
  await B.p.reload();
  await B.p.getByRole("link", { name: /Chidi Okeke/ }).first().click();
  await B.p.getByRole("link", { name: "Call" }).waitFor();
  assert.equal(await B.p.getByRole("link", { name: "Call" }).getAttribute("href"), "tel:+2348031234567");
  // Rename on A: the customer row and their sale change on the server together.
  await A.p.getByRole("link", { name: "Edit details" }).click();
  await A.p.getByLabel("Name").fill("Chidi Okeke-Smith");
  await A.p.getByRole("button", { name: "Save customer" }).click();
  await poll("rename reached the server", async () => {
    const st = await state();
    return st.customers.some((r) => r.name === "Chidi Okeke-Smith") && st.sales.some((r) => r.customer === "Chidi Okeke-Smith") && !st.sales.some((r) => r.customer === "Chidi Okeke");
  });
  // Later steps expect to start from a screen with the tab bar.
  await A.p.goto(APP + "/app/today");
  await B.p.goto(APP + "/app/today");
});

await step("your business facts sync to the server and appear on another device, next to your onboarding answers", async () => {
  await A.p.goto(APP + "/business");
  await A.p.getByLabel("Business name").fill("Ada's Kitchen");
  await A.p.getByLabel("Where you are").fill("Yaba, Lagos");
  await A.p.getByLabel("Instagram").fill("@ada.kitchen");
  await A.p.getByRole("button", { name: "Save" }).click();
  const row = await poll("facts saved", async () => (await state()).profiles.find((r) => r.answers?.businessName === "Ada's Kitchen"));
  assert.equal(row.answers.place, "Yaba, Lagos");
  assert.equal(row.answers.instagram, "ada.kitchen");
  assert.equal(row.answers.stage, "idea", "the onboarding answers are still there");
  await B.p.goto(APP + "/business");
  await B.p.reload();
  // The page opens from this phone's saved copy and the newer server copy arrives a moment later; the form should pick it up.
  await poll("the form shows the details from the other device", async () => (await B.p.getByLabel("Business name").inputValue()) === "Ada's Kitchen");
  assert.equal(await B.p.getByLabel("Where you are").inputValue(), "Yaba, Lagos");
  await A.p.goto(APP + "/app/today");
  await B.p.goto(APP + "/app/today");
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
  // Opening the step (online, a moment earlier) saved a row with no ticks. The offline ticks must not have arrived.
  const early = (await state()).step_progress.find((r) => r.module_id === "setup-register");
  assert.ok(!early || early.steps.length === 0, "offline ticks reached the server");
  await A.p.goto(APP + "/app/profile"); // a fresh load while offline: the unsent ticks must still be there, and still waiting
  await A.p.getByText(/Waiting for a connection/).waitFor();
  await fake("offline?on=0");
  await A.p.evaluate(() => window.dispatchEvent(new Event("online")));
  const row = await poll("synced after reconnect", async () => (await state()).step_progress.find((r) => r.module_id === "setup-register" && r.steps.length > 0));
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
