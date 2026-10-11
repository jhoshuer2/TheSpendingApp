import React from "react";

/* Lucide geometry (ISC), redrawn at SPAL's 1.6 stroke. Strings are paths; {c} circles; {r} rects. */
const G = {
  plus: ["M5 12h14", "M12 5v14"],
  x: ["M18 6 6 18", "m6 6 12 12"],
  check: ["M20 6 9 17l-5-5"],
  "chevron-right": ["m9 18 6-6-6-6"],
  "chevron-down": ["m6 9 6 6 6-6"],
  "chevron-left": ["m15 18-6-6 6-6"],
  "arrow-right": ["M5 12h14", "m12 5 7 7-7 7"],
  "arrow-up-right": ["M7 7h10v10", "M7 17 17 7"],
  "arrow-down-left": ["M17 7 7 17", "M17 17H7V7"],
  "trending-up": ["M22 7 13.5 15.5 8.5 10.5 2 17", "M16 7h6v6"],
  bell: ["M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9", "M10.3 21a1.94 1.94 0 0 0 3.4 0"],
  search: [{ c: [11, 11, 8] }, "m21 21-4.3-4.3"],
  home: ["m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"],
  list: ["M8 6h13", "M8 12h13", "M8 18h13", "M3 6h.01", "M3 12h.01", "M3 18h.01"],
  chart: ["M3 3v18h18", "M18 17V9", "M13 17V5", "M8 17v-3"],
  user: ["M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", { c: [12, 7, 4] }],
  message: ["M7.9 20A9 9 0 1 0 4 16.1L2 22Z"],
  target: [{ c: [12, 12, 10] }, { c: [12, 12, 6] }, { c: [12, 12, 2] }],
  archive: [{ r: [2, 3, 20, 5, 1] }, "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8", "M10 12h4"],
  trash: ["M3 6h18", "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"],
  undo: ["M9 14 4 9l5-5", "M4 9h10.5a5.5 5.5 0 0 1 0 11H11"],
  clock: [{ c: [12, 12, 10] }, "M12 6v6l4 2"],
  wallet: ["M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1", "M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"],
  menu: ["M4 12h16", "M4 6h16", "M4 18h16"],
};

/** SPAL icon — Lucide geometry at a refined 1.6 stroke, rounded caps/joins, currentColor. */
export function Icon({ name, size = 20, stroke = 1.6, color = "currentColor", style }) {
  const parts = G[name] || [];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0, ...style }} aria-hidden="true">
      {parts.map((p, i) =>
        typeof p === "string" ? <path key={i} d={p} /> :
        p.c ? <circle key={i} cx={p.c[0]} cy={p.c[1]} r={p.c[2]} /> :
        <rect key={i} x={p.r[0]} y={p.r[1]} width={p.r[2]} height={p.r[3]} rx={p.r[4]} />
      )}
    </svg>
  );
}

Icon.names = Object.keys(G);
