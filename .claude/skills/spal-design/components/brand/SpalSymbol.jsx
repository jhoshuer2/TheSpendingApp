import React from "react";

/**
 * SPAL symbols — hairline marks (1.25 stroke) with a single accent point. They stand in for
 * illustrations in empty states, loading, onboarding and section breaks. Never filled, never multicolor.
 */
const R = (cx, cy, r, o = 1) => <circle cx={cx} cy={cy} r={r} opacity={o} />;
const marks = {
  profit: (a) => (<>{R(32, 32, 26, 0.28)}{R(32, 32, 18, 0.55)}{R(32, 32, 10)}<circle cx="32" cy="32" r="2.5" fill={a} stroke="none" /></>),
  flow: (a) => (<>{R(32, 32, 24, 0.35)}{R(32, 32, 14)}<circle cx="32" cy="8" r="2.5" fill={a} stroke="none" /><circle cx="46" cy="32" r="1.5" fill="currentColor" stroke="none" opacity="0.5" /></>),
  growth: (a) => (<><rect x="10" y="38" width="10" height="16" rx="2" opacity="0.4" /><rect x="27" y="26" width="10" height="28" rx="2" opacity="0.7" /><rect x="44" y="12" width="10" height="42" rx="2" /><circle cx="49" cy="6" r="2.5" fill={a} stroke="none" /></>),
  focus: (a) => (<>{R(32, 32, 26, 0.22)}<circle cx="32" cy="32" r="18" strokeDasharray="2 4" opacity="0.6" />{R(32, 32, 8)}<circle cx="32" cy="32" r="2.5" fill={a} stroke="none" /></>),
  consistency: (a) => (<g stroke="none">{[14, 32, 50].map((x) => [14, 32, 50].map((y) => (x === 32 && y === 32) ? <circle key="c" cx="32" cy="32" r="3.5" fill={a} /> : <circle key={`${x}${y}`} cx={x} cy={y} r="1.75" fill="currentColor" opacity="0.55" />))}</g>),
  momentum: (a) => (<><path d="M6 44h12l8-22 8 22 6-12h18" opacity="0.9" /><circle cx="58" cy="32" r="2.5" fill={a} stroke="none" /></>),
  insight: (a) => (<>{Array.from({ length: 12 }).map((_, i) => { const t = (i / 12) * Math.PI * 2; return <line key={i} x1={32 + Math.cos(t) * 16} y1={32 + Math.sin(t) * 16} x2={32 + Math.cos(t) * (i % 3 === 0 ? 26 : 22)} y2={32 + Math.sin(t) * (i % 3 === 0 ? 26 : 22)} opacity={i % 3 === 0 ? 1 : 0.45} />; })}<circle cx="32" cy="32" r="3" fill={a} stroke="none" /></>),
  cashflow: (a) => (<><path d="M4 30c7-12 13-12 20 0s13 12 20 0 13-12 16-6" /><path d="M4 40c7-12 13-12 20 0s13 12 20 0 13-12 16-6" opacity="0.35" /><circle cx="44" cy="30" r="2.5" fill={a} stroke="none" /></>),
};

export function SpalSymbol({ symbol = "profit", color = "var(--text-primary)", accent = "var(--accent)", size = 64, spin = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: "block", color, ...(spin ? { animation: "spal-sym-spin 14s linear infinite" } : null) }} aria-hidden="true">
      {marks[symbol]?.(accent)}
      {spin && <style>{`@keyframes spal-sym-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>}
    </svg>
  );
}
