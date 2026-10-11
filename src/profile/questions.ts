import type { Answers } from "./types";

export interface Option {
  value: string;
  label: string;
  hint?: string;
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
}

const started = (a: Answers) => a.stage !== undefined && a.stage !== "idea";

export const QUESTIONS: Question[] = [
  {
    id: "stage",
    title: "Where are you with your business?",
    options: [
      { value: "idea", label: "I haven't started yet", hint: "I have an idea or a plan" },
      { value: "under1", label: "I started less than a year ago" },
      { value: "y1to3", label: "I've been running 1 to 3 years" },
      { value: "y3plus", label: "I've been running 3 years or more" },
    ],
  },
  {
    id: "goal",
    title: "What matters most right now?",
    lede: "Pick the one that's closest. You can change it later.",
    options: [
      { value: "start", label: "Start properly" },
      { value: "customers", label: "Get more customers" },
      { value: "earn", label: "Earn more from what I sell" },
      { value: "grow", label: "Grow bigger" },
      { value: "organised", label: "Get organised" },
    ],
  },
  {
    id: "type",
    title: "What kind of business is it?",
    lede: "Or what it will be.",
    options: [
      { value: "food", label: "Food and drinks" },
      { value: "fashion", label: "Fashion and beauty" },
      { value: "shop", label: "Shop or trading" },
      { value: "services", label: "Services", hint: "Repairs, cleaning, tutoring, events" },
      { value: "online", label: "Online or digital" },
      { value: "farm", label: "Farming" },
      { value: "other", label: "Something else" },
    ],
  },
  {
    id: "team",
    title: "How many people work in it?",
    lede: "Count yourself.",
    when: started,
    options: [
      { value: "solo", label: "Just me" },
      { value: "t2to5", label: "2 to 5 people" },
      { value: "t6to15", label: "6 to 15 people" },
      { value: "t16plus", label: "More than 15" },
    ],
  },
  {
    id: "sales",
    title: "About how much do you sell in a month?",
    lede: "A rough idea is fine. It stays private.",
    when: started,
    options: [
      { value: "lt100k", label: "Under ₦100,000" },
      { value: "k100to500", label: "₦100,000 to ₦500,000" },
      { value: "k500to2m", label: "₦500,000 to ₦2 million" },
      { value: "gt2m", label: "Over ₦2 million" },
      { value: "unsure", label: "I'm not sure" },
    ],
  },
  {
    id: "have",
    title: "What do you already have?",
    lede: "Pick all that apply.",
    multi: true,
    options: [
      { value: "registered", label: "A registered business name" },
      { value: "logo", label: "A logo" },
      { value: "online", label: "A website or online store" },
      { value: "social", label: "A page on social media" },
      { value: "bank", label: "A separate business account" },
      { value: "tracking", label: "A way to track my sales" },
      { value: "none", label: "None of these yet", exclusive: true },
    ],
  },
  {
    id: "pain",
    title: "What's hardest right now?",
    options: [
      { value: "customers", label: "Getting customers" },
      { value: "demand", label: "Keeping up with demand" },
      { value: "money", label: "Money and cash flow" },
      { value: "staff", label: "Hiring and managing people" },
      { value: "organised", label: "Staying organised" },
      { value: "brand", label: "Looking professional" },
      { value: "unsure", label: "Knowing what to do next" },
    ],
  },
];

/** The questions this person will see, given what they've answered so far. */
export const visibleQuestions = (a: Answers): Question[] => QUESTIONS.filter((q) => !q.when || q.when(a));

export const isAnswered = (q: Question, a: Answers): boolean => {
  const v = a[q.id];
  return Array.isArray(v) ? v.length > 0 : v !== undefined;
};
