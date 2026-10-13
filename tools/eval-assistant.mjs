// How well does the assistant understand English and Nigerian Pidgin? Runs the cases in eval-assistant-lib.mjs against a model
// using the SAME instructions and tools as the real function, and reports accuracy and cost per message.
//
//   ANTHROPIC_API_KEY=sk-... node tools/eval-assistant.mjs [model ...] [--effort medium] [--only pcm]
//   node tools/eval-assistant.mjs --self-test        checks the scoring itself, no key and no cost
//
// With no model named it runs claude-opus-5-5, claude-sonnet-5-5 and claude-haiku-5-5 so you can compare them.
// It spends real money (a few cents per model). Each case is a fresh conversation. Fixed fake books answer any lookups.
import assert from "node:assert/strict";
import { SYSTEM_PROMPT, TOOLS, READ_TOOLS, DRAFT_TOOLS, buildContext } from "../supabase/functions/_shared/assistant-protocol.ts";
import { CASES, FIXTURE, TODAY, costUSD, judge } from "./eval-assistant-lib.mjs";

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const effort = flag("--effort") ?? "medium";
const only = flag("--only");
const models = args.filter((a, i) => !a.startsWith("--") && !(args[i - 1] ?? "").startsWith("--"));

const [weekday, today] = TODAY.split(" ");
const ctx = (lang) => buildContext({ today, weekday, name: "Ada", businessType: "food", replyLanguage: lang });
// Every case is sent with the default reply language (English): people write in Pidgin, the assistant should understand it either way.
const langOf = (c) => (c.id.startsWith("pcm") ? "pcm" : "en");

/** What the app tells the assistant after it shows a draft (kept in step with src/assistant/engine.ts). */
const draftResult = (u) =>
  u.name === "draft_text"
    ? `A text draft ("${String(u.input?.title ?? "Draft").slice(0, 80)}") is on the person's screen. Nothing was posted or sent: they read it and copy it themselves. Offer to change it if they want.`
    : `A ${u.input?.kind} draft for ${u.input?.customer} is on the person's screen. Nothing was sent: they read it, change it if they like, and send it themselves.`;

/** Run one case to the end, answering lookups from the fixture and leaving any proposals unanswered (the person hasn't tapped Save). */
async function runCase(c, call) {
  const messages = [{ role: "user", content: [{ type: "text", text: `${ctx("en")}\n${c.say}` }] }];
  const calls = [];
  let text = "";
  const usage = { input: 0, output: 0 };
  for (let i = 0; i < 4; i++) {
    const r = await call(messages);
    usage.input += r.usage.input; usage.output += r.usage.output;
    messages.push({ role: "assistant", content: r.content });
    text += r.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
    const uses = r.content.filter((b) => b.type === "tool_use");
    calls.push(...uses);
    // A proposal (a card to save) is left for the person, so the exchange ends there. Lookups and drafts carry on: in the app the
    // assistant is told "the draft is on the person's screen, nothing was sent" and gets to say its line after it.
    if (!uses.length || uses.some((u) => !READ_TOOLS.includes(u.name) && !DRAFT_TOOLS.includes(u.name))) break;
    messages.push({ role: "user", content: uses.map((u) => ({ type: "tool_result", tool_use_id: u.id, content: DRAFT_TOOLS.includes(u.name) ? draftResult(u) : JSON.stringify(FIXTURE[u.name] ?? {}) })) });
  }
  return { calls, text, usage, problems: judge(c, calls, text) };
}

async function evaluate(model, cases, call) {
  let pass = 0, cost = 0, n = 0;
  const failed = [];
  const by = { en: [0, 0], pcm: [0, 0] };
  await Promise.all(cases.map(async (c) => {
    let res;
    try { res = await runCase(c, call); } catch (e) { res = { problems: [`error: ${String(e.message ?? e).slice(0, 120)}`], usage: { input: 0, output: 0 }, text: "", calls: [] }; }
    n++; cost += costUSD(model, res.usage) || 0;
    const l = langOf(c); by[l][1]++;
    if (res.problems.length) failed.push({ c, res }); else { pass++; by[l][0]++; }
  }));
  return { pass, n, cost, failed, by };
}

