import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { backend } from "../backend";
import { PermanentError, type RemoteRecords } from "../backend/types";
import { useAuth } from "../lib/auth";
import { useProfile } from "../profile/store";
import { liveExpenses, liveProducts, liveSales } from "./calc";
import {
  clearRecordsCache, EMPTY_RECORDS, isRecordsDirty, mergePulled, readRecordsCache, requeueRejected, writeRecordsCache,
  type RecordsState,
} from "./state";
import { normName } from "./customers";
import { stockLeft } from "./stock";
import type { Customer, Expense, ExpenseCategory, Product, RecordKind, Sale, SaleItem } from "./types";

export type RecordsStatus = "loading" | "ready" | "error";
export type RecordsSync = "idle" | "saving" | "offline";

/** A uuid for a new row. Made on the device, so saving offline works and retries can't create duplicates. */
export function newId(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  const b = c?.getRandomValues ? c.getRandomValues(new Uint8Array(16)) : Uint8Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export interface NewSale {
  amount: number;
  items?: SaleItem[];
  note?: string;
  customer?: string;
  paid: boolean;
  at?: string;
}
export interface NewExpense {
  amount: number;
  category: ExpenseCategory;
  note?: string;
  at?: string;
}
export interface CustomerInput {
  id?: string;
  name: string;
  phone?: string;
  note?: string;
}
export interface ProductInput {
  id?: string;
  name: string;
  price: number;
  cost?: number;
  /** undefined = leave tracking as it is; null = stop tracking; a number = count now. */
  stock?: number | null;
  /** undefined = leave as it is; null = no warning level; a number = warn at or below. */
  lowAt?: number | null;
}

/** What a product's count was, so a change can be undone exactly. */
export interface StockBefore {
  stock?: number;
  countedAt?: string;
  lowAt?: number;
}

interface RecordsApi {
  status: RecordsStatus;
  sync: RecordsSync;
  state: RecordsState;
  customers: Customer[];
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  addSale: (s: NewSale) => Sale;
  addExpense: (e: NewExpense) => Expense;
  markPaid: (id: string) => void;
  /** Undo markPaid. */
  markUnpaid: (id: string) => void;
  /** Soft delete. Undo with restoreRecord. */
  removeRecord: (kind: RecordKind, id: string) => void;
  restoreRecord: (kind: RecordKind, id: string) => void;
  saveProduct: (p: ProductInput) => Product;
  archiveProduct: (id: string, archived: boolean) => void;
  /** Count a product now. Starts tracking it if it wasn't. */
  setStock: (id: string, count: number) => void;
  /** Bought more: adds to what is left now (never below nothing) and counts from now. */
  addStock: (id: string, more: number) => void;
  /** The level to warn at, or null for none. */
  setLowAt: (id: string, level: number | null) => void;
  /** Put a product's count back exactly as it was (for Undo). */
  restoreStock: (id: string, before: StockBefore) => void;
  /** Save a customer's details. Changing the name also updates their past sales so they stay together. */
  saveCustomer: (c: CustomerInput) => Customer;
  /** Remove from the list (their sales stay). */
  archiveCustomer: (id: string) => void;
  /** How many records the server refused for good. They stay on this phone. */
  rejectedCount: number;
  retry: () => void;
  prepareSignOut: () => Promise<void>;
}

const Ctx = createContext<RecordsApi | null>(null);

const FLUSH_DELAY_MS = 600;
const RETRY_MS = 20_000;
const REFRESH_AFTER_MS = 30_000;

/**
 * The person's books. Same approach as their profile: the screen reads a local copy (instant, works offline),
 * changes are saved to the server in the background and retried until they get through.
 */
export function RecordsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { markActive } = useProfile();
  const userId = session?.id ?? null;

  const [state, setState] = useState<RecordsState>(EMPTY_RECORDS);
  const [status, setStatus] = useState<RecordsStatus>("loading");
  const [sync, setSync] = useState<RecordsSync>("idle");

  const ref = useRef<RecordsState>(EMPTY_RECORDS);
  const idRef = useRef<string | null>(null);
  const remoteRef = useRef<RemoteRecords | null>(null);
  const flushing = useRef<Promise<void> | null>(null);
  const flushTimer = useRef<number>();
  const retryTimer = useRef<number>();
  const loadSeq = useRef(0);
  const hadCache = useRef(false);
  const lastLoad = useRef(0);
  const markActiveRef = useRef(markActive);
  markActiveRef.current = markActive;

  const commit = useCallback((next: RecordsState) => {
    ref.current = next;
    setState(next);
    if (idRef.current) writeRecordsCache(idRef.current, next);
  }, []);

  const flush = useCallback((): Promise<void> => {
    if (flushing.current) return flushing.current;

    /** Take rows off the queue: sent, or refused for good. Only those still exactly what we sent. One commit for the lot, so a big backlog is one write, not one per row. */
    type Table = "customers" | "products" | "sales" | "expenses";
    const settle = (rows: { table: Table; id: string; sentJson: string }[], outcome: "sent" | "rejected") => {
      let next = ref.current;
      for (const { table, id, sentJson } of rows) {
        if (JSON.stringify(ref.current[table][id]) !== sentJson) continue; // edited meanwhile: stays queued
        const prefix = { customers: "customer", products: "product", sales: "sale", expenses: "expense" }[table];
        next = {
          ...next,
          dirty: { ...next.dirty, [table]: next.dirty[table].filter((x) => x !== id) },
          rejected: outcome === "rejected" ? [...new Set([...next.rejected, `${prefix}:${id}`])] : next.rejected,
        };
      }
      if (next !== ref.current) commit(next);
    };
    const asRows = (table: Table, rows: { id: string }[]) => rows.map((r) => ({ table, id: r.id, sentJson: JSON.stringify(r) }));

    const run = async () => {
      const remote = remoteRef.current;
      if (!remote) return;
      window.clearTimeout(retryTimer.current);
      try {
        for (;;) {
          const cur = ref.current;
          if (!isRecordsDirty(cur)) break;
          setSync("saving");
          const sent = {
            customers: cur.dirty.customers.map((id) => cur.customers[id]).filter(Boolean),
            products: cur.dirty.products.map((id) => cur.products[id]).filter(Boolean),
            sales: cur.dirty.sales.map((id) => cur.sales[id]).filter(Boolean),
            expenses: cur.dirty.expenses.map((id) => cur.expenses[id]).filter(Boolean),
          };
          try {
            await remote.push(sent);
            settle((["customers", "products", "sales", "expenses"] as const).flatMap((t) => asRows(t, sent[t])), "sent");
          } catch (e) {
            if (!(e instanceof PermanentError)) throw e;
            // The server refused something in this batch for good. Find which rows, so one bad row can't hold up the rest.
            for (const t of ["customers", "products", "sales", "expenses"] as const) {
              for (const r of sent[t]) {
                try {
                  await remote.push({ customers: [], products: [], sales: [], expenses: [], [t]: [r] });
                  settle(asRows(t, [r]), "sent");
                } catch (e2) {
                  if (!(e2 instanceof PermanentError)) throw e2;
                  settle(asRows(t, [r]), "rejected");
                }
              }
            }
          }
          // Rows edited while we were sending are still queued; clear any queue entries whose row no longer exists.
          const now = ref.current;
          const stale = (t: "customers" | "products" | "sales" | "expenses") => now.dirty[t].filter((id) => !now[t][id]);
          if (stale("customers").length + stale("products").length + stale("sales").length + stale("expenses").length) {
            commit({ ...now, dirty: { customers: now.dirty.customers.filter((id) => now.customers[id]), products: now.dirty.products.filter((id) => now.products[id]), sales: now.dirty.sales.filter((id) => now.sales[id]), expenses: now.dirty.expenses.filter((id) => now.expenses[id]) } });
          }
        }
        setSync("idle");
      } catch {
        setSync("offline");
        retryTimer.current = window.setTimeout(() => void flush(), RETRY_MS);
      }
    };
    flushing.current = run().finally(() => {
      flushing.current = null;
    });
    return flushing.current;
  }, [commit]);

  const reconcile = useCallback(async () => {
    const remote = remoteRef.current;
    const seq = ++loadSeq.current;
    if (!remote) return;
    try {
      const pulled = await remote.pull(ref.current.cursor);
      if (seq !== loadSeq.current) return;
      lastLoad.current = Date.now();
      // Refused rows get one more try on each load, in case whatever blocked them has changed.
      const merged = requeueRejected(mergePulled(ref.current, pulled));
      commit(merged);
      setStatus("ready");
      if (isRecordsDirty(merged)) void flush();
      else setSync("idle");
    } catch {
      if (seq !== loadSeq.current) return;
      // With nothing cached we can't tell "no records yet" from "server unreachable". Don't guess.
      if (!hadCache.current) setStatus("error");
      else setSync(isRecordsDirty(ref.current) ? "offline" : "idle");
    }
  }, [commit, flush]);

  useEffect(() => {
    window.clearTimeout(flushTimer.current);
    window.clearTimeout(retryTimer.current);
    loadSeq.current++;
    idRef.current = userId;
    remoteRef.current = userId ? backend.recordsFor(userId) : null;
    if (!userId) {
      ref.current = EMPTY_RECORDS;
      setState(EMPTY_RECORDS);
      setStatus("loading");
      setSync("idle");
      return;
    }
    const cached = readRecordsCache(userId);
    hadCache.current = cached !== null;
    ref.current = cached ?? EMPTY_RECORDS;
    setState(ref.current);
    setSync("idle");
    if (!remoteRef.current) {
      setStatus("ready");
      return;
    }
    setStatus(cached ? "ready" : "loading");
    void reconcile();
  }, [userId, reconcile]);

  useEffect(() => {
    const wake = () => {
      if (!remoteRef.current) return;
      if (isRecordsDirty(ref.current)) void flush();
      else if (document.visibilityState === "visible" && Date.now() - lastLoad.current > REFRESH_AFTER_MS) void reconcile();
    };
    window.addEventListener("online", wake);
    document.addEventListener("visibilitychange", wake);
    return () => {
      window.removeEventListener("online", wake);
      document.removeEventListener("visibilitychange", wake);
      window.clearTimeout(flushTimer.current);
      window.clearTimeout(retryTimer.current);
    };
  }, [flush, reconcile]);

  /** Apply a change, queue the touched rows for saving, and save soon. */
  const change = useCallback(
    (fn: (s: RecordsState) => RecordsState, touched: { customers?: string[]; products?: string[]; sales?: string[]; expenses?: string[] }) => {
      const cur = ref.current;
      let next = fn(cur);
      if (next === cur) return;
      if (remoteRef.current) {
        const add = (have: string[], more: string[] = []) => [...have, ...more.filter((m) => !have.includes(m))];
        next = { ...next, dirty: { customers: add(cur.dirty.customers, touched.customers), products: add(cur.dirty.products, touched.products), sales: add(cur.dirty.sales, touched.sales), expenses: add(cur.dirty.expenses, touched.expenses) } };
      }
      commit(next);
      if (remoteRef.current) {
        window.clearTimeout(flushTimer.current);
        flushTimer.current = window.setTimeout(() => void flush(), FLUSH_DELAY_MS);
      }
    },
    [commit, flush],
  );

  const api = useMemo<RecordsApi>(() => {
    const setSale = (id: string, fn: (x: Sale) => Sale) => change((s) => (s.sales[id] ? { ...s, sales: { ...s.sales, [id]: fn(s.sales[id]) } } : s), { sales: [id] });
    const setExpense = (id: string, fn: (x: Expense) => Expense) => change((s) => (s.expenses[id] ? { ...s, expenses: { ...s.expenses, [id]: fn(s.expenses[id]) } } : s), { expenses: [id] });
    const without = <T extends object>(o: T, ...keys: (keyof T)[]): T => {
      const c = { ...o };
      for (const k of keys) delete c[k];
      return c;
    };
    return {
      status,
      sync,
      state,
      customers: Object.values(state.customers).filter((c) => !c.archived).sort((a, b) => a.name.localeCompare(b.name)),
      products: liveProducts(state),
      sales: liveSales(state).sort((a, b) => b.at.localeCompare(a.at)),
      expenses: liveExpenses(state).sort((a, b) => b.at.localeCompare(a.at)),
      rejectedCount: state.rejected.length,
      addSale: (input) => {
        const at = input.at ?? new Date().toISOString();
        const sale: Sale = {
          id: newId(), at, amount: input.amount, items: input.items ?? [], paid: input.paid,
          ...(input.paid ? { paidAt: at } : {}),
          ...(input.note?.trim() ? { note: input.note.trim().slice(0, 200) } : {}),
          ...(input.customer?.trim() ? { customer: input.customer.trim().slice(0, 80) } : {}),
        };
        change((s) => ({ ...s, sales: { ...s.sales, [sale.id]: sale } }), { sales: [sale.id] });
        markActiveRef.current();
        return sale;
      },
      addExpense: (input) => {
        const e: Expense = { id: newId(), at: input.at ?? new Date().toISOString(), amount: input.amount, category: input.category, ...(input.note?.trim() ? { note: input.note.trim().slice(0, 200) } : {}) };
        change((s) => ({ ...s, expenses: { ...s.expenses, [e.id]: e } }), { expenses: [e.id] });
        markActiveRef.current();
        return e;
      },
      markPaid: (id) => setSale(id, (x) => (x.paid ? x : { ...x, paid: true, paidAt: new Date().toISOString() })),
      markUnpaid: (id) => setSale(id, (x) => (x.paid ? { ...without(x, "paidAt"), paid: false } : x)),
      removeRecord: (kind, id) => {
        const stamp = new Date().toISOString();
        if (kind === "sale") setSale(id, (x) => ({ ...x, deletedAt: stamp }));
        else setExpense(id, (x) => ({ ...x, deletedAt: stamp }));
      },
      restoreRecord: (kind, id) => {
        if (kind === "sale") setSale(id, (x) => without(x, "deletedAt"));
        else setExpense(id, (x) => without(x, "deletedAt"));
      },
      saveProduct: (input) => {
        const id = input.id ?? newId();
        const prev = state.products[id];
        const now = new Date().toISOString();
        const count = (n: number) => Math.max(0, Math.min(1_000_000, Math.round(n)));
        const tracking = input.stock === null ? {} : typeof input.stock === "number" ? { stock: count(input.stock), countedAt: now } : prev && prev.stock !== undefined && prev.countedAt ? { stock: prev.stock, countedAt: prev.countedAt } : {};
        const low = input.lowAt === null ? undefined : typeof input.lowAt === "number" ? count(input.lowAt) : prev?.lowAt;
        const p: Product = { id, name: input.name.trim().slice(0, 80), price: input.price, ...(input.cost !== undefined ? { cost: input.cost } : {}), ...(prev?.archived ? { archived: true } : {}), ...tracking, ...(low !== undefined ? { lowAt: low } : {}) };
        change((s) => ({ ...s, products: { ...s.products, [id]: p } }), { products: [id] });
        return p;
      },
      setStock: (id, count) => {
        const stock = Math.max(0, Math.min(1_000_000, Math.round(count)));
        change((s) => (s.products[id] ? { ...s, products: { ...s.products, [id]: { ...s.products[id], stock, countedAt: new Date().toISOString() } } } : s), { products: [id] });
      },
      addStock: (id, more) =>
        change((s) => {
          const p = s.products[id];
          if (!p) return s;
          // Counting from now: what is left now (not below nothing) plus what came in.
          const base = Math.max(0, stockLeft(s, p) ?? 0);
          const stock = Math.max(0, Math.min(1_000_000, Math.round(base + more)));
          return { ...s, products: { ...s.products, [id]: { ...p, stock, countedAt: new Date().toISOString() } } };
        }, { products: [id] }),
      setLowAt: (id, level) =>
        change((s) => {
          const p = s.products[id];
          if (!p) return s;
          const { lowAt: _l, ...rest } = p;
          return { ...s, products: { ...s.products, [id]: { ...rest, ...(level !== null ? { lowAt: Math.max(0, Math.min(1_000_000, Math.round(level))) } : {}) } } };
        }, { products: [id] }),
      restoreStock: (id, before) =>
        change((s) => {
          const p = s.products[id];
          if (!p) return s;
          const { stock: _s, countedAt: _c, lowAt: _l, ...rest } = p;
          return { ...s, products: { ...s.products, [id]: { ...rest, ...(before.stock !== undefined && before.countedAt ? { stock: before.stock, countedAt: before.countedAt } : {}), ...(before.lowAt !== undefined ? { lowAt: before.lowAt } : {}) } } };
        }, { products: [id] }),
      archiveProduct: (id, archived) =>
        change((s) => (s.products[id] ? { ...s, products: { ...s.products, [id]: archived ? { ...s.products[id], archived: true } : without(s.products[id], "archived") } } : s), { products: [id] }),
      saveCustomer: (input) => {
        const id = input.id ?? newId();
        const prev = state.customers[id];
        const name = input.name.trim().replace(/\s+/g, " ").slice(0, 80);
        const phone = input.phone?.trim().slice(0, 20), note = input.note?.trim().slice(0, 200);
        const c: Customer = { id, name, ...(phone ? { phone } : {}), ...(note ? { note } : {}) };
        const renamed = prev && normName(prev.name) !== normName(name) ? normName(prev.name) : null;
        change(
          (s) => {
            let sales = s.sales;
            // A new name: carry it to their earlier sales, otherwise those sales would no longer belong to this customer.
            if (renamed) {
              sales = { ...s.sales };
              for (const x of Object.values(s.sales)) if (normName(x.customer) === renamed) { sales[x.id] = { ...x, customer: name }; }
            }
            return { ...s, customers: { ...s.customers, [id]: c }, sales };
          },
          { customers: [id], sales: renamed ? Object.values(state.sales).filter((x) => normName(x.customer) === renamed).map((x) => x.id) : [] },
        );
        return c;
      },
      archiveCustomer: (id) => change((s) => (s.customers[id] ? { ...s, customers: { ...s.customers, [id]: { ...s.customers[id], archived: true } } } : s), { customers: [id] }),
      retry: () => {
        setStatus("loading");
        void reconcile();
      },
      prepareSignOut: async () => {
        window.clearTimeout(flushTimer.current);
        await flush();
        // Keep the cache if anything is unsent or was refused: it is the only copy of those records.
        if (remoteRef.current && idRef.current && !isRecordsDirty(ref.current) && ref.current.rejected.length === 0) clearRecordsCache(idRef.current);
      },
    };
  }, [state, status, sync, change, reconcile, flush]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useRecords(): RecordsApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRecords must be used inside RecordsProvider");
  return v;
}
