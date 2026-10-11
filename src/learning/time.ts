/** Local calendar day as YYYY-MM-DD. "Active day" and "this week" follow the person's own clock, not UTC. */
export const dayKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const DAY_MS = 24 * 60 * 60 * 1000;

/** The day `n` days before `from` (n = 0 is `from`'s own day). Steps by calendar day, so it is safe across clock changes. */
export const daysAgo = (from: Date, n: number): Date => new Date(from.getFullYear(), from.getMonth(), from.getDate() - n, 12);

export const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
