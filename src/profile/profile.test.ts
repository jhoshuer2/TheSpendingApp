import { describe, expect, it } from "vitest";
import { fitsPerson, MODULES } from "./modules";
import { isAnswered, pruneAnswers, QUESTIONS, resolveQuestion, visibleQuestions } from "./questions";
import { recommend } from "./recommend";
import { bandFor, buildProfile, stageLabel, stageNote, BAND_LABEL, BAND_NOTE } from "./scoring";
import { sanitizeAnswers } from "./state";
import type { Answers, NeedId } from "./types";

const NEEDS: NeedId[] = ["setup", "brand", "online", "customers", "demand", "team", "money", "records", "direction"];

describe("questions", () => {
  it("skips team and sales for someone who hasn't started", () => {
    const ids = visibleQuestions({ stage: "idea" }).map((q) => q.id);
    expect(ids).not.toContain("team");
    expect(ids).not.toContain("sales");
    expect(ids).toEqual(["stage", "goal", "type", "have", "pain"]);
  });
  it("asks everything once the business has started", () => {
    expect(visibleQuestions({ stage: "y1to3" })).toHaveLength(QUESTIONS.length);
  });
  it("gives every option an icon, so each answer can be told apart at a glance", () => {
    for (const q of QUESTIONS) for (const o of q.options) expect(o.icon, `${q.id}/${o.value}`).toBeTruthy();
  });
  it("keeps the icon when the wording changes for a stage", () => {
    const goal = QUESTIONS.find((q) => q.id === "goal")!;
    const idea = resolveQuestion(goal, { stage: "idea" }).options.find((o) => o.value === "customers")!;
    expect(idea.label).toBe("Find my first customers");
    expect(idea.icon).toBe(goal.options.find((o) => o.value === "customers")!.icon);
  });
  it("has unique option values per question", () => {
    for (const q of QUESTIONS) expect(new Set(q.options.map((o) => o.value)).size).toBe(q.options.length);
  });
});

const ask = (id: string, a: Answers) => resolveQuestion(QUESTIONS.find((q) => q.id === id)!, a);
const values = (id: string, a: Answers) => ask(id, a).options.map((o) => o.value);

describe("questions adapt to what you've said", () => {
  it("doesn't offer someone who hasn't started the goals of an established business", () => {
    expect(values("goal", { stage: "idea" })).toEqual(["start", "customers", "organised"]);
    expect(values("goal", { stage: "y3plus" })).not.toContain("start");
    expect(values("goal", { stage: "y3plus" })).toContain("grow");
    expect(values("goal", { stage: "under1" })).not.toContain("grow");
  });
  it("speaks about starting, not running, when the business hasn't started", () => {
    expect(ask("goal", { stage: "idea" }).options.map((o) => o.label)).toContain("Find my first customers");
    expect(ask("type", { stage: "idea" }).title).toBe("What kind of business will it be?");
    expect(ask("type", { stage: "y1to3" }).title).toBe("What kind of business is it?");
    expect(ask("pain", { stage: "idea" }).title).toBe("What feels hardest about starting?");
  });
  it("hides what can't apply yet", () => {
    expect(values("have", { stage: "idea" })).not.toContain("tracking");
    expect(values("pain", { stage: "idea" })).not.toContain("demand");
    expect(values("pain", { stage: "idea" })).not.toContain("staff");
    expect(values("pain", { stage: "y1to3", team: "solo" })).not.toContain("staff");
    expect(values("pain", { stage: "y1to3", team: "t2to5" })).toContain("staff");
  });
  it("shows everything before the stage is known", () => {
    expect(values("goal", {})).toEqual(QUESTIONS.find((q) => q.id === "goal")!.options.map((o) => o.value));
  });
  it("counts an answer that no longer fits as unanswered", () => {
    expect(isAnswered(QUESTIONS.find((q) => q.id === "goal")!, { stage: "idea", goal: "grow" })).toBe(false);
    expect(isAnswered(QUESTIONS.find((q) => q.id === "goal")!, { stage: "idea", goal: "start" })).toBe(true);
  });
  it("drops answers that stopped fitting when an earlier answer changed", () => {
    expect(pruneAnswers({ stage: "idea", goal: "grow", pain: "staff", have: ["logo", "tracking"] })).toEqual({ stage: "idea", have: ["logo"] });
    expect(pruneAnswers({ stage: "y3plus", goal: "grow", pain: "demand" })).toEqual({ stage: "y3plus", goal: "grow", pain: "demand" });
  });
});