if (args.includes("--self-test")) {
  // A perfect answerer must score 100%; one that never does anything must fail every case that wants an action. This proves the scoring can fail.
  const afterResult = (messages) => Array.isArray(messages.at(-1).content) && messages.at(-1).content.some((b) => b.type === "tool_result");
  const oracle = (c) => async (messages) => {
    if (afterResult(messages)) return { content: [{ type: "text", text: "It is ready for you to check." }], usage: { input: 1000, output: 100 } };
    const sales = [], expenses = [];
    if (c.saleTotal !== undefined) sales.push({ amount: c.saleTotal, ...(c.customer ? { customer: c.customer } : {}), ...(c.unpaid ? { paid: false, customer: c.unpaid } : {}), ...(c.when ? { when: c.when } : {}) });
    if (c.expenseTotal !== undefined) expenses.push({ amount: c.expenseTotal, category: c.categories?.[0] ?? "other", ...(c.when ? { when: c.when } : {}) });
    const content = [];
    if (c.stock) content.push({ type: "text", text: "Got it, please check the card." }, { type: "tool_use", id: "t1", name: "propose_stock", input: { updates: [{ product: c.stock.product, ...(c.stock.add !== undefined ? { add: c.stock.add } : { set: c.stock.set }) }] } });
    else if (c.facts) content.push({ type: "text", text: "Want me to remember that?" }, { type: "tool_use", id: "t1", name: "propose_business_facts", input: { place: c.facts.place } });
    else if (c.draftText) content.push({ type: "text", text: "Here it is." }, { type: "tool_use", id: "t1", name: "draft_text", input: { kind: c.draftText.kind, title: "Draft", text: `Ada's Kitchen. ${c.draftText.mention}. Order on WhatsApp.` } });
    else if (c.draft) content.push({ type: "text", text: "Here is the draft." }, { type: "tool_use", id: "t1", name: "draft_message", input: { kind: c.draft.kind, customer: c.draft.customer } });
    else if (c.markPaid) content.push({ type: "tool_use", id: "t1", name: "propose_mark_paid", input: { customer: c.markPaid } });
    else if (c.tool) content.push({ type: "tool_use", id: "t1", name: c.tool, input: {} });
    else if (sales.length || expenses.length) content.push({ type: "text", text: "Please check this and tap Save." }, { type: "tool_use", id: "t1", name: "propose_records", input: { sales, expenses } });
    else content.push({ type: "text", text: "Can you tell me more?" });
    return { content, usage: { input: 1000, output: 100 } };
  };
  const idle = async () => ({ content: [{ type: "text", text: "Okay." }], usage: { input: 1000, output: 100 } });
  let ok = 0, idlePass = 0;
  for (const c of CASES) {
    if (!(await runCase(c, oracle(c))).problems.length) ok++;
    if (!(await runCase(c, idle)).problems.length) idlePass++;
  }
  assert.equal(ok, CASES.length, "a perfect answerer should pass every case");
  const wantsNothing = CASES.filter((c) => c.nothing).length;
  assert.equal(idlePass, wantsNothing, "an answerer that never acts should pass only the cases that want no action");
  // A draft is judged on what the assistant says once it is told the draft is on screen (as in the app), not only before it.
  const draftCase = CASES.find((c) => c.id === "en-draft-reminder");
  const draftThen = (after) => async (messages) =>
    afterResult(messages)
      ? { content: after ? [{ type: "text", text: after }] : [], usage: { input: 1000, output: 100 } }
      : { content: [{ type: "tool_use", id: "t1", name: "draft_message", input: { kind: "reminder", customer: "Chidi" } }], usage: { input: 1000, output: 100 } };
  assert.equal((await runCase(draftCase, draftThen("It's ready. Check it and send it from WhatsApp."))).problems.length, 0, "speaking after the draft is on screen should pass");
  assert.ok((await runCase(draftCase, draftThen(""))).problems.length > 0, "never saying anything should still fail");
  // For genuinely ambiguous wording, one clear question passes; silence does not.
  const ambiguous = CASES.find((c) => c.orAsk);
  const asker = async () => ({ content: [{ type: "text", text: "Is the 60k for both bags of beans, or each?" }], usage: { input: 1000, output: 100 } });
  assert.equal((await runCase(ambiguous, asker)).problems.length, 0, "a clear question should pass an ambiguous case");
  assert.ok((await runCase(ambiguous, idle)).problems.length > 0, "doing and saying nothing should still fail it");
  assert.ok((await runCase(CASES.find((c) => c.id === "en-sale-wig"), asker)).problems.length > 0, "asking should NOT pass a case that was not ambiguous");
  // A wrong amount, a wrong date and an invented record must each be caught.
  const wrong = (c, input) => judge(c, [{ name: "propose_records", input }], "x");
  assert.ok(wrong(CASES[0], { sales: [{ amount: 450 }] }).length);
  assert.ok(wrong({ ...CASES[0], when: "yesterday" }, { sales: [{ amount: 4500 }] }).length);
  assert.ok(judge(CASES.find((c) => c.id === "en-vague-sale"), [{ name: "propose_records", input: { sales: [{ amount: 1 }] } }], "ok").length);
  console.log(`self-test passed: ${CASES.length} cases (${CASES.filter((c) => c.id.startsWith("pcm")).length} Pidgin). Scoring catches wrong amounts, dates and invented records.`);
  process.exit(0);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Set ANTHROPIC_API_KEY to run this against a real model (it costs a few cents per model).\nOr run with --self-test to check the scoring without a key.");
  process.exit(2);
}
const { default: Anthropic } = await import("@anthropic-ai/sdk");
const client = new Anthropic();
const list = models.length ? models : ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"];
const cases = CASES.filter((c) => !only || c.id.startsWith(only));

for (const model of list) {
  const call = async (messages) => {
    const m = await client.beta.messages.create({ model, max_tokens: 4000, system: SYSTEM_PROMPT, tools: TOOLS, messages, output_config: { effort }, cache_control: { type: "ephemeral" } });
    return { content: m.content, usage: { input: m.usage.input_tokens, output: m.usage.output_tokens } };
  };
  const r = await evaluate(model, cases, call);
  console.log(`\n${model} (effort ${effort}): ${r.pass}/${r.n} correct  [English ${r.by.en[0]}/${r.by.en[1]}, Pidgin ${r.by.pcm[0]}/${r.by.pcm[1]}]  about $${(r.cost / r.n).toFixed(4)} per message`);
  for (const { c, res } of r.failed) console.log(`  x ${c.id}: "${c.say}"\n      ${res.problems.join("; ")}`);
}
