import * as React from "react";
export interface QuickMenuFabProps {
  onSelect?: (key: "sale" | "expense" | "ask" | "goals" | "inventory") => void;
}
export declare function QuickMenuFab(props: QuickMenuFabProps): JSX.Element;
