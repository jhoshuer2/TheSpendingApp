import * as React from "react";
export interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onExpire: () => void;
  duration?: number;
}
export declare function UndoToast(props: UndoToastProps): JSX.Element;
