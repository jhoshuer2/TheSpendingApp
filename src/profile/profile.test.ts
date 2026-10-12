import { describe, expect, it } from "vitest";
import { MODULES } from "./modules";
import { QUESTIONS, visibleQuestions } from "./questions";
import { recommend } from "./recommend";
import { bandFor, buildProfile } from "./scoring";
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
  it("has unique option values per question", () => {
    for (const q of QUESTIONS) expect(new Set(q.options.map((o) => o.value)).size).toBe(q.options.length);
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
        expect(["do", "draft"]).toContain(m.kind); // "do" steps tick themselves; "draft" steps offer to write it for you
        expect(m.tool.to).toMatch(/^\/(money|app|write|assistant)(\/|\?|$)/);
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