describe("band", () => {
  it("is starting for an idea or a first-year business", () => {
    expect(bandFor({ stage: "idea" })).toBe("starting");
    expect(bandFor({ stage: "under1", team: "t16plus", sales: "gt2m" })).toBe("starting");
  });
  it("needs a bigger team and good sales to scale within 3 years", () => {
    expect(bandFor({ stage: "y1to3", team: "solo", sales: "gt2m" })).toBe("growing");
    expect(bandFor({ stage: "y1to3", team: "t6to15", sales: "k500to2m" })).toBe("scaling");
  });
  it("scales an established business with a big team or strong sales", () => {
    expect(bandFor({ stage: "y3plus", team: "solo", sales: "lt100k" })).toBe("growing");
    expect(bandFor({ stage: "y3plus", team: "t6to15" })).toBe("scaling");
    expect(bandFor({ stage: "y3plus", sales: "gt2m" })).toBe("scaling");
  });
});

describe("needs map", () => {
  it("puts setup first for someone starting from nothing", () => {
    const p = buildProfile({ stage: "idea", goal: "start", have: ["none"], pain: "unsure" });
    expect(p.band).toBe("starting");
    expect(p.needs[0].id).toBe("setup");
  });
  it("ranks the hardest part highly and explains it", () => {
    const a: Answers = { stage: "y1to3", goal: "organised", team: "t2to5", have: ["registered", "logo", "online", "social", "bank", "tracking"], pain: "customers" };
    const p = buildProfile(a);
    expect(p.needs[0].id).toBe("customers");
    expect(p.needs[0].reasons[0]).toContain("getting customers");
  });
  it("gives two people at the same stage different needs", () => {
    const base = { stage: "y1to3", team: "t2to5", sales: "k100to500" } as const;
    const a = buildProfile({ ...base, goal: "customers", pain: "customers", have: ["registered", "logo", "online", "social", "bank", "tracking"] });
    const b = buildProfile({ ...base, goal: "grow", pain: "brand", have: ["registered", "online", "social", "bank", "tracking"] });
    expect(a.band).toBe(b.band);
    expect(a.needs[0].id).not.toBe(b.needs[0].id);
  });
  it("always returns a ranked, deduplicated list", () => {
    const p = buildProfile({});
    expect(p.needs.length).toBeGreaterThan(0);
    for (let i = 1; i < p.needs.length; i++) expect(p.needs[i - 1].score).toBeGreaterThanOrEqual(p.needs[i].score);
    for (const n of p.needs) expect(new Set(n.reasons).size).toBe(n.reasons.length);
  });
});

describe("modules", () => {
  it("have unique ids, valid needs and real steps", () => {
    expect(new Set(MODULES.map((m) => m.id)).size).toBe(MODULES.length);
    for (const m of MODULES) {
      expect(NEEDS).toContain(m.need);
      expect(m.steps.length).toBeGreaterThanOrEqual(3);
      expect(m.bands.length).toBeGreaterThan(0);
      expect(m.minutes).toBeGreaterThan(0);
    }
  });
  it("say how each one gets done, and give every in-app step a real tool and a valid route", () => {
    for (const m of MODULES) {
      expect(["do", "draft", "guide", "connect"]).toContain(m.kind);
      if (m.kind === "do") expect(m.tool).toBeDefined();
      if (m.tool) {
        expect(["do", "draft", "guide"]).toContain(m.kind); // "do" steps tick themselves; "draft" steps offer to write it for you; a "guide" may link to a get-ready screen
        expect(m.tool.to).toMatch(/^\/(money|app|write|assistant|business)(\/|\?|$)/);
        expect(m.tool.label.length).toBeGreaterThan(0);
      }
    }
  });
  it("only auto-tick steps that exist, and only for in-app steps", () => {
    for (const m of MODULES) {
      if (!m.auto) continue;
      expect(m.kind).toBe("do");
      for (const i of Object.keys(m.auto).map(Number)) {
        expect(i).toBeGreaterThanOrEqual(0);
        expect(i).toBeLessThan(m.steps.length);
      }
    }
  });
  it("cover every need for at least one band", () => {
    for (const n of NEEDS) expect(MODULES.some((m) => m.need === n)).toBe(true);
  });
});

