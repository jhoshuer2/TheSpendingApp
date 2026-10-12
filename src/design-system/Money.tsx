import { formatNaira } from "../records/money";

interface MoneyProps {
  /** Whole kobo. */
  kobo: number;
  /** Font size in px. */
  size?: number;
  /** "plus" shows a + for money in. A minus sign always shows for negative amounts. */
  sign?: "plus" | "none";
  className?: string;
}

/**
 * The signature money figure: the number is loud, the ₦ is small, raised and quiet. Tabular figures.
 * Screen readers hear a plain sentence, not the styled pieces.
 */
export function Money({ kobo, size = 16, sign = "none", className = "" }: MoneyProps) {
  const neg = kobo < 0;
  const big = size >= 28;
  const spoken = `${neg ? "minus " : ""}${formatNaira(Math.abs(kobo))} naira`;
  return (
    <span className={`money ${className}`} style={{ fontSize: size, letterSpacing: big ? "-0.035em" : "-0.01em" }} role="text" aria-label={spoken}>
      <span aria-hidden="true" className="money__sign">
        {neg ? "−" : sign === "plus" ? "+" : ""}
      </span>
      <span aria-hidden="true" className="money__cur" style={{ fontSize: big ? "0.5em" : "0.78em", marginTop: big ? "0.12em" : "0.08em" }}>
        ₦
      </span>
      <span aria-hidden="true">{formatNaira(Math.abs(kobo))}</span>
    </span>
  );
}
