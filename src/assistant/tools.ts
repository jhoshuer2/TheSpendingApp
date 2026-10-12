import { EXPENSE_CATEGORIES } from "../../supabase/functions/_shared/assistant-protocol.ts";
import { categoryName, liveSales, owed, periodRanges, summarize, ledger, localDay, saleTitle } from "../records/calc";
import { buildCustomers, normName, type CustomerEntry } from "../records/customers";
import { receiptMessage, reminderMessage, type MsgLang, type Tone } from "../messages/templates";
import { MAX_NAIRA, toKobo } from "../records/money";
import type { RecordsState } from "../records/state";
import type { ExpenseCategory, Product, SaleItem } from "../records/types";

/** What the assistant suggests. Nothing here is saved until the person says so (or turned on auto-save). */
export interface ProposedSale {
  amount: number;
  items: SaleItem[];
  note?: string;
  customer?: string;
  paid: boolean;
  at: string;
}
export interface ProposedExpense {
  amount: number;
  category: ExpenseCategory;
  note?: string;
  at: string;
}
export interface Proposal {
  sales: ProposedSale[];
  expenses: ProposedExpense[];
  markPaid?: { customer: string; saleIds: string[]; total: number };
}
export type Built = { ok: true; proposal: Proposal } | { ok: false; error: string };

const naira = (kobo: number) => Math.round(kobo) / 100;
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const text = (v: unknown, max: number): string | undefined => (typeof v === "string" && v.trim() ? v.trim().replace(/\s+/g, " ").slice(0, max) : undefined);
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();
const categories = new Set<string>(EXPENSE_CATEGORIES);

/** Whole-naira-or-kobo amount the assistant gave, as kobo, or an explanation the assistant can act on. */
function amountOf(v: unknown, what: string, min = 0.01): { kobo: number } | { error: string } {
  if (typeof v !== "number" || !Number.isFinite(v)) return { error: `${what}: the amount is missing or not a number. Ask the person.` };
  if (v < min) return { error: `${what}: the amount must be more than zero.` };
  if (v > MAX_NAIRA) return { error: `${what}: that amount is too large. Check it with the person.` };
  return { kobo: toKobo(v) };
}

/** "today", "yesterday" or YYYY-MM-DD, to a timestamp. Past days are set to midday so the day is unambiguous. */
function whenOf(v: unknown, now: Date): { at: string } | { error: string } {
  if (v === undefined || v === null || v === "" || v === "today") return { at: now.toISOString() };
  if (typeof v !== "string") return { error: "The date must be today, yesterday or YYYY-MM-DD." };
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
  if (v === "yesterday") return { at: day(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)).toISOString() };
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return { error: "The date must be today, yesterday or YYYY-MM-DD." };
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
  if (d.getFullYear() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[3])) return { error: `${v} is not a real date.` };
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
  if (d.getTime() >= startOfTomorrow) return { error: "Records can't be dated in the future." };
  if (d.getFullYear() < now.getFullYear() - 5) return { error: "That date is too long ago." };
  return { at: localDay(d.toISOString()) === localDay(now.toISOString()) ? now.toISOString() : d.toISOString() };
}

/** Match what the person said to one of their products: exact name first, then a name that contains it, only if that is unambiguous. */
function matchProduct(name: string, products: Product[]): Product | undefined {
  const n = norm(name);
  if (!n) return undefined;
  const exact = products.filter((p) => norm(p.name) === n);
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) return undefined;
  const part = products.filter((p) => norm(p.name).includes(n) || n.includes(norm(p.name)));
  return part.length === 1 ? part[0] : undefined;
}