describe("recommend", () => {
  const answers: Answers = { stage: "idea", goal: "start", type: "food", have: ["none"], pain: "unsure" };
  const profile = buildProfile(answers);

  it("offers one next step and a short queue, all fitting the band", () => {
    const { next, upNext } = recommend(profile, answers, new Set());
    expect(next).toBeDefined();
    expect(upNext).toHaveLength(3);
    for (const r of [next!, ...upNext]) expect(r.module.bands).toContain("starting");
  });
  it("skips finished steps", () => {
    const first = recommend(profile, answers, new Set()).next!.module.id;
    const second = recommend(profile, answers, new Set([first]));
    expect(second.next!.module.id).not.toBe(first);
    expect([second.next!, ...second.upNext].map((r) => r.module.id)).not.toContain(first);
  });
  it("only offers business-type steps to that type", () => {
    const food = recommend(profile, answers, new Set(), { upNextCount: 20 });
    const ids = [food.next!, ...food.upNext].map((r) => r.module.id);
    expect(ids).toContain("food-price");
    expect(ids).not.toContain("fashion-deposit");
  });
  it("does not offer scaling steps to a beginner", () => {
    const all = recommend(profile, answers, new Set(), { upNextCount: 50 });
    expect([all.next!, ...all.upNext].map((r) => r.module.id)).not.toContain("team-delegate");
  });
  it("mixes needs instead of repeating one back to back", () => {
    const { next, upNext } = recommend(profile, answers, new Set());
    const needs = [next!, ...upNext].map((r) => r.module.need);
    expect(new Set(needs).size).toBeGreaterThan(2);
  });
  it("runs out gracefully", () => {
    const everything = new Set(MODULES.map((m) => m.id));
    const r = recommend(profile, answers, everything);
    expect(r.next).toBeUndefined();
    expect(r.upNext).toEqual([]);
  });
});


describe("business facts in answers", () => {
  it("keeps tidy facts, trims and limits them, and drops junk", () => {
    const a = sanitizeAnswers({ businessName: "  Ada's   Kitchen ", about: "Jollof\nand zobo", place: "x".repeat(300), hours: 5, instagram: "@ada.kitchen_ng" });
    expect(a).toMatchObject({ businessName: "Ada's Kitchen", about: "Jollof and zobo", instagram: "ada.kitchen_ng" });
    expect(a.place).toHaveLength(100);
    expect("hours" in a).toBe(false);
    expect("instagram" in sanitizeAnswers({ instagram: "not a handle!" })).toBe(false);
    expect("about" in sanitizeAnswers({ about: "   " })).toBe(false);
  });
});

