import { describe, expect, it } from "vitest";
import { calendarDaysAgo, dayLabel, evaluateAuto, groupByDay, ledger, owed, periodRanges, saleTitle, summarize } from "./calc";
import { compareText, recordInsights } from "./insights";
import { digitsToKobo, formatNaira, MAX_DIGITS, naira, pressKey, toKobo } from "./money";
import { cleanExpense, cleanProduct, cleanSale, EMPTY_RECORDS, isRecordsDirty, mergePulled, requeueRejected, sanitizeRecords, saleLimitProblem, type RecordsState } from "./state";
import { whenToIso } from "../screens/money/WhenPicker";
import type { Expense, Product, Sale } from "./types";

// Wed 14 Oct 2026, midday local time. Dates are built locally so the tests pass in any timezone.
const NOW = new Date(2026, 9, 14, 12, 0, 0);
const t = (daysBack: number, hour = 10) => new Date(2026, 9, 14 - daysBack, hour, 0, 0).toISOString();
let n = 0;
const uid = () => `id-${String(++n).padStart(8, "0")}`;

const sale = (over: Partial<Sale> = {}): Sale => ({ id: uid(), at: t(0), amount: 100_000, items: [], paid: true, ...over });
const exp = (over: Partial<Expense> = {}): Expense => ({ id: uid(), at: t(0), amount: 40_000, category: "stock", ...over });
const state = (sales: Sale[] = [], expenses: Expense[] = [], products: Product[] = []): RecordsState => ({
  ...EMPTY_RECORDS,
  sales: Object.fromEntries(sales.map((x) => [x.id, x])),
  expenses: Object.fromEntries(expenses.map((x) => [x.id, x])),
  products: Object.fromEntries(products.map((x) => [x.id, x])),
});

describe("money", () => {
  it("formats naira with separators, and kobo only when present", () => {
    expect(formatNaira(450_000)).toBe("4,500");
    expect(formatNaira(450_050)).toBe("4,500.50");
    expect(formatNaira(0)).toBe("0");
    expect(formatNaira(-1_200_000)).toBe("-12,000");
    expect(naira(450_000)).toBe("₦4,500");
    expect(naira(-250_000)).toBe("-₦2,500");
  });
  it("converts exactly, with no floating point drift", () => {
    expect(toKobo(0.1 + 0.2)).toBe(30);
    expect(toKobo(19.99)).toBe(1999);
    expect(digitsToKobo("4500")).toBe(450_000);
    expect(digitsToKobo("")).toBe(0);
  });
  it("builds an amount from keypad presses, limited to a sane size", () => {
    let d = "";
    for (const k of ["4", "5", "000"]) d = pressKey(d, k);
    expect(d).toBe("45000");
    expect(pressKey(d, "back")).toBe("4500");
    expect(pressKey("", "0")).toBe("");
    expect(pressKey("", "000")).toBe("");
    expect(pressKey("12", "x")).toBe("12");
    expect(pressKey("999999999", "1")).toBe("999999999");
    expect("999999999".length).toBe(MAX_DIGITS);
    expect(pressKey("", "back")).toBe("");
  });
});

describe("periods", () => {
  it("starts the week on Monday and ends it the next Monday", () => {
    const { current, previous } = periodRanges("week", NOW); // NOW is a Wednesday
    expect(current.start).toEqual(new Date(2026, 9, 12));
    expect(current.end).toEqual(new Date(2026, 9, 19));
    expect(previous.start).toEqual(new Date(2026, 9, 5));
  });
  it("treats Sunday as the last day of the week, not the first", () => {
    const sunday = new Date(2026, 9, 18, 20, 0, 0);
    expect(periodRanges("week", sunday).current.start).toEqual(new Date(2026, 9, 12));
    const monday = new Date(2026, 9, 19, 0, 30, 0);
    expect(periodRanges("week", monday).current.start).toEqual(new Date(2026, 9, 19));
  });
  it("handles month boundaries, including January", () => {
    const jan = new Date(2027, 0, 10, 12);
    const { current, previous } = periodRanges("month", jan);
    expect(current.start).toEqual(new Date(2027, 0, 1));
    expect(previous.start).toEqual(new Date(2026, 11, 1));
    expect(periodRanges("day", NOW).previous.start).toEqual(new Date(2026, 9, 13));
  });
});

