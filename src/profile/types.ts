import type { AutoCheck } from "../records/calc";

export type Stage = "idea" | "under1" | "y1to3" | "y3plus";
export type Goal = "start" | "customers" | "earn" | "grow" | "organised";
export type BizType = "food" | "fashion" | "shop" | "services" | "online" | "farm" | "other";
export type Team = "solo" | "t2to5" | "t6to15" | "t16plus";
export type Sales = "lt100k" | "k100to500" | "k500to2m" | "gt2m" | "unsure";
export type Have = "registered" | "logo" | "online" | "social" | "bank" | "tracking" | "none";
export type Pain = "customers" | "demand" | "money" | "staff" | "organised" | "unsure" | "brand";

export interface Answers {
  stage?: Stage;
  goal?: Goal;
  type?: BizType;
  team?: Team;
  sales?: Sales;
  have?: Have[];
  pain?: Pain;
  /** Not a question: the name shown on receipts and reminders. Set from the message screen. */
  businessName?: string;
  /** What you sell and who for, in a line. Facts about the business that SPAL writes from. */
  about?: string;
  place?: string;
  hours?: string;
  /** Instagram name without the @. */
  instagram?: string;
}

export type Band = "starting" | "growing" | "scaling";

export type NeedId = "setup" | "brand" | "online" | "customers" | "demand" | "team" | "money" | "records" | "direction";

export interface NeedScore {
  id: NeedId;
  score: number;
  /** Plain-language reasons, strongest first. Shown to the user as "because...". */
  reasons: string[];
}

export interface Profile {
  band: Band;
  needs: NeedScore[];
}

/** How a step gets done. See docs/PRD-DO-IT-IN-SPAL.md. Only "do" steps have an in-app tool today. */
export type StepKind = "do" | "draft" | "guide" | "connect";

export interface Module {
  id: string;
  kind: StepKind;
  /** The in-app tool that does the job. Required for "do" steps. */
  tool?: { label: string; to: string };
  /** Steps that tick themselves when the person does the thing, keyed by step index. */
  auto?: Record<number, AutoCheck>;
  title: string;
  why: string;
  minutes: number;
  need: NeedId;
  bands: Band[];
  /** If set, the module is only offered to these business types. */
  types?: BizType[];
  steps: string[];
}