export function buildRecordsProposal(input: unknown, state: RecordsState, now: Date): Built {
  const o = obj(input);
  const rawSales = Array.isArray(o.sales) ? o.sales : [];
  const rawExpenses = Array.isArray(o.expenses) ? o.expenses : [];
  if (rawSales.length === 0 && rawExpenses.length === 0) return { ok: false, error: "Nothing to record. Ask the person what they sold or spent." };
  if (rawSales.length > 20 || rawExpenses.length > 20) return { ok: false, error: "Too many at once. Send at most 20 sales and 20 expenses." };
  const products = Object.values(state.products).filter((p) => !p.archived);

  const sales: ProposedSale[] = [];
  for (const [i, r] of rawSales.entries()) {
    const s = obj(r), label = `Sale ${i + 1}`;
    const amt = amountOf(s.amount, label);
    if ("error" in amt) return { ok: false, error: amt.error };
    const when = whenOf(s.when, now);
    if ("error" in when) return { ok: false, error: `${label}: ${when.error}` };
    const paid = s.paid !== false;
    const customer = text(s.customer, 80);
    if (!paid && !customer) return { ok: false, error: `${label}: it is not paid, so ask the person who owes it.` };

    const items: SaleItem[] = [];
    let allExplicit = true;
    const rawItems = Array.isArray(s.items) ? s.items : [];
    if (rawItems.length > 20) return { ok: false, error: `${label}: too many items.` };
    for (const it of rawItems) {
      const x = obj(it);
      const name = text(x.name, 80);
      const qty = x.qty === undefined ? 1 : x.qty;
      if (!name) return { ok: false, error: `${label}: an item has no name.` };
      if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 1 || qty > 100000) return { ok: false, error: `${label}: "${name}" needs a quantity of one or more.` };
      let unit: number | undefined;
      if (x.unit_price !== undefined && x.unit_price !== null) {
        if (typeof x.unit_price !== "number" || !Number.isFinite(x.unit_price) || x.unit_price < 0 || x.unit_price > MAX_NAIRA) return { ok: false, error: `${label}: "${name}" has an unusable price.` };
        unit = toKobo(x.unit_price);
      }
      if (unit === undefined) allExplicit = false;
      const product = matchProduct(name, products);
      items.push({ ...(product ? { productId: product.id } : {}), name: product?.name ?? name, qty, unitPrice: unit ?? product?.price ?? -1 });
    }
    // Unit prices the assistant didn't give: work them out only when there is a single item; otherwise leave them at zero.
    if (items.length === 1 && items[0].unitPrice < 0) items[0].unitPrice = Math.round(amt.kobo / items[0].qty);
    for (const it of items) if (it.unitPrice < 0) it.unitPrice = 0;
    if (items.length > 0 && allExplicit && items.every((it) => it.unitPrice > 0)) {
      const sum = items.reduce((n, it) => n + it.qty * it.unitPrice, 0);
      if (Math.abs(sum - amt.kobo) > 100) return { ok: false, error: `${label}: the items add up to ₦${naira(sum).toLocaleString("en-NG")} but the total is ₦${naira(amt.kobo).toLocaleString("en-NG")}. Check the numbers with the person.` };
    }
    const note = text(s.note, 200);
    sales.push({ amount: amt.kobo, items, ...(note ? { note } : {}), ...(customer ? { customer } : {}), paid, at: when.at });
  }

  const expenses: ProposedExpense[] = [];
  for (const [i, r] of rawExpenses.entries()) {
    const e = obj(r), label = `Expense ${i + 1}`;
    const amt = amountOf(e.amount, label);
    if ("error" in amt) return { ok: false, error: amt.error };
    if (typeof e.category !== "string" || !categories.has(e.category)) return { ok: false, error: `${label}: the category must be one of ${EXPENSE_CATEGORIES.join(", ")}.` };
    const when = whenOf(e.when, now);
    if ("error" in when) return { ok: false, error: `${label}: ${when.error}` };
    const note = text(e.note, 200);
    expenses.push({ amount: amt.kobo, category: e.category as ExpenseCategory, ...(note ? { note } : {}), at: when.at });
  }
  return { ok: true, proposal: { sales, expenses } };
}

/** Find who the person means among the customers who owe. Never guesses between two. */
export function buildMarkPaidProposal(input: unknown, state: RecordsState): Built {
  const name = text(obj(input).customer, 80);
  if (!name) return { ok: false, error: "Which customer? Ask the person." };
  const unpaid = owed(state).list.filter((s) => s.customer);
  const owing = [...new Set(unpaid.map((s) => s.customer as string))];
  const n = norm(name);
  const exact = owing.filter((c) => norm(c) === n);
  const hits = exact.length ? exact : owing.filter((c) => n.length >= 2 && (norm(c).includes(n) || n.includes(norm(c))));
  if (hits.length === 0) return { ok: false, error: owing.length ? `Nobody called "${name}" owes anything. People who owe: ${owing.slice(0, 10).join(", ")}.` : `Nobody owes anything right now, so there is nothing to mark as paid.` };
  if (hits.length > 1) return { ok: false, error: `More than one customer matches "${name}": ${hits.slice(0, 5).join(", ")}. Ask the person which one.` };
  const sales = unpaid.filter((s) => s.customer === hits[0]);
  return { ok: true, proposal: { sales: [], expenses: [], markPaid: { customer: hits[0], saleIds: sales.map((s) => s.id), total: sales.reduce((n2, s) => n2 + s.amount, 0) } } };
}

