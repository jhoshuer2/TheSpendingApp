import * as React from "react";
/**
 * Intentional addition — formalizes SPAL's money treatment (big figures are the emotional core of every screen; source formats them inline via formatCurrency()).
 */
export interface MoneyProps {
  value: number;
  currency?: string;
  size?: number;
  weight?: number;
  direction?: "none" | "in" | "out" | "owed";
  decimals?: boolean;
  color?: string;
}
export declare function Money(props: MoneyProps): JSX.Element;
