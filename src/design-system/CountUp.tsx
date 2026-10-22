import { useEffect, useRef, useState } from "react";
import { formatNaira } from "../records/money";
import { Money } from "./Money";

const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** A number that travels to its value and settles (ease-out, 560ms). With motion off it is simply the value. */
export function useCountUp(target: number, from = 0, ms = 560): number {
  const [v, setV] = useState(reduced() ? target : from);
  const shown = useRef(v);
  useEffect(() => {
    if (reduced()) {
      shown.current = target;
      setV(target);
      return;
    }
    const start = shown.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      const eased = 1 - Math.pow(1 - p, 4);
      shown.current = Math.round(start + (target - start) * eased);
      setV(shown.current);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

/** A money figure that counts up to its amount. Screen readers hear the final amount, not the climb. */
export function MoneyCountUp({ kobo, size, from = 0 }: { kobo: number; size?: number; from?: number }) {
  const v = useCountUp(kobo, from);
  const whole = v === kobo ? v : Math.round(v / 100) * 100; // climb in whole naira, land on the exact amount
  return (
    <>
      <span aria-hidden="true">
        <Money kobo={whole} size={size} />
      </span>
      <span className="sr-only">{formatNaira(kobo)} naira</span>
    </>
  );
}

/** A whole number that counts up to its value (steps finished, days). Screen readers hear the final number. */
export function NumberCountUp({ value, className }: { value: number; className?: string }) {
  const v = useCountUp(value, 0, 560);
  return (
    <>
      <span className={className} aria-hidden="true">
        {v}
      </span>
      <span className="sr-only">{value}</span>
    </>
  );
}
