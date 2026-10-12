import { describe, expect, it } from "vitest";
import { validateRequest, type Block, type ChatMessage } from "../../supabase/functions/_shared/assistant-protocol.ts";
import { EMPTY_RECORDS, type RecordsState } from "../records/state";
import type { Product, Sale } from "../records/types";
import { ChatError, DEFAULT_SETTINGS, emptyChat, freshChat, needsFresh, runTurn, type Chat, type IO, type ModelReply, type Settings } from "./engine";
import { buildMarkPaidProposal, buildRecordsProposal, describeProposal, runReadTool } from "./tools";

const NOW = new Date(2026, 9, 12, 15, 0); // Monday 12 Oct 2026, 3pm
const rice: Product = { id: "p-rice-0001", name: "Jollof rice", price: 150000 };
const zobo: Product = { id: "p-zobo-0001", name: "Zobo", price: 50000 };

function books(over: Partial<RecordsState> = {}): RecordsState {
  const sale = (id: string, o: Partial<Sale>): Sale => ({ id, at: new Date(2026, 9, 12, 10).toISOString(), amount: 100000, items: [], paid: true, ...o });
  return {
    ...EMPTY_RECORDS,
    products: { [rice.id]: rice, [zobo.id]: zobo },
    sales: {
      "sale-0001": sale("sale-0001", { amount: 450000, items: [{ productId: rice.id, name: "Jollof rice", qty: 3, unitPrice: 150000 }] }),
      "sale-0002": sale("sale-0002", { amount: 200000, paid: false, customer: "Mrs Bello", at: new Date(2026, 9, 8, 10).toISOString() }),
      "sale-0003": sale("sale-0003", { amount: 50000, paid: false, customer: "Mr Bello", at: new Date(2026, 9, 9, 10).toISOString() }),
      "sale-0004": sale("sale-0004", { amount: 75000, paid: false, customer: "Chidi", at: new Date(2026, 9, 9, 10).toISOString() }),
    },
    ...over,
  };
}

