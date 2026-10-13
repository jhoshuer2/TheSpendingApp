import { validateRequest } from "../../supabase/functions/_shared/assistant-protocol.ts";
import { DEFAULT_SETTINGS, emptyChat, type Chat, type Item, type Pending, type ProposalStatus, type Saved, type Settings } from "./engine";
import { cleanExpense, cleanSale } from "../records/state";
import { FACT_KEYS, type BusinessFacts } from "../messages/facts";
import type { Draft, Proposal, StockChange } from "./tools";

export interface Stored {
  chat: Chat;
  settings: Settings;
  /** The person has read what is shared with the AI and agreed. */
  consented: boolean;
}

const MAX_ITEMS = 120;
const str = (v: unknown, max: number): string | undefined => (typeof v === "string" ? v.slice(0, max) : undefined);
const idOf = (v: unknown): string | undefined => (typeof v === "string" && /^[\w-]{1,100}$/.test(v) ? v : undefined);
const STATUSES: ProposalStatus[] = ["pending", "saved", "dismissed", "undone"];
const ids = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && /^[0-9a-zA-Z-]{8,64}$/.test(x)).slice(0, 100) : []);

/** Proposals are cleaned with the same rules as real records; anything that doesn't pass is dropped. */
function cleanProposal(raw: unknown): Proposal | null {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: Proposal = { sales: [], expenses: [] };
  const FAKE_ID = "00000000-0000-0000-0000-000000000000";
  for (const x of (Array.isArray(o.sales) ? o.sales : []).slice(0, 20)) {
    const c = cleanSale({ ...(x as object), id: FAKE_ID });
    if (!c) return null;
    out.sales.push({ amount: c.amount, items: c.items, ...(c.note ? { note: c.note } : {}), ...(c.customer ? { customer: c.customer } : {}), paid: c.paid, at: c.at });
  }
  for (const x of (Array.isArray(o.expenses) ? o.expenses : []).slice(0, 20)) {
    const c = cleanExpense({ ...(x as object), id: FAKE_ID });
    if (!c) return null;
    out.expenses.push({ amount: c.amount, category: c.category, ...(c.note ? { note: c.note } : {}), at: c.at });
  }
  const m = (o.markPaid && typeof o.markPaid === "object" ? o.markPaid : null) as Record<string, unknown> | null;
  if (m) {
    const customer = str(m.customer, 80), saleIds = ids(m.saleIds);
    if (!customer || !saleIds.length || typeof m.total !== "number" || !Number.isFinite(m.total) || m.total < 0) return null;
    out.markPaid = { customer, saleIds, total: m.total };
  }
  if (Array.isArray(o.stock)) {
    const cleanInt = (v: unknown, min: number) => (typeof v === "number" && Number.isInteger(v) && v >= min && v <= 1_000_000 ? v : undefined);
    const stock = o.stock.slice(0, 20).flatMap((c): StockChange[] => {
      const x = (c && typeof c === "object" ? c : {}) as Record<string, unknown>;
      const productId = typeof x.productId === "string" && /^[0-9a-zA-Z-]{8,64}$/.test(x.productId) ? x.productId : null;
      const name = str(x.name, 80);
      if (!productId || !name) return [];
      const set = cleanInt(x.set, 0), add = cleanInt(x.add, 1), lowAt = cleanInt(x.lowAt, 0), result = cleanInt(x.result, 0);
      if (set === undefined && add === undefined && lowAt === undefined) return [];
      return [{ productId, name, ...(set !== undefined ? { set } : {}), ...(add !== undefined ? { add } : {}), ...(lowAt !== undefined ? { lowAt } : {}), ...(result !== undefined ? { result } : {}) }];
    });
    if (stock.length) out.stock = stock;
  }
  const f = (o.facts && typeof o.facts === "object" ? o.facts : null) as Record<string, unknown> | null;
  if (f) {
    const facts: BusinessFacts = {};
    for (const k of FACT_KEYS) if (typeof f[k] === "string" && (f[k] as string).trim()) facts[k] = (f[k] as string).trim().slice(0, 200);
    if (Object.keys(facts).length) out.facts = facts;
  }
  return out.sales.length + out.expenses.length > 0 || out.markPaid || out.facts || out.stock ? out : null;
}

