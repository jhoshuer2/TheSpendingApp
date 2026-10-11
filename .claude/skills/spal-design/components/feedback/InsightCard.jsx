import React from "react";
import { Aura } from "../brand/Aura.jsx";

const variants = {
  default: { surface: { background: "var(--surface-card)", boxShadow: "var(--shadow-1)" }, tile: "var(--surface-sunken)", glyph: "var(--text-primary)", title: "var(--text-primary)", body: "var(--text-secondary)" },
  celebration: { surface: { background: "#0B100E", boxShadow: "var(--highlight-top-dark)" }, aura: "night", tile: "rgba(255,255,255,0.08)", glyph: "#6CC796", title: "#EEF1ED", body: "rgba(238,241,237,0.66)", horizon: true },
  warning: { surface: { background: "var(--ochre-50)", boxShadow: "0 0 0 1px var(--ochre-100)" }, tile: "var(--ochre-100)", glyph: "var(--ochre-700)", title: "var(--ochre-700)", body: "var(--ink-600)" },
  tip: { surface: { background: "var(--atmos-mist)", boxShadow: "var(--shadow-1)" }, aura: "mist", tile: "rgba(255,255,255,0.8)", glyph: "var(--accent-text)", title: "var(--text-primary)", body: "var(--text-secondary)" },
};

/** Inline insight — daily nudges, tips, celebrations. Optional trailing metric. */
export function InsightCard({ title, message, variant = "default", icon, metric, metricLabel, positive }) {
  const v = variants[variant] || variants.default;
  const metricColor = variant === "celebration" ? "#EEF1ED" : positive === true ? "var(--money-in)" : positive === false ? "var(--money-out)" : "var(--text-primary)";
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: "var(--radius-md)", padding: 16, ...v.surface }}>
      {v.aura && <Aura variant={v.aura} />}
      {v.horizon && <span aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 1, background: "var(--horizon-line)" }} />}
      <div style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 12 }}>
        {icon && <span style={{ flexShrink: 0, width: 32, height: 32, borderRadius: "var(--radius-sm)", background: v.tile, color: v.glyph, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>}
        <div style={{ flex: 1, minWidth: 0, paddingTop: icon ? 1 : 0 }}>
          <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 15, lineHeight: 1.35, letterSpacing: "-0.01em", color: v.title }}>{title}</p>
          <p style={{ margin: "3px 0 0", fontSize: 13.5, lineHeight: 1.45, color: v.body }}>{message}</p>
        </div>
        {metric && (
          <div style={{ flexShrink: 0, textAlign: "right" }}>
            <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 20, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", color: metricColor }}>{metric}</p>
            {metricLabel && <p style={{ margin: "2px 0 0", fontSize: 12, color: v.body }}>{metricLabel}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
