import * as React from "react";
export interface PillChipProps {
  label: string;
  icon?: React.ReactNode;
  color?: "green" | "blue" | "orange" | "purple" | "gray";
  selected?: boolean;
  size?: "sm" | "md";
  onClick?: () => void;
}
export declare function PillChip(props: PillChipProps): JSX.Element;
