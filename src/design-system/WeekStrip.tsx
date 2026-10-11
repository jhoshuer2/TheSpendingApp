import type { WeekDay } from "../learning/insights";

/** The last seven days, filled where the person was active. The sentence next to it carries the meaning. */
export function WeekStrip({ days, summary }: { days: WeekDay[]; summary: string }) {
  return (
    <div className="week" role="img" aria-label={summary}>
      {days.map((d) => (
        <div key={d.key} className="week__day">
          <i className={d.active ? "on" : ""} />
          <span>{d.label}</span>
        </div>
      ))}
    </div>
  );
}
