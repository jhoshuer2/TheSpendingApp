import { Icon } from "./Icon";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "back"] as const;

interface AmountPadProps {
  onKey: (key: string) => void;
}

/** A big number pad for entering money one-handed. Every key is a 56px+ target. */
export function AmountPad({ onKey }: AmountPadProps) {
  return (
    <div className="pad" role="group" aria-label="Amount keypad">
      {KEYS.map((k) => (
        <button key={k} type="button" className="pad__key" aria-label={k === "back" ? "Delete last digit" : k === "000" ? "Three zeros" : k} onClick={() => onKey(k)}>
          {k === "back" ? <Icon name="delete" size={24} /> : k}
        </button>
      ))}
    </div>
  );
}