function cleanItem(raw: unknown): Item | null {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const id = idOf(o.id);
  if (!id) return null;
  if (o.kind === "user" || o.kind === "assistant" || o.kind === "note") {
    const text = str(o.text, 8000);
    return text ? { kind: o.kind, id, text } : null;
  }
  if (o.kind === "draft") {
    const d = (o.draft && typeof o.draft === "object" ? o.draft : {}) as Record<string, unknown>;
    const kind = d.kind === "reminder" || d.kind === "receipt" || d.kind === "text" ? d.kind : null;
    const customerKey = typeof d.customerKey === "string" && /^[\w-]{1,200}$/.test(d.customerKey) ? d.customerKey : undefined;
    const title = str(d.title, 120), text = str(d.text, 1500);
    if (!kind || (kind !== "text" && !customerKey) || !title || !text) return null;
    const saleId = typeof d.saleId === "string" && /^[0-9a-zA-Z-]{8,64}$/.test(d.saleId) ? d.saleId : undefined;
    const draft: Draft = { kind, title, text, ...(customerKey ? { customerKey } : {}), ...(saleId ? { saleId } : {}) };
    return { kind: "draft", id, draft };
  }
  if (o.kind === "proposal") {
    const proposal = cleanProposal(o.proposal);
    const status = STATUSES.find((s) => s === o.status);
    if (!proposal || !status) return null;
    const sv = (o.saved && typeof o.saved === "object" ? o.saved : null) as Record<string, unknown> | null;
    const savedFacts: Saved["facts"] = {};
    if (sv?.facts && typeof sv.facts === "object") for (const k of FACT_KEYS) { const v = (sv.facts as Record<string, unknown>)[k]; if (v === null) savedFacts[k] = null; else if (typeof v === "string") savedFacts[k] = v.slice(0, 200); }
    const savedStock: NonNullable<Saved["stock"]> = [];
    if (Array.isArray(sv?.stock)) for (const e of sv.stock.slice(0, 20)) {
      const x = (e && typeof e === "object" ? e : {}) as Record<string, unknown>, b = (x.before && typeof x.before === "object" ? x.before : {}) as Record<string, unknown>;
      if (typeof x.id !== "string" || !/^[0-9a-zA-Z-]{8,64}$/.test(x.id)) continue;
      const n = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 1_000_000 ? v : undefined);
      const when = typeof b.countedAt === "string" && !Number.isNaN(Date.parse(b.countedAt)) ? new Date(b.countedAt).toISOString() : undefined;
      const stock = n(b.stock), lowAt = n(b.lowAt);
      savedStock.push({ id: x.id, before: { ...(stock !== undefined && when ? { stock, countedAt: when } : {}), ...(lowAt !== undefined ? { lowAt } : {}) } });
    }
    const saved: Saved | undefined = sv ? { sales: ids(sv.sales), expenses: ids(sv.expenses), paid: ids(sv.paid), ...(Object.keys(savedFacts).length ? { facts: savedFacts } : {}), ...(savedStock.length ? { stock: savedStock } : {}) } : undefined;
    return { kind: "proposal", id, proposal, status, ...(o.auto === true ? { auto: true } : {}), ...(o.stale === true ? { stale: true } : {}), ...(saved ? { saved } : {}) };
  }
  return null;
}

/** Validate what was stored on this phone. A damaged chat becomes an empty one; it never breaks the screen. */
export function sanitizeStored(raw: unknown, today: string): Stored {
  const fresh: Stored = { chat: emptyChat(today), settings: DEFAULT_SETTINGS, consented: false };
  if (!raw || typeof raw !== "object") return fresh;
  const r = raw as Record<string, unknown>;
  const s = (r.settings && typeof r.settings === "object" ? r.settings : {}) as Record<string, unknown>;
  const settings: Settings = { replyLanguage: s.replyLanguage === "pcm" ? "pcm" : "en", autonomy: s.autonomy === "auto" ? "auto" : "ask" };
  const consented = r.consented === true;
  const c = (r.chat && typeof r.chat === "object" ? r.chat : {}) as Record<string, unknown>;

  const items = (Array.isArray(c.items) ? c.items : []).map(cleanItem).filter((x): x is Item => x !== null).slice(-MAX_ITEMS);
  const day = typeof c.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(c.day) ? c.day : today;

  // The model's history must be exactly valid, or the server will refuse it. If it isn't, start the conversation again (the cards stay).
  let api: Chat["api"] = [];
  let pending: Pending[] = [];
  if (Array.isArray(c.api) && c.api.length) {
    const v = validateRequest({ messages: [...c.api, { role: "user", content: "x" }] });
    if (v.ok) {
      api = v.messages.slice(0, -1);
      const itemIds = new Set(items.map((i) => i.id));
      pending = (Array.isArray(c.pending) ? c.pending : []).flatMap((p): Pending[] => {
        const x = (p && typeof p === "object" ? p : {}) as Record<string, unknown>;
        const toolUseId = idOf(x.toolUseId);
        if (!toolUseId) return [];
        if (typeof x.itemId === "string" && itemIds.has(x.itemId)) return [{ toolUseId, itemId: x.itemId }];
        const content = str(x.content, 12000);
        return content !== undefined ? [{ toolUseId, content, ...(x.isError === true ? { isError: true } : {}) }] : [];
      });
      // Every tool call in the last assistant turn needs an answer; if any is missing we can't continue that conversation.
      const last = api[api.length - 1];
      const uses = last && last.role === "assistant" && Array.isArray(last.content) ? last.content.filter((b) => b.type === "tool_use").map((b) => String(b.id)) : [];
      if (uses.some((u) => !pending.some((p) => p.toolUseId === u))) {
        api = [];
        pending = [];
      }
    }
  }
  const failed = (c.failed && typeof c.failed === "object" ? c.failed : null) as { text?: unknown } | null;
  const failedText = failed ? (failed.text === null ? null : str(failed.text, 1000)) : undefined;
  const chat: Chat = { api, items: api.length === 0 ? items.map((i) => (i.kind === "proposal" && i.status === "pending" ? { ...i, status: "dismissed" as const, stale: true } : i)) : items, pending, day, ...(failedText !== undefined ? { failed: { text: failedText } } : {}) };
  return { chat, settings, consented };
}

const key = (userId: string) => `spal.assistant.v1:${userId}`;
export function readStored(userId: string, today: string): Stored {
  try {
    const raw = localStorage.getItem(key(userId));
    return sanitizeStored(raw ? JSON.parse(raw) : null, today);
  } catch {
    return sanitizeStored(null, today);
  }
}
export function writeStored(userId: string, s: Stored): void {
  try {
    localStorage.setItem(key(userId), JSON.stringify(s));
  } catch {
    /* storage full or unavailable: the chat just won't survive a reload */
  }
}
export function clearStored(userId: string): void {
  try {
    localStorage.removeItem(key(userId));
  } catch {
    /* nothing to clear */
  }
}
