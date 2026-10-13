import { describe, expect, it } from "vitest";
import { EMPTY_RECORDS, cleanProduct, sanitizeRecords, type RecordsState } from "./state";
import { isTracked, leftLabel, runningLow, soldSince, stockLeft, stockLines, stockStatus } from "./stock";
import type { Product, Sale } from "./types";

const at = (day: number, hour = 12) => new Date(2026, 9, day, hour).toISOString();
const rice: Product = { id: "p-rice-0001", name: "Rice (bag)", price: 5000000, stock: 20, countedAt: at(10, 9), lowAt: 5 };
const zobo: Product = { id: "p-zobo-0001", name: "Zobo (bottle)", price: 60000 };
const sale = (id: string, o: Partial<Sale>): Sale => ({ id, at: at(10, 12), amount: 100, items: [], paid: true, ...o });
const withSales = (sales: Sale[], products: Product[] = [rice, zobo]): RecordsState => ({
  ...EMPTY_RECORDS,
  products: Object.fromEntries(products.map((p) => [p.id, p])),
  sales: Object.fromEntries(sales.map((s) => [s.id, s])),
});
const rows = (qty: number, id = rice.id) => [{ productId: id, name: "x", qty, unitPrice: 100 }];

describe("what is left", () => {
  it("is nothing to track until you count", () => {
    expect(isTracked(zobo)).toBe(false);
    expect(stockLeft(withSales([]), zobo)).toBeNull();
    expect(stockStatus(null, 3)).toBeNull();
  });
  it("is the count minus what was sold since, by picking products", () => {
    const s = withSales([sale("a", { items: rows(3) }), sale("b", { at: at(11), items: rows(2) })]);
    expect(soldSince(s, rice)).toBe(5);
    expect(stockLeft(s, rice)).toBe(15);
  });
  it("ignores sales from before the count (the count already reflects them), other products, and typed-in sales", () => {
    const s = withSales([sale("old", { at: at(10, 8), items: rows(7) }), sale("other", { items: rows(4, zobo.id) }), sale("typed", { amount: 999 })]);
    expect(stockLeft(s, rice)).toBe(20);
  });
  it("puts stock back when a sale is deleted, and takes it off again when restored", () => {
    const gone = withSales([sale("a", { items: rows(6), deletedAt: at(11) })]);
    expect(stockLeft(gone, rice)).toBe(20);
    const back = withSales([sale("a", { items: rows(6) })]);
    expect(stockLeft(back, rice)).toBe(14);
  });
  it("counts a credit sale too (it was still handed over) and can go below zero without blocking anything", () => {
    const s = withSales([sale("a", { items: rows(25), paid: false, customer: "Chidi" })]);
    expect(stockLeft(s, rice)).toBe(-5);
    expect(leftLabel(-5)).toBe("Out of stock");
    expect(leftLabel(0)).toBe("Out of stock");
    expect(leftLabel(1200)).toBe("1,200 left");
  });
  it("adds up several items of the same product in one sale", () => {
    const s = withSales([sale("a", { items: [...rows(2), ...rows(3)] })]);
    expect(stockLeft(s, rice)).toBe(15);
  });
});

describe("low and out", () => {
  it("flags out at zero or below, low at or under your level, and ok above it", () => {
    expect(stockStatus(0, 5)).toBe("out");
    expect(stockStatus(-2, undefined)).toBe("out");
    expect(stockStatus(5, 5)).toBe("low");
    expect(stockStatus(6, 5)).toBe("ok");
    expect(stockStatus(1, undefined)).toBe("ok"); // no level set: only "out" is flagged
  });
  it("lists the worst first, only tracked products, and leaves out removed ones", () => {
    const a: Product = { id: "p-aaaa-00001", name: "Beans", price: 1, stock: 2, countedAt: at(1), lowAt: 5 };
    const b: Product = { id: "p-bbbb-00001", name: "Oil", price: 1, stock: 0, countedAt: at(1) };
    const c: Product = { id: "p-cccc-00001", name: "Salt", price: 1, stock: 50, countedAt: at(1), lowAt: 5 };
    const gone: Product = { id: "p-dddd-00001", name: "Old", price: 1, stock: 0, countedAt: at(1), archived: true };
    const s = withSales([], [a, b, c, gone, zobo]);
    expect(stockLines(s).map((l) => [l.product.name, l.status])).toEqual([["Oil", "out"], ["Beans", "low"], ["Salt", "ok"]]);
    expect(runningLow(s).map((l) => l.product.name)).toEqual(["Oil", "Beans"]);
  });
});

describe("cleaning products from the server or storage", () => {
  const base = { id: "p-rice-0001", name: "Rice", price: 100 };
  it("keeps a count with its time, from either spelling of the column", () => {
    expect(cleanProduct({ ...base, stock: 12, counted_at: at(3), low_at: 4 })).toMatchObject({ stock: 12, countedAt: new Date(at(3)).toISOString(), lowAt: 4 });
    expect(cleanProduct({ ...base, stock: 12, countedAt: at(3) })?.stock).toBe(12);
  });
  it("never trusts a count without a time, or a time without a count", () => {
    const a = cleanProduct({ ...base, stock: 12 });
    expect(a && "stock" in a).toBe(false);
    const b = cleanProduct({ ...base, countedAt: at(3) });
    expect(b && "countedAt" in b).toBe(false);
    const c = cleanProduct({ ...base, stock: 12, countedAt: "not a date" });
    expect(c && "stock" in c).toBe(false);
  });
  it("rejects counts that are negative, fractional, or silly", () => {
    for (const stock of [-1, 1.5, 1_000_001, "lots", null, NaN]) {
      const p = cleanProduct({ ...base, stock, countedAt: at(3) });
      expect(p && "stock" in p).toBe(false);
    }
    expect(cleanProduct({ ...base, stock: 0, countedAt: at(3) })?.stock).toBe(0);
    expect(cleanProduct({ ...base, lowAt: -3 }) && "lowAt" in (cleanProduct({ ...base, lowAt: -3 }) as object)).toBe(false);
  });
  it("survives the saved copy on the phone", () => {
    const s = sanitizeRecords(JSON.parse(JSON.stringify(withSales([sale("sale-aaaa-0001", { items: rows(1) })]))));
    expect(s.products[rice.id]).toMatchObject({ stock: 20, lowAt: 5 });
    expect(stockLeft(s, s.products[rice.id])).toBe(19);
  });
});
