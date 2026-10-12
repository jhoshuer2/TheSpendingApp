import { describe, expect, it } from "vitest";
import { EMPTY, isDirty, mergeState, sanitizeActivity, sanitizeAnswers, sanitizeProgress, sanitizeStored, type StoredProfile } from "./state";

const base = (over: Partial<StoredProfile> = {}): StoredProfile => ({ answers: {}, completed: false, progress: {}, activity: { days: [], learning: true }, ...over });

describe("sanitize", () => {
  it("drops answers the app doesn't understand", () => {
    expect(sanitizeAnswers({ stage: "idea", goal: "world-domination", team: 5, have: ["logo", "nope", "logo"], extra: "x" })).toEqual({ stage: "idea", have: ["logo"] });
  });
  it("copes with junk input", () => {
    expect(sanitizeAnswers(null)).toEqual({});
    expect(sanitizeAnswers([])).toEqual({});
    expect(sanitizeAnswers("hi")).toEqual({});
    expect(sanitizeStored(undefined)).toEqual(EMPTY);
    expect(sanitizeStored("x")).toEqual(EMPTY);
  });
  it("keeps only valid, sorted, unique steps and real dates", () => {
    expect(sanitizeProgress({ steps: [3, 1, 1, -1, 99, 2.5, "x"], doneAt: "2026-10-11T10:00:00Z" })).toEqual({ steps: [1, 3], doneAt: "2026-10-11T10:00:00.000Z" });
    expect(sanitizeProgress({ steps: "nope", doneAt: "not a date", openedAt: 5, snoozedUntil: "also bad" })).toEqual({ steps: [] });
  });
  it("keeps learning fields on a step, and only a real true for dismissed", () => {
    const p = sanitizeProgress({ steps: [], openedAt: "2026-10-01T08:00:00Z", snoozedUntil: "2026-10-20T08:00:00Z", dismissed: true });
    expect(p).toEqual({ steps: [], openedAt: "2026-10-01T08:00:00.000Z", snoozedUntil: "2026-10-20T08:00:00.000Z", dismissed: true });
    expect(sanitizeProgress({ steps: [], dismissed: "yes" }).dismissed).toBeUndefined();
  });
  it("cleans activity: real days only, sorted, capped at 90, learning on unless explicitly off", () => {
    const many = Array.from({ length: 120 }, (_, i) => `2026-${String(1 + Math.floor(i / 28)).padStart(2, "0")}-${String(1 + (i % 28)).padStart(2, "0")}`);
    const a = sanitizeActivity({ days: ["2026-10-02", "2026-10-01", "2026-10-01", "yesterday", 5, "2026-13-45"], lastSeen: "2026-10-02T09:00:00Z" });
    expect(a).toEqual({ days: ["2026-10-01", "2026-10-02"], learning: true, lastSeen: "2026-10-02T09:00:00.000Z" });
    expect(sanitizeActivity({ days: many }).days).toHaveLength(90);
    expect(sanitizeActivity({ learning: false }).learning).toBe(false);
    expect(sanitizeActivity({ learning: "no" }).learning).toBe(true);
    expect(sanitizeActivity(undefined)).toEqual({ days: [], learning: true });
  });
  it("ignores progress for steps that no longer exist", () => {
    const s = sanitizeStored({ progress: { "setup-name": { steps: [0] }, "deleted-module": { steps: [0] } } });
    expect(Object.keys(s.progress)).toEqual(["setup-name"]);
  });
  it("round-trips a valid cache including unsynced flags", () => {
    const s: StoredProfile = base({
      answers: { stage: "idea" },
      completed: true,
      progress: { "setup-name": { steps: [0, 1], openedAt: "2026-10-01T08:00:00.000Z" } },
      activity: { days: ["2026-10-01"], learning: false, lastSeen: "2026-10-01T08:00:00.000Z" },
      dirty: { profile: true, modules: ["setup-name"] },
    });
    expect(sanitizeStored(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
  it("still understands a cache written before activity existed (old dirty flag name)", () => {
    const s = sanitizeStored({ answers: { stage: "idea" }, completed: true, progress: {}, dirty: { answers: true, modules: [] } });
    expect(s.dirty).toEqual({ profile: true, modules: [] });
    expect(s.activity).toEqual({ days: [], learning: true });
  });
  it("drops an empty dirty marker", () => {
    expect(sanitizeStored({ dirty: { profile: false, modules: [] } }).dirty).toBeUndefined();
  });
});

describe("mergeState", () => {
  it("takes the server copy when nothing changed locally", () => {
    const server = base({ answers: { stage: "y1to3" }, completed: true, progress: { "setup-name": { steps: [0, 1] } }, activity: { days: ["2026-10-05"], learning: true } });
    const local = base({ answers: { stage: "idea" }, progress: { "setup-name": { steps: [0] } } });
    const merged = mergeState(server, local);
    expect(merged.answers).toEqual({ stage: "y1to3" });
    expect(merged.progress["setup-name"].steps).toEqual([0, 1]);
    expect(merged.activity.days).toEqual(["2026-10-05"]);
    expect(isDirty(merged)).toBe(false);
  });
  it("keeps local answers changed offline, and stays dirty so they get pushed", () => {
    const merged = mergeState(base({ answers: { stage: "idea" }, completed: true }), base({ answers: { stage: "y3plus" }, completed: true, dirty: { profile: true, modules: [] } }));
    expect(merged.answers.stage).toBe("y3plus");
    expect(merged.dirty).toEqual({ profile: true, modules: [] });
  });
  it("unions ticked steps for a step changed on two devices", () => {
    const server = base({ progress: { "setup-name": { steps: [0, 2] } } });
    const local = base({ progress: { "setup-name": { steps: [1] } }, dirty: { profile: false, modules: ["setup-name"] } });
    expect(mergeState(server, local).progress["setup-name"].steps).toEqual([0, 1, 2]);
  });
  it("never un-finishes a finished step, and keeps the earliest finish time", () => {
    const server = base({ progress: { "setup-name": { steps: [0, 1, 2, 3], doneAt: "2026-10-10T08:00:00.000Z" } } });
    const local = base({ progress: { "setup-name": { steps: [0], doneAt: "2026-10-11T08:00:00.000Z" } }, dirty: { profile: false, modules: ["setup-name"] } });
    expect(mergeState(server, local).progress["setup-name"].doneAt).toBe("2026-10-10T08:00:00.000Z");
    const localOnly = base({ progress: { "money-profit": { steps: [0, 1, 2, 3], doneAt: "2026-10-11T08:00:00.000Z" } }, dirty: { profile: false, modules: ["money-profit"] } });
    expect(mergeState(base(), localOnly).progress["money-profit"].doneAt).toBe("2026-10-11T08:00:00.000Z");
  });
  it("leaves modules changed only on the server alone", () => {
    const server = base({ progress: { "setup-name": { steps: [0] }, "setup-plan": { steps: [1] } } });
    const local = base({ progress: { "setup-name": { steps: [0, 3] } }, dirty: { profile: false, modules: ["setup-name"] } });
    const merged = mergeState(server, local);
    expect(merged.progress["setup-plan"]).toEqual({ steps: [1] });
    expect(merged.dirty?.modules).toEqual(["setup-name"]);
  });
  it("does not lose onboarding completion if either side completed it", () => {
    expect(mergeState(base({ completed: true }), base({ answers: { stage: "idea" }, completed: false, dirty: { profile: true, modules: [] } })).completed).toBe(true);
  });
  it("unions active days, keeps the latest 'last seen', and the local learning choice", () => {
    const server = base({ activity: { days: ["2026-10-01", "2026-10-03"], learning: true, lastSeen: "2026-10-03T09:00:00.000Z" } });
    const local = base({ activity: { days: ["2026-10-02", "2026-10-03"], learning: false, lastSeen: "2026-10-02T09:00:00.000Z" }, dirty: { profile: true, modules: [] } });
    expect(mergeState(server, local).activity).toEqual({ days: ["2026-10-01", "2026-10-02", "2026-10-03"], learning: false, lastSeen: "2026-10-03T09:00:00.000Z" });
  });
  it("keeps this device's hide / snooze choice for a step it changed, and the earliest 'opened'", () => {
    const server = base({ progress: { "setup-name": { steps: [], openedAt: "2026-10-05T08:00:00.000Z" } } });
    const local = base({
      progress: { "setup-name": { steps: [], openedAt: "2026-10-07T08:00:00.000Z", dismissed: true, snoozedUntil: "2026-10-20T00:00:00.000Z" } },
      dirty: { profile: false, modules: ["setup-name"] },
    });
    const p = mergeState(server, local).progress["setup-name"];
    expect(p.dismissed).toBe(true);
    expect(p.snoozedUntil).toBe("2026-10-20T00:00:00.000Z");
    expect(p.openedAt).toBe("2026-10-05T08:00:00.000Z");
  });
});
