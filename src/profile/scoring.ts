import type { Answers, Band, NeedId, NeedScore, Profile } from "./types";

export const NEED_LABEL: Record<NeedId, string> = {
  setup: "Setting up properly",
  brand: "Your brand and look",
  online: "Being found online",
  customers: "Getting more customers",
  demand: "Keeping up with demand",
  team: "Your team",
  money: "Money and profit",
  records: "Keeping records",
  direction: "Knowing your next move",
};

export const BAND_LABEL: Record<Band, string> = {
  starting: "Getting started",
  growing: "Growing",
  scaling: "Scaling up",
};

export const BAND_NOTE: Record<Band, string> = {
  starting: "You're laying the foundations. We'll keep it simple and take it one step at a time.",
  growing: "Your business is running. We'll focus on getting more customers and getting organised.",
  scaling: "You're established. We'll focus on keeping up with demand and building your team.",
};

/** The stage in words. Someone with only an idea isn't "getting started" in the same way as someone who opened last month. */
export const stageLabel = (a: Answers): string => (a.stage === "idea" ? "Getting ready to launch" : a.stage === "under1" ? "Finding your feet" : BAND_LABEL[bandFor(a)]);
export const stageNote = (a: Answers): string =>
  a.stage === "idea"
    ? "You're planning something new. We'll help you get ready before you launch, one small step at a time."
    : a.stage === "under1"
      ? "You've started selling. We'll help you keep simple records, find customers who come back, and know what you keep."
      : BAND_NOTE[bandFor(a)];

const PAIN: Record<NonNullable<Answers["pain"]>, { need: NeedId; text: string }> = {
  customers: { need: "customers", text: "getting customers" },
  demand: { need: "demand", text: "keeping up with demand" },
  money: { need: "money", text: "money and cash flow" },
  staff: { need: "team", text: "hiring and managing people" },
  organised: { need: "records", text: "staying organised" },
  brand: { need: "brand", text: "looking professional" },
  unsure: { need: "direction", text: "knowing what to do next" },
};

export function bandFor(a: Answers): Band {
  const bigTeam = a.team === "t6to15" || a.team === "t16plus";
  const goodSales = a.sales === "k500to2m" || a.sales === "gt2m";
  switch (a.stage) {
    case "idea":
    case "under1":
      return "starting";
    case "y1to3":
      return bigTeam && goodSales ? "scaling" : "growing";
    case "y3plus":
      return bigTeam || goodSales ? "scaling" : "growing";
    default:
      return "starting";
  }
}

interface Hit {
  need: NeedId;
  weight: number;
  reason: string;
}

export function buildProfile(a: Answers): Profile {
  const band = bandFor(a);
  const have = new Set(a.have ?? []);
  const hits: Hit[] = [{ need: "direction", weight: 1, reason: "A clear goal makes every other step easier" }];
  const add = (need: NeedId, weight: number, reason: string) => hits.push({ need, weight, reason });

  if (a.pain) add(PAIN[a.pain].need, 3, `You said ${PAIN[a.pain].text} is the hardest part right now`);

  switch (a.goal) {
    case "start":
      add("setup", 3, "Your main goal is to start properly");
      break;
    case "customers":
      add("customers", 2, "Your main goal is to get more customers");
      break;
    case "earn":
      add("money", 2, "Your main goal is to earn more from what you sell");
      add("customers", 1, "Your main goal is to earn more from what you sell");
      break;
    case "grow":
      add("team", 1, "Your main goal is to grow bigger");
      add("online", 1, "Your main goal is to grow bigger");
      add("demand", 1, "Your main goal is to grow bigger");
      break;
    case "organised":
      add("records", 2, "Your main goal is to get organised");
      break;
  }

  const idea = a.stage === "idea";
  if (idea) {
    add("money", 1, "Knowing what it will cost to start helps you plan before you launch");
    add("customers", 1, "Finding your first customers before you launch makes day one easier");
  }

  if (a.stage === "under1") {
    add("customers", 1, "In your first year, customers who come back matter most");
    add("money", 1, "In your first year, knowing what you keep matters most");
  }
  if (a.stage === "y1to3") add("money", 1, "At this stage, prices and cash flow set how fast you can grow");
  if (a.stage === "y3plus") {
    add("team", 1, "Written routines let you step back as the business grows");
    add("money", 1, "At this stage, prices and cash flow set how fast you can grow");
  }

  if (band === "starting") {
    add("setup", 1, "You're just getting started");
    add("direction", 1, "You're just getting started");
  } else if (band === "growing") {
    add("customers", 1, "Your business is running and ready for more customers");
    add("records", 1, "Your business is running, so good records will pay off");
  } else {
    add("team", 1, "Your business is established and ready for more help");
    add("demand", 1, "Your business is established and ready to handle more orders");
  }

  const nothing = have.has("none");
  if (nothing || !have.has("registered")) add("setup", band === "starting" ? 2 : 1, "You don't have a registered business name yet");
  if (nothing || !have.has("logo")) add("brand", 2, "You don't have a logo yet");
  if (nothing || !have.has("online")) add("online", 2, "You're not online with a website or store yet");
  if (nothing || !have.has("social")) add("online", 1, "You don't have a social media page for your business yet");
  if (nothing || !have.has("bank")) add("money", 1, "You don't have a separate business account yet");
  if (!idea && (nothing || !have.has("tracking"))) add("records", band === "starting" ? 1 : 2, "You're not tracking your sales yet");

  if (a.team === "solo" && band !== "starting") add("demand", 1, "You're running it on your own, so demand can outgrow you");

  const byNeed = new Map<NeedId, Hit[]>();
  for (const h of hits) byNeed.set(h.need, [...(byNeed.get(h.need) ?? []), h]);

  const needs: NeedScore[] = [...byNeed.entries()].map(([id, hs]) => {
    const sorted = [...hs].sort((x, y) => y.weight - x.weight);
    return { id, score: hs.reduce((n, h) => n + h.weight, 0), reasons: [...new Set(sorted.map((h) => h.reason))] };
  });
  needs.sort((x, y) => y.score - x.score);
  return { band, needs };
}