describe("summaries", () => {
  it("works out sold, received, spent and what was kept", () => {
    const s = state([sale({ amount: 500_000 }), sale({ amount: 300_000 })], [exp({ amount: 200_000 })]);
    const r = summarize(s, periodRanges("week", NOW).current);
    expect(r).toMatchObject({ sold: 800_000, received: 800_000, spent: 200_000, kept: 600_000, salesCount: 2, expensesCount: 1 });
  });
  it("doesn't count money a customer still owes as kept, but does count it as sold", () => {
    const s = state([sale({ amount: 500_000 }), sale({ amount: 300_000, paid: false, customer: "Mama Tosin" })]);
    const r = summarize(s, periodRanges("week", NOW).current);
    expect(r.sold).toBe(800_000);
    expect(r.received).toBe(500_000);
    expect(r.kept).toBe(500_000);
  });
  it("counts a credit sale as received on the day it is paid", () => {
    const old = sale({ at: t(10), amount: 300_000, paid: true, paidAt: t(0) });
    const week = periodRanges("week", NOW).current;
    const r = summarize(state([old]), week);
    expect(r.sold).toBe(0); // sold ten days ago
    expect(r.received).toBe(300_000); // paid today
  });
  it("can show a loss as a negative number", () => {
    expect(summarize(state([sale({ amount: 100_000 })], [exp({ amount: 250_000 })]), periodRanges("day", NOW).current).kept).toBe(-150_000);
  });
  it("ignores deleted records and records outside the period", () => {
    const s = state([sale({ amount: 100_000, deletedAt: t(0) }), sale({ at: t(20), amount: 900_000 })], [exp({ deletedAt: t(0) })]);
    const r = summarize(s, periodRanges("week", NOW).current);
    expect(r).toMatchObject({ sold: 0, received: 0, spent: 0, kept: 0, salesCount: 0, expensesCount: 0 });
  });
  it("totals what is owed, all time, oldest first", () => {
    const s = state([sale({ at: t(9), amount: 200_000, paid: false }), sale({ at: t(30), amount: 100_000, paid: false }), sale({ amount: 999, paid: true }), sale({ amount: 500, paid: false, deletedAt: t(0) })]);
    const o = owed(s);
    expect(o.total).toBe(300_000);
    expect(o.list.map((x) => x.amount)).toEqual([100_000, 200_000]);
  });
});

describe("the list", () => {
  it("merges sales and spending, newest first, with readable titles", () => {
    const s = state(
      [sale({ at: t(0, 9), items: [{ name: "Jollof rice", qty: 3, unitPrice: 100_000 }], amount: 300_000 }), sale({ at: t(1), note: "Wedding order", paid: false, customer: "Kemi" })],
      [exp({ at: t(0, 11), category: "transport" })],
    );
    const l = ledger(s);
    expect(l.map((e) => e.kind)).toEqual(["expense", "sale", "sale"]);
    expect(l[0].title).toBe("Transport");
    expect(l[1].title).toBe("3 × Jollof rice");
    expect(l[2]).toMatchObject({ title: "Wedding order", owing: true, sub: "Kemi owes this" });
  });
  it("names a multi-item sale by its first item", () => {
    expect(saleTitle(sale({ items: [{ name: "Bread", qty: 1, unitPrice: 1 }, { name: "Egg", qty: 2, unitPrice: 1 }, { name: "Tea", qty: 1, unitPrice: 1 }] }))).toBe("Bread and 2 more");
    expect(saleTitle(sale())).toBe("Sale");
  });
  it("groups by local day and labels Today / Yesterday / dates", () => {
    const l = ledger(state([sale({ at: t(0, 9) }), sale({ at: t(0, 14) }), sale({ at: t(1) }), sale({ at: t(5) })]));
    const g = groupByDay(l);
    expect(g.map((x) => x.entries.length)).toEqual([2, 1, 1]);
    expect(dayLabel(g[0].key, NOW)).toBe("Today");
    expect(dayLabel(g[1].key, NOW)).toBe("Yesterday");
    expect(dayLabel(g[2].key, NOW)).toMatch(/9 Oct|Oct 9/);
  });
});

