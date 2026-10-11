import React from "react";

const tabs = [
  { key: "home", label: "Home" },
  { key: "records", label: "Records" },
  { key: "insights", label: "Insights" },
];

/** Segmented control — a recessed track with a raised thumb that glides between segments. Primary nav on Home/Records/Insights. */
export function TopNavPills({ active = "home", onChange }) {
  const idx = Math.max(0, tabs.findIndex((t) => t.key === active));
  return (
    <div role="tablist" style={{ position: "relative", display: "flex", height: 40, padding: 3, borderRadius: "var(--radius-full)", background: "var(--surface-sunken)", boxShadow: "inset 0 1px 2px rgba(20,26,23,0.05)" }}>
      <span aria-hidden="true" style={{
        position: "absolute", top: 3, bottom: 3, left: 3, width: `calc((100% - 6px) / ${tabs.length})`,
        transform: `translateX(${idx * 100}%)`, borderRadius: "var(--radius-full)",
        background: "var(--surface-card)", boxShadow: "var(--shadow-tactile-light)",
        transition: "transform var(--dur-3) var(--ease-out)",
      }} />
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <button key={t.key} role="tab" aria-selected={on} onClick={() => onChange?.(t.key)}
            style={{ position: "relative", flex: 1, border: "none", background: "transparent", cursor: "pointer", borderRadius: "var(--radius-full)", fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 14, letterSpacing: "-0.005em", color: on ? "var(--text-primary)" : "var(--text-secondary)", transition: "color var(--dur-2) var(--ease-out)" }}>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
