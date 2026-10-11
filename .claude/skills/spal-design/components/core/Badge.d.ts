import * as React from "react";
export interface BadgeProps {
  label: string;
  /** orange = money out (clay) · ochre = owed/pending · blue/purple = SPAL AI (iris) */
  color?: "green" | "orange" | "ochre" | "blue" | "purple" | "gray" | "red";
  dot?: boolean;
  size?: "sm" | "md";
}
export declare function Badge(props: BadgeProps): JSX.Element;
