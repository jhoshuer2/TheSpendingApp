import React from "react";

/** Placeholder bar — a slow, soft sheen across a recessed surface. SPAL never shows spinners. */
export function Skeleton({ width = "100%", height = 12, radius = 6, style }) {
  return (
    <div className="spal-skel" style={{ width, height, borderRadius: radius, background: "var(--surface-sunken)", position: "relative", overflow: "hidden", ...style }}>
      <style>{`
        .spal-skel::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0.55) 50%,rgba(255,255,255,0) 100%);transform:translateX(-100%);animation:spal-sheen 1.8s var(--ease-in-out) infinite}
        [data-theme="night"] .spal-skel::after{background:linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0.05) 50%,rgba(255,255,255,0) 100%)}
        @keyframes spal-sheen{0%{transform:translateX(-100%)}60%,100%{transform:translateX(100%)}}
      `}</style>
    </div>
  );
}

/** Skeleton in the exact shape of a ledger row. */
export function SkeletonRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, height: "var(--row-h)", boxShadow: "inset 0 -1px 0 var(--line)" }}>
      <Skeleton width={40} height={40} radius={10} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <Skeleton width="52%" height={11} />
        <Skeleton width="28%" height={9} />
      </div>
      <Skeleton width={56} height={11} />
    </div>
  );
}
