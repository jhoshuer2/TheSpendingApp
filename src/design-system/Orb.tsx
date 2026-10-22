/** The SPAL mascot: a small living orb. It breathes (4px, 5s) and presses in. Decorative; whatever wraps it carries the name. */
export function Orb({ size = 56 }: { size?: number }) {
  return <img className="orb" src="/brand/spal-ai-orb.webp" alt="" width={size} height={size} style={{ width: size, height: size }} />;
}
