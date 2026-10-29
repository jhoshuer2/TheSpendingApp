import type { IconName } from "../design-system/Icon";
import type { Answers } from "./types";

export interface Option {
  value: string;
  label: string;
  hint?: string;
  /** Shown before the label, so each answer can be told apart at a glance. */
  icon?: IconName;
  /** Multi-select only: choosing this clears the others (and vice versa). */
  exclusive?: boolean;
}

export interface Question {
  id: keyof Answers;
  title: string;
  lede?: string;
  multi?: boolean;
  options: Option[];
  /** Hide the question for some answers, so people only see what fits them. */
  when?: (a: Answers) => boolean;
  /** Narrow the options to the ones that make sense given earlier answers. `options` stays the full list. */
  only?: (a: Answers) => string[] | undefined;
  /** Say it differently given earlier answers: a different title or lede, or other labels for the same values. */
  say?: (a: Answers) => { title?: string; lede?: string; labels?: Partial<Record<string, string>> } | undefined;
}

const started = (a: Answers) => a.stage !== undefined && a.stage !== "idea";
const notStarted = (a: Answers) => a.stage === "idea";

export const QUESTIONS: Question[] = [
  {
    id: "stage",
    title: "Where are you with your business?",
    options: [
      { value: "idea", icon: "lightbulb", label: "I haven't started yet", hint: "I have an idea or a plan" },
      { value: "under1", icon: "sprout", label: "I started less than a year ago" },
      { value: "y1to3", icon: "trending-up", label: "I've been running 1 to 3 years" },
      { value: "y3plus", icon: "briefcase", label: "I've been running 3 years or more" },
    ],
  },
  {
    id: "goal",
    title: "What matters most right now?",
    lede: "Pick the one that's closest. You can change it later.",
    options: [
      { value: "start", icon: "flag", label: "Start properly" },
      { value: "customers", icon: "users", label: "Get more customers" },
      { value: "earn", icon: "wallet", label: "Earn more from what I sell" },
      { value: "grow", icon: "chart", label: "Grow bigger" },
      { value: "organised", icon: "clipboard-list", label: "Get organised" },
    ],
    only: (a) => (a.stage === "idea" ? ["start", "customers", "organised"] : a.stage === "under1" ? ["start", "customers", "earn", "organised"] : a.stage === "y1to3" ? ["start", "customers", "earn", "grow", "organised"] : a.stage === "y3plus" ? ["customers", "earn", "grow", "organised"] : undefined),
    say: (a) => {
      if (notStarted(a)) return { title: "What do you want to get done first?", labels: { start: "Get set up properly", customers: "Find my first customers", organised: "Plan it before I start" } };
      if (a.stage === "under1" || a.stage === "y1to3") return { labels: { start: "Set things up properly" } };
      return undefined;
    },
  },
  {
    id: "type",
    title: "What kind of business is it?",
    options: [
      { value: "food", icon: "utensils", label: "Food and drinks" },
      { value: "fashion", icon: "shirt", label: "Fashion and beauty" },
      { value: "shop", icon: "store", label: "Shop or trading" },
      { value: "services", icon: "wrench", label: "Services", hint: "Repairs, cleaning, tutoring, events" },
      { value: "online", icon: "globe", label: "Online or digital" },
      { value: "farm", icon: "leaf", label: "Farming" },
      { value: "other", icon: "sparkles", label: "Something else" },
    ],
    say: (a) => (notStarted(a) ? { title: "What kind of business will it be?", lede: "Pick the closest." } : undefined),
  },
  {
    id: "team",
    title: "How many people work in it?",
    lede: "Count yourself.",
    when: started,
    options: [
      { value: "solo", icon: "user", label: "Just me" },
      { value: "t2to5", icon: "users", label: "2 to 5 people" },
      { value: "t6to15", icon: "briefcase", label: "6 to 15 people" },
      { value: "t16plus", icon: "store", label: "More than 15" },
    ],
  },
  {
    id: "sales",
    title: "About how much do you sell in a month?",
    lede: "A rough idea is fine. It stays private.",
    when: started,
    options: [
      { value: "lt100k", icon: "receipt", label: "Under ₦100,000" },
      { value: "k100to500", icon: "wallet", label: "₦100,000 to ₦500,000" },
      { value: "k500to2m", icon: "kept", label: "₦500,000 to ₦2 million" },
      { value: "gt2m", icon: "chart", label: "Over ₦2 million" },
      { value: "unsure", icon: "compass", label: "I'm not sure" },
    ],
  },
  {
    id: "have",
    title: "What do you already have?",
    lede: "Pick all that apply.",
    multi: true,
    options: [
      { value: "registered", icon: "clipboard-list", label: "A registered business name" },
      { value: "logo", icon: "pen-tool", label: "A logo" },
      { value: "online", icon: "globe", label: "A website or online store" },
      { value: "social", icon: "share", label: "A page on social media" },
      { value: "bank", icon: "wallet", label: "A separate business account" },
      { value: "tracking", icon: "chart", label: "A way to track my sales" },
      { value: "none", icon: "minus", label: "None of these yet", exclusive: true },
    ],
    only: (a) => (notStarted(a) ? ["registered", "logo", "online", "social", "bank", "none"] : undefined),
    say: (a) => (notStarted(a) ? { title: "What do you already have ready?" } : undefined),
  },
  {
    id: "pain",
    title: "What's hardest right now?",
    options: [
      { value: "customers", icon: "users", label: "Getting customers" },
      { value: "demand", icon: "box", label: "Keeping up with demand" },
      { value: "money", icon: "wallet", label: "Money and cash flow" },
      { value: "staff", icon: "user", label: "Hiring and managing people" },
      { value: "organised", icon: "clipboard-list", label: "Staying organised" },
      { value: "brand", icon: "pen-tool", label: "Looking professional" },
      { value: "unsure", icon: "compass", label: "Knowing what to do next" },
    ],
    only: (a) => (notStarted(a) ? ["customers", "money", "organised", "brand", "unsure"] : a.team === "solo" ? ["customers", "demand", "money", "organised", "brand", "unsure"] : undefined),
    say: (a) => (notStarted(a) ? { title: "What feels hardest about starting?", labels: { money: "Money to get going", unsure: "Knowing where to begin" } } : undefined),
  },
];

