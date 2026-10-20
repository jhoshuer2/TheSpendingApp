import type { Expense, ExpenseCategory, Product, Sale } from "./types";
import type { RecordsState } from "./state";

export type Period = "day" | "week" | "month";
export interface Range {
  start: Date;
  end: Date;
}

const at = (y: number, m: number, d: number) => new Date(y, m, d, 0, 0, 0, 0);

/** The current period and the one before it, in the person's own timezone. Weeks start on Monday. */
export function periodRanges(period: Period, now: Date): { current: Range; previous: Range } {
  const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
  if (period === "day") return { current: { start: at(y, m, d), end: at(y, m, d + 1) }, previous: { start: at(y, m, d - 1), end: at(y, m, d) } };
  if (period === "week") {
    const sinceMonday = (now.getDay() + 6) % 7;
    const mon = d - sinceMonday;
    return { current: { start: at(y, m, mon), end: at(y, m, mon + 7) }, previous: { start: at(y, m, mon - 7), end: at(y, m, mon) } };
  }
  return { current: { start: at(y, m, 1), end: at(y, m + 1, 1) }, previous: { start: at(y, m - 1, 1), end: at(y, m, 1) } };
}

const within = (iso: string, r: Range) => {
  const t = Date.parse(iso);
  return t >= r.start.getTime() && t < r.end.getTime();
};

export const liveSales = (s: RecordsState): Sale[] => Object.values(s.sales).filter((x) => !x.deletedAt);
export const liveExpenses = (s: RecordsState): Expense[] => Object.values(s.expenses).filter((x) => !x.deletedAt);
export const liveProducts = (s: RecordsState): Product[] => Object.values(s.products).filter((p) => !p.archived).sort((a, b) => a.name.localeCompare(b.name));

export interface Summary {
  /** Everything sold in the period, including what customers still owe. */
  sold: number;
  /** Money actually received in the period (a credit sale counts on the day it was paid). */
  received: number;
  spent: number;
  /** What the person actually kept: received minus spent. */
  kept: number;
  salesCount: number;
  expensesCount: number;
}

export function summarize(s: RecordsState, range: Range): Summary {
  const sales = liveSales(s);
  const sold = sales.filter((x) => within(x.at, range)).reduce((n, x) => n + x.amount, 0);
  const received = sales.filter((x) => x.paid && within(x.paidAt ?? x.at, range)).reduce((n, x) => n + x.amount, 0);
  const exp = liveExpenses(s).filter((x) => within(x.at, range));
  const spent = exp.reduce((n, x) => n + x.amount, 0);
  return { sold, received, spent, kept: received - spent, salesCount: sales.filter((x) => within(x.at, range)).length, expensesCount: exp.length };
}

/** Sales customers haven't paid for yet, oldest first, and the total. */
export function owed(s: RecordsState) {
  const list = liveSales(s).filter((x) => !x.paid).sort((a, b) => a.at.localeCompare(b.at));
  return { list, total: list.reduce((n, x) => n + x.amount, 0) };
}

export interface LedgerEntry {
  kind: "sale" | "expense";
  id: string;
  at: string;
  /** Always positive. Direction comes from `kind`. */
  amount: number;
  title: string;
  sub?: string;
  owing?: boolean;
}

const categoryLabel: Record<ExpenseCategory, string> = {
  stock: "Stock or ingredients", transport: "Transport", rent: "Rent", staff: "Staff pay",
  data: "Data and airtime", packaging: "Packaging", utilities: "Power and water", other: "Something else",
};
export const categoryName = (c: ExpenseCategory) => categoryLabel[c];

export function saleTitle(x: Sale): string {
  if (x.items.length) {
    const first = x.items[0];
    const head = `${first.qty > 1 ? `${first.qty} × ` : ""}${first.name}`;
    return x.items.length > 1 ? `${head} and ${x.items.length - 1} more` : head;
  }
  return x.note || "Sale";
}

/** Newest first. */
export function ledger(s: RecordsState): LedgerEntry[] {
  const sales: LedgerEntry[] = liveSales(s).map((x) => ({
    kind: "sale", id: x.id, at: x.at, amount: x.amount, title: saleTitle(x), owing: !x.paid,
    sub: !x.paid ? `${x.customer ? `${x.customer} owes this` : "Not paid yet"}` : x.customer || undefined,
  }));
  const exps: LedgerEntry[] = liveExpenses(s).map((x) => ({ kind: "expense", id: x.id, at: x.at, amount: x.amount, title: x.note || categoryLabel[x.category], sub: x.note ? categoryLabel[x.category] : undefined }));
  return [...sales, ...exps].sort((a, b) => b.at.localeCompare(a.at));
}

export const localDay = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Whole calendar days between a moment and now, by the clock on the wall: 9pm last night is 1 at 8am, not 0. */
export const calendarDaysAgo = (iso: string, now: Date): number => {
  const d = new Date(iso);
  return Math.round((at(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - at(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86_400_000);
};

/** "Today", "Yesterday", or "Mon 12 Oct", for grouping the list. */
export function dayLabel(key: string, now: Date): string {
  const d = new Date(`${key}T12:00:00`);
  const diff = Math.round((at(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - at(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" });
}

export function groupByDay(entries: LedgerEntry[]): { key: string; entries: LedgerEntry[] }[] {
  const out: { key: string; entries: LedgerEntry[] }[] = [];
  for (const e of entries) {
    const key = localDay(e.at);
    const last = out[out.length - 1];
    if (last && last.key === key) last.entries.push(e);
    else out.push({ key, entries: [e] });
  }
  return out;
}

/** Steps that tick themselves when the person does the thing, so they never have to say "done". */
export type AutoCheck = "sales>=1" | "salesDays>=3" | "expenses>=1" | "salesMonth>=3";

export function evaluateAuto(check: AutoCheck, s: RecordsState, now: Date): boolean {
  const sales = liveSales(s);
  switch (check) {
    case "sales>=1":
      return sales.length >= 1;
    case "salesDays>=3":
      return new Set(sales.map((x) => localDay(x.at))).size >= 3;
    case "expenses>=1":
      return liveExpenses(s).length >= 1;
    case "salesMonth>=3":
      return summarize(s, periodRanges("month", now).current).salesCount >= 3;
  }
}