describe("how long ago", () => {
  const early = new Date(2026, 9, 14, 9, 0, 0);
  it("counts calendar days, not 24-hour blocks", () => {
    expect(calendarDaysAgo(t(0, 8), early)).toBe(0);
    expect(calendarDaysAgo(t(1, 12), early)).toBe(1); // "Yesterday" is saved at midday, 21 hours before 9am
    expect(calendarDaysAgo(t(1, 20), early)).toBe(1);
    expect(calendarDaysAgo(t(3, 23), early)).toBe(3);
  });
});

describe("limits the server enforces, caught on the entry screen", () => {
  const item = (name: string, i = 0) => ({ productId: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`, name, qty: 1, unitPrice: 100_000 });
  it("refuses a product total over the ₦1bn the server accepts", () => {
    expect(saleLimitProblem(100_000_000_000, [item("Rice")])).toBeNull();
    expect(saleLimitProblem(100_000_000_001, [item("Rice")])).toMatch(/too big/);
  });
  it("refuses a sale whose products would not be saved in full (51 products, or long names that overflow the 4KB the server keeps)", () => {
    expect(saleLimitProblem(500_000, [item("Rice", 1), item("Beans", 2), item("Zobo", 3)])).toBeNull();
    expect(saleLimitProblem(500_000, Array.from({ length: 51 }, (_, i) => item(`Item ${i}`, i)))).toMatch(/too many/);
    expect(saleLimitProblem(500_000, Array.from({ length: 25 }, (_, i) => item("🍛".repeat(60), i)))).toMatch(/too many/);
  });
  it("accepts a date up to five years back and refuses older ones or the future", () => {
    const now = new Date(2026, 9, 14, 12);
    expect(whenToIso({ kind: "other", date: "2021-10-14" }, now)).not.toBeNull();
    expect(whenToIso({ kind: "other", date: "2010-01-01" }, now)).toBeNull();
    expect(whenToIso({ kind: "other", date: "2026-10-15" }, now)).toBeNull();
  });
});

describe("steps that tick themselves", () => {
  it("knows when a first sale, three sale-days, an expense, and three sales this month are done", () => {
    expect(evaluateAuto("sales>=1", state(), NOW)).toBe(false);
    expect(evaluateAuto("sales>=1", state([sale()]), NOW)).toBe(true);
    expect(evaluateAuto("salesDays>=3", state([sale(), sale(), sale()]), NOW)).toBe(false); // same day
    expect(evaluateAuto("salesDays>=3", state([sale(), sale({ at: t(1) }), sale({ at: t(2) })]), NOW)).toBe(true);
    expect(evaluateAuto("expenses>=1", state([], [exp()]), NOW)).toBe(true);
    expect(evaluateAuto("expenses>=1", state([], [exp({ deletedAt: t(0) })]), NOW)).toBe(false);
    expect(evaluateAuto("salesMonth>=3", state([sale(), sale(), sale({ at: t(30) })]), NOW)).toBe(false);
    expect(evaluateAuto("salesMonth>=3", state([sale(), sale(), sale({ at: t(1) })]), NOW)).toBe(true);
  });
});

describe("insights from real numbers", () => {
  const manySales = (weekday: number, extraOnBest: number) => {
    const out: Sale[] = [];
    for (let d = 0; d < 50; d++) {
      const date = new Date(2026, 9, 14 - d, 10);
      const best = date.getDay() === weekday;
      out.push(sale({ at: date.toISOString(), amount: best ? 100_000 + extraOnBest : 100_000 }));
    }
    return out;
  };
  it("names a best day only with enough sales and a clear winner", () => {
    expect(recordInsights(state(manySales(6, 400_000)), NOW).some((i) => i.id === "best-day" && /Saturdays/.test(i.title))).toBe(true);
    expect(recordInsights(state(manySales(6, 0)), NOW).some((i) => i.id === "best-day")).toBe(false); // every day equal
    expect(recordInsights(state([sale(), sale(), sale()]), NOW)).toEqual([]); // too little to say anything
  });
  it("lists best sellers by quantity from product sales", () => {
    const mk = (name: string, qty: number) => sale({ items: [{ name, qty, unitPrice: 100 }], amount: qty * 100 });
    const s = state([mk("Jollof", 5), mk("Jollof", 4), mk("Fried rice", 2), mk("Drink", 1), mk("Drink", 1)]);
    const best = recordInsights(s, NOW).find((i) => i.id === "best-sellers")!;
    expect(best.body).toMatch(/^Jollof \(9\), Fried rice \(2\), Drink \(2\)/);
  });
  it("points out where most of the money goes this month, only when it is clearly one thing", () => {
    const heavy = state([], [exp({ category: "stock", amount: 600_000 }), exp({ category: "stock", amount: 300_000 }), exp({ category: "transport", amount: 100_000 })]);
    expect(recordInsights(heavy, NOW).find((i) => i.id === "top-cost")!.body).toMatch(/90%/);
    const even = state([], [exp({ category: "stock" }), exp({ category: "transport" }), exp({ category: "rent" })]);
    expect(recordInsights(even, NOW).some((i) => i.id === "top-cost")).toBe(false);
  });
  it("tells someone plainly when a product isn't making money, and when it leaves little", () => {
    const p: Product = { id: "prod-0001", name: "Jollof", price: 150_000, cost: 160_000 };
    const sold = sale({ items: [{ productId: p.id, name: p.name, qty: 1, unitPrice: p.price }] });
    expect(recordInsights(state([sold], [], [p]), NOW)[0].title).toBe(`"Jollof" isn't making you money`);
    const thin = { ...p, cost: 135_000 };
    expect(recordInsights(state([sold], [], [thin]), NOW)[0].title).toMatch(/leaves little/);
    const good = { ...p, cost: 80_000 };
    expect(recordInsights(state([sold], [], [good]), NOW)[0].title).toBe(`You keep ₦700 on each "Jollof"`);
  });
  it("compares with the last period without making a slow one sound like failure", () => {
    const up = state([sale({ amount: 900_000 }), sale({ at: t(7), amount: 300_000 })]);
    expect(compareText(up, "week", NOW)).toBe("That's ₦6,000 more than last week.");
    const down = state([sale({ amount: 100_000 }), sale({ at: t(7), amount: 300_000 })]);
    expect(compareText(down, "week", NOW)).toBe("Last week you kept ₦3,000.");
    expect(compareText(state([sale()]), "week", NOW)).toBeNull(); // nothing to compare with
  });
});

