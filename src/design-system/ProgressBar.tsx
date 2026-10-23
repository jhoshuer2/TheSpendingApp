import type { Tone } from "./Charts";

interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  /** Fill with the hatched-stripe signature in this tone instead of plain ink. */
  tone?: Tone;
}

export function ProgressBar({ value, max, label, tone }: ProgressBarProps) {
  return (
    <div className={tone ? "bar bar--hatch" : "bar"} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <i className={tone ? `hatch hatch--${tone}` : undefined} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  );
}
