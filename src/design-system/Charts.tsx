import type { ReactNode } from "react";

/** The colours a chart may use. Colour means direction, as everywhere else: in is green, out is clay, owed is ochre; blue is neutral information. */
export type Tone = "in" | "out" | "owed" | "info" | "ink";

const HATCH_ID = (tone: Tone) => `hatch-${tone}`;

/**
 * Shared hatch patterns for SVG charts (donut). Render once near the root of any screen that uses a Donut; the bars use CSS and need nothing.
 */
export function HatchDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        {(["in", "out", "owed", "info", "ink"] as Tone[]).map((t) => (
          <pattern key={t} id={HATCH_ID(t)} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="5" height="5" fill={`var(--tone-${t})`} />
            <rect width="2" height="5" fill={`var(--tone-${t}-soft)`} />
          </pattern>
        ))}
      </defs>
    </svg>
  );
}

/** A progress bar filled with diagonal stripes: our chart signature. It grows from the left once. */
export function HatchBar({ value, max = 100, tone = "in", height = 12, delay = 0, label }: { value: number; max?: number; tone?: Tone; height?: number; delay?: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div className="hbar" style={{ height }} role="img" aria-label={label ?? `${Math.round(pct)}%`}>
      <i className={`hatch hatch--${tone}`} style={{ width: `${pct}%`, animationDelay: `${delay}ms` }} />
    </div>
  );
}

/** A label, its number, and the bar under them. The whole row says one thing. */
export function BarRow({ label, display, value, max, tone, delay }: { label: string; display: ReactNode; value: number; max?: number; tone?: Tone; delay?: number }) {
  return (
    <div className="barrow">
      <div className="barrow__top">
        <span className="barrow__label">{label}</span>
        <span className="barrow__value">{display}</span>
      </div>
      <HatchBar value={value} max={max} tone={tone} delay={delay} label={`${label}: ${typeof display === "string" ? display : value}`} />
    </div>
  );
}

export interface Segment {
  label: string;
  value: number;
  tone: Tone;
  /** What to show beside the label (a count, an amount). */
  detail?: ReactNode;
  /** A solid fill, for the good outcome; the rest are hatched. */
  solid?: boolean;
}

/** One bar split into parts, then a legend: each row is a dot, a label, a percentage and a quiet number. */
export function StackBar({ segments, hatched = true }: { segments: Segment[]; hatched?: boolean }) {
  const total = segments.reduce((n, s) => n + s.value, 0) || 1;
  const spoken = segments.map((s) => `${s.label} ${Math.round((s.value / total) * 100)}%`).join(", ");
  return (
    <div className="stack-chart">
      <div className="stackbar" role="img" aria-label={spoken}>
        {segments.map((s, i) => (
          <i key={s.label} className={hatched && !s.solid ? `hatch hatch--${s.tone}` : `solid solid--${s.tone}`} style={{ flexGrow: s.value, animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
      <ul className="legend">
        {segments.map((s) => (
          <li key={s.label}>
            <span className={`dot dot--${s.tone}`} aria-hidden="true" />
            <span className="legend__label">{s.label}</span>
            <span className="legend__pct">{Math.round((s.value / total) * 100)}%</span>
            {s.detail !== undefined && <span className="legend__detail">{s.detail}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A ring with the total in the middle and chips for the parts. Segments are separated by a small gap, not a line. */
export function Donut({ segments, center, caption, size = 176 }: { segments: Segment[]; center: ReactNode; caption?: string; size?: number }) {
  const total = segments.reduce((n, s) => n + s.value, 0) || 1;
  const r = 70;
  const c = 2 * Math.PI * r;
  const gap = 5;
  let offset = 0;
  const spoken = segments.map((s) => `${s.label} ${Math.round((s.value / total) * 100)}%`).join(", ");
  return (
    <div className="donut">
      <div className="donut__ring" style={{ width: size, height: size }} role="img" aria-label={spoken}>
        <svg viewBox="0 0 176 176" width={size} height={size}>
          <circle cx="88" cy="88" r={r} fill="none" stroke="var(--surface-sunken)" strokeWidth="22" />
          {segments.map((s, i) => {
            const len = Math.max(0, (s.value / total) * c - gap);
            const el = (
              <circle key={s.label} className="donut__arc" cx="88" cy="88" r={r} fill="none" stroke={`url(#${HATCH_ID(s.tone)})`} strokeWidth="22" strokeDasharray={`${len} ${c}`} strokeDashoffset={-offset} transform="rotate(-90 88 88)" style={{ animationDelay: `${i * 90}ms` }} />
            );
            offset += (s.value / total) * c;
            return el;
          })}
        </svg>
        <div className="donut__center">
          <span className="donut__num">{center}</span>
          {caption && <span className="donut__cap">{caption}</span>}
        </div>
      </div>
      <div className="chips">
        {segments.map((s) => (
          <span key={s.label} className="chip">
            <span className={`dot dot--${s.tone}`} aria-hidden="true" />
            {s.label} {Math.round((s.value / total) * 100)}%
          </span>
        ))}
      </div>
    </div>
  );
}

/** A tiny trend line with a soft fill. It draws itself once. */
export function Spark({ values, tone = "in", width = 132, height = 52 }: { values: number[]; tone?: Tone; width?: number; height?: number }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const step = width / Math.max(1, values.length - 1);
  const pts = values.map((v, i) => [i * step, height - 4 - ((v - min) / span) * (height - 8)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return (
    <svg className={`spark spark--${tone}`} width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={`${line} L${width} ${height} L0 ${height} Z`} className="spark__area" />
      <path d={line} className="spark__line" pathLength={1} />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.2" className="spark__dot" />
    </svg>
  );
}

/** The change since last time: an arrow and a number, tinted by whether it helps. */
export function Delta({ pct, goodIsUp = true }: { pct: number; goodIsUp?: boolean }) {
  const up = pct >= 0;
  const good = up === goodIsUp;
  return (
    <span className={`delta delta--${good ? "good" : "bad"}`}>
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style={{ transform: up ? "none" : "scaleY(-1)" }}>
        <path d="M2.5 8.5 9 2.5M4.5 2.5H9v4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

/** A card that makes one point: a label, one big number, how it changed, and a small picture of the trend. */
export function StatCard({ label, children, delta, chart, footer }: { label: string; children: ReactNode; delta?: ReactNode; chart?: ReactNode; footer?: ReactNode }) {
  return (
    <section className="statcard">
      <div className="statcard__head">
        <span className="statcard__label">{label}</span>
        {delta}
      </div>
      <div className="statcard__body">
        <div className="statcard__num">{children}</div>
        {chart && <div className="statcard__chart">{chart}</div>}
      </div>
      {footer && <div className="statcard__foot">{footer}</div>}
    </section>
  );
}
