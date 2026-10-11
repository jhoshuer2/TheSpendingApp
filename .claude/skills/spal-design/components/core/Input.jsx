import React, { useState } from "react";

/** Text field — hairline ring that becomes a green focus ring. `large` turns it into the hero amount field. */
export function Input({ label, hint, error, prefix, suffix, large = false, style, ...props }) {
  const [focused, setFocused] = useState(false);
  const ring = error ? "0 0 0 1px var(--danger), 0 0 0 4px rgba(180,35,24,0.12)"
    : focused ? "0 0 0 1px var(--accent), var(--focus-ring)" : "0 0 0 1px var(--line-strong)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, fontFamily: "var(--font-body)" }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>{label}</label>}
      <div style={{
        display: "flex", alignItems: "center", gap: large ? 6 : 8, background: "var(--surface-card)",
        borderRadius: large ? "var(--radius-md)" : "var(--radius-sm)", boxShadow: ring,
        height: large ? 76 : "var(--control-h)", padding: large ? "0 18px" : "0 14px",
        transition: "box-shadow var(--dur-2) var(--ease-out)", ...style,
      }}>
        {prefix && <span style={{ fontWeight: 500, color: "var(--text-tertiary)", fontSize: large ? 20 : 15, alignSelf: large ? "flex-start" : "center", marginTop: large ? 22 : 0, flexShrink: 0 }}>{prefix}</span>}
        <input
          style={{
            flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "var(--text-primary)",
            fontFamily: "var(--font-display)", fontSize: large ? 36 : 15, fontWeight: large ? 500 : 400,
            letterSpacing: large ? "-0.03em" : "-0.003em", fontVariantNumeric: "tabular-nums",
          }}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          {...props}
        />
        {suffix && <span style={{ flexShrink: 0, color: "var(--text-tertiary)" }}>{suffix}</span>}
      </div>
      {error && <p style={{ fontSize: 12.5, color: "var(--danger)", fontWeight: 500, margin: 0 }}>{error}</p>}
      {hint && !error && <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: 0 }}>{hint}</p>}
    </div>
  );
}
