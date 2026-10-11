import * as React from "react";
/**
 * Intentional addition — production SPAL uses hugeicons-react (not browser-distributable). This wraps a curated set of Lucide geometry at SPAL's 1.6 stroke.
 */
export interface IconProps {
  name: "plus" | "x" | "check" | "chevron-right" | "chevron-down" | "chevron-left" | "arrow-right" | "arrow-up-right" | "arrow-down-left" | "trending-up" | "bell" | "search" | "home" | "list" | "chart" | "user" | "message" | "target" | "archive" | "trash" | "undo" | "clock" | "wallet" | "menu";
  size?: number;
  stroke?: number;
  color?: string;
}
export declare function Icon(props: IconProps): JSX.Element;
