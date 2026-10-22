/** Each blob: [left%, top%, width%, height%, colour, opacity, drift seconds]. Some sit outside the frame so colour bleeds in from the edges. */
const PALETTES = {
  night: { base: "#0B100E", blobs: [[-18, 52, 78, 70, "#1E7A4C", 0.85, 22], [52, 40, 70, 62, "#1B5C5A", 0.8, 26], [22, 78, 50, 34, "#8CD3A8", 0.42, 19], [62, 74, 42, 40, "#8A5F34", 0.38, 24], [-20, -22, 64, 52, "#2F4A24", 0.4, 30]] },
  dawn: { base: "#F6F6F1", blobs: [[-20, 58, 78, 66, "#BFE4CB", 1, 22], [50, 52, 72, 64, "#E1EDB9", 0.95, 26], [24, 74, 56, 44, "#F4D4B6", 0.9, 19], [56, -24, 62, 54, "#CFE2EA", 0.8, 28], [-24, -10, 56, 50, "#DCEBDF", 0.7, 32]] },
} as const;

/**
 * The signature atmosphere: large, soft, analogous colour fields that settle low like light on a horizon and drift almost imperceptibly.
 * Fills its positioned parent. One per screen, never behind dense lists. Stands still when motion is off.
 */
export function Aura({ variant = "night" }: { variant?: keyof typeof PALETTES }) {
  const p = PALETTES[variant];
  return (
    <div className={`aura aura--${variant}`} aria-hidden="true" style={{ background: p.base }}>
      {p.blobs.map(([x, y, w, h, c, o, d], i) => (
        <i key={i} style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`, background: c, opacity: o, animationDuration: `${d}s`, animationDelay: `${-i * 3.7}s`, animationName: `aura-drift-${i % 3}` }} />
      ))}
      <span className="aura__grain" />
    </div>
  );
}
