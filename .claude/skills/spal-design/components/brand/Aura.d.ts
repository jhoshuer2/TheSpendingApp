import * as React from "react";
/**
 * Intentional addition — SPAL's signature atmosphere as a live component (soft drifting color fields). Static equivalents: --atmos-night / --atmos-dawn / --atmos-mist.
 */
export interface AuraProps {
  variant?: "night" | "dawn" | "mist";
  /** Slow drift (22–32s per blob). Disabled under prefers-reduced-motion. */
  animate?: boolean;
  /** Multiplies blob opacity (0.5 = quieter). */
  intensity?: number;
  grain?: boolean;
}
export declare function Aura(props: AuraProps): JSX.Element;
