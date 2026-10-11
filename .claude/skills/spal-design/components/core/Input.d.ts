import * as React from "react";
export interface InputProps {
  label?: string;
  hint?: string;
  error?: string;
  prefix?: string;
  suffix?: React.ReactNode;
  large?: boolean;
  value?: string;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
export declare function Input(props: InputProps): JSX.Element;
