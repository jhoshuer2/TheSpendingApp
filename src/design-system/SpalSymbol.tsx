/** SPAL symbols: hairline marks (1.25 stroke) with one accent point. Stand in for illustration. */
export type SymbolName = "profit" | "growth" | "focus" | "insight";

const ring = (r: number, o = 1) => <circle cx="32" cy="32" r={r} opacity={o} />;

const MARKS: Record<SymbolName, (accent: string) => JSX.Element> = {
  profit: (a) => (
    <>
      {ring(26, 0.28)}
      {ring(18, 0.55)}
      {ring(10)}
      <circle cx="32" cy="32" r="2.5" fill={a} stroke="none" />
    </>
  ),
  growth: (a) => (
    <>
      <rect x="10" y="38" width="10" height="16" rx="2" opacity="0.4" />
      <rect x="27" y="26" width="10" height="28" rx="2" opacity="0.7" />
      <rect x="44" y="12" width="10" height="42" rx="2" />
      <circle cx="49" cy="6" r="2.5" fill={a} stroke="none" />
    </>
  ),
  focus: (a) => (
    <>
      {ring(26, 0.22)}
      <circle cx="32" cy="32" r="18" strokeDasharray="2 4" opacity="0.6" />
      {ring(8)}
      <circle cx="32" cy="32" r="2.5" fill={a} stroke="none" />
    </>
  ),
  insight: (a) => (
    <>
      {Array.from({ length: 12 }).map((_, i) => {
        const t = (i / 12) * Math.PI * 2;
        const long = i % 3 === 0;
        const r2 = long ? 26 : 22;
        return (
          <line
            key={i}
            x1={32 + Math.cos(t) * 16}
            y1={32 + Math.sin(t) * 16}
            x2={32 + Math.cos(t) * r2}
            y2={32 + Math.sin(t) * r2}
            opacity={long ? 1 : 0.45}
          />
        );
      })}
      <circle cx="32" cy="32" r="3" fill={a} stroke="none" />
    </>
  ),
};

interface SpalSymbolProps {
  symbol: SymbolName;
  size?: number | string;
}

export function SpalSymbol({ symbol, size = 64 }: SpalSymbolProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {MARKS[symbol]("var(--accent-text)")}
    </svg>
  );
}
