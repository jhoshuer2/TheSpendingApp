import * as React from "react";
export interface WeeklyChallengeCardProps {
  label: string;
  current: number;
  target: number;
  completed?: boolean;
}
export declare function WeeklyChallengeCard(props: WeeklyChallengeCardProps): JSX.Element;
