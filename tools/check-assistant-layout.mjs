// Layout and accessibility of the assistant screens, at every phone size, against the fake backend.
// (The main layout check runs in demo mode, where the assistant is unavailable.)  npm run check:assistant-layout
import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pageIssues } from "./layout-rules.mjs";

const APP = process.env.APP_URL ?? "http://localhost:4174";
const FAKE = process.env.FAKE_URL ?? "http://localhost:54321";
const OUT = new URL("./out/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
function chromePath() {
  if (process.env.CHROME) return process.env.CHROME;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH ?? "/opt/pw-browsers";
  const dirs = readdirSync(root).filter((d) => d.startsWith("chromium")).sort((a) => (a.includes("headless_shell") ? -1 : 1));
  for (const d of dirs) for (const r of ["chrome-linux/headless_shell", "chrome-linux/chrome"]) { const p = join(root, d, r); if (existsSync(p)) return p; }
  throw new Error("No Chromium found; set CHROME=<path>");
}
const fake = (path) => fetch(FAKE + "/__fake/" + path).then((r) => r.json());
const VIEWPORTS = [[320, 568], [360, 640], [375, 667], [390, 844], [430, 932], [768, 1024], [1280, 800]];
const failures = [];
const browser = await chromium.launch({ executablePath: chromePath(), args: ["--no-sandbox"] });

for (const [w, h] of VIEWPORTS) {
  await fake("reset");
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: w < 600, serviceWorkers: "block" });
  const p = await ctx.newPage();
  const say = async (t) => { await p.getByLabel("Message").fill(t); await p.getByRole("button", { name: "Send" }).click(); };
  const shot = async (name) => {
    await p.waitForTimeout(450);
    for (const i of await p.evaluate(pageIssues)) failures.push(`${w}x${h} ${name}: ${i}`);
    await p.screenshot({ path: `${OUT}assistant-${name}-${w}x${h}.png` });
  };

  await p.goto(APP + "/signup");
  await p.getByLabel("Your name").fill("Adaeze Okonkwo-Williams");
  await p.getByLabel("Email").fill("ada@example.com");
  await p.getByLabel("Password", { exact: true }).fill("correct-horse");
  await p.getByRole("button", { name: "Create account" }).click();
  await p.waitForURL("**/onboarding");
  for (const a of [/running 1 to 3/, /Get more customers/, /Food and drinks/, /Just me/, /Under/]) { await p.getByRole("radio", { name: a }).click(); await p.getByRole("button", { name: /^(Continue|Finish)/ }).click(); }
  await p.getByRole("checkbox", { name: /None of these/ }).click();
  await p.getByRole("button", { name: "Continue" }).click();
  await p.getByRole("radio", { name: /Getting customers/ }).click();
  await p.getByRole("button", { name: /^Finish/ }).click();
  await p.waitForURL("**/onboarding/summary");
  await p.getByRole("button", { name: "See my first step" }).click();
  await p.waitForURL("**/app/today");
  await shot("today-entry");
  await p.goto(APP + "/app/money");
  await p.getByRole("heading", { name: "Money", exact: true }).waitFor();
  await shot("money-entry");

  await p.goto(APP + "/assistant");
  await p.getByText("What gets shared").waitFor();
  await shot("consent");
  await p.getByRole("button", { name: "I understand" }).click();
  await p.getByLabel("Message").waitFor();
  await shot("empty");
  await say("I sold 3 plates of jollof rice with extra plantain and moi moi for ₦4,500");
  await p.getByTestId("proposal").waitFor();
  await shot("card-pending");
  await p.getByTestId("proposal").getByRole("button", { name: "Save" }).click();
  await shot("card-saved");
  await say("Chidi owes me ₦2,000");
  await p.locator(".acard--pending").waitFor();
  await p.locator(".acard--pending").getByRole("button", { name: "Save" }).click();
  await say("remind Chidi");
  await p.getByTestId("draft").waitFor();
  await p.getByText(/ready on your screen/).waitFor();
  await shot("draft");
  await say("write my instagram bio");
  await p.getByTestId("draft").nth(1).waitFor();
  await p.getByText(/Copy it when you're happy/).waitFor();
  await shot("text-draft");
  await say("how much did I make this week? Please explain in a lot of detail so the answer is long enough to wrap onto several lines on a small phone");
  await p.getByText(/This week you kept/).waitFor();
  await shot("conversation");
  await say(`${"A very long message without spaces ".repeat(3)}${"x".repeat(60)}`);
  await p.waitForTimeout(600);
  await shot("long-message");
  await fake("offline?on=1");
  await say("who owes me money?");
  await p.getByRole("button", { name: "Try again" }).waitFor({ timeout: 8000 });
  await shot("error");
  await fake("offline?on=0");
  await p.getByRole("link", { name: "Assistant settings" }).click();
  await p.getByRole("button", { name: "Clear this chat" }).waitFor();
  await shot("settings");
  await ctx.close();
}
await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} layout issue(s):\n` + [...new Set(failures)].map((f) => " - " + f).join("\n"));
  process.exit(1);
}
console.log(`Assistant layout check passed: 13 screens x ${VIEWPORTS.length} viewports. Screenshots in tools/out/`);