describe("cleaning data from the server or the cache", () => {
  it("accepts good rows, including bigint columns that arrive as strings", () => {
    const s = cleanSale({ id: "11111111-aaaa", at: "2026-10-10T10:00:00Z", amount: "450000", items: [{ name: "Jollof", qty: 2, unitPrice: 225000 }], paid: false, customer: "Kemi", deleted_at: null });
    expect(s).toMatchObject({ amount: 450_000, paid: false, customer: "Kemi" });
    expect(s!.items).toHaveLength(1);
  });
  it("drops rows it can't trust instead of crashing", () => {
    expect(cleanSale({ id: "x", at: "2026-10-10", amount: 100 })).toBeNull(); // id too short
    expect(cleanSale({ id: "11111111", at: "nonsense", amount: 100 })).toBeNull();
    expect(cleanSale({ id: "11111111", at: "2026-10-10", amount: 0 })).toBeNull();
    expect(cleanSale({ id: "11111111", at: "2026-10-10", amount: -5 })).toBeNull();
    expect(cleanSale({ id: "11111111", at: "2026-10-10", amount: 1.5 })).toBeNull();
    expect(cleanExpense({ id: "11111111", at: "2026-10-10", amount: 100, category: "yachts" })).toBeNull();
    expect(cleanProduct({ id: "11111111", name: "   ", price: 100 })).toBeNull();
    expect(cleanProduct({ id: "11111111", name: "Rice", price: -1 })).toBeNull();
    expect(cleanSale(null)).toBeNull();
  });
  it("keeps good items and drops malformed ones inside a sale", () => {
    const s = cleanSale({ id: "11111111", at: "2026-10-10", amount: 100, items: [{ name: "A", qty: 1, unitPrice: 100 }, { name: "", qty: 1, unitPrice: 5 }, { name: "B", qty: 0, unitPrice: 5 }, "junk"] })!;
    expect(s.items.map((i) => i.name)).toEqual(["A"]);
  });
  it("a credit sale has no paid date until it is paid", () => {
    expect(cleanSale({ id: "11111111", at: "2026-10-10", amount: 100, paid: false, paid_at: "2026-10-11" })!.paidAt).toBeUndefined();
  });
  it("cleans a whole cache, and forgets dirty flags for rows that no longer exist", () => {
    const good = sale({ id: "11111111-keep" });
    const cleaned = sanitizeRecords({ sales: { [good.id]: good, bad: { id: "x" } }, products: {}, expenses: {}, dirty: { sales: [good.id, "ghost"], products: [], expenses: [] }, cursor: "2026-10-10T10:00:00Z" });
    expect(Object.keys(cleaned.sales)).toEqual([good.id]);
    expect(cleaned.dirty.sales).toEqual([good.id]);
    expect(cleaned.cursor).toBe("2026-10-10T10:00:00.000Z");
    expect(sanitizeRecords({ rejected: ["sale:11111111-aaaa", "sale:11111111-aaaa", "sale:x", "nonsense", 5] }).rejected).toEqual(["sale:11111111-aaaa"]);
    expect(sanitizeRecords(undefined)).toEqual(EMPTY_RECORDS);
    expect(sanitizeRecords("x")).toEqual(EMPTY_RECORDS);
  });
});

