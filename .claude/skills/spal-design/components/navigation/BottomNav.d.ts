import * as React from "react";
export interface BottomNavProps {
  active?: "home" | "records" | "insights" | "profile";
  onChange?: (key: string) => void;
}
export declare function BottomNav(props: BottomNavProps): JSX.Element;
