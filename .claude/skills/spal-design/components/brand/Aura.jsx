import React from "react";

/* Each blob: [left%, top%, width%, height%, color, opacity, driftSeconds] — positions may sit outside the frame so color bleeds in from the edges. */
const PALETTES = {
  night: { base: "#0B100E", blur: 0.16, blobs: [
    [-18, 52, 78, 70, "#1E7A4C", 0.85, 22], [52, 40, 70, 62, "#1B5C5A", 0.8, 26],
    [22, 78, 50, 34, "#8CD3A8", 0.42, 19], [62, 74, 42, 40, "#8A5F34", 0.38, 24], [-20, -22, 64, 52, "#2F4A24", 0.4, 30],
  ] },
  dawn: { base: "#F6F6F1", blur: 0.14, blobs: [
    [-20, 58, 78, 66, "#BFE4CB", 1, 22], [50, 52, 72, 64, "#E1EDB9", 0.95, 26],
    [24, 74, 56, 44, "#F4D4B6", 0.9, 19], [56, -24, 62, 54, "#CFE2EA", 0.8, 28], [-24, -10, 56, 50, "#DCEBDF", 0.7, 32],
  ] },
  mist: { base: "#EEF0EA", blur: 0.18, blobs: [
    [-14, -24, 70, 80, "#FFFFFF", 1, 24], [48, 50, 72, 70, "#CBE5D4", 0.95, 28],
    [44, -10, 50, 46, "#E7EFCB", 0.7, 22], [-10, 60, 48, 46, "#F1DFCB", 0.65, 26],
  ] },
};

/**
 * SPAL Aura — the signature atmosphere. Large, soft, analogous color fields (forest, teal, mint, ember / mint, lime, sand, sky)
 * that settle low like light on a horizon and drift almost imperceptibly. Fills its positioned parent.
 */
export function Aura({ variant = "night", animate = true, intensity = 1, grain = true, style }) {
  const p = PALETTES[variant] || PALETTES.night;
  return (
    <div aria-hidden="true" className="spal-aura" style={{ position: "absolute", inset: 0, overflow: "hidden", background: p.base, borderRadius: "inherit", pointerEvents: "none", containerType: "size", ...style }}>
      {p.blobs.map(([x, y, w, h, c, o, d], i) => (
        <span key={i} className={animate ? "spal-aura-blob" : undefined} style={{
          position: "absolute", left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`, borderRadius: "50%",
          background: c, opacity: Math.min(1, o * intensity), filter: `blur(calc(${p.blur * 100}cqmin + 12px))`,
          animationDuration: `${d}s`, animationDelay: `${-i * 3.7}s`, animationName: `spal-aura-drift-${i % 3}`,
        }} />
      ))}
      {grain && <span style={{ position: "absolute", inset: 0, backgroundImage: "var(--texture-grain)", opacity: variant === "night" ? 0.9 : 0.7, mixBlendMode: variant === "night" ? "screen" : "multiply" }} />}
      <style>{`
        .spal-aura-blob{animation-timing-function:var(--ease-in-out);animation-iteration-count:infinite;animation-direction:alternate;will-change:transform}
        @keyframes spal-aura-drift-0{from{transform:translate(0,0) scale(1)}to{transform:translate(6%,-4%) scale(1.06)}}
        @keyframes spal-aura-drift-1{from{transform:translate(0,0) scale(1.04)}to{transform:translate(-5%,3%) scale(0.97)}}
        @keyframes spal-aura-drift-2{from{transform:translate(0,0) rotate(0)}to{transform:translate(3%,5%) rotate(8deg)}}
        @media (prefers-reduced-motion: reduce){.spal-aura-blob{animation:none}}
      `}</style>
    </div>
  );
}
