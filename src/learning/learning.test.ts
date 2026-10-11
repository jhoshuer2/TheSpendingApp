import { describe, expect, it } from "vitest";
import { MODULES } from "../profile/modules";
import { prefersShort, recommend } from "../profile/recommend";
import { buildProfile } from "../profile/scoring";
import type { Progress, StoredProfile } from "../profile/state";
import type { Answers } from "../profile/types";
import { computeInsights, welcomeBack } from "./insights";
import { dayKey, daysAgo } from "./time";

// A fixed "now" at midday so local-day maths is stable in any timezone.
const NOW = new Date(2026, 9, 14, 12, 0, 0); // Wed 14 Oct 2026
const at = (daysBack: number, hour = 10) => { const d = daysAgo(NOW, daysBack); d.setHours(hour, 0, 0, 0); return d.toISOString(); };
const day = (n: number) => dayKey(daysAgo(NOW, n));

const answers: Answers = { stage: "y1to3", goal: "customers", type: "shop", team: "solo", sales: "k100to500", have: ["registered", "bank"], pain: "customers" };
const profile = buildProfile(answers);
const store = (over: Partial<StoredProfile> = {}): StoredProfile => ({ answers, completed: true, progress: {}, activity: { days: [], learning: true }, ...over });
const done = (ids: string[]) => new Set(ids);
const finished = (id: string, daysBack: number, over: Partial<Progress> = {}): [string, Progress] => [id, { steps: [0, 1, 2], doneAt: at(daysBack), ...over }];
const ids = (r: ReturnType<typeof recommend>) => [r.next, ...r.upNext].filter(Boolean).map((x) => x!.module.id);

describe("recommend: hidden steps", () => {
  it("never offers a step the person said is not for them, even with learning off", () => {
    const first = recommend(profile, answers, done([]), { now: NOW }).next!.module.id;
    const progress = { [first]: { steps: [], dismissed: true } };
    for (const learning of [true, false]) {
      const r = recommend(profile, answers, done([]), { progress, now: NOW, learning, upNextCount: 30 });
      expect(ids(r)).not.toContain(first);
    }
  });
  it("hides a snoozed step for a week, then brings it back", () => {
    const first = recommend(profile, answers, done([]), { now: NOW }).next!.module.id;
    const progress = { [first]: { steps: [], snoozedUntil: at(-7) } };
    expect(ids(recommend(profile, answers, done([]), { progress, now: NOW, upNextCount: 30 }))).not.toContain(first);
    const later = new Date(NOW.getTime() + 8 * 24 * 60 * 60 * 1000);
    expect(ids(recommend(profile, answers, done([]), { progress, now: later, upNextCount: 30 }))).toContain(first);
  });
});

