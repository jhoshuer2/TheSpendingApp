// Layout and accessibility smoke check. Run `npm run build && npx vite preview --port 4173` first.
// Loads each screen at several phone sizes and fails on: horizontal overflow, touch targets < 44px,
// primary action outside the viewport, and content hidden behind the floating nav.
import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

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
  { name: "product-error", path: "/money/product/new", authed: true, seed: SEED_READY, act: async (p) => p.getByRole("button", { name: "Save product" }).click() },
  { name: "record-sale", path: "/money/record/sale/" + uuid(100), authed: true, seed: SEED_READY, books: SEED_BOOKS },
  { name: "record-owed", path: "/money/record/sale/" + uuid(142), authed: true, seed: SEED_READY, books: SEED_BOOKS },
  { name: "record-expense", path: "/money/record/expense/" + uuid(144), authed: true, seed: SEED_READY, books: SEED_BOOKS },
  { name: "module-tool", path: "/module/records-sales", authed: true, seed: SEED_READY, books: SEED_BOOKS },
  { name: "module-tool-fresh", path: "/module/records-sales", authed: true, seed: SEED_READY },
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

    const res = await page.evaluate(() => {
      const issues = [];
      const vw = window.innerWidth;
      const app = document.querySelector(".app").getBoundingClientRect();
      for (const el of document.querySelectorAll(".app *")) {
        const r = el.getBoundingClientRect();
        if (r.width && (r.right > app.right + 0.5 || r.left < app.left - 0.5) && !el.closest(".screen__body")) {
          issues.push(`overflow-x: <${el.tagName.toLowerCase()} class="${el.className}">`);
        }
      }
      // The app column must be the same width on every screen: min(480, viewport).
      const expected = Math.min(480, vw);
      if (Math.abs(app.width - expected) > 1) issues.push(`app column is ${Math.round(app.width)}px wide, expected ${expected}px`);
      const body = document.querySelector(".screen__body");
      if (body && body.scrollWidth > body.clientWidth + 1) issues.push(`body scrolls horizontally (${body.scrollWidth} > ${body.clientWidth})`);

      const targets = document.querySelectorAll("button, a[href], input, [role=button]");
      for (const el of targets) {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        if (r.width < 43.5 || r.height < 43.5) issues.push(`tap target ${Math.round(r.width)}x${Math.round(r.height)}: ${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") || el.textContent || el.id).trim().slice(0, 30)}"`);
      }
      for (const el of document.querySelectorAll(".btn--primary")) {
        const r = el.getBoundingClientRect();
        const a = document.querySelector(".app").getBoundingClientRect();
        // In a footer it must be fully on screen. Inside scrolling content it must at least start on screen.
        const inBody = Boolean(el.closest(".screen__body"));
        const lowest = inBody ? r.top + 24 : r.bottom;
        if (lowest > innerHeight + 0.5 || r.top < 0 || r.left < a.left - 0.5 || r.right > a.right + 0.5) issues.push("primary action outside viewport");
      }
      // content vs floating nav
      const nav = document.querySelector(".nav__bar");
      if (nav && body) {
        body.scrollTop = body.scrollHeight;
        const last = [...body.querySelectorAll("*")].filter((e) => e.getBoundingClientRect().height).pop();
        if (last && last.getBoundingClientRect().bottom > nav.getBoundingClientRect().top - 4) issues.push("content hidden behind nav");
        body.scrollTop = 0;
      }
      const heading = document.querySelector("h1, h2");
      const fs = heading ? getComputedStyle(heading).fontFamily : "Satoshi";
      if (!/Satoshi/.test(fs)) issues.push(`heading font is not Satoshi: ${fs}`);
      return issues;
    });
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
