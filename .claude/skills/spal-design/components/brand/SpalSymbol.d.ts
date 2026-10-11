import * as React from "react";
/**
 * Intentional addition — DESIGN.md defines a "proprietary geometric symbol system" but ships no code. v2 renders it as hairline marks with one accent point.
 */
export interface SpalSymbolProps {
  symbol?: "profit" | "flow" | "growth" | "focus" | "consistency" | "momentum" | "insight" | "cashflow";
  /** Stroke color (default ink). */
  color?: string;
  /** The single accent point (default --accent). */
  accent?: string;
  size?: number;
  spin?: boolean;
}
export declare function SpalSymbol(props: SpalSymbolProps): JSX.Element;
