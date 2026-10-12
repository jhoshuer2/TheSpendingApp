// The in-page layout and accessibility rules, shared by every check that takes screenshots.
// Runs inside the browser: pass it to page.evaluate.
export function pageIssues() {
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
}
