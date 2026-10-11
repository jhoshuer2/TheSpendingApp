import * as React from "react";
/**
 * Intentional addition — DESIGN.md mandates "skeleton screens, not spinners" but ships no shared component; this factors the pattern out for reuse.
 */
export interface SkeletonProps { width?: string | number; height?: number; radius?: number; }
export declare function Skeleton(props: SkeletonProps): JSX.Element;
export declare function SkeletonRow(): JSX.Element;
