import React from "react";

const tint = { green: "var(--money-in)", orange: "var(--money-out)", blue: "var(--iris-600)", purple: "var(--iris-600)", gray: "currentColor" };

/** Pill toggle — selection is shown in ink, not color. `color` only tints a leading icon. */
export function PillChip({ label, icon, color = "gray", selected = false, size = "md", onClick }) {
  const sm = size === "sm";
  return (
    <button
      className="spal-pillchip"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        borderRadius: "var(--radius-full)", fontFamily: "var(--font-display)", fontWeight: 500, cursor: "pointer", border: "none", whiteSpace: "nowrap", flexShrink: 0,
        background: selected ? "var(--ink-900)" : "var(--surface-card)",
        color: selected ? "#fff" : "var(--text-primary)",
        boxShadow: selected ? "inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px var(--ink-900)" : "var(--shadow-tactile-light)",
        height: sm ? "var(--control-h-sm)" : 44, padding: sm ? "0 14px" : "0 18px", fontSize: sm ? 14 : 15,
        transition: "transform var(--dur-1) var(--ease-out), background var(--dur-2) var(--ease-out), color var(--dur-2) var(--ease-out)",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {icon && <span style={{ display: "flex", color: selected ? "inherit" : tint[color] }}>{icon}</span>}
      {label}
      <style>{`.spal-pillchip:active{transform:scale(var(--press-scale))}`}</style>
    </button>
  );
}
