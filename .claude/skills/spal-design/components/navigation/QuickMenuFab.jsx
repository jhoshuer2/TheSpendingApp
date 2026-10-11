import React, { useState, useRef, useEffect } from "react";
import { Icon } from "../core/Icon.jsx";

const items = [
  { key: "sale", label: "Record sale", icon: "arrow-down-left", tone: "var(--money-in)" },
  { key: "expense", label: "Record expense", icon: "arrow-up-right", tone: "var(--money-out)" },
  { key: "ask", label: "Ask SPAL", icon: "message", tone: "var(--iris-600)" },
  { key: "goals", label: "Set a goal", icon: "target", tone: "var(--text-primary)" },
  { key: "inventory", label: "Inventory", icon: "archive", tone: "var(--text-primary)" },
];

/** Quick menu — an ink capsule whose plus turns 45° into a close; the menu rises item by item. The app's primary entry point. */
export function QuickMenuFab({ onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "absolute", zIndex: 50, right: 16, bottom: "calc(env(safe-area-inset-bottom,0px) + 24px)" }}>
      {open && (
        <div style={{ position: "absolute", bottom: 64, right: 0, width: 220, padding: 6, background: "var(--surface-card)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-2)", transformOrigin: "bottom right", animation: "spal-menu-in var(--dur-3) var(--ease-out)" }}>
          {items.map((it, i) => (
            <button key={it.key} className="spal-menu-item" onClick={() => { setOpen(false); onSelect?.(it.key); }}
              style={{ width: "100%", height: 48, display: "flex", alignItems: "center", gap: 12, padding: "0 10px", background: "none", border: "none", borderRadius: "var(--radius-sm)", textAlign: "left", cursor: "pointer", animation: `spal-item-in var(--dur-3) var(--ease-out) ${i * 30}ms both` }}>
              <span style={{ width: 32, height: 32, borderRadius: 9, background: "var(--surface-sunken)", color: it.tone, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={it.icon} size={17} />
              </span>
              <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.005em" }}>{it.label}</span>
            </button>
          ))}
        </div>
      )}
      <button className="spal-fab" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        style={{ display: "flex", alignItems: "center", gap: 8, height: 52, padding: "0 20px 0 16px", borderRadius: "var(--radius-full)", border: "none", cursor: "pointer", background: "var(--ink-900)", color: "#EEF1ED", fontWeight: 500, fontSize: 15, fontFamily: "var(--font-display)", whiteSpace: "nowrap", boxShadow: "var(--shadow-2), inset 0 1px 0 rgba(255,255,255,0.1)", transition: "transform var(--dur-1) var(--ease-out)" }}>
        <span style={{ display: "flex", transform: open ? "rotate(45deg)" : "none", transition: "transform var(--dur-3) var(--ease-out)" }}><Icon name="plus" size={20} stroke={1.8} /></span>
        {open ? "Close" : "Quick menu"}
      </button>
      <style>{`
        .spal-fab:active{transform:scale(var(--press-scale))}
        .spal-menu-item:hover{background:var(--surface-sunken)!important}
        .spal-menu-item:active{transform:scale(0.99)}
        @keyframes spal-menu-in{from{opacity:0;transform:translateY(6px) scale(0.98)}to{opacity:1;transform:none}}
        @keyframes spal-item-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
      `}</style>
    </div>
  );
}
