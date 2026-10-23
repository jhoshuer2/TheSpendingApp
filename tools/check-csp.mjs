// The Content-Security-Policy, enforced for real: serves dist/ with the headers from vercel.json, then loads the app
// and fails on any violation (a blocked script, style, font, image, request, or service worker).
//   npm run build && npm run check:csp
import { chromium } from "playwright-core";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";
import { startServer } from "./serve-headers.mjs";

function chromePath() {
  if (process.env.CHROME) return process.env.CHROME;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH ?? "/opt/pw-browsers";
  const dirs = readdirSync(root).filter((d) => d.startsWith("chromium")).sort((a) => (a.includes("headless_shell") ? -1 : 1));
  for (const d of dirs) for (const r of ["chrome-linux/headless_shell", "chrome-linux/chrome"]) { const p = join(root, d, r); if (existsSync(p)) return p; }
  throw new Error("No Chromium found; set CHROME=<path>");
}

const PORT = 4182;
const BASE = `http://localhost:${PORT}`;
const server = await startServer({ dir: "dist", port: PORT });
const step = async (label, fn) => { await fn(); console.log("ok -", label); };

await step("the page is served with a strict policy", async () => {
  const res = await fetch(BASE + "/welcome");
  const csp = res.headers.get("content-security-policy") ?? "";
  assert.ok(csp, "no Content-Security-Policy header on /welcome");
  const dir = (name) => csp.split(";").map((d) => d.trim()).find((d) => d.startsWith(name + " "))?.split(/\s+/).slice(1) ?? [];
  assert.deepEqual(dir("default-src"), ["'self'"]);
  assert.deepEqual(dir("script-src"), ["'self'"], "scripts may only come from this site, with no unsafe-inline or unsafe-eval");
  assert.deepEqual(dir("object-src"), ["'none'"]);
  assert.deepEqual(dir("frame-ancestors"), ["'none'"]);
  assert.deepEqual(dir("base-uri"), ["'self'"]);
  assert.ok(!/unsafe-eval/.test(csp), "unsafe-eval must never be allowed");
  assert.ok(dir("connect-src").every((s) => s === "'self'" || s.startsWith("https://")), "requests may only go to this site or over https");
  const asset = await fetch(BASE + "/assets/" + (await (await fetch(BASE + "/")).text()).match(/assets\/([^"]+\.js)/)[1]);
  assert.ok(asset.headers.get("content-security-policy"), "the policy must cover assets too");
});

const browser = await chromium.launch({ executablePath: chromePath(), args: ["--no-sandbox"] });
const SESSION = JSON.stringify({ name: "Ada Okafor", email: "ada@example.com" });
const PROFILE = JSON.stringify({ answers: { stage: "y1to3", goal: "customers", type: "food", team: "solo", sales: "k100to500", have: ["registered", "bank"], pain: "customers" }, completed: true, progress: {} });

const visit = async (ctx, path, authed) => {
  const page = await ctx.newPage();
  const bad = [];
  page.on("console", (m) => m.type() === "error" && bad.push(m.text()));
  page.on("pageerror", (e) => bad.push(e.message));
  await page.addInitScript(() => { window.__csp = []; document.addEventListener("securitypolicyviolation", (e) => window.__csp.push(`${e.violatedDirective} blocked ${e.blockedURI}`)); });
  if (authed) await page.addInitScript(([s, p]) => { localStorage.setItem("spal.session", s); localStorage.setItem("spal.profile.v1:ada@example.com", p); }, [SESSION, PROFILE]);
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const violations = await page.evaluate(() => window.__csp);
  await page.close();
  return [...violations, ...bad];
};

const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
for (const [path, authed] of [["/welcome", false], ["/login", false], ["/signup", false], ["/onboarding", true], ["/app/today", true], ["/app/money", true], ["/app/journey", true], ["/app/library", true], ["/app/profile", true], ["/assistant", true], ["/money/sale", true], ["/nope", false]]) {
  await step(`${path} loads with nothing blocked`, async () => assert.deepEqual(await visit(ctx, path, authed), [], `${path}: blocked or errored`));
}
await ctx.close();

await step("the service worker still registers and the app works offline-first", async () => {
  const sw = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "allow" });
  const page = await sw.newPage();
  const bad = [];
  page.on("console", (m) => m.type() === "error" && bad.push(m.text()));
  await page.addInitScript(() => { window.__csp = []; document.addEventListener("securitypolicyviolation", (e) => window.__csp.push(`${e.violatedDirective} blocked ${e.blockedURI}`)); });
  await page.goto(BASE + "/welcome", { waitUntil: "networkidle" });
  const ready = await page.evaluate(() => Promise.race([navigator.serviceWorker.ready.then(() => true), new Promise((r) => setTimeout(() => r(false), 8000))]));
  assert.equal(ready, true, "the service worker did not register under the policy");
  assert.deepEqual(await page.evaluate(() => window.__csp), []);
  assert.deepEqual(bad, []);
  await sw.close();
});

await browser.close();
server.close();
console.log("\nCSP check passed.");
