/**
 * The signature atmosphere, as a diffusion mesh: a few very large soft colour fields that blend into each other like light through frosted glass.
 * Each field is a radial gradient with an eased (smoothstep) falloff, so it has no edge, ring or banding to find, and a layer of fine grain finishes it.
 * Fields: [left%, top%, width%, height%, colour, strength 0-1, drift seconds]. Some start outside the frame so colour bleeds in from the corners.
 */
const PALETTES = {
  // Dark and calm enough for white text: black with a blue floor, a deep teal belly and a mint glow in the top corner.
  night: { base: "#05080a", fields: [[-32, 38, 112, 92, "#3f75ee", 0.56, 26], [8, 52, 86, 62, "#0fa37f", 0.4, 22], [42, -38, 96, 78, "#00ffaa", 0.36, 30], [-26, -34, 74, 62, "#dcefff", 0.1, 34]] },
  // Light and airy for dark text: white, a mint wash, a sky-blue wash.
  dawn: { base: "#f8f8f4", fields: [[38, -32, 104, 84, "#00ffaa", 0.3, 28], [-38, 42, 116, 94, "#3f75ee", 0.22, 32], [14, 54, 92, 64, "#9cc4ff", 0.26, 24], [-22, -28, 72, 62, "#ffffff", 0.95, 30]] },
} as const;

const hex = (h: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];

/** A radial gradient whose opacity falls off like a smoothstep, so the field melts into whatever is behind it. */
function field(colour: string, strength: number): string {
  const [r, g, b] = hex(colour);
  const stops = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8;
    const smooth = t * t * (3 - 2 * t);
    return `rgba(${r},${g},${b},${(strength * (1 - smooth)).toFixed(3)}) ${Math.round(t * 100)}%`;
  });
  return `radial-gradient(closest-side, ${stops.join(", ")})`;
}

/** Fills its positioned parent. One per screen, never behind dense lists. It stands still when motion is off. */
export function Aura({ variant = "night" }: { variant?: keyof typeof PALETTES }) {
  const p = PALETTES[variant];
  return (
    <div className={`aura aura--${variant}`} aria-hidden="true" style={{ background: p.base }}>
      {p.fields.map(([x, y, w, h, c, s, d], i) => (
        <i key={i} style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`, backgroundImage: field(c, s), animationDuration: `${d}s`, animationDelay: `${-i * 4.1}s`, animationName: `aura-drift-${i % 3}` }} />
      ))}
      <span className="aura__grain" />
    </div>
  );
}