/** Largest single proposal that auto-save will accept without asking. */
export const AUTO_LIMIT_KOBO = toKobo(500_000);
export function proposalTotal(p: Proposal): number {
  return p.sales.reduce((n, s) => n + s.amount, 0) + p.expenses.reduce((n, e) => n + e.amount, 0) + (p.markPaid?.total ?? 0);
}

const money = (kobo: number) => `₦${naira(kobo).toLocaleString("en-NG")}`;

/** One line per thing, in plain words. Used on the card and in the result sent back to the model. */
export function describeProposal(p: Proposal): string[] {
  const lines: string[] = [];
  for (const s of p.sales) {
    const what = s.items.length ? s.items.map((i) => `${i.qty > 1 ? `${i.qty} × ` : ""}${i.name}`).join(", ") : s.note || "Sale";
    lines.push(`${what}: ${money(s.amount)}${s.paid ? (s.customer ? ` · ${s.customer}, paid` : "") : ` · ${s.customer} owes this`}`);
  }
  for (const e of p.expenses) lines.push(`${e.note || categoryName(e.category)}: ${money(e.amount)} spent`);
  if (p.markPaid) lines.push(`${p.markPaid.customer} paid ${money(p.markPaid.total)}`);
  return lines;
}

// ---- Tools that only read ----

const CAP = 11000;
const cap = (s: string) => (s.length > CAP ? `${s.slice(0, CAP)}…(cut short)` : s);
const dayName = (iso: string) => localDay(iso);

/** Run a read-only tool against the person's books. Returns the text sent back to the model. */
export function runReadTool(name: string, input: unknown, state: RecordsState, now: Date): string {
  const o = obj(input);
  switch (name) {
    case "get_summary": {
      const period = o.period === "day" || o.period === "week" || o.period === "month" ? o.period : "week";
      const r = periodRanges(period, now);
      const fig = (k: ReturnType<typeof summarize>) => ({ sold: naira(k.sold), received: naira(k.received), spent: naira(k.spent), kept: naira(k.kept), sales_count: k.salesCount, expenses_count: k.expensesCount });
      const owing = owed(state);
      return JSON.stringify({ period, current: fig(summarize(state, r.current)), previous: fig(summarize(state, r.previous)), still_owed_to_person: naira(owing.total), people_who_owe: new Set(owing.list.map((s) => s.customer ?? "?")).size, note: "kept = money received minus money spent. sold includes sales not yet paid for." });
    }
    case "list_owed": {
      const { list, total } = owed(state);
      return cap(JSON.stringify({ total: naira(total), count: list.length, sales: list.slice(0, 40).map((s) => ({ customer: s.customer ?? "(no name)", amount: naira(s.amount), what: saleTitle(s), since: dayName(s.at) })) }));
    }
    case "list_recent": {
      const limit = typeof o.limit === "number" && o.limit >= 1 ? Math.min(Math.floor(o.limit), 15) : 8;
      const kind = o.kind === "sale" || o.kind === "expense" ? o.kind : undefined;
      const rows = ledger(state).filter((e) => !kind || e.kind === kind).slice(0, limit);
      return cap(JSON.stringify({ records: rows.map((e) => ({ kind: e.kind, date: dayName(e.at), what: e.title, amount: naira(e.amount), ...(e.owing ? { not_paid_yet: true } : {}) })) }));
    }
    case "best_sellers": {
      const days = typeof o.days === "number" && o.days >= 1 ? Math.min(Math.floor(o.days), 90) : 30;
      const since = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1).getTime();
      const by = new Map<string, { qty: number; revenue: number }>();
      for (const s of liveSales(state)) {
        if (Date.parse(s.at) < since) continue;
        for (const it of s.items) {
          const cur = by.get(it.name) ?? { qty: 0, revenue: 0 };
          cur.qty += it.qty;
          cur.revenue += it.qty * it.unitPrice;
          by.set(it.name, cur);
        }
      }
      const top = [...by.entries()].sort((a, b) => b[1].qty - a[1].qty).slice(0, 10).map(([n, v]) => ({ product: n, quantity: v.qty, money_in: naira(v.revenue) }));
      return JSON.stringify({ days, best_sellers: top, ...(top.length ? {} : { note: "No sales with products were recorded in this time." }) });
    }
    case "list_products": {
      const ps = Object.values(state.products).filter((p) => !p.archived).sort((a, b) => a.name.localeCompare(b.name)).slice(0, 60);
      return cap(JSON.stringify({ products: ps.map((p) => ({ name: p.name, price: naira(p.price), ...(p.cost !== undefined ? { cost: naira(p.cost) } : {}) })), ...(ps.length ? {} : { note: "The person has not added any products yet." }) }));
    }
    case "list_customers": {
      const limit = typeof o.limit === "number" && o.limit >= 1 ? Math.min(Math.floor(o.limit), 15) : 8;
      const list = buildCustomers(state).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
      return cap(JSON.stringify({
        customers: list.slice(0, limit).map((c) => ({ name: c.name, bought_total: naira(c.total), sales: c.sales.length, owes: naira(c.owed), ...(c.lastAt ? { last_purchase: dayName(c.lastAt) } : {}) })),
        total_customers: list.length,
        ...(list.length ? {} : { note: "No customers yet. Names appear when a sale is recorded with a customer's name." }),
      }));
    }
    default:
      return JSON.stringify({ error: `Unknown tool ${name.slice(0, 40)}.` });
  }
}


