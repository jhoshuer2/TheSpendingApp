import React from "react";

const colors = {
  green: ["var(--green-50)", "var(--green-700)", "var(--green-500)"],
  orange: ["var(--clay-50)", "var(--clay-700)", "var(--clay-600)"],
  ochre: ["var(--ochre-50)", "var(--ochre-700)", "var(--ochre-600)"],
  blue: ["var(--iris-50)", "var(--iris-600)", "var(--iris-600)"],
  purple: ["var(--iris-50)", "var(--iris-600)", "var(--iris-600)"],
  gray: ["var(--surface-sunken)", "var(--ink-600)", "var(--ink-400)"],
  red: ["var(--red-50)", "var(--red-700)", "var(--red-600)"],
};

/** Small status label — 6px radius (not a pill), sentence case, quiet tint. */
export function Badge({ label, color = "gray", dot = false, size = "sm" }) {
  const [bg, fg, dotColor] = colors[color] || colors.gray;
  const sm = size === "sm";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, borderRadius: "var(--radius-xs)",
      fontFamily: "var(--font-body)", fontWeight: 500, letterSpacing: "0.005em", whiteSpace: "nowrap",
      height: sm ? 22 : 26, padding: sm ? "0 7px" : "0 9px", fontSize: sm ? 12 : 13,
      background: bg, color: fg,
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: 999, background: dotColor, flexShrink: 0 }} />}
      {label}
    </span>
  );
}
