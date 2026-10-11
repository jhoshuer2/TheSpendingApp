import * as React from "react";
/** Intentional addition — factored from the identical inline nav-pill row repeated on Home/Records/Insights in source. */
export interface TopNavPillsProps {
  active?: "home" | "records" | "insights";
  onChange?: (key: string) => void;
}
export declare function TopNavPills(props: TopNavPillsProps): JSX.Element;
