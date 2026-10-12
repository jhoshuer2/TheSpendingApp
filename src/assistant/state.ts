import { validateRequest } from "../../supabase/functions/_shared/assistant-protocol.ts";
import { DEFAULT_SETTINGS, emptyChat, type Chat, type Item, type Pending, type ProposalStatus, type Saved, type Settings } from "./engine";
import { cleanExpense, cleanSale } from "../records/state";
import type { Proposal } from "./tools";

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
  return out.sales.length + out.expenses.length > 0 || out.markPaid ? out : null;
}

function cleanItem(raw: unknown): Item | null {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const id = idOf(o.id);
  if (!id) return null;
  if (o.kind === "user" || o.kind === "assistant" || o.kind === "note") {
    const text = str(o.text, 8000);
    return text ? { kind: o.kind, id, text } : null;
  }
  if (o.kind === "proposal") {
    const proposal = cleanProposal(o.proposal);
    const status = STATUSES.find((s) => s === o.status);
    if (!proposal || !status) return null;
    const sv = (o.saved && typeof o.saved === "object" ? o.saved : null) as Record<string, unknown> | null;
    const saved: Saved | undefined = sv ? { sales: ids(sv.sales), expenses: ids(sv.expenses), paid: ids(sv.paid) } : undefined;
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
