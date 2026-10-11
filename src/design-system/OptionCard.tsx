import { Icon } from "./Icon";

interface OptionCardProps {
  label: string;
  hint?: string;
  selected: boolean;
  /** radio = pick one, checkbox = pick several. Announced to screen readers either way. */
  kind: "radio" | "checkbox";
  onSelect: () => void;
}

/** A tappable answer. Selection is shown by an ink ring AND a check mark, never by colour alone. */
export function OptionCard({ label, hint, selected, kind, onSelect }: OptionCardProps) {
  return (
    <button type="button" role={kind} aria-checked={selected} className={`opt${selected ? " opt--on" : ""}`} onClick={onSelect}>
      <span className="opt__text">
        <span className="opt__label">{label}</span>
        {hint && <span className="opt__hint">{hint}</span>}
      </span>
      <span className="check" aria-hidden="true">
        {selected && <Icon name="check" size={14} stroke={2.4} />}
      </span>
    </button>
  );
}
