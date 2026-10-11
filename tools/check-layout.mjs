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

const SCREENS = [
  { name: "splash", path: "/", holdSplash: true },
  { name: "welcome-1", path: "/welcome" },
  { name: "welcome-2", path: "/welcome", act: async (p) => p.getByRole("button", { name: "Next" }).click() },
  { name: "welcome-3", path: "/welcome", act: async (p) => { await p.getByRole("button", { name: "Next" }).click(); await p.getByRole("button", { name: "Next" }).click(); } },
  { name: "signup", path: "/signup" },
  { name: "signup-errors", path: "/signup", act: async (p) => p.getByRole("button", { name: "Create account" }).click() },
  { name: "login", path: "/login" },
  { name: "onboarding", path: "/onboarding", authed: true },
  { name: "today", path: "/app/today", authed: true },
  { name: "profile", path: "/app/profile", authed: true },
  { name: "not-found", path: "/nope" },
];

const failures = [];
const browser = await chromium.launch({ executablePath: chromePath(), args: ["--no-sandbox"] });

for (const [w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: w < 600, serviceWorkers: "block" });
  for (const s of SCREENS) {
    const page = await ctx.newPage();
    // Keep the splash on screen: ignore its 1200ms auto-navigation timer.
    if (s.holdSplash) await page.addInitScript(() => { const st = window.setTimeout; window.setTimeout = (fn, ms, ...a) => (ms === 1200 ? 0 : st(fn, ms, ...a)); });
    if (s.authed) await page.addInitScript((v) => localStorage.setItem("spal.session", v), SESSION);
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
        if (r.bottom > innerHeight + 0.5 || r.top < 0 || r.left < a.left - 0.5 || r.right > a.right + 0.5) issues.push("primary action outside viewport");
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
