import { describe, expect, it } from "vitest";
import { validateRequest, type Block, type ChatMessage } from "../../supabase/functions/_shared/assistant-protocol.ts";
import { EMPTY_RECORDS, type RecordsState } from "../records/state";
import type { Product, Sale } from "../records/types";
import { toChatError } from "../backend/supabase";
import { sanitizeStored } from "./state";
import { ChatError, DEFAULT_SETTINGS, emptyChat, freshChat, needsFresh, runTurn, type Chat, type IO, type ModelReply, type Settings } from "./engine";
import { amountsIn, buildDraft, buildFactsProposal, buildStockProposal, buildMarkPaidProposal, buildRecordsProposal, buildTextDraft, describeProposal, runReadTool } from "./tools";

const at = (d: number) => new Date(2026, 9, d, 10).toISOString();
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
  it("does not mistake a product whose name is only an emoji for whatever was sold", () => {
    const pizza: Product = { id: "p-pizza-0001", name: "🍕", price: 300000 };
    const r = buildRecordsProposal({ sales: [{ amount: 3000, items: [{ name: "Wig", qty: 2 }] }] }, books({ products: { [pizza.id]: pizza } }), NOW);
    expect(r.ok && r.proposal.sales[0].items[0]).toMatchObject({ name: "Wig", qty: 2, unitPrice: 150000 });
    expect(r.ok && r.proposal.sales[0].items[0].productId).toBeUndefined();
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
  it("always shows who the customer is, whether they owe or have paid", () => {
    const r = buildRecordsProposal({ sales: [{ amount: 25000, customer: "Chidi", note: "2 bags of rice" }] }, books(), NOW);
    expect(r.ok && describeProposal(r.proposal)).toEqual(["2 bags of rice: ₦25,000 · Chidi, paid"]);
  });
  it("describes in plain words", () => {
    const r = buildRecordsProposal({ sales: [{ amount: 4500, items: [{ name: "jollof rice", qty: 3 }] }, { amount: 2000, paid: false, customer: "Ada", note: "Cake" }], expenses: [{ amount: 500, category: "transport" }] }, books(), NOW);
    expect(r.ok && describeProposal(r.proposal)).toEqual(["3 × Jollof rice: ₦4,500", "Cake: ₦2,000 · Ada owes this", "Transport: ₦500 spent"]);
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

describe("propose_mark_paid with one customer spelled two ways", () => {
  it("treats 'Ada' and 'ada.' as the same person, as the Customers screen does, and marks both sales", () => {
    const sale = (id: string, customer: string): Sale => ({ id, at: new Date(2026, 9, 12, 10).toISOString(), amount: 100000, items: [], paid: false, customer });
    const r = buildMarkPaidProposal({ customer: "ada" }, books({ sales: { a1: sale("a1", "Ada"), a2: sale("a2", "ada.") } }));
    expect(r.ok && r.proposal.markPaid).toMatchObject({ saleIds: ["a1", "a2"], total: 200000 });
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
    messageContext: () => ({ from: "Ada's Kitchen", lang: "en", tone: "friendly" }),
    facts: () => ({ businessName: "Ada's Kitchen", about: "Home-cooked jollof and zobo", place: "Yaba, Lagos" }),
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

// ---- stored chats and error mapping ----

describe("sanitizeStored", () => {
  const today = "2026-10-12";
  const good = {
    settings: { replyLanguage: "pcm", autonomy: "auto" },
    consented: true,
    chat: {
      day: today,
      api: [
        { role: "user", content: [{ type: "text", text: "hi" }] },
        { role: "assistant", content: [{ type: "thinking", thinking: "t", signature: "s" }, { type: "tool_use", id: "t1", name: "propose_records", input: { expenses: [] } }] },
      ],
      pending: [{ toolUseId: "t1", itemId: "card1" }],
      items: [
        { kind: "user", id: "u1", text: "hi" },
        { kind: "proposal", id: "card1", status: "pending", proposal: { sales: [], expenses: [{ amount: 50000, category: "transport", at: "2026-10-12T10:00:00.000Z" }] } },
      ],
    },
  };
  it("keeps a good chat exactly, including an open card", () => {
    const s = sanitizeStored(JSON.parse(JSON.stringify(good)), today);
    expect(s.settings).toEqual({ replyLanguage: "pcm", autonomy: "auto" });
    expect(s.consented).toBe(true);
    expect(s.chat.api).toHaveLength(2);
    expect(s.chat.pending).toEqual([{ toolUseId: "t1", itemId: "card1" }]);
    expect(s.chat.items[1]).toMatchObject({ kind: "proposal", status: "pending" });
  });
  it("falls back to safe defaults for junk", () => {
    for (const junk of [null, "x", 5, [], { chat: 5, settings: "x" }]) {
      const s = sanitizeStored(junk, today);
      expect(s.chat.items).toEqual([]);
      expect(s.settings).toEqual({ replyLanguage: "en", autonomy: "ask" });
      expect(s.consented).toBe(false);
    }
  });
  it("drops a history the server would refuse, and expires its open cards instead of leaving them half-working", () => {
    const bad = JSON.parse(JSON.stringify(good));
    bad.chat.api[1].content[1].name = "delete_everything";
    const s = sanitizeStored(bad, today);
    expect(s.chat.api).toEqual([]);
    expect(s.chat.pending).toEqual([]);
    expect(s.chat.items[1]).toMatchObject({ status: "dismissed", stale: true });
  });
  it("drops the history when a tool call has no answer waiting for it", () => {
    const bad = JSON.parse(JSON.stringify(good));
    bad.chat.pending = [];
    expect(sanitizeStored(bad, today).chat.api).toEqual([]);
  });
  it("discards cards and messages with impossible amounts or shapes", () => {
    const bad = JSON.parse(JSON.stringify(good));
    bad.chat.items.push({ kind: "proposal", id: "c2", status: "saved", proposal: { sales: [{ amount: -5, paid: true, at: "2026-10-12T10:00:00.000Z" }], expenses: [] } });
    bad.chat.items.push({ kind: "assistant", id: "a1", text: 42 });
    bad.chat.items.push({ kind: "weird", id: "w" });
    const s = sanitizeStored(bad, today);
    expect(s.chat.items.map((i) => i.id)).toEqual(["u1", "card1"]);
  });
});

describe("toChatError", () => {
  const http = (status: number, body: unknown) => ({ name: "FunctionsHttpError", context: { status, json: async () => body } });
  it("maps statuses to kinds a person can understand", async () => {
    expect((await toChatError(http(401, {}))).kind).toBe("signin");
    expect((await toChatError(http(413, {}))).kind).toBe("too_long");
    expect((await toChatError(http(429, { scope: "global" }))).scope).toBe("global");
    expect((await toChatError(http(429, { scope: "user" }))).kind).toBe("quota");
    expect((await toChatError(http(503, { error: "busy" }))).kind).toBe("busy");
    expect((await toChatError(http(503, { error: "disabled" }))).kind).toBe("unavailable");
    expect((await toChatError(http(404, {}))).kind).toBe("unavailable");
    expect((await toChatError(http(500, {}))).kind).toBe("unavailable");
    expect((await toChatError(http(502, {}))).kind).toBe("failed");
  });
  it("treats network trouble as offline, and survives bodies that aren't JSON", async () => {
    expect((await toChatError({ name: "FunctionsFetchError" })).kind).toBe("offline");
    expect((await toChatError({ name: "FunctionsHttpError", context: { status: 429, json: async () => { throw new Error("not json"); } } })).kind).toBe("quota");
    expect((await toChatError(undefined)).kind).toBe("failed");
  });
  it("never carries server text", async () => {
    const e = await toChatError(http(502, { message: "sk-secret in here" }));
    expect(e.message).not.toContain("sk-secret");
  });
});


// ---- customers and drafts ----
const ctx = { from: "Ada's Kitchen", lang: "en" as const, tone: "friendly" as const };
const withPhone = (): RecordsState => ({ ...books(), customers: { "cust-chidi-1": { id: "cust-chidi-1", name: "Chidi", phone: "0803 123 4567" } } });

describe("draft_message", () => {
  it("writes a reminder from the books: exact amounts, the customer's own wording of the debt, signed", () => {
    const r = buildDraft({ kind: "reminder", customer: "mrs bello" }, books(), ctx);
    expect(r.ok && r.draft.text).toMatch(/^Hello Mrs Bello, I hope you're well\. A quick reminder about the ₦2,000 for your order/);
    expect(r.ok && r.draft.text).toMatch(/— Ada's Kitchen$/);
    expect(r.ok && r.draft.title).toBe("Reminder for Mrs Bello");
  });
  it("uses the person's language and tone unless the assistant passes a tone", () => {
    expect((buildDraft({ kind: "reminder", customer: "Chidi" }, books(), { ...ctx, lang: "pcm" }) as { draft: { text: string } }).draft.text).toMatch(/how you dey/);
    expect((buildDraft({ kind: "reminder", customer: "Chidi", tone: "firm" }, books(), ctx) as { draft: { text: string } }).draft.text).toMatch(/still outstanding/);
    expect((buildDraft({ kind: "reminder", customer: "Chidi", tone: "rude" }, books(), ctx) as { draft: { text: string } }).draft.text).toMatch(/hope you're well/);
  });
  it("won't remind someone who owes nothing, or guess between two people", () => {
    const state = books({ sales: { ...books().sales, "sale-0009": { id: "sale-0009", at: at(8), amount: 100000, items: [], paid: true, customer: "Tolu" } } } as Partial<RecordsState>);
    const none = buildDraft({ kind: "reminder", customer: "Tolu" }, state, ctx);
    expect(!none.ok && none.error).toMatch(/doesn't owe anything/);
    const amb = buildDraft({ kind: "reminder", customer: "Bello" }, books(), ctx);
    expect(!amb.ok && amb.error).toMatch(/More than one/);
    expect(buildDraft({ kind: "reminder", customer: "Nobody" }, books(), ctx).ok).toBe(false);
    expect(buildDraft({ kind: "reminder" }, books(), ctx).ok).toBe(false);
    expect(buildDraft({ kind: "sms", customer: "Chidi" }, books(), ctx).ok).toBe(false);
  });
  it("makes a receipt for the customer's latest sale", () => {
    const state = books({ sales: { ...books().sales, "sale-0010": { id: "sale-0010", at: at(11), amount: 300000, items: [{ name: "Zobo", qty: 6, unitPrice: 50000 }], paid: true, customer: "Chidi" } } } as Partial<RecordsState>);
    const r = buildDraft({ kind: "receipt", customer: "Chidi" }, state, ctx);
    expect(r.ok && r.draft.saleId).toBe("sale-0010");
    expect(r.ok && r.draft.text).toContain("6 × Zobo — ₦3,000");
    expect(r.ok && r.draft.text).toContain("Paid ✔");
  });
});

describe("list_customers", () => {
  it("lists biggest buyers with what they owe, and never a phone number", () => {
    const out = runReadTool("list_customers", {}, withPhone(), NOW);
    expect(out).not.toMatch(/0803|phone/i);
    const d = JSON.parse(out);
    expect(d.total_customers).toBe(3);
    expect(d.customers.map((c: { name: string }) => c.name)).toEqual(["Mrs Bello", "Chidi", "Mr Bello"]);
    expect(d.customers.find((c: { name: string }) => c.name === "Chidi")).toMatchObject({ bought_total: 750, owes: 750, sales: 1 });
    expect(JSON.parse(runReadTool("list_customers", {}, EMPTY_RECORDS, NOW)).note).toBeTruthy();
  });
});

describe("drafting in a conversation", () => {
  it("shows the draft, tells the model nothing was sent, and lets it add a line", async () => {
    const h = harness([reply([say("Here you go."), use("t1", "draft_message", { kind: "reminder", customer: "Chidi" })]), reply([say("It's ready. Check it and send it from WhatsApp.")])]);
    const r = await runTurn(start(), { text: "remind Chidi" }, DEFAULT_SETTINGS, WHO, h.io);
    expect(r.error).toBeUndefined();
    const draft = r.chat.items.find((i) => i.kind === "draft");
    expect(draft && draft.kind === "draft" && draft.draft.text).toMatch(/₦750/);
    expect(h.calls).toHaveLength(2);
    const result = (h.calls[1][2].content as Block[])[0];
    expect(result).toMatchObject({ type: "tool_result", tool_use_id: "t1" });
    expect(String(result.content)).toMatch(/Nothing was sent/);
    expect(String(result.content)).not.toMatch(/₦|0803/); // the model never gets the message text or amounts back
    expect(r.chat.items.at(-1)).toMatchObject({ kind: "assistant" });
  });
  it("reports why a draft can't be made", async () => {
    const h = harness([reply([use("t1", "draft_message", { kind: "reminder", customer: "Nobody" })]), reply([say("Who do you mean?")])]);
    const r = await runTurn(start(), { text: "remind Nobody" }, DEFAULT_SETTINGS, WHO, h.io);
    expect(h.calls[1][2].content[0]).toMatchObject({ is_error: true });
    expect(r.chat.items.some((i) => i.kind === "draft")).toBe(false);
  });
  it("a saved draft survives a reload", () => {
    const stored = { settings: { replyLanguage: "en", autonomy: "ask" }, consented: true, chat: { day: "2026-10-12", api: [], pending: [], items: [{ kind: "draft", id: "d1", draft: { kind: "reminder", customerKey: "cust-chidi-1", title: "Reminder for Chidi", text: "Hello Chidi" } }, { kind: "draft", id: "d2", draft: { kind: "reminder", customerKey: "bad key!", title: "x", text: "y" } }] } };
    const s = sanitizeStored(JSON.parse(JSON.stringify(stored)), "2026-10-12");
    expect(s.chat.items.map((i) => i.id)).toEqual(["d1"]);
  });
});


// ---- business facts and writing ----
describe("propose_business_facts", () => {
  it("cleans what the person said, and describes it plainly", () => {
    const r = buildFactsProposal({ place: "  Yaba,   Lagos ", hours: "Mon to Sat,\n10am to 6pm", instagram: "@ada.kitchen", business_name: "Ada's Kitchen" });
    expect(r.ok && r.proposal.facts).toEqual({ businessName: "Ada's Kitchen", place: "Yaba, Lagos", hours: "Mon to Sat, 10am to 6pm", instagram: "ada.kitchen" });
    expect(r.ok && describeProposal(r.proposal)).toEqual(["Business name: Ada's Kitchen", "Where you are: Yaba, Lagos", "Opening hours: Mon to Sat, 10am to 6pm", "Instagram: @ada.kitchen"]);
  });
  it("refuses nothing-to-save, bad Instagram names, and caps the length", () => {
    expect(buildFactsProposal({}).ok).toBe(false);
    expect(buildFactsProposal({ place: "   " }).ok).toBe(false);
    expect(buildFactsProposal({ instagram: "not a handle!" }).ok).toBe(false);
    expect(buildFactsProposal("nonsense").ok).toBe(false);
    const long = buildFactsProposal({ about: "x".repeat(500) });
    expect(long.ok && long.proposal.facts?.about?.length).toBe(200);
  });
});

describe("get_business", () => {
  it("returns what is known and says what is missing", () => {
    const d = JSON.parse(runReadTool("get_business", {}, books(), NOW, { businessName: "Ada's Kitchen", place: "Yaba" }));
    expect(d.business).toEqual({ business_name: "Ada's Kitchen", place: "Yaba" });
    expect(d.missing).toEqual(["about", "hours", "instagram"]);
    expect(d.products).toBe(2);
    expect(JSON.parse(runReadTool("get_business", {}, EMPTY_RECORDS, NOW)).missing).toHaveLength(5);
  });
});

describe("draft_text", () => {
  it("shows writing that uses only the person's real prices", () => {
    const ok = buildTextDraft({ kind: "captions", title: "Post captions", text: "Jollof rice (plate) is ₦1,500 today. Zobo is N500.\nOrder on WhatsApp." }, books());
    expect(ok.ok && ok.draft).toMatchObject({ kind: "text", title: "Post captions" });
  });
  it("blocks any price that isn't one of theirs", () => {
    for (const text of ["Jollof for just ₦999!", "Only 1,200 naira per plate", "Best price: N20000", "Plates from ₦1,500 or ₦2,000"]) {
      const r = buildTextDraft({ kind: "captions", title: "x", text }, books());
      expect(r.ok).toBe(false);
      expect(!r.ok && r.error).toMatch(/not (one of the person's product prices|one of)|are not one of/);
    }
    expect(buildTextDraft({ kind: "other", title: "x", text: "Any price" }, EMPTY_RECORDS).ok).toBe(true);
    expect(buildTextDraft({ kind: "other", title: "x", text: "Only ₦500" }, EMPTY_RECORDS).ok).toBe(false); // no products, so no real prices to quote
  });
  it("holds an Instagram bio to 150 characters, and refuses empty or enormous text", () => {
    const bio = (text: string) => buildTextDraft({ kind: "instagram_bio", title: "Bio", text }, books());
    expect(bio("Home-cooked jollof and zobo in Yaba. Order on WhatsApp.").ok).toBe(true);
    expect(bio("x".repeat(151)).ok).toBe(false);
    expect(bio("   ").ok).toBe(false);
    expect(buildTextDraft({ kind: "captions", title: "x", text: "y".repeat(1600) }, books()).ok).toBe(false);
  });
  it("tidies control characters and falls back to a sensible title and kind", () => {
    const r = buildTextDraft({ kind: "mystery", text: "Hello\u0007 there\r\nfriends" }, books());
    expect(r.ok && r.draft.text).toBe("Hello there\nfriends");
    expect(r.ok && r.draft.title).toBe("Draft");
  });
  it("finds amounts however they are written", () => {
    expect(amountsIn("₦2,500 and N 300, 1,200 naira, NGN? 5 NGN, Nancy N/A")).toEqual([2500, 300, 1200, 5]);
    expect(amountsIn("Open 10am to 6pm, call 0803 123 4567")).toEqual([]);
  });
});

describe("facts and writing in a conversation", () => {
  it("proposes facts as a card, and saving tells the model what happened", async () => {
    const h = harness([reply([say("Want me to remember that?"), use("t1", "propose_business_facts", { place: "Yaba", hours: "10am to 6pm" })]), reply([say("Done.")])]);
    let r = await runTurn(start(), { text: "I'm in Yaba, open 10 to 6" }, DEFAULT_SETTINGS, WHO, h.io);
    const card = r.chat.items.find((i) => i.kind === "proposal");
    expect(card && card.kind === "proposal" && card.proposal.facts).toEqual({ place: "Yaba", hours: "10am to 6pm" });
    expect(card && card.kind === "proposal" && card.status).toBe("pending");
    expect(h.applied).toHaveLength(0);
    r.chat = { ...r.chat, items: r.chat.items.map((i) => (i.kind === "proposal" ? { ...i, status: "saved" as const, saved: { sales: [], expenses: [], paid: [], facts: { place: null } } } : i)) };
    r = await runTurn(r.chat, { text: "thanks" }, DEFAULT_SETTINGS, WHO, h.io);
    expect(String(((h.calls[1][2].content as Block[])[0]).content)).toMatch(/^Saved\. Where you are: Yaba; Opening hours: 10am to 6pm\./);
  });
  it("lets the assistant read the facts, then show a bio; and refuses an invented price", async () => {
    const h = harness([
      reply([use("t1", "get_business", {})]),
      reply([use("t2", "draft_text", { kind: "instagram_bio", title: "Instagram bio", text: "Jollof from just ₦999. Yaba." })]),
      reply([use("t3", "draft_text", { kind: "instagram_bio", title: "Instagram bio", text: "Home-cooked jollof and zobo. Yaba, Lagos. Order on WhatsApp." })]),
      reply([say("Here it is. Copy it when you're happy.")]),
    ]);
    const r = await runTurn(start(), { text: "write my instagram bio" }, DEFAULT_SETTINGS, WHO, h.io);
    expect(r.error).toBeUndefined();
    expect(JSON.parse(String((h.calls[1][2].content as Block[])[0].content)).business.place).toBe("Yaba, Lagos");
    expect(h.calls[2][4].content[0]).toMatchObject({ is_error: true });
    const drafts = r.chat.items.filter((i) => i.kind === "draft");
    expect(drafts).toHaveLength(1);
    expect(drafts[0].kind === "draft" && drafts[0].draft.text).toMatch(/^Home-cooked jollof/);
    expect(String((h.calls[3][6].content as Block[])[0].content)).toMatch(/Nothing was posted or sent/);
  });
  it("saved text drafts and fact cards survive a reload", () => {
    const stored = { settings: { replyLanguage: "en", autonomy: "ask" }, consented: true, chat: { day: "2026-10-12", api: [], pending: [], items: [
      { kind: "draft", id: "d1", draft: { kind: "text", title: "Instagram bio", text: "Home-cooked jollof." } },
      { kind: "proposal", id: "p1", status: "saved", proposal: { sales: [], expenses: [], facts: { place: "Yaba", bogus: "x" } }, saved: { sales: [], expenses: [], paid: [], facts: { place: null, hours: "9 to 5" } } },
    ] } };
    const s = sanitizeStored(JSON.parse(JSON.stringify(stored)), "2026-10-12");
    expect(s.chat.items.map((i) => i.id)).toEqual(["d1", "p1"]);
    const p = s.chat.items[1];
    expect(p.kind === "proposal" && p.proposal.facts).toEqual({ place: "Yaba" });
    expect(p.kind === "proposal" && p.saved?.facts).toEqual({ place: null, hours: "9 to 5" });
  });
});


// ---- stock ----
const counted = (): RecordsState => {
  const b = books();
  return { ...b, products: { ...b.products, [rice.id]: { ...rice, stock: 20, countedAt: new Date(2026, 9, 9, 9).toISOString(), lowAt: 5 } } };
};

describe("get_stock", () => {
  it("says what is left (minus what was sold since the count), what is low, and what isn't counted", () => {
    const d = JSON.parse(runReadTool("get_stock", {}, counted(), NOW));
    expect(d.counted).toEqual([{ product: "Jollof rice", left: 17, status: "ok", warn_at: 5 }]);
    expect(d.not_counted).toEqual(["Zobo"]);
    expect(JSON.parse(runReadTool("get_stock", {}, books(), NOW)).note).toBeTruthy();
  });
});

describe("propose_stock", () => {
  it("sets a count, or adds to what is left now, and says what will be in stock", () => {
    const set = buildStockProposal({ updates: [{ product: "jollof rice", set: 30 }] }, counted());
    expect(set.ok && set.proposal.stock).toEqual([{ productId: rice.id, name: "Jollof rice", set: 30, result: 30 }]);
    const add = buildStockProposal({ updates: [{ product: "Jollof", add: 20 }] }, counted());
    expect(add.ok && add.proposal.stock?.[0]).toMatchObject({ add: 20, result: 37 }); // 17 left now + 20
    expect(add.ok && describeProposal(add.proposal)).toEqual(["Jollof rice: 20 more (37 in stock)"]);
    expect(set.ok && describeProposal(set.proposal)).toEqual(["Jollof rice: 30 in stock"]);
  });
  it("starts counting a product with set, but won't add to something that isn't counted yet", () => {
    const start = buildStockProposal({ updates: [{ product: "Zobo", set: 40, low_at: 10 }] }, counted());
    expect(start.ok && describeProposal(start.proposal)).toEqual(["Zobo: 40 in stock · warn at 10"]);
    const add = buildStockProposal({ updates: [{ product: "Zobo", add: 10 }] }, counted());
    expect(!add.ok && add.error).toMatch(/isn't being counted yet.*use set/);
    expect(buildStockProposal({ updates: [{ product: "Zobo", low_at: 3 }] }, counted()).ok).toBe(false);
    expect(buildStockProposal({ updates: [{ product: "Jollof rice", low_at: 3 }] }, counted()).ok).toBe(true);
  });
  it("never guesses the product, and checks every number", () => {
    expect(buildStockProposal({ updates: [{ product: "Nothing", set: 1 }] }, counted()).ok).toBe(false);
    const state = counted();
    state.products = { ...state.products, "p-jollof-0002": { id: "p-jollof-0002", name: "Jollof rice (party)", price: 1 } };
    const amb = buildStockProposal({ updates: [{ product: "Jollof", set: 1 }] }, state);
    expect(!amb.ok && amb.error).toMatch(/more than one product/);
    for (const bad of [{ set: -1 }, { set: 1.5 }, { set: 2_000_000 }, { add: 0 }, { add: -4 }, { add: "ten" }, { set: 5, add: 5 }, {}]) {
      expect(buildStockProposal({ updates: [{ product: "Jollof rice", ...bad }] }, counted()).ok).toBe(false);
    }
    expect(buildStockProposal({ updates: [{ product: "Jollof rice", set: 1 }, { product: "jollof rice", set: 2 }] }, counted()).ok).toBe(false);
    expect(buildStockProposal({ updates: [] }, counted()).ok).toBe(false);
    expect(buildStockProposal({}, counted()).ok).toBe(false);
    expect(buildStockProposal({ updates: Array.from({ length: 21 }, () => ({ product: "Jollof rice", set: 1 })) }, counted()).ok).toBe(false);
  });
  it("is a card to Save, then Undo puts the old count back (the store keeps what it was)", async () => {
    const h = harness([reply([say("Got it."), use("t1", "propose_stock", { updates: [{ product: "Jollof rice", add: 20 }] })]), reply([say("Done.")])], counted());
    const r = await runTurn(start(), { text: "I bought 20 more bags of rice" }, DEFAULT_SETTINGS, WHO, h.io);
    const card = r.chat.items.find((i) => i.kind === "proposal");
    expect(card && card.kind === "proposal" && card.status).toBe("pending");
    expect(card && card.kind === "proposal" && card.proposal.stock?.[0]).toMatchObject({ add: 20, result: 37 });
    expect(h.applied).toHaveLength(0);
  });
  it("survives a reload, including what Undo needs", () => {
    const stored = { settings: { replyLanguage: "en", autonomy: "ask" }, consented: true, chat: { day: "2026-10-12", api: [], pending: [], items: [
      { kind: "proposal", id: "p1", status: "saved", proposal: { sales: [], expenses: [], stock: [{ productId: "p-rice-0001", name: "Jollof rice", add: 20, result: 37 }, { productId: "bad id", name: "x", set: 1 }] }, saved: { sales: [], expenses: [], paid: [], stock: [{ id: "p-rice-0001", before: { stock: 17, countedAt: "2026-10-09T08:00:00.000Z", lowAt: 5 } }, { id: "nope", before: {} }] } },
    ] } };
    const s2 = sanitizeStored(JSON.parse(JSON.stringify(stored)), "2026-10-12");
    const it = s2.chat.items[0];
    expect(it.kind === "proposal" && it.proposal.stock).toEqual([{ productId: "p-rice-0001", name: "Jollof rice", add: 20, result: 37 }]);
    expect(it.kind === "proposal" && it.saved?.stock).toEqual([{ id: "p-rice-0001", before: { stock: 17, countedAt: "2026-10-09T08:00:00.000Z", lowAt: 5 } }]);
  });
});