describe("recommend: learning from use", () => {
  // A close call between two areas is where learning should tip the balance. What the person said matters most
  // still wins when it is clearly ahead, so these tests use a profile where two areas are close.
  const close = { band: "growing" as const, needs: [
    { id: "customers" as const, score: 4, reasons: ["You said getting customers is the hardest part right now"] },
    { id: "records" as const, score: 3.5, reasons: ["You're not tracking your sales yet"] },
    { id: "direction" as const, score: 1, reasons: ["A clear goal makes every other step easier"] },
  ] };

  it("tips a close call towards a fresh area once the person has worked on the top one, and says why", () => {
    expect(recommend(close, answers, done([]), { now: NOW }).next!.module.need).toBe("customers");
    const progress = Object.fromEntries([finished("customers-ask", 3)]);
    const after = recommend(close, answers, done(["customers-ask"]), { progress, now: NOW });
    expect(after.next!.module.need).toBe("records");
    expect(after.next!.learned).toMatch(/already finished 1 step on getting more customers/i);
  });
  it("still points at what they said matters most when it is clearly ahead", () => {
    const progress = Object.fromEntries([finished("customers-ask", 3), finished("customers-referral", 2)]);
    const after = recommend(profile, answers, done(["customers-ask", "customers-referral"]), { progress, now: NOW });
    expect(after.next!.module.need).toBe("customers");
  });
  it("applies none of that when learning is off", () => {
    const progress = Object.fromEntries([finished("customers-ask", 3)]);
    const off = recommend(profile, answers, done(["customers-ask"]), { progress, now: NOW, learning: false });
    expect(off.next!.learned).toBeUndefined();
    expect(off.next!.module.need).toBe("customers"); // base ranking untouched
  });
  it("turns an area down after the person says a step in it is not for them", () => {
    const progress = { "customers-ask": { steps: [], dismissed: true } } as Record<string, Progress>;
    expect(recommend(close, answers, done([]), { progress, now: NOW, learning: true }).next!.module.need).toBe("records");
    // Learning off: the step stays hidden, but the area is not turned down.
    expect(recommend(close, answers, done([]), { progress, now: NOW, learning: false }).next!.module.need).toBe("customers");
  });
  it("leans to short steps when someone finishes short ones and lets long ones stall", () => {
    const progress: Record<string, Progress> = Object.fromEntries([
      finished("records-sales", 6), finished("direction-goal", 5),
      ["online-store", { steps: [0], openedAt: at(12) }] as [string, Progress], // 30 min step, abandoned
    ]);
    expect(prefersShort(progress, NOW)).toBe(true);
    const r = recommend(profile, answers, done(["records-sales", "direction-goal"]), { progress, now: NOW, upNextCount: 6 });
    const firstShort = [r.next!, ...r.upNext].findIndex((x) => x.module.minutes <= 15);
    expect(firstShort).toBeGreaterThanOrEqual(0);
    expect(firstShort).toBeLessThanOrEqual(1);
  });
  it("favours a step the person has already started, even over a slightly higher-ranked one", () => {
    const progress = { "records-sales": { steps: [0, 1] } } as Record<string, Progress>;
    for (const learning of [true, false]) {
      expect(recommend(close, answers, done([]), { progress, now: NOW, learning }).next!.module.id).toBe("records-sales");
    }
  });
  it("does not call someone a short-step person without evidence", () => {
    expect(prefersShort({}, NOW)).toBe(false);
    expect(prefersShort(Object.fromEntries([finished("records-sales", 6)]), NOW)).toBe(false);
  });
});

describe("insights: this week", () => {
  it("shows the last 7 local days and which were active", () => {
    const i = computeInsights(store({ activity: { days: [day(0), day(2), day(9)], learning: true } }), profile, NOW);
    expect(i.week.days).toHaveLength(7);
    expect(i.week.days.at(-1)!.key).toBe(day(0));
    expect(i.week.days.map((d) => d.active)).toEqual([false, false, false, false, true, false, true]);
    expect(i.week.activeDays).toBe(2);
  });
  it("compares steps finished this week with last week", () => {
    const progress = Object.fromEntries([finished("setup-name", 1), finished("records-sales", 3), finished("direction-goal", 8), finished("brand-look", 20)]);
    const i = computeInsights(store({ progress }), profile, NOW);
    expect(i.week.stepsFinished).toBe(2);
    expect(i.week.prevStepsFinished).toBe(1);
    expect(i.totals.finished).toBe(4);
  });
  it("hides activity entirely when learning is off", () => {
    const i = computeInsights(store({ activity: { days: [day(0), day(1), day(2)], learning: false } }), profile, NOW);
    expect(i.week.activeDays).toBe(0);
    expect(i.milestones.find((m) => m.id === "rhythm")!.unlocked).toBe(false);
    expect(i.gap).toBeNull();
  });
});

