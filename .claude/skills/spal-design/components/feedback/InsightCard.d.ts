import * as React from "react";
export interface InsightCardProps {
  title: string;
  message: string;
  variant?: "default" | "celebration" | "warning" | "tip";
  icon?: React.ReactNode;
  metric?: string;
  metricLabel?: string;
  positive?: boolean;
}
export declare function InsightCard(props: InsightCardProps): JSX.Element;