// ---- Messages the person sends themselves ----

/** A message the assistant prepared. The text is a snapshot; the phone number is looked up when it is shown, never stored here. */
export interface Draft {
  kind: "reminder" | "receipt";
  customerKey: string;
  saleId?: string;
  title: string;
  text: string;
}
export type BuiltDraft = { ok: true; draft: Draft } | { ok: false; error: string };

export interface MessageContext {
  from?: string;
  lang: MsgLang;
  tone: Tone;
}

function matchCustomer(name: string, list: CustomerEntry[]): { hit: CustomerEntry } | { error: string } {
  const n = normName(name);
  if (!n) return { error: "Which customer? Ask the person." };
  const exact = list.filter((c) => normName(c.name) === n);
  const hits = exact.length ? exact : list.filter((c) => n.length >= 2 && (normName(c.name).includes(n) || n.includes(normName(c.name))));
  if (hits.length === 0) return { error: `No customer called "${name.slice(0, 40)}". Ask the person who they mean.` };
  if (hits.length > 1) return { error: `More than one customer matches "${name.slice(0, 40)}": ${hits.slice(0, 5).map((c) => c.name).join(", ")}. Ask which one.` };
  return { hit: hits[0] };
}

/** Prepare a reminder or receipt from the books. Amounts and dates come from the records, never from the model. */
export function buildDraft(input: unknown, state: RecordsState, ctx: MessageContext): BuiltDraft {
  const o = obj(input);
  const kind = o.kind === "reminder" || o.kind === "receipt" ? o.kind : null;
  if (!kind) return { ok: false, error: "The kind must be reminder or receipt." };
  const name = text(o.customer, 80);
  if (!name) return { ok: false, error: "Which customer? Ask the person." };
  const m = matchCustomer(name, buildCustomers(state));
  if ("error" in m) return { ok: false, error: m.error };
  const c = m.hit;
  const tone: Tone = o.tone === "short" || o.tone === "firm" ? o.tone : ctx.tone;
  if (kind === "reminder") {
    if (c.owed <= 0) return { ok: false, error: `${c.name} doesn't owe anything right now, so there is nothing to remind them about.` };
    return { ok: true, draft: { kind, customerKey: c.key, title: `Reminder for ${c.name}`, text: reminderMessage({ customerName: c.name, sales: c.owedSales, from: ctx.from, tone, lang: ctx.lang }) } };
  }
  const latest = c.sales[0];
  if (!latest) return { ok: false, error: `${c.name} has no sales yet, so there is no receipt to make.` };
  return { ok: true, draft: { kind, customerKey: c.key, saleId: latest.id, title: `Receipt for ${c.name}`, text: receiptMessage({ sale: latest, from: ctx.from, lang: ctx.lang }) } };
}
