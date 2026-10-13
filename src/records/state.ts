import { EXPENSE_CATEGORIES, type Customer, type Expense, type ExpenseCategory, type Product, type Sale, type SaleItem } from "./types";

/** What hasn't reached the server yet, by record id. Kept with the cache so closing the tab loses nothing. */
export interface RecordsDirty {
  customers: string[];
  products: string[];
  sales: string[];
  expenses: string[];
}

export interface RecordsState {
  customers: Record<string, Customer>;
  products: Record<string, Product>;
  sales: Record<string, Sale>;
  expenses: Record<string, Expense>;
  dirty: RecordsDirty;
  /** Rows the server refused for good (as "sale:<id>"). Kept on this phone, not retried, and shown to the person. */
  rejected: string[];
  /** Newest change we've pulled from the server. The next pull only asks for changes since then. */
  cursor?: string;
}

export const EMPTY_RECORDS: RecordsState = { customers: {}, products: {}, sales: {}, expenses: {}, dirty: { customers: [], products: [], sales: [], expenses: [] }, rejected: [] };

export const isRecordsDirty = (s: RecordsState): boolean => s.dirty.customers.length + s.dirty.products.length + s.dirty.sales.length + s.dirty.expenses.length > 0;

const MAX_KOBO = 100_000_000_000;
export const MAX_STOCK = 1_000_000;
const whole = (v: unknown, min: number, max: number): number | undefined => {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isInteger(n) && n >= min && n <= max ? n : undefined;
};
const categories = new Set<string>(EXPENSE_CATEGORIES.map((c) => c.id));

const str = (v: unknown, max: number): string | undefined => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
const kobo = (v: unknown, min: number): number | undefined => {
  const n = typeof v === "string" ? Number(v) : v; // PostgREST can return bigint columns as strings
  return typeof n === "number" && Number.isInteger(n) && n >= min && n <= MAX_KOBO ? n : undefined;
};
const iso = (v: unknown): string | undefined => (typeof v === "string" && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : undefined);
const id = (v: unknown): string | undefined => (typeof v === "string" && /^[0-9a-zA-Z-]{8,64}$/.test(v) ? v : undefined);

const phone = (v: unknown): string | undefined => (typeof v === "string" && v.trim() && v.trim().length <= 20 && /^[0-9+() -]+$/.test(v.trim()) ? v.trim() : undefined);

export function cleanCustomer(r: unknown): Customer | null {
  const o = (r && typeof r === "object" ? r : {}) as Record<string, unknown>;
  const cid = id(o.id), name = str(o.name, 80);
  if (!cid || !name) return null;
  const ph = phone(o.phone), note = str(o.note, 200);
  return { id: cid, name, ...(ph ? { phone: ph } : {}), ...(note ? { note } : {}), ...(o.archived === true ? { archived: true } : {}) };
}

/** Each cleaner returns null for a row it can't trust, so one bad row never breaks the screen. */
export function cleanProduct(r: unknown): Product | null {
  const o = (r && typeof r === "object" ? r : {}) as Record<string, unknown>;
  const pid = id(o.id), name = str(o.name, 80), price = kobo(o.price, 0);
  if (!pid || !name || price === undefined) return null;
  const cost = kobo(o.cost, 0);
  // A count always comes with the time it was taken; one without the other is not trusted.
  const count = whole(o.stock, 0, MAX_STOCK), countedAt = iso(o.countedAt ?? o.counted_at);
  const tracked = count !== undefined && countedAt !== undefined;
  const lowAt = whole(o.lowAt ?? o.low_at, 0, MAX_STOCK);
  return {
    id: pid, name, price,
    ...(cost !== undefined ? { cost } : {}),
    ...(o.archived === true ? { archived: true } : {}),
    ...(tracked ? { stock: count, countedAt } : {}),
    ...(lowAt !== undefined ? { lowAt } : {}),
  };
}

function cleanItems(v: unknown): SaleItem[] {
  if (!Array.isArray(v)) return [];
  const out: SaleItem[] = [];
  for (const it of v.slice(0, 50)) {
    const o = (it && typeof it === "object" ? it : {}) as Record<string, unknown>;
    const name = str(o.name, 80), unit = kobo(o.unitPrice, 0);
    const qty = typeof o.qty === "number" && Number.isInteger(o.qty) && o.qty >= 1 && o.qty <= 100000 ? o.qty : undefined;
    if (!name || unit === undefined || qty === undefined) continue;
    const pid = id(o.productId);
    out.push({ ...(pid ? { productId: pid } : {}), name, qty, unitPrice: unit });
  }
  return out;
}

export function cleanSale(r: unknown): Sale | null {
  const o = (r && typeof r === "object" ? r : {}) as Record<string, unknown>;
  const sid = id(o.id), at = iso(o.at), amount = kobo(o.amount, 1);
  if (!sid || !at || amount === undefined) return null;
  const paid = o.paid !== false;
  const paidAt = paid ? iso(o.paidAt ?? o.paid_at) : undefined;
  const deletedAt = iso(o.deletedAt ?? o.deleted_at);
  const note = str(o.note, 200), customer = str(o.customer, 80);
  return { id: sid, at, amount, items: cleanItems(o.items), ...(note ? { note } : {}), ...(customer ? { customer } : {}), paid, ...(paidAt ? { paidAt } : {}), ...(deletedAt ? { deletedAt } : {}) };
}

