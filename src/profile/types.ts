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

export interface Module {
  id: string;
  title: string;
  why: string;
  minutes: number;
  need: NeedId;
  bands: Band[];
  /** If set, the module is only offered to these business types. */
  types?: BizType[];
  steps: string[];
}
