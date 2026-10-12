import { useId } from "react";

interface SwitchProps {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (on: boolean) => void;
}

/** A labelled on/off setting. The whole row is the tap target (at least 44px tall). */
export function Switch({ label, hint, checked, onChange }: SwitchProps) {
  const id = useId();
  return (
    <button type="button" role="switch" aria-checked={checked} aria-labelledby={`${id}-l`} aria-describedby={hint ? `${id}-h` : undefined} className="switch" onClick={() => onChange(!checked)}>
      <span className="row__main">
        <span id={`${id}-l`} className="row__title">
          {label}
        </span>
        {hint && (
          <span id={`${id}-h`} className="row__sub">
            {hint}
          </span>
        )}
      </span>
      <span className="switch__track" aria-hidden="true">
        <i />
      </span>
    </button>
  );
}
