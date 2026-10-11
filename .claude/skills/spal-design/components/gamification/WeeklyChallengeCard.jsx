import React from "react";
import { Icon } from "../core/Icon.jsx";

/** Weekly challenge — progress as discrete segments (one per step) when the target is small, a hairline bar when large. */
export function WeeklyChallengeCard({ label, current, target, completed = false }) {
  const pct = Math.min(current / target, 1);
  const segmented = target <= 12;
  return (
    <div style={{ borderRadius: "var(--radius-md)", padding: 16, background: "var(--surface-card)", boxShadow: "var(--shadow-1), var(--highlight-top)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 500, color: "var(--text-secondary)" }}>Weekly challenge</p>
          <p style={{ margin: "4px 0 0", fontSize: 15, fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.35, letterSpacing: "-0.01em", fontFamily: "var(--font-display)" }}>{label}</p>
        </div>
        <p style={{ margin: 0, fontSize: 17, fontWeight: 500, color: "var(--text-primary)", flexShrink: 0, fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-display)" }}>
          {current}<span style={{ color: "var(--text-tertiary)" }}>/{target}</span>
        </p>
      </div>
      {segmented ? (
        <div style={{ marginTop: 14, display: "flex", gap: 4 }}>
          {Array.from({ length: target }).map((_, i) => (
            <span key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i < current ? "var(--accent)" : "var(--surface-sunken)", boxShadow: i < current ? "inset 0 1px 0 rgba(255,255,255,0.2)" : "inset 0 0 0 1px var(--line)", transition: `background var(--dur-3) var(--ease-out) ${i * 30}ms` }} />
          ))}
        </div>
      ) : (
        <div style={{ marginTop: 14, height: 6, borderRadius: 3, background: "var(--surface-sunken)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct * 100}%`, borderRadius: 3, background: "var(--accent)", transition: "width var(--dur-4) var(--ease-out)" }} />
        </div>
      )}
      {completed && (
        <p style={{ margin: "12px 0 0", display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 500, color: "var(--accent-text)" }}>
          <Icon name="check" size={16} stroke={2} />You finished this week's challenge
        </p>
      )}
    </div>
  );
}