describe("refused records", () => {
  it("get one more try: they go back in the queue, and the refused list clears", () => {
    const a = sale({ id: "11111111-aaaa" });
    const e = exp({ id: "22222222-bbbb" });
    const local: RecordsState = { ...state([a], [e]), rejected: [`sale:${a.id}`, `expense:${e.id}`, "sale:99999999-gone"] };
    const r = requeueRejected(local);
    expect(r.rejected).toEqual([]);
    expect(r.dirty.sales).toEqual([a.id]);
    expect(r.dirty.expenses).toEqual([e.id]);
  });
  it("don't double up a row that is already queued, and do nothing when nothing was refused", () => {
    const a = sale({ id: "11111111-aaaa" });
    const local: RecordsState = { ...state([a]), dirty: { customers: [], products: [], sales: [a.id], expenses: [] }, rejected: [`sale:${a.id}`] };
    expect(requeueRejected(local).dirty.sales).toEqual([a.id]);
    expect(requeueRejected(state([a]))).toEqual(state([a]));
  });
});

describe("merging what the server sends", () => {
  it("takes the server's version of anything we haven't changed", () => {
    const mine = sale({ id: "11111111-a", amount: 100_000 });
    const local: RecordsState = { ...state([mine]), cursor: "2026-10-01T00:00:00.000Z" };
    const merged = mergePulled(local, { customers: [], products: [], sales: [{ ...mine, paid: false }], expenses: [], cursor: "2026-10-05T00:00:00.000Z" });
    expect(merged.sales[mine.id].paid).toBe(false);
    expect(merged.cursor).toBe("2026-10-05T00:00:00.000Z");
  });
  it("keeps our unsent changes over the server's copy, and stays dirty so they get pushed", () => {
    const mine = sale({ id: "11111111-a", paid: true, paidAt: t(0) });
    const local: RecordsState = { ...state([mine]), dirty: { customers: [], products: [], sales: [mine.id], expenses: [] } };
    const merged = mergePulled(local, { customers: [], products: [], sales: [{ ...mine, paid: false, paidAt: undefined }], expenses: [] });
    expect(merged.sales[mine.id].paid).toBe(true);
    expect(isRecordsDirty(merged)).toBe(true);
  });
  it("keeps the list of refused rows when new data arrives", () => {
    const local: RecordsState = { ...EMPTY_RECORDS, rejected: ["sale:11111111-aaaa"] };
    expect(mergePulled(local, { customers: [], products: [], sales: [], expenses: [] }).rejected).toEqual(["sale:11111111-aaaa"]);
  });
  it("adds records made on another device, and learns about deletions", () => {
    const a = sale({ id: "11111111-a" });
    const b = sale({ id: "22222222-b" });
    const local = state([a]);
    const merged = mergePulled(local, { customers: [], products: [], sales: [{ ...a, deletedAt: t(0) }, b], expenses: [] });
    expect(merged.sales[a.id].deletedAt).toBeDefined();
    expect(merged.sales[b.id]).toBeDefined();
  });
  it("never moves the cursor backwards", () => {
    const local: RecordsState = { ...EMPTY_RECORDS, cursor: "2026-10-09T00:00:00.000Z" };
    expect(mergePulled(local, { customers: [], products: [], sales: [], expenses: [], cursor: "2026-10-01T00:00:00.000Z" }).cursor).toBe("2026-10-09T00:00:00.000Z");
    expect(mergePulled(local, { customers: [], products: [], sales: [], expenses: [] }).cursor).toBe("2026-10-09T00:00:00.000Z");
  });
});