describe("insights: pace, gap and milestones", () => {
  it("works out a typical pace only from at least two steps", () => {
    const one = Object.fromEntries([finished("setup-name", 2, { openedAt: at(4) })]);
    expect(computeInsights(store({ progress: one }), profile, NOW).paceDays).toBeNull();
    // Both took two days from opening to finishing.
    const two = Object.fromEntries([finished("setup-name", 2, { openedAt: at(4) }), finished("records-sales", 3, { openedAt: at(5) })]);
    expect(computeInsights(store({ progress: two }), profile, NOW).paceDays).toBe(2);
  });
  it("points out an untouched top area once the person has settled in, and offers a step in it", () => {
    const progress = Object.fromEntries([finished("records-sales", 5), finished("direction-goal", 4), finished("brand-look", 3)]);
    const i = computeInsights(store({ progress }), profile, NOW);
    expect(i.gap).not.toBeNull();
    expect(i.gap!.need).toBe("customers");
    expect(i.gap!.module.need).toBe("customers");
    expect(i.gap!.text).toMatch(/haven't started a step on getting more customers/);
  });
  it("is quiet about gaps for someone new", () => {
    expect(computeInsights(store({ activity: { days: [day(0)], learning: true } }), profile, NOW).gap).toBeNull();
  });
  it("is quiet about an area they have started", () => {
    const progress = Object.fromEntries([finished("records-sales", 5), finished("direction-goal", 4), finished("brand-look", 3), ["customers-ask", { steps: [0] }] as [string, Progress]]);
    // Customers was started, so it is not flagged (another untouched area may be).
    expect(computeInsights(store({ progress }), profile, NOW).gap?.need).not.toBe("customers");
  });
  it("unlocks step milestones in order, dated when they happened", () => {
    const progress = Object.fromEntries([finished("setup-name", 9), finished("records-sales", 7), finished("direction-goal", 5)]);
    const m = Object.fromEntries(computeInsights(store({ progress }), profile, NOW).milestones.map((x) => [x.id, x]));
    expect(m.first.unlocked && m.three.unlocked).toBe(true);
    expect(m.ten.unlocked).toBe(false);
    expect(m.first.at).toBe(at(9));
    expect(m.three.at).toBe(at(5));
  });
  it("recognises three active days inside a week, but not spread thin", () => {
    const yes = computeInsights(store({ activity: { days: [day(6), day(4), day(2)], learning: true } }), profile, NOW).milestones.find((m) => m.id === "rhythm")!;
    expect(yes.unlocked).toBe(true);
    const no = computeInsights(store({ activity: { days: [day(20), day(10), day(1)], learning: true } }), profile, NOW).milestones.find((m) => m.id === "rhythm")!;
    expect(no.unlocked).toBe(false);
  });
  it("recognises a whole area finished", () => {
    const records = MODULES.filter((m) => m.need === "records" && m.bands.includes("growing")).map((m) => m.id);
    const progress = Object.fromEntries(records.map((id, i) => finished(id, 3 + i)));
    const area = computeInsights(store({ progress }), profile, NOW).milestones.find((m) => m.id === "area")!;
    expect(area.unlocked).toBe(true);
    expect(area.body).toMatch(/keeping records/i);
  });
});

describe("welcome back", () => {
  it("only after three or more days away, and only with learning on", () => {
    expect(welcomeBack(at(1), store(), NOW)).toBeNull();
    expect(welcomeBack(at(2), store(), NOW)).toBeNull();
    expect(welcomeBack(at(3), store(), NOW)).not.toBeNull();
    expect(welcomeBack(at(10), store({ activity: { days: [], learning: false } }), NOW)).toBeNull();
    expect(welcomeBack(undefined, store(), NOW)).toBeNull();
  });
  it("offers the step they were partway through, the most recently opened one", () => {
    const progress: Record<string, Progress> = {
      "setup-name": { steps: [0], openedAt: at(9) },
      "records-sales": { steps: [0, 1], openedAt: at(5) },
      "direction-goal": { steps: [0, 1, 2, 3], doneAt: at(4), openedAt: at(8) },
    };
    expect(welcomeBack(at(4), store({ progress }), NOW)!.inProgress!.id).toBe("records-sales");
  });
  it("is fine when nothing is in progress", () => {
    expect(welcomeBack(at(5), store(), NOW)).toEqual({ daysAway: 5, inProgress: undefined });
  });
});