describe("propose_records", () => {
  it("builds a sale from products and fills prices", () => {
    const r = buildRecordsProposal({ sales: [{ amount: 4500, items: [{ name: "jollof rice", qty: 3 }] }] }, books(), NOW);
    expect(r.ok && r.proposal.sales[0]).toMatchObject({ amount: 450000, paid: true, items: [{ productId: rice.id, name: "Jollof rice", qty: 3, unitPrice: 150000 }] });
  });
  it("works out the unit price of a single unknown item, and leaves several at zero", () => {
    const one = buildRecordsProposal({ sales: [{ amount: 3000, items: [{ name: "Wig", qty: 2 }] }] }, books(), NOW);
    expect(one.ok && one.proposal.sales[0].items[0].unitPrice).toBe(150000);
    const two = buildRecordsProposal({ sales: [{ amount: 3000, items: [{ name: "Wig", qty: 1 }, { name: "Gel", qty: 1 }] }] }, books(), NOW);
    expect(two.ok && two.proposal.sales[0].items.map((i) => i.unitPrice)).toEqual([0, 0]);
  });
  it("rejects explicit prices that don't add up, but allows a discount on product prices", () => {
    expect(buildRecordsProposal({ sales: [{ amount: 1000, items: [{ name: "Wig", qty: 1, unit_price: 5000 }] }] }, books(), NOW).ok).toBe(false);
    expect(buildRecordsProposal({ sales: [{ amount: 4000, items: [{ name: "Jollof rice", qty: 3 }] }] }, books(), NOW).ok).toBe(true);
  });
  it("needs a customer when something is not paid", () => {
    const r = buildRecordsProposal({ sales: [{ amount: 2000, paid: false }] }, books(), NOW);
    expect(!r.ok && r.error).toMatch(/who owes/);
    expect(buildRecordsProposal({ sales: [{ amount: 2000, paid: false, customer: "Ada" }] }, books(), NOW).ok).toBe(true);
  });
  it("rejects missing, zero, negative, huge and non-numeric amounts", () => {
    for (const amount of [undefined, 0, -5, 1e12, "5k", NaN, null]) expect(buildRecordsProposal({ sales: [{ amount }] }, books(), NOW).ok).toBe(false);
  });
  it("handles dates: today, yesterday, a past date; rejects future and nonsense", () => {
    const at = (when: unknown) => { const r = buildRecordsProposal({ expenses: [{ amount: 500, category: "transport", when }] }, books(), NOW); return r.ok ? r.proposal.expenses[0].at : r.error; };
    expect(at(undefined)).toBe(NOW.toISOString());
    expect(at("yesterday")).toBe(new Date(2026, 9, 11, 12).toISOString());
    expect(at("2026-10-05")).toBe(new Date(2026, 9, 5, 12).toISOString());
    expect(at("2026-10-12")).toBe(NOW.toISOString());
    for (const bad of ["2026-10-13", "2026-02-30", "last week", 5, "2015-01-01"]) expect(at(bad)).toMatch(/date|future|ago/i);
  });
  it("validates expense categories", () => {
    expect(buildRecordsProposal({ expenses: [{ amount: 500, category: "fuel" }] }, books(), NOW).ok).toBe(false);
    const ok = buildRecordsProposal({ expenses: [{ amount: 500, category: "transport", note: "  bus   to market " }] }, books(), NOW);
    expect(ok.ok && ok.proposal.expenses[0]).toMatchObject({ amount: 50000, category: "transport", note: "bus to market" });
  });
  it("refuses empty and oversized proposals", () => {
    expect(buildRecordsProposal({}, books(), NOW).ok).toBe(false);
    expect(buildRecordsProposal({ sales: Array.from({ length: 21 }, () => ({ amount: 1 })) }, books(), NOW).ok).toBe(false);
    expect(buildRecordsProposal("nonsense", books(), NOW).ok).toBe(false);
  });
  it("describes in plain words", () => {
    const r = buildRecordsProposal({ sales: [{ amount: 4500, items: [{ name: "jollof rice", qty: 3 }] }, { amount: 2000, paid: false, customer: "Ada", note: "Cake" }], expenses: [{ amount: 500, category: "transport" }] }, books(), NOW);
    expect(r.ok && describeProposal(r.proposal)).toEqual(["3 × Jollof rice: ₦4,500", "Cake: ₦2,000 (Ada owes this)", "Transport: ₦500 spent"]);
  });
});

describe("propose_mark_paid", () => {
  it("finds one customer, including partial names", () => {
    const r = buildMarkPaidProposal({ customer: "mrs bello" }, books());
    expect(r.ok && r.proposal.markPaid).toMatchObject({ customer: "Mrs Bello", saleIds: ["sale-0002"], total: 200000 });
    const c = buildMarkPaidProposal({ customer: "Chidi" }, books());
    expect(c.ok).toBe(true);
  });
  it("never guesses between two people, and lists who owes when there is no match", () => {
    const amb = buildMarkPaidProposal({ customer: "Bello" }, books());
    expect(!amb.ok && amb.error).toMatch(/More than one.*Mrs Bello.*Mr Bello|More than one.*Mr Bello.*Mrs Bello/);
    const none = buildMarkPaidProposal({ customer: "Tolu" }, books());
    expect(!none.ok && none.error).toMatch(/Chidi/);
    expect(buildMarkPaidProposal({}, books()).ok).toBe(false);
    expect(buildMarkPaidProposal({ customer: "x" }, EMPTY_RECORDS).ok).toBe(false);
  });
});

