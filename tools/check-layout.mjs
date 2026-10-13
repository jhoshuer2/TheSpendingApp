// Layout and accessibility smoke check. Run `npm run build && npx vite preview --port 4173` first.
// Loads each screen at several phone sizes and fails on: horizontal overflow, touch targets < 44px,
// primary action outside the viewport, and content hidden behind the floating nav.
import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pageIssues } from "./layout-rules.mjs";

const BASE = process.env.BASE_URL ?? "http://localhost:4173";
const OUT = new URL("./out/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

function chromePath() {
  if (process.env.CHROME) return process.env.CHROME;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH ?? "/opt/pw-browsers";
  // Prefer the standalone headless shell; the full chrome binary no longer supports old headless mode.
  const dirs = readdirSync(root).filter((d) => d.startsWith("chromium")).sort((a) => (a.includes("headless_shell") ? -1 : 1));
  for (const dir of dirs) {
    for (const rel of ["chrome-linux/headless_shell", "chrome-linux/chrome"]) {
      const p = join(root, dir, rel);
      if (existsSync(p)) return p;
    }
  }
  throw new Error("No Chromium found; set CHROME=<path>");
}

const VIEWPORTS = [
  [320, 568], [360, 640], [375, 667], [390, 844], [430, 932], [768, 1024], [1280, 800],
];
const SESSION = JSON.stringify({ name: "Ada Okafor", email: "ada@example.com" });
const PROFILE_KEY = "spal.profile.v1:ada@example.com";
const BOOKS_KEY = "spal.records.v1:ada@example.com";
const ANSWERS = { stage: "y1to3", goal: "customers", type: "food", team: "solo", sales: "k100to500", have: ["registered", "bank"], pain: "customers" };
const nowIso = new Date().toISOString();
// An onboarded person with one finished step and one in progress.
const SEED_READY = JSON.stringify({
  answers: ANSWERS, completed: true,
  progress: { "setup-name": { steps: [0, 1, 2, 3], doneAt: nowIso }, "customers-ask": { steps: [0, 1] } },
});
const ago = (days, hour = 10) => { const d = new Date(); d.setDate(d.getDate() - days); d.setHours(hour, 0, 0, 0); return d.toISOString(); };
const dayKey = (days) => { const d = new Date(); d.setDate(d.getDate() - days); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
// Three finished steps in other areas, active this week, and a hidden step: shows the gap card, week strip and milestones.
const SEED_RICH = JSON.stringify({
  answers: ANSWERS, completed: true,
  progress: {
    "records-sales": { steps: [0, 1, 2, 3], doneAt: ago(5), openedAt: ago(7) },
    "direction-goal": { steps: [0, 1, 2, 3], doneAt: ago(3), openedAt: ago(4) },
    "brand-look": { steps: [0, 1, 2], doneAt: ago(2), openedAt: ago(3) },
    "online-store": { steps: [0], openedAt: ago(1) },
    "customers-offer": { steps: [], dismissed: true },
    "customers-referral": { steps: [], snoozedUntil: ago(-4) },
  },
  activity: { days: [dayKey(5), dayKey(3), dayKey(2), dayKey(1), dayKey(0)], learning: true, lastSeen: ago(0, 8) },
});
// Back after six days away, partway through a step.
const SEED_RETURNING = JSON.stringify({
  answers: ANSWERS, completed: true,
  progress: { "customers-ask": { steps: [0, 1], openedAt: ago(9) } },
  activity: { days: [dayKey(9), dayKey(8)], learning: true, lastSeen: ago(6) },
});
// Learning switched off.
const SEED_NO_LEARNING = JSON.stringify({ answers: ANSWERS, completed: true, progress: { "setup-name": { steps: [0, 1, 2, 3], doneAt: ago(2) } }, activity: { days: [], learning: false } });
// A busy shop: products, two weeks of sales (some by product, one owed), and spending in several categories.
const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const SEED_BOOKS = (() => {
  const products = {}, sales = {}, expenses = {};
  [["Jollof rice (plate)", 250000, 140000], ["Fried rice (plate)", 270000, 150000], ["Zobo (bottle)", 60000, 30000], ["Chicken piece", 150000, 110000]].forEach(([name, price, cost], i) => {
    products[uuid(i + 1)] = { id: uuid(i + 1), name, price, cost };
  });
  let n = 100;
  for (let d = 0; d < 14; d++) {
    for (let k = 0; k < 3; k++) {
      const id = uuid(n++);
      const p = products[uuid(1 + ((d + k) % 4))];
      const qty = 1 + ((d + k) % 3);
      sales[id] = { id, at: ago(d, 9 + k * 3), amount: p.price * qty, items: [{ productId: p.id, name: p.name, qty, unitPrice: p.price }], paid: true, paidAt: ago(d, 9 + k * 3) };
    }
  }
  const owedId = uuid(n++);
  sales[owedId] = { id: owedId, at: ago(2), amount: 1850000, items: [], note: "Catering for naming ceremony", customer: "Mrs Adebayo", paid: false };
  const quick = uuid(n++);
  sales[quick] = { id: quick, at: ago(0, 8), amount: 450000, items: [], note: "Cake order", paid: true, paidAt: ago(0, 8) };
  [["stock", 1850000, "Rice, oil and tomatoes"], ["transport", 320000, "Market runs"], ["data", 150000, ""], ["staff", 900000, "Helper, this week"], ["stock", 1400000, "Chicken and spices"]].forEach(([category, amount, note], i) => {
    const id = uuid(n++);
    expenses[id] = { id, at: ago(i, 15), amount, category, ...(note ? { note } : {}) };
  });
  return JSON.stringify({ products, sales, expenses, dirty: { products: [], sales: [], expenses: [] } });
})();
// The same shop with its stock counted: one plenty, one running low, one out, one not tracked.
const SEED_STOCK = (() => {
  const b = JSON.parse(SEED_BOOKS);
  const counted = ago(20);
  [[1, 80, 10], [2, 12, 10], [3, 0, 5]].forEach(([i, stock, lowAt]) => { Object.assign(b.products[uuid(i)], { stock, countedAt: counted, lowAt }); });
  return JSON.stringify(b);
})();
// The same shop with named customers (some with phone numbers), a few unpaid, and one saved customer with no sales yet.
const keyFor = (name) => "n_" + Buffer.from(name.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim()).toString("base64url");
const SEED_CUSTOMERS = (() => {
  const b = JSON.parse(SEED_BOOKS);
  const names = ["Mrs Adebayo", "Chinedu Okonkwo-Eze", "Tolu Bakare", "Mama Tosin", "Alhaji Musa", "Funmilayo Adeyemi-Johnson", "Ngozi", "Bayo", "Kemi A."];
  Object.values(b.sales).filter((s) => s.paid).slice(0, 27).forEach((s, i) => { s.customer = names[i % names.length]; });
  for (const i of [3, 10, 17]) { const s = Object.values(b.sales).filter((x) => x.customer && x.paid)[i]; if (s) { s.paid = false; delete s.paidAt; } }
  b.customers = {
    [uuid(300)]: { id: uuid(300), name: "Mrs Adebayo", phone: "0803 123 4567", note: "Catering client. Pays after the event." },
    [uuid(301)]: { id: uuid(301), name: "Chinedu Okonkwo-Eze", phone: "+234 802 000 1111" },
    [uuid(302)]: { id: uuid(302), name: "Never Bought Yet" },
  };
  b.dirty.customers = [];
  return JSON.stringify(b);
})();
const NO_PHONE = Object.values(JSON.parse(SEED_CUSTOMERS).sales).find((s) => !s.paid && s.customer && !["Mrs Adebayo", "Chinedu Okonkwo-Eze"].includes(s.customer))?.customer;
const CUST_SALE = Object.values(JSON.parse(SEED_CUSTOMERS).sales).find((s) => s.customer === "Mrs Adebayo" && s.paid)?.id;
// The same person, with facts about their business filled in (some deliberately long, to test wrapping).
const SEED_BIZ = (() => {
  const d = JSON.parse(SEED_READY);
  d.answers = { ...d.answers, businessName: "Funmilayo Adeyemi-Johnson's Home Kitchen and Catering", about: "Home-cooked jollof rice, fried rice, zobo and small chops for events, made fresh every day.", place: "12 Herbert Macaulay Way, Yaba, Lagos", hours: "Mon to Sat, 10am to 6pm", instagram: "funmilayo.homekitchen" };
  return JSON.stringify(d);
})();
const SEED_PRODUCTS_ONLY = JSON.stringify({ products: { [uuid(1)]: { id: uuid(1), name: "Jollof rice (plate)", price: 250000, cost: 140000 }, [uuid(2)]: { id: uuid(2), name: "Zobo (bottle)", price: 60000 } }, sales: {}, expenses: {}, dirty: { products: [], sales: [], expenses: [] } });
// Answers given, onboarding not finished yet.
const SEED_PARTIAL = JSON.stringify({ answers: ANSWERS, completed: false, progress: {} });

const pick = (name) => async (p) => p.getByRole("radio", { name }).click();
const key = (k) => async (p) => { for (const x of k) await p.getByRole("button", { name: x, exact: true }).click(); };
const SALE = ["4", "Three zeros"];
const cont = async (p) => p.getByRole("button", { name: /Continue|Finish/ }).click();
const walk = (steps) => async (p) => { for (const s of steps) { await s(p); await cont(p); } };

const SCREENS = [
  { name: "splash", path: "/", hold: true },
  { name: "welcome-1", path: "/welcome" },
  { name: "welcome-2", path: "/welcome", act: async (p) => p.getByRole("button", { name: "Next" }).click() },
  { name: "welcome-3", path: "/welcome", act: async (p) => { await p.getByRole("button", { name: "Next" }).click(); await p.getByRole("button", { name: "Next" }).click(); } },
  { name: "signup", path: "/signup" },
  { name: "signup-errors", path: "/signup", act: async (p) => p.getByRole("button", { name: "Create account" }).click() },
  { name: "login", path: "/login" },
  { name: "forgot-password", path: "/forgot-password" },
  { name: "reset-expired", path: "/reset-password" },
  { name: "q-stage", path: "/onboarding", authed: true },
  { name: "q-stage-picked", path: "/onboarding", authed: true, act: pick(/running 1 to 3/) },
  {
    name: "q-have", path: "/onboarding", authed: true,
    act: async (p) => {
      await walk([pick(/running 1 to 3/), pick(/Get more customers/), pick(/Food and drinks/), pick(/Just me/), pick(/Under/)])(p);
      await p.getByRole("checkbox", { name: /registered business name/ }).click();
      await p.getByRole("checkbox", { name: /logo/ }).click();
    },
  },
  { name: "building", path: "/onboarding/building", authed: true, seed: SEED_PARTIAL, hold: true },
  { name: "summary", path: "/onboarding/summary", authed: true, seed: SEED_PARTIAL },
  { name: "today", path: "/app/today", authed: true, seed: SEED_READY },
  { name: "module-progress", path: "/module/customers-ask", authed: true, seed: SEED_READY },
  { name: "module-finished", path: "/module/setup-name", authed: true, seed: SEED_READY },
  { name: "today-rich", path: "/app/today", authed: true, seed: SEED_RICH },
  { name: "today-welcome-back", path: "/app/today", authed: true, seed: SEED_RETURNING },
  { name: "today-toast", path: "/app/today", authed: true, seed: SEED_RICH, act: async (p) => p.getByRole("button", { name: "Not now" }).click() },
  { name: "today-no-learning", path: "/app/today", authed: true, seed: SEED_NO_LEARNING },
  { name: "journey-rich", path: "/app/journey", authed: true, seed: SEED_RICH },
  { name: "journey-no-learning", path: "/app/journey", authed: true, seed: SEED_NO_LEARNING },
  { name: "profile-rich", path: "/app/profile", authed: true, seed: SEED_RICH },
  { name: "profile-forget", path: "/app/profile", authed: true, seed: SEED_RICH, act: async (p) => p.getByRole("button", { name: "Forget what SPAL has noticed" }).click() },
  { name: "money-empty", path: "/app/money", authed: true, seed: SEED_READY },
  { name: "money", path: "/app/money", authed: true, seed: SEED_READY, books: SEED_BOOKS },
  { name: "money-month", path: "/app/money", authed: true, seed: SEED_READY, books: SEED_BOOKS, act: async (p) => p.getByRole("radio", { name: "This month" }).click() },
  { name: "sale", path: "/money/sale", authed: true, seed: SEED_READY },
  { name: "sale-typed", path: "/money/sale", authed: true, seed: SEED_READY, act: key(SALE) },
  { name: "sale-owes", path: "/money/sale", authed: true, seed: SEED_READY, act: async (p) => { await key(SALE)(p); await p.getByRole("radio", { name: "Owes me" }).click(); await p.getByRole("radio", { name: "Another day" }).click(); } },
  { name: "sale-error", path: "/money/sale", authed: true, seed: SEED_READY, act: async (p) => { await key(["5"])(p); await p.getByRole("radio", { name: "Owes me" }).click(); await p.getByRole("button", { name: /^Record/ }).click(); } },
  { name: "sale-products", path: "/money/sale", authed: true, seed: SEED_READY, books: SEED_BOOKS, act: async (p) => { await p.getByRole("radio", { name: "Pick products" }).click(); await p.getByRole("button", { name: "Add one Jollof rice (plate)" }).click(); await p.getByRole("button", { name: "Add one Jollof rice (plate)" }).click(); await p.getByRole("button", { name: "Add one Zobo (bottle)" }).click(); } },
  { name: "sale-no-products", path: "/money/sale", authed: true, seed: SEED_READY, act: async (p) => p.getByRole("radio", { name: "Pick products" }).click() },
  { name: "expense", path: "/money/expense", authed: true, seed: SEED_READY },
  { name: "expense-picked", path: "/money/expense", authed: true, seed: SEED_READY, act: async (p) => { await key(["1", "Three zeros"])(p); await p.getByRole("radio", { name: "Transport" }).click(); } },
  { name: "products-empty", path: "/money/products", authed: true, seed: SEED_READY },
  { name: "products", path: "/money/products", authed: true, seed: SEED_READY, books: SEED_BOOKS },
  { name: "product-new", path: "/money/product/new", authed: true, seed: SEED_READY },
  { name: "product-edit", path: "/money/product/" + uuid(1), authed: true, seed: SEED_READY, books: SEED_BOOKS },
  { name: "money-stock", path: "/app/money", authed: true, seed: SEED_READY, books: SEED_STOCK },
  { name: "products-stock", path: "/money/products", authed: true, seed: SEED_READY, books: SEED_STOCK },
  { name: "product-edit-stock", path: "/money/product/" + uuid(1), authed: true, seed: SEED_READY, books: SEED_STOCK },
  { name: "product-track-on", path: "/money/product/new", authed: true, seed: SEED_READY, act: async (p) => p.getByRole("switch", { name: /Track how many I have/ }).click() },
  { name: "product-track-error", path: "/money/product/new", authed: true, seed: SEED_READY, act: async (p) => { await p.getByRole("switch", { name: /Track how many I have/ }).click(); await p.getByRole("button", { name: "Save product" }).click(); } },
  { name: "stock-count", path: "/money/stock", authed: true, seed: SEED_READY, books: SEED_STOCK },
  { name: "stock-count-empty", path: "/money/stock", authed: true, seed: SEED_READY, books: SEED_BOOKS },
  { name: "sale-stock-warning", path: "/money/sale", authed: true, seed: SEED_READY, books: SEED_STOCK, act: async (p) => { await p.getByRole("radio", { name: "Pick products" }).click(); await p.getByRole("button", { name: "Add one Fried rice (plate)" }).click(); for (let i = 0; i < 4; i++) await p.getByRole("button", { name: "Add one Zobo (bottle)" }).click(); } },
  { name: "product-error", path: "/money/product/new", authed: true, seed: SEED_READY, act: async (p) => p.getByRole("button", { name: "Save product" }).click() },
  { name: "record-sale", path: "/money/record/sale/" + uuid(100), authed: true, seed: SEED_READY, books: SEED_BOOKS },
  { name: "record-owed", path: "/money/record/sale/" + uuid(142), authed: true, seed: SEED_READY, books: SEED_BOOKS },
  { name: "record-expense", path: "/money/record/expense/" + uuid(144), authed: true, seed: SEED_READY, books: SEED_BOOKS },
  { name: "module-tool", path: "/module/records-sales", authed: true, seed: SEED_READY, books: SEED_BOOKS },
  { name: "module-tool-fresh", path: "/module/records-sales", authed: true, seed: SEED_READY },
  { name: "customers-empty", path: "/money/customers", authed: true, seed: SEED_READY },
  { name: "customers", path: "/money/customers", authed: true, seed: SEED_READY, books: SEED_CUSTOMERS },
  { name: "customer-owing", path: "/money/customer/" + uuid(300), authed: true, seed: SEED_READY, books: SEED_CUSTOMERS },
  { name: "customer-derived", path: "/money/customer/" + keyFor("Funmilayo Adeyemi-Johnson"), authed: true, seed: SEED_READY, books: SEED_CUSTOMERS },
  { name: "customer-no-sales", path: "/money/customer/" + uuid(302), authed: true, seed: SEED_READY, books: SEED_CUSTOMERS },
  { name: "customer-new", path: "/money/customer/new/edit", authed: true, seed: SEED_READY },
  { name: "customer-edit", path: "/money/customer/" + uuid(300) + "/edit", authed: true, seed: SEED_READY, books: SEED_CUSTOMERS },
  { name: "customer-error", path: "/money/customer/new/edit", authed: true, seed: SEED_READY, act: async (p) => p.getByRole("button", { name: "Save customer" }).click() },
  { name: "customer-error-phone", path: "/money/customer/new/edit", authed: true, seed: SEED_READY, act: async (p) => { await p.getByLabel("Name").fill("Tolu"); await p.getByLabel("Phone number (optional)").fill("0803"); await p.getByRole("button", { name: "Save customer" }).click(); } },
  { name: "message-reminder", path: "/money/message/reminder/" + uuid(300), authed: true, seed: SEED_READY, books: SEED_CUSTOMERS },
  { name: "message-reminder-pidgin", path: "/money/message/reminder/" + uuid(300), authed: true, seed: SEED_READY, books: SEED_CUSTOMERS, act: async (p) => { await p.getByRole("radio", { name: "Pidgin" }).click(); await p.getByRole("radio", { name: "Firm" }).click(); } },
  { name: "message-reminder-no-phone", path: "/money/message/reminder/" + keyFor(NO_PHONE), authed: true, seed: SEED_READY, books: SEED_CUSTOMERS },
  { name: "message-receipt", path: "/money/message/receipt/" + CUST_SALE, authed: true, seed: SEED_READY, books: SEED_CUSTOMERS },
  { name: "message-receipt-plain", path: "/money/message/receipt/" + uuid(100), authed: true, seed: SEED_READY, books: SEED_CUSTOMERS },
  { name: "sale-customer-chips", path: "/money/sale", authed: true, seed: SEED_READY, books: SEED_CUSTOMERS },
  { name: "record-owed-customer", path: "/money/record/sale/" + uuid(142), authed: true, seed: SEED_READY, books: SEED_CUSTOMERS },
  { name: "write-hub", path: "/write", authed: true, seed: SEED_READY },
  { name: "write-hub-known", path: "/write", authed: true, seed: SEED_BIZ, books: SEED_CUSTOMERS },
  { name: "write-prices", path: "/write/prices", authed: true, seed: SEED_BIZ, books: SEED_CUSTOMERS },
  { name: "write-prices-empty", path: "/write/prices", authed: true, seed: SEED_READY },
  { name: "write-prices-pidgin", path: "/write/prices", authed: true, seed: SEED_BIZ, books: SEED_CUSTOMERS, act: async (p) => p.getByRole("radio", { name: "Pidgin" }).click() },
  { name: "write-greeting", path: "/write/greeting", authed: true, seed: SEED_BIZ },
  { name: "write-greeting-plain", path: "/write/greeting", authed: true, seed: SEED_READY },
  { name: "write-away", path: "/write/away", authed: true, seed: SEED_BIZ },
  { name: "business", path: "/business", authed: true, seed: SEED_BIZ },
  { name: "register-empty", path: "/business/register", authed: true, seed: SEED_READY },
  { name: "register", path: "/business/register", authed: true, seed: SEED_BIZ },
  { name: "register-nudge", path: "/business/register", authed: true, seed: SEED_BIZ, act: async (p) => { await p.getByLabel("Second choice").fill("Ada National and Federal Foods"); await p.getByRole("checkbox", { name: /A valid ID/ }).click(); } },
  { name: "register-error", path: "/business/register", authed: true, seed: SEED_BIZ, act: async (p) => { await p.getByLabel("Registration number").fill("12"); await p.getByRole("button", { name: "Save", exact: true }).click(); } },
  { name: "register-done", path: "/business/register", authed: true, seed: SEED_BIZ, act: async (p) => { await p.getByLabel("Registration number").fill("BN 1234567"); await p.getByLabel("Date registered (optional)").fill("2026-09-01"); await p.getByRole("button", { name: "Save", exact: true }).click(); } },
  { name: "module-register", path: "/module/setup-register", authed: true, seed: SEED_READY },
  { name: "business-empty", path: "/business", authed: true, seed: SEED_READY },
  { name: "business-error", path: "/business", authed: true, seed: SEED_READY, act: async (p) => { await p.getByLabel("Instagram").fill("not a handle!"); await p.getByRole("button", { name: "Save" }).click(); } },
  { name: "profile-business", path: "/app/profile", authed: true, seed: SEED_BIZ },
  { name: "module-draft", path: "/module/online-whatsapp", authed: true, seed: SEED_READY },
  { name: "module-draft-instagram", path: "/module/online-instagram", authed: true, seed: SEED_READY },
  { name: "library", path: "/app/library", authed: true, seed: SEED_READY },
  { name: "library-rich", path: "/app/library", authed: true, seed: SEED_RICH },
  { name: "journey", path: "/app/journey", authed: true, seed: SEED_READY },
  { name: "journey-empty", path: "/app/journey", authed: true, seed: JSON.stringify({ answers: ANSWERS, completed: true, progress: {} }) },
  { name: "profile", path: "/app/profile", authed: true, seed: SEED_READY },
  { name: "not-found", path: "/nope" },
];

const failures = [];
const browser = await chromium.launch({ executablePath: chromePath(), args: ["--no-sandbox"] });

for (const [w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: w < 600, serviceWorkers: "block" });
  for (const s of SCREENS) {
    const page = await ctx.newPage();
    // Keep timed screens (splash, "building") on screen: ignore their auto-navigation timers.
    if (s.hold) await page.addInitScript(() => { const st = window.setTimeout; window.setTimeout = (fn, ms, ...a) => (ms === 1200 || ms === 2000 ? 0 : st(fn, ms, ...a)); });
    if (s.authed) await page.addInitScript((v) => localStorage.setItem("spal.session", v), SESSION);
    // Each screen starts from exactly the data it asks for. Screens share one browser context, so without
    // this, books or progress seeded for one screen would leak into the next.
    await page.addInitScript(([pk, pv, bk, bv]) => {
      for (const [k, v] of [[pk, pv], [bk, bv]]) { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); }
    }, [PROFILE_KEY, s.seed ?? null, BOOKS_KEY, s.books ?? null]);
    await page.goto(BASE + s.path, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    if (s.act) await s.act(page);
    await page.waitForTimeout(450); // let entrance animations settle

    const res = await page.evaluate(pageIssues);
    for (const i of res) failures.push(`${w}x${h} ${s.name}: ${i}`);
    await page.screenshot({ path: `${OUT}${s.name}-${w}x${h}.png` });
    await page.close();
  }
  await ctx.close();
}
await browser.close();

if (failures.length) {
  console.error(`\n${failures.length} layout issue(s):\n` + [...new Set(failures)].map((f) => " - " + f).join("\n"));
  process.exit(1);
}
console.log(`Layout check passed: ${SCREENS.length} screens x ${VIEWPORTS.length} viewports. Screenshots in tools/out/`);
