import type { CSSProperties } from "react";

/* Lucide geometry (ISC), drawn at SPAL's 1.6 stroke. Strings are paths; c = circle [cx, cy, r]. */
type Part = string | { c: [number, number, number] };

const GLYPHS = {
  "arrow-right": ["M5 12h14", "m12 5 7 7-7 7"],
  "chevron-left": ["m15 18-6-6 6-6"],
  check: ["M20 6 9 17l-5-5"],
  eye: ["M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z", { c: [12, 12, 3] }],
  "eye-off": [
    "M9.88 9.88a3 3 0 1 0 4.24 4.24",
    "M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68",
    "M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61",
    "m2 2 20 20",
  ],
  home: ["m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"],
  "book-open": [
    "M12 7v14",
    "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",
  ],
  "trending-up": ["M22 7 13.5 15.5 8.5 10.5 2 17", "M16 7h6v6"],
  user: ["M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", { c: [12, 7, 4] }],
} satisfies Record<string, Part[]>;

export type IconName = keyof typeof GLYPHS;

interface IconProps {
  name: IconName;
  size?: number;
  stroke?: number;
  style?: CSSProperties;
}

export function Icon({ name, size = 20, stroke = 1.6, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {(GLYPHS[name] as Part[]).map((p, i) =>
        typeof p === "string" ? <path key={i} d={p} /> : <circle key={i} cx={p.c[0]} cy={p.c[1]} r={p.c[2]} />,
      )}
    </svg>
  );
}