describe("steps fit the person's stage and what they already have", () => {
  const ids = (a: Answers) => {
    const band = bandFor(a);
    return MODULES.filter((m) => fitsPerson(m, band, a)).map((m) => m.id);
  };

  it("gives someone who hasn't started steps for starting, and none that need customers or sales", () => {
    const got = ids({ stage: "idea", type: "food" });
    expect(got).toEqual(expect.arrayContaining(["setup-name", "idea-test", "idea-costs", "idea-first-customers"]));
    for (const not of ["records-sales", "customers-referral", "customers-ask", "money-profit", "online-store"]) expect(got).not.toContain(not);
  });
  it("doesn't offer the starting-up steps to someone already running", () => {
    for (const stage of ["under1", "y1to3", "y3plus"] as const) {
      const got = ids({ stage });
      for (const not of ["idea-test", "idea-costs", "idea-first-customers", "setup-name"]) expect(got).not.toContain(not);
    }
  });
  it("offers running steps once the business is running", () => {
    expect(ids({ stage: "under1" })).toContain("records-sales");
    expect(ids({ stage: "y1to3" })).toContain("customers-referral");
    expect(ids({ stage: "y3plus", team: "t6to15" })).toContain("team-delegate");
  });
  it("skips a step for something they already have", () => {
    const base = { stage: "y1to3" } as const;
    expect(ids({ ...base })).toEqual(expect.arrayContaining(["setup-register", "brand-logo", "online-instagram", "money-account", "online-store", "records-sales"]));
    expect(ids({ ...base, have: ["registered"] })).not.toContain("setup-register");
    expect(ids({ ...base, have: ["logo"] })).not.toContain("brand-logo");
    expect(ids({ ...base, have: ["social"] })).not.toContain("online-instagram");
    expect(ids({ ...base, have: ["bank"] })).not.toContain("money-account");
    expect(ids({ ...base, have: ["online"] })).not.toContain("online-store");
    expect(ids({ ...base, have: ["tracking"] })).not.toContain("records-sales");
  });
  it("doesn't treat 'none of these' as having something", () => {
    expect(ids({ stage: "y1to3", have: ["none"] })).toEqual(expect.arrayContaining(["setup-register", "brand-logo", "money-account"]));
  });
  it("still offers everything when the stage isn't known", () => {
    expect(ids({})).toContain("setup-name");
  });
  it("points someone who hasn't started at starting steps first", () => {
    const a: Answers = { stage: "idea", goal: "start", type: "food", have: ["none"], pain: "unsure" };
    const p = buildProfile(a);
    const { next, upNext } = recommend(p, a, new Set());
    const queue = [next!, ...upNext].map((r) => r.module.id);
    expect(queue.some((id) => ["setup-name", "idea-test", "idea-costs", "idea-first-customers", "setup-plan"].includes(id))).toBe(true);
    for (const id of queue) expect(["records-sales", "customers-referral"]).not.toContain(id);
  });
});

describe("the profile for someone who hasn't started", () => {
  const a: Answers = { stage: "idea", goal: "start", type: "food", have: ["none"], pain: "unsure" };
  it("doesn't say they aren't tracking sales they haven't made", () => {
    const records = buildProfile(a).needs.find((n) => n.id === "records");
    expect(records?.reasons.join(" ") ?? "").not.toMatch(/tracking your sales/);
  });
  it("leads with starting up, not with running a business", () => {
    const top = buildProfile(a).needs.slice(0, 4).map((n) => n.id);
    expect(top).toEqual(expect.arrayContaining(["setup"]));
    expect(top).not.toContain("team");
    expect(top).not.toContain("demand");
  });
  it("explains the money and customers steps in terms of launching", () => {
    const p = buildProfile(a);
    expect(p.needs.find((n) => n.id === "money")?.reasons.join(" ")).toMatch(/cost to start|before you launch/i);
    expect(p.needs.find((n) => n.id === "customers")?.reasons.join(" ")).toMatch(/first customers|before you launch/i);
  });
  it("still asks a running business about tracking", () => {
    const records = buildProfile({ stage: "y1to3", have: ["none"] }).needs.find((n) => n.id === "records");
    expect(records?.reasons.join(" ")).toMatch(/tracking your sales/);
  });
});

