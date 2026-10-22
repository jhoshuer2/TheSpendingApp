import { naira } from "../records/money";

interface DayBarsProps {
  days: { key: string; label: string; total: number; today: boolean }[];
  /** What the bars measure, for people who can't see them. */
  what: string;
}

/**
 * Seven thin bars on a baseline, one per day, today in the bright mint. One series, so no legend: the card around it names it.
 * The bars grow up from the baseline once. The sentence in aria-label carries the numbers.
 */
export function DayBars({ days, what }: DayBarsProps) {
  const max = Math.max(...days.map((d) => d.total), 1);
  const spoken = `${what}: ${days.map((d) => `${d.today ? "today" : d.label} ${d.total > 0 ? naira(d.total) : "none"}`).join(", ")}.`;
  return (
    <div className="daybars" role="img" aria-label={spoken}>
      {days.map((d, i) => (
        <span key={d.key} className={`daybars__day${d.today ? " daybars__day--today" : ""}`}>
          <span className="daybars__col">
            <i style={{ height: `${d.total > 0 ? Math.max(8, Math.round((d.total / max) * 100)) : 3}%`, ["--i" as string]: i }} className={d.total > 0 ? "" : "daybars__none"} />
          </span>
          <span className="daybars__label">{d.label}</span>
        </span>
      ))}
    </div>
  );
}
