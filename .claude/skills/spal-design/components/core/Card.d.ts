import * as React from "react";
export interface CardProps {
  /** raised = white with hairline ring · sunken = recessed well · mist = soft atmospheric light · night = dark horizon hero */
  surface?: "raised" | "sunken" | "mist" | "night";
  /** Draws a 1px horizon line across the top edge in the given hue. */
  accent?: "green" | "blue" | "orange" | "purple" | "none";
  padding?: "sm" | "md" | "lg" | "none";
  elevated?: boolean;
  children?: React.ReactNode;
}
export declare function Card(props: CardProps): JSX.Element;