/** A question as this person should see it: wording and options fitted to what they've already said. */
export function resolveQuestion(q: Question, a: Answers): { id: Question["id"]; title: string; lede?: string; multi?: boolean; options: Option[] } {
  const keep = q.only?.(a);
  const said = q.say?.(a);
  const options = q.options.filter((o) => !keep || keep.includes(o.value)).map((o) => ({ ...o, label: said?.labels?.[o.value] ?? o.label }));
  return { id: q.id, title: said?.title ?? q.title, lede: said?.lede ?? q.lede, multi: q.multi, options };
}

/** Drop answers that stopped fitting because an earlier answer changed (say, "grow bigger" after switching to "haven't started"). */
export function pruneAnswers(a: Answers): Answers {
  const out: Record<string, unknown> = { ...a };
  for (const q of QUESTIONS) {
    const ok = new Set(resolveQuestion(q, a).options.map((o) => o.value));
    const v = out[q.id];
    if (Array.isArray(v)) {
      const kept = v.filter((x) => ok.has(x));
      if (kept.length) out[q.id] = kept;
      else delete out[q.id];
    } else if (v !== undefined && !ok.has(v as string)) delete out[q.id];
  }
  return out as Answers;
}

/** The questions this person will see, given what they've answered so far. */
export const visibleQuestions = (a: Answers): Question[] => QUESTIONS.filter((q) => !q.when || q.when(a));

export const isAnswered = (q: Question, a: Answers): boolean => {
  const ok = new Set(resolveQuestion(q, a).options.map((o) => o.value));
  const v = a[q.id];
  return Array.isArray(v) ? v.some((x) => ok.has(x)) : v !== undefined && ok.has(v);
};
