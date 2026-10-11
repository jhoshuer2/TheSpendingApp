import React from "react";
import { Icon } from "../core/Icon.jsx";

const tabs = [
  { key: "home", label: "Home", icon: "home" },
  { key: "records", label: "Records", icon: "list" },
  { key: "insights", label: "Insights", icon: "chart" },
  { key: "profile", label: "Profile", icon: "user" },
];

/** Glass tab bar — hairline top edge, ink-weighted active state (no colored indicator). Inner/detail screens only. */
export function BottomNav({ active = "home", onChange }) {
  return (
    <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "var(--shell-max-w)", background: "var(--surface-glass)", boxShadow: "inset 0 1px 0 var(--line)", backdropFilter: "saturate(180%) blur(var(--blur-glass))", WebkitBackdropFilter: "saturate(180%) blur(var(--blur-glass))", zIndex: 50 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", padding: "6px 8px calc(env(safe-area-inset-bottom,0px) + 6px)" }}>
        {tabs.map((t) => {
          const on = t.key === active;
          return (
            <button key={t.key} onClick={() => onChange?.(t.key)} aria-current={on ? "page" : undefined}
              style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 64, minHeight: 50, justifyContent: "center", cursor: "pointer", color: on ? "var(--text-primary)" : "var(--text-tertiary)", transition: "color var(--dur-2) var(--ease-out)" }}>
              <Icon name={t.icon} size={22} stroke={on ? 2 : 1.6} />
              <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.01em", fontFamily: "var(--font-display)" }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
