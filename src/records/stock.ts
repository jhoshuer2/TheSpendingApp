import { liveSales } from "./calc";
import type { RecordsState } from "./state";
import type { Product } from "./types";

export const isTracked = (p: Product): boolean => p.stock !== undefined && p.countedAt !== undefined;

/** How many of this product were sold (by picking products) since the count was taken. Deleted sales don't count, so undo puts stock back. */
export function soldSince(state: RecordsState, p: Product): number {
  if (!isTracked(p)) return 0;
  const from = Date.parse(p.countedAt as string);
  let n = 0;
  for (const s of liveSales(state)) {
    if (Date.parse(s.at) < from) continue; // already reflected in the count
    for (const it of s.items) if (it.productId === p.id) n += it.qty;
  }
  return n;
}

/** What is left now: the count minus what was sold since. Can go below zero if more was sold than counted; the person is told, not blocked. */
export const stockLeft = (state: RecordsState, p: Product): number | null => (isTracked(p) ? (p.stock as number) - soldSince(state, p) : null);

export type StockStatus = "ok" | "low" | "out";
export function stockStatus(left: number | null, lowAt: number | undefined): StockStatus | null {
  if (left === null) return null;
  if (left <= 0) return "out";
  return lowAt !== undefined && left <= lowAt ? "low" : "ok";
}

export interface StockLine {
  product: Product;
  left: number;
  status: StockStatus;
}

/** Everything you track, worst first (out, then low, then by how little is left). */
export function stockLines(state: RecordsState): StockLine[] {
  const rank = { out: 0, low: 1, ok: 2 } as const;
  return Object.values(state.products)
    .filter((p) => !p.archived && isTracked(p))
    .map((product) => {
      const left = stockLeft(state, product) as number;
      return { product, left, status: stockStatus(left, product.lowAt) as StockStatus };
    })
    .sort((a, b) => rank[a.status] - rank[b.status] || a.left - b.left || a.product.name.localeCompare(b.product.name));
}

/** Products that are out or low. */
export const runningLow = (state: RecordsState): StockLine[] => stockLines(state).filter((l) => l.status !== "ok");

export const leftLabel = (left: number): string => (left <= 0 ? "Out of stock" : `${left.toLocaleString("en-NG")} left`);