export function cleanExpense(r: unknown): Expense | null {
  const o = (r && typeof r === "object" ? r : {}) as Record<string, unknown>;
  const eid = id(o.id), at = iso(o.at), amount = kobo(o.amount, 1);
  const category = typeof o.category === "string" && categories.has(o.category) ? (o.category as ExpenseCategory) : undefined;
  if (!eid || !at || amount === undefined || !category) return null;
  const note = str(o.note, 200), deletedAt = iso(o.deletedAt ?? o.deleted_at);
  return { id: eid, at, amount, category, ...(note ? { note } : {}), ...(deletedAt ? { deletedAt } : {}) };
}

const byId = <T extends { id: string }>(rows: unknown, clean: (r: unknown) => T | null): Record<string, T> => {
  const out: Record<string, T> = {};
  if (Array.isArray(rows)) for (const r of rows) { const c = clean(r); if (c) out[c.id] = c; }
  return out;
};
const ids = (v: unknown, known: Record<string, unknown>): string[] => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === "string" && x in known))] : []);

/** Validate a cached blob. Anything wrong is dropped, never trusted. */
export function sanitizeRecords(raw: unknown): RecordsState {
  if (!raw || typeof raw !== "object") return EMPTY_RECORDS;
  const r = raw as Record<string, unknown>;
  const asList = (m: unknown) => (m && typeof m === "object" ? Object.values(m as object) : []);
  const customers = byId(asList(r.customers), cleanCustomer);
  const products = byId(asList(r.products), cleanProduct);
  const sales = byId(asList(r.sales), cleanSale);
  const expenses = byId(asList(r.expenses), cleanExpense);
  const d = (r.dirty && typeof r.dirty === "object" ? r.dirty : {}) as Record<string, unknown>;
  const cursor = iso(r.cursor);
  const rejected = Array.isArray(r.rejected) ? [...new Set(r.rejected.filter((x): x is string => typeof x === "string" && /^(customer|product|sale|expense):[0-9a-zA-Z-]{8,64}$/.test(x)))] : [];
  return { customers, products, sales, expenses, dirty: { customers: ids(d.customers, customers), products: ids(d.products, products), sales: ids(d.sales, sales), expenses: ids(d.expenses, expenses) }, rejected, ...(cursor ? { cursor } : {}) };
}

export interface Pulled {
  customers: Customer[];
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  cursor?: string;
}

/**
 * Apply what the server sent. Anything we haven't pushed yet wins (it is the person's latest change);
 * everything else takes the server's version. Rows are matched by id, so repeats are harmless.
 */
export function mergePulled(local: RecordsState, pulled: Pulled): RecordsState {
  const take = <T extends { id: string }>(mine: Record<string, T>, theirs: T[], pending: string[]) => {
    const out = { ...mine };
    for (const row of theirs) if (!pending.includes(row.id)) out[row.id] = row;
    return out;
  };
  const cursor = [local.cursor, pulled.cursor].filter(Boolean).sort().at(-1);
  return {
    customers: take(local.customers, pulled.customers, local.dirty.customers),
    products: take(local.products, pulled.products, local.dirty.products),
    sales: take(local.sales, pulled.sales, local.dirty.sales),
    expenses: take(local.expenses, pulled.expenses, local.dirty.expenses),
    dirty: local.dirty,
    rejected: local.rejected,
    ...(cursor ? { cursor } : {}),
  };
}

/**
 * Put refused rows back in the queue so they get one more try (the rule, the clock or the app may have been fixed).
 * Rows that are refused again go straight back to `rejected`, so this never loops.
 */
export function requeueRejected(s: RecordsState): RecordsState {
  if (!s.rejected.length) return s;
  const dirty: RecordsDirty = { customers: [...s.dirty.customers], products: [...s.dirty.products], sales: [...s.dirty.sales], expenses: [...s.dirty.expenses] };
  const tables = { customer: "customers", product: "products", sale: "sales", expense: "expenses" } as const;
  for (const entry of s.rejected) {
    const [kind, id] = entry.split(":") as [keyof typeof tables, string];
    const t = tables[kind];
    if (t && s[t][id] && !dirty[t].includes(id)) dirty[t].push(id);
  }
  return { ...s, dirty, rejected: [] };
}

const cacheKey = (userId: string) => `spal.records.v1:${userId}`;

export function readRecordsCache(userId: string): RecordsState | null {
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    return raw ? sanitizeRecords(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}
export function writeRecordsCache(userId: string, s: RecordsState): void {
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify(s));
  } catch {
    /* storage full or unavailable: records still sync to the server when online */
  }
}
export function clearRecordsCache(userId: string): void {
  try {
    localStorage.removeItem(cacheKey(userId));
  } catch {
    /* nothing to clear */
  }
}