describe("read tools", () => {
  it("summarises in naira with the previous period", () => {
    const out = JSON.parse(runReadTool("get_summary", { period: "week" }, books(), NOW));
    expect(out.current.sold).toBeGreaterThan(0);
    expect(out.still_owed_to_person).toBe(3250);
    expect(out.people_who_owe).toBe(3);
  });
  it("lists owed, recent, best sellers and products; copes with bad input", () => {
    expect(JSON.parse(runReadTool("list_owed", {}, books(), NOW)).count).toBe(3);
    expect(JSON.parse(runReadTool("list_recent", { limit: 2, kind: "sale" }, books(), NOW)).records).toHaveLength(2);
    expect(JSON.parse(runReadTool("best_sellers", { days: 30 }, books(), NOW)).best_sellers[0]).toMatchObject({ product: "Jollof rice", quantity: 3, money_in: 4500 });
    expect(JSON.parse(runReadTool("list_products", {}, books(), NOW)).products).toHaveLength(2);
    expect(JSON.parse(runReadTool("list_recent", { limit: "lots" }, books(), NOW)).records.length).toBeGreaterThan(0);
    expect(JSON.parse(runReadTool("nope", {}, books(), NOW)).error).toBeTruthy();
    expect(JSON.parse(runReadTool("best_sellers", {}, EMPTY_RECORDS, NOW)).note).toBeTruthy();
  });
});

// ---- the conversation engine, with a scripted model ----

const use = (id: string, name: string, input: unknown): Block => ({ type: "tool_use", id, name, input });
const say = (t: string): Block => ({ type: "text", text: t });
const th: Block = { type: "thinking", thinking: "hmm", signature: "sig" };

function harness(script: (ModelReply | ChatError)[], records = books()) {
  const calls: ChatMessage[][] = [];
  const applied: unknown[] = [];
  let n = 0;
  const io: IO = {
    call: async (m) => {
      calls.push(JSON.parse(JSON.stringify(m)));
      const next = script.shift();
      if (!next) throw new Error("script ran out");
      if (next instanceof ChatError) throw next;
      return next;
    },
    records: () => records,
    apply: (p) => (applied.push(p), { sales: ["s1"], expenses: [], paid: [] }),
    now: () => NOW,
    id: () => `id-${++n}`,
  };
  return { io, calls, applied };
}
const reply = (content: Block[], stopReason = content.some((b) => b.type === "tool_use") ? "tool_use" : "end_turn"): ModelReply => ({ content, stopReason });
const WHO = { name: "Ada" };
const day = "2026-10-12";
const start = (): Chat => emptyChat(day);

