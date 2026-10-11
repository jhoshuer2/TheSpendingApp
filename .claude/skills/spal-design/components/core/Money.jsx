import React from "react";

/**
 * SPAL money figure — the signature typographic treatment: the number is loud, the ₦ is quiet
 * (small, raised, tertiary). Tabular figures. Direction tints the figure, never its container.
 */
export function Money({ value = 0, currency = "₦", size = 15, weight = 500, direction = "none", decimals = false, color, style }) {
  const abs = Math.abs(Number(value) || 0);
  const whole = Math.floor(abs).toLocaleString("en-NG");
  const kobo = String(Math.round((abs % 1) * 100)).padStart(2, "0");
  const tone = color || (direction === "in" ? "var(--money-in)" : direction === "owed" ? "var(--money-owed)" : "var(--text-primary)");
  const sign = direction === "in" ? "+" : direction === "out" ? "\u2212" : "";
  const big = size >= 28;
  return (
    <span style={{
      display: "inline-flex", alignItems: "flex-start", fontFamily: "var(--font-display)", fontWeight: weight,
      fontSize: size, lineHeight: 1, letterSpacing: big ? "-0.035em" : "-0.01em", color: tone,
      fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", ...style,
    }}>
      {sign && <span style={{ marginRight: big ? "0.06em" : "0.08em", fontWeight: 400 }}>{sign}</span>}
      <span style={{ fontSize: big ? "0.5em" : "0.78em", lineHeight: 1, marginTop: big ? "0.12em" : "0.08em", marginRight: big ? "0.08em" : "0.04em", color: direction === "none" && !color ? "var(--text-tertiary)" : "inherit", opacity: direction === "none" && !color ? 1 : 0.7, fontWeight: 500, letterSpacing: 0 }}>{currency}</span>
      <span>{whole}</span>
      {decimals && <span style={{ fontSize: "0.5em", marginTop: "0.12em", marginLeft: "0.06em", color: "var(--text-tertiary)", letterSpacing: 0 }}>{kobo}</span>}
    </span>
  );
}