describe("how the stage is named", () => {
  it("calls someone who hasn't started 'getting ready to launch', and everyone else by their band", () => {
    expect(stageLabel({ stage: "idea" })).toBe("Getting ready to launch");
    expect(stageNote({ stage: "idea" })).toMatch(/before you launch|get ready/i);
    expect(stageLabel({ stage: "under1" })).toBe("Finding your feet");
    expect(stageNote({ stage: "under1" })).toMatch(/selling/);
    expect(stageLabel({ stage: "y1to3" })).toBe(BAND_LABEL.growing);
    expect(stageNote({ stage: "y1to3" })).toBe(BAND_NOTE.growing);
    expect(BAND_NOTE.starting).toBeTruthy();
    expect(stageLabel({ stage: "y3plus", team: "t6to15" })).toBe(BAND_LABEL.scaling);
  });
});

describe("each running stage gets steps that fit it", () => {
  const ids = (a: Answers) => MODULES.filter((m) => fitsPerson(m, bandFor(a), a)).map((m) => m.id);

  it("gives a first-year business steps about what it keeps and who comes back", () => {
    const got = ids({ stage: "under1", team: "solo" });
    expect(got).toEqual(expect.arrayContaining(["money-profit", "customers-ask", "run-first-months", "run-repeat-customers", "records-sales"]));
    for (const not of ["grow-cashflow", "grow-prices", "scale-routines", "team-first-helper", "team-delegate"]) expect(got).not.toContain(not);
  });
  it("gives a business of one to three years steps about cash, prices and keeping customers", () => {
    const got = ids({ stage: "y1to3", team: "solo" });
    expect(got).toEqual(expect.arrayContaining(["grow-cashflow", "grow-prices", "run-repeat-customers", "money-profit"]));
    for (const not of ["run-first-months", "scale-routines", "idea-test", "setup-name"]) expect(got).not.toContain(not);
  });
  it("gives an established business steps about routines and cash, and none for starting out", () => {
    const got = ids({ stage: "y3plus", team: "t6to15" });
    expect(got).toEqual(expect.arrayContaining(["scale-routines", "grow-cashflow", "grow-prices"]));
    for (const not of ["run-first-months", "run-repeat-customers", "idea-costs", "setup-plan", "setup-name"]) expect(got).not.toContain(not);
  });
  it("doesn't tell a team to plan their first helper, or a one-person business to hand tasks over", () => {
    expect(ids({ stage: "y1to3", team: "solo" })).toContain("team-first-helper");
    expect(ids({ stage: "y1to3", team: "solo", sales: "gt2m" })).not.toContain("team-delegate");
    expect(ids({ stage: "y1to3", team: "t6to15", sales: "k500to2m" })).not.toContain("team-first-helper");
    expect(ids({ stage: "y1to3", team: "t6to15", sales: "k500to2m" })).toContain("team-delegate");
    expect(ids({ stage: "y3plus", team: "t16plus" })).not.toContain("team-first-helper");
  });
  it("still offers both when the team size isn't known", () => {
    const got = ids({ stage: "y3plus", sales: "gt2m" });
    expect(got).toEqual(expect.arrayContaining(["team-first-helper", "team-delegate"]));
  });
  it("explains the profile of each stage in its own terms", () => {
    const first = buildProfile({ stage: "under1", have: ["none"] });
    expect(first.needs.find((n) => n.id === "customers")?.reasons.join(" ")).toMatch(/first year/i);
    expect(first.needs.find((n) => n.id === "money")?.reasons.join(" ")).toMatch(/first year/i);
    const mid = buildProfile({ stage: "y1to3", have: ["bank", "tracking"] });
    expect(mid.needs.find((n) => n.id === "money")?.reasons.join(" ")).toMatch(/prices and cash/i);
    const old = buildProfile({ stage: "y3plus", team: "t6to15" });
    expect(old.needs.find((n) => n.id === "team")?.reasons.join(" ")).toMatch(/routines|step back/i);
  });
  it("keeps every new step real: enough steps, a real tool route, a known need", () => {
    for (const id of ["run-first-months", "run-repeat-customers", "grow-cashflow", "grow-prices", "scale-routines"]) {
      const m = MODULES.find((x) => x.id === id)!;
      expect(m, id).toBeDefined();
      expect(m.steps.length).toBeGreaterThanOrEqual(3);
      expect(m.stages, id).toBeDefined();
    }
  });
});
