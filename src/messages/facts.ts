import type { Answers } from "../profile/types";

/** The few facts about the business that SPAL writes from. All optional, all in the person's own words. */
export interface BusinessFacts {
  businessName?: string;
  about?: string;
  place?: string;
  hours?: string;
  instagram?: string;
}
export const FACT_KEYS = ["businessName", "about", "place", "hours", "instagram"] as const;
export type FactKey = (typeof FACT_KEYS)[number];

export const FACT_LABEL: Record<FactKey, string> = {
  businessName: "Business name",
  about: "What you sell",
  place: "Where you are",
  hours: "Opening hours",
  instagram: "Instagram",
};

export const factsOf = (a: Answers): BusinessFacts => {
  const out: BusinessFacts = {};
  for (const k of FACT_KEYS) if (a[k]) out[k] = a[k];
  return out;
};