describe("runTurn", () => {
  it("answers a question using a read tool, in two calls", async () => {
    const h = harness([reply([th, use("t1", "get_summary", { period: "week" })]), reply([say("You kept ₦4,500 this week.")])]);
    const { chat, error } = await runTurn(start(), { text: "how much did I make this week?" }, DEFAULT_SETTINGS, WHO, h.io);
    expect(error).toBeUndefined();
    expect(chat.items.map((i) => i.kind)).toEqual(["user", "assistant"]);
    expect(h.calls).toHaveLength(2);
    // The first message carries the context line; the second carries the tool result.
    expect(JSON.stringify(h.calls[0][0].content)).toContain("[Context: Today is Monday 2026-10-12");
    expect(JSON.stringify(h.calls[0][0].content)).toContain("Reply in: English");
    expect(h.calls[1][2].content[0]).toMatchObject({ type: "tool_result", tool_use_id: "t1" });
    // History is append-only and valid for the server, thinking included.
    expect(chat.api).toHaveLength(4);
    expect(JSON.stringify(chat.api[1].content)).toContain("signature");
    expect(validateRequest({ messages: [...chat.api, { role: "user", content: "x" }] }).ok).toBe(true);
    expect(JSON.stringify(h.calls[1].slice(0, 2))).toBe(JSON.stringify(h.calls[0].concat([{ role: "assistant", content: [th, use("t1", "get_summary", { period: "week" })] }])));
  });

  it("shows a card and waits; the answer rides on the next message", async () => {
    const h = harness([
      reply([say("Got it."), use("t1", "propose_records", { sales: [{ amount: 4500, items: [{ name: "jollof rice", qty: 3 }] }] })]),
      reply([say("Anything else?")]),
    ]);
    let r = await runTurn(start(), { text: "sold 3 jollof for 4500" }, DEFAULT_SETTINGS, WHO, h.io);
    expect(h.calls).toHaveLength(1);
    const card = r.chat.items.find((i) => i.kind === "proposal");
    expect(card && card.kind === "proposal" && card.status).toBe("pending");
    expect(h.applied).toHaveLength(0);
    // The person taps Save.
    r.chat = { ...r.chat, items: r.chat.items.map((i) => (i.kind === "proposal" ? { ...i, status: "saved" as const, saved: { sales: ["s1"], expenses: [], paid: [] } } : i)) };
    r = await runTurn(r.chat, { text: "no that's all" }, DEFAULT_SETTINGS, WHO, h.io);
    const blocks = h.calls[1][2].content as Block[];
    expect(blocks[0]).toMatchObject({ type: "tool_result", tool_use_id: "t1" });
    expect(String(blocks[0].content)).toMatch(/^Saved\./);
    expect(blocks[1].type).toBe("text");
  });

  it("treats an unanswered card as not saved and marks it stale", async () => {
    const h = harness([reply([use("t1", "propose_records", { expenses: [{ amount: 500, category: "transport" }] })]), reply([say("ok")])]);
    let r = await runTurn(start(), { text: "bus 500" }, DEFAULT_SETTINGS, WHO, h.io);
    r = await runTurn(r.chat, { text: "what do I owe" }, DEFAULT_SETTINGS, WHO, h.io);
    expect(String((h.calls[1][2].content as Block[])[0].content)).toMatch(/did not answer/);
    expect(r.chat.items.find((i) => i.kind === "proposal")).toMatchObject({ status: "dismissed", stale: true });
  });

  it("tells the model what was wrong with a bad proposal and lets it try again", async () => {
    const h = harness([
      reply([use("t1", "propose_records", { sales: [{ amount: 0 }] })]),
      reply([say("How much was it?")]),
    ]);
    const r = await runTurn(start(), { text: "sold some rice" }, DEFAULT_SETTINGS, WHO, h.io);
    expect(h.calls[1][2].content[0]).toMatchObject({ type: "tool_result", is_error: true });
    expect(r.chat.items.some((i) => i.kind === "proposal")).toBe(false);
    expect(r.chat.items.at(-1)).toMatchObject({ kind: "assistant", text: "How much was it?" });
  });

  it("saves straight away in auto mode when small, but still asks when large", async () => {
    const auto: Settings = { replyLanguage: "en", autonomy: "auto" };
    const h = harness([
      reply([use("t1", "propose_records", { sales: [{ amount: 4500 }] })]), reply([say("Done.")]),
      reply([use("t2", "propose_records", { sales: [{ amount: 600000 }] })]),
    ]);
    let r = await runTurn(start(), { text: "sold for 4500" }, auto, WHO, h.io);
    expect(h.applied).toHaveLength(1);
    expect(r.chat.items.find((i) => i.kind === "proposal")).toMatchObject({ status: "saved", auto: true });
    expect(String((h.calls[1][2].content as Block[])[0].content)).toMatch(/^Saved/);
    r = await runTurn(r.chat, { text: "sold a generator for 600k" }, auto, WHO, h.io);
    expect(h.applied).toHaveLength(1);
    expect(r.chat.items.filter((i) => i.kind === "proposal").at(-1)).toMatchObject({ status: "pending" });
  });

  it("stops after four model calls", async () => {
    const loop = () => reply([use(`t${Math.random()}`, "list_owed", {})]);
    const h = harness([loop(), loop(), loop(), loop(), loop()]);
    const r = await runTurn(start(), { text: "owed?" }, DEFAULT_SETTINGS, WHO, h.io);
    expect(h.calls).toHaveLength(4);
    expect(r.chat.pending.length).toBe(1);
  });

  it("keeps the chat and offers a retry when the model can't be reached, without duplicating the message", async () => {
    const h = harness([new ChatError("offline"), reply([say("Hello Ada")])]);
    let r = await runTurn(start(), { text: "hi" }, DEFAULT_SETTINGS, WHO, h.io);
    expect(r.error?.kind).toBe("offline");
    expect(r.chat.failed).toEqual({ text: "hi" });
    expect(r.chat.api).toHaveLength(0);
    r = await runTurn(r.chat, { text: "hi", retry: true }, DEFAULT_SETTINGS, WHO, h.io);
    expect(r.error).toBeUndefined();
    expect(r.chat.items.filter((i) => i.kind === "user")).toHaveLength(1);
    expect(r.chat.failed).toBeUndefined();
  });

  it("recovers when it fails between a tool call and the answer", async () => {
    const h = harness([reply([use("t1", "list_owed", {})]), new ChatError("busy"), reply([say("Three people owe you.")])]);
    let r = await runTurn(start(), { text: "who owes" }, DEFAULT_SETTINGS, WHO, h.io);
    expect(r.error?.kind).toBe("busy");
    r = await runTurn(r.chat, { text: null }, DEFAULT_SETTINGS, WHO, h.io);
    expect(r.error).toBeUndefined();
    expect(h.calls[2].at(-1)?.content[0]).toMatchObject({ type: "tool_result", tool_use_id: "t1" });
    expect(validateRequest({ messages: [...r.chat.api, { role: "user", content: "x" }] }).ok).toBe(true);
  });

  it("handles refusals and cut-off replies without breaking the history", async () => {
    let h = harness([reply([say("")], "refusal")]);
    let r = await runTurn(start(), { text: "something bad" }, DEFAULT_SETTINGS, WHO, h.io);
    expect(r.chat.items.at(-1)).toMatchObject({ kind: "note" });
    h = harness([reply([use("t1", "propose_records", { sales: [{ amount: 5 }] })], "max_tokens"), reply([say("Sorry, again?")])]);
    r = await runTurn(start(), { text: "long" }, DEFAULT_SETTINGS, WHO, h.io);
    expect(h.calls[1][2].content[0]).toMatchObject({ is_error: true });
    expect(h.applied).toHaveLength(0);
  });

  it("passes the reply language in the context", async () => {
    const h = harness([reply([say("Oga, I don hear.")])]);
    await runTurn(start(), { text: "I sell 3 bag rice" }, { replyLanguage: "pcm", autonomy: "ask" }, WHO, h.io);
    expect(JSON.stringify(h.calls[0][0].content)).toContain("Reply in: Pidgin");
  });
});

describe("fresh chats", () => {
  it("starts over on a new day or when long, and expires open cards", () => {
    const c: Chat = { ...emptyChat(day), api: [{ role: "user", content: "a" }], items: [{ kind: "proposal", id: "x", proposal: { sales: [], expenses: [] }, status: "pending" }] };
    expect(needsFresh(c, NOW)).toBe(false);
    expect(needsFresh(c, new Date(2026, 9, 13, 9))).toBe(true);
    expect(needsFresh({ ...c, api: Array.from({ length: 30 }, () => ({ role: "user" as const, content: "a" })) }, NOW)).toBe(true);
    const f = freshChat(c, new Date(2026, 9, 13, 9), "n1");
    expect(f.api).toEqual([]);
    expect(f.items[0]).toMatchObject({ status: "dismissed", stale: true });
    expect(f.items.at(-1)).toMatchObject({ kind: "note" });
    expect(needsFresh(emptyChat(day), new Date(2026, 9, 13, 9))).toBe(false);
  });
});
