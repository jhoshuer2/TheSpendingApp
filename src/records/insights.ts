import { categoryName, liveExpenses, liveSales, periodRanges, summarize } from "./calc";
import type { RecordsState } from "./state";
import { naira } from "./money";
import type { ExpenseCategory } from "./types";

export interface RecordInsight {
  id: string;
  title: string;
  body: string;
}

const DAY_MS = 86_400_000;
const WEEKDAY = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];

/**
 * Plain statements worked out from what the person recorded. Each one has a minimum amount of data before it
 * speaks, so SPAL never claims a pattern from a handful of sales. Most useful first.
 */
export function recordInsights(s: RecordsState, now: Date): RecordInsight[] {
  const out: RecordInsight[] = [];
  const sales = liveSales(s);
  const recent = sales.filter((x) => now.getTime() - Date.parse(x.at) <= 56 * DAY_MS);

  // Best day of the week: needs a real spread of sales (not three Saturdays in a row).
  if (recent.length >= 15) {
    const totals = Array(7).fill(0) as number[];
    const counts = Array(7).fill(0) as number[];
    for (const x of recent) { const d = new Date(x.at).getDay(); totals[d] += x.amount; counts[d] += 1; }
    const mean = totals.reduce((a, b) => a + b, 0) / 7;
    const best = totals.indexOf(Math.max(...totals));
    if (counts[best] >= 3 && totals[best] >= mean * 1.3) {
      out.push({ id: "best-day", title: `${WEEKDAY[best]} are your best day`, body: `Over the last eight weeks you've sold the most on ${WEEKDAY[best].toLowerCase()}. It's worth being stocked and ready.` });
    }
  }

  // Best sellers, from sales that were recorded with products.
  const last30 = sales.filter((x) => now.getTime() - Date.parse(x.at) <= 30 * DAY_MS && x.items.length > 0);
  if (last30.length >= 5) {
    const qty = new Map<string, number>();
    for (const x of last30) for (const it of x.items) qty.set(it.name, (qty.get(it.name) ?? 0) + it.qty);
    const top = [...qty.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    out.push({ id: "best-sellers", title: "What sells best", body: `${top.map(([n, q]) => `${n} (${q})`).join(", ")} in the last 30 days.` });
  }

  // Where the money goes this month.
  const { current } = periodRanges("month", now);
  const thisMonth = liveExpenses(s).filter((x) => Date.parse(x.at) >= current.start.getTime() && Date.parse(x.at) < current.end.getTime());
  if (thisMonth.length >= 3) {
    const byCat = new Map<ExpenseCategory, number>();
    for (const x of thisMonth) byCat.set(x.category, (byCat.get(x.category) ?? 0) + x.amount);
    const total = [...byCat.values()].reduce((a, b) => a + b, 0);
    const [cat, amt] = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0];
    const share = Math.round((amt / total) * 100);
    if (byCat.size > 1 && share >= 40) out.push({ id: "top-cost", title: `${categoryName(cat)} is where most of your money goes`, body: `${share}% of what you've spent this month (${naira(amt)}).` });
  }

  // Margin on products where the person gave a cost. Gentle: a fact and a nudge, never a scolding.
  const products = Object.values(s.products).filter((p) => !p.archived && p.cost !== undefined);
  const withCost = products.filter((p) => recent.some((x) => x.items.some((i) => i.productId === p.id)));
  if (withCost.length) {
    const p = withCost[0];
    const profit = p.price - (p.cost as number);
    const pct = p.price > 0 ? Math.round((profit / p.price) * 100) : 0;
    if (profit <= 0) out.push({ id: `margin-${p.id}`, title: `"${p.name}" isn't making you money`, body: `It costs you ${naira(p.cost as number)} and you sell it for ${naira(p.price)}. Worth looking at the price.` });
    else if (pct < 15) out.push({ id: `margin-${p.id}`, title: `"${p.name}" leaves little after costs`, body: `You keep ${naira(profit)} on each one (${pct}%). A small price rise could add up.` });
    else out.push({ id: `margin-${p.id}`, title: `You keep ${naira(profit)} on each "${p.name}"`, body: `That's ${pct}% of the price after what it costs you.` });
  }

  return out;
}

/** Compares this period with the last, in words that never make a slow week sound like a failure. */
export function compareText(s: RecordsState, period: "day" | "week" | "month", now: Date): string | null {
  const { current, previous } = periodRanges(period, now);
  const cur = summarize(s, current), prev = summarize(s, previous);
  const word = { day: "yesterday", week: "last week", month: "last month" }[period];
  if (prev.salesCount === 0 && prev.expensesCount === 0) return null;
  if (cur.kept > prev.kept) return `That's ${naira(cur.kept - prev.kept)} more than ${word}.`;
  if (cur.kept === prev.kept) return `About the same as ${word}.`;
  return `${word[0].toUpperCase()}${word.slice(1)} you kept ${naira(prev.kept)}.`;
}
