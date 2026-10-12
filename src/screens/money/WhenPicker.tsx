import { Field } from "../../design-system/Field";
import { Segmented } from "../../design-system/Segmented";

export type When = { kind: "today" } | { kind: "yesterday" } | { kind: "other"; date: string };

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** The ISO time to save, or null if the chosen date is missing or in the future. Past days are saved at midday. */
export function whenToIso(w: When, now = new Date()): string | null {
  if (w.kind === "today") return now.toISOString();
  if (w.kind === "yesterday") return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12).toISOString();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(w.date);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
  return d.getTime() > now.getTime() ? null : d.toISOString();
}

/** "When was it?": today, yesterday, or any earlier day. People often write things down later. */
export function WhenPicker({ when, onChange }: { when: When; onChange: (w: When) => void }) {
  return (
    <div className="stack">
      <span className="field__label">When was it?</span>
      <Segmented
        label="When"
        value={when.kind}
        options={[{ value: "today", label: "Today" }, { value: "yesterday", label: "Yesterday" }, { value: "other", label: "Another day" }]}
        onChange={(k) => onChange(k === "other" ? { kind: "other", date: dayKey(new Date()) } : { kind: k })}
      />
      {when.kind === "other" && <Field label="Date" type="date" max={dayKey(new Date())} value={when.date} onChange={(e) => onChange({ kind: "other", date: e.target.value })} />}
    </div>
  );
}
