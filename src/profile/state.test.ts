import { describe, expect, it } from "vitest";
import { EMPTY, isDirty, mergeState, sanitizeAnswers, sanitizeProgress, sanitizeStored, type StoredProfile } from "./state";

const base = (over: Partial<StoredProfile> = {}): StoredProfile => ({ answers: {}, completed: false, progress: {}, ...over });

describe("sanitize", () => {
  it("drops answers the app doesn't understand", () => {
    const a = sanitizeAnswers({ stage: "idea", goal: "world-domination", team: 5, have: ["logo", "nope", "logo"], extra: "x" });
    expect(a).toEqual({ stage: "idea", have: ["logo"] });
  });
  it("copes with junk input", () => {
    expect(sanitizeAnswers(null)).toEqual({});
    expect(sanitizeAnswers([])).toEqual({});
    expect(sanitizeAnswers("hi")).toEqual({});
    expect(sanitizeStored(undefined)).toEqual(EMPTY);
    expect(sanitizeStored("x")).toEqual(EMPTY);
  });
  it("keeps only valid, sorted, unique steps and a real date", () => {
    expect(sanitizeProgress([3, 1, 1, -1, 99, 2.5, "x"], "2026-10-11T10:00:00Z")).toEqual({ steps: [1, 3], doneAt: "2026-10-11T10:00:00.000Z" });
    expect(sanitizeProgress("nope", "not a date")).toEqual({ steps: [] });
  });
  it("ignores progress for steps that no longer exist", () => {
    const s = sanitizeStored({ progress: { "setup-name": { steps: [0] }, "deleted-module": { steps: [0] } } });
    expect(Object.keys(s.progress)).toEqual(["setup-name"]);
  });
  it("round-trips a valid cache including unsynced flags", () => {
    const s: StoredProfile = base({ answers: { stage: "idea" }, completed: true, progress: { "setup-name": { steps: [0, 1] } }, dirty: { answers: true, modules: ["setup-name"] } });
    expect(sanitizeStored(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
  it("drops an empty dirty marker", () => {
    expect(sanitizeStored({ dirty: { answers: false, modules: [] } }).dirty).toBeUndefined();
  });
});

describe("mergeState", () => {
  it("takes the server copy when nothing changed locally", () => {
    const server = base({ answers: { stage: "y1to3" }, completed: true, progress: { "setup-name": { steps: [0, 1] } } });
    const local = base({ answers: { stage: "idea" }, progress: { "setup-name": { steps: [0] } } });
    const merged = mergeState(server, local);
    expect(merged.answers).toEqual({ stage: "y1to3" });
    expect(merged.progress["setup-name"].steps).toEqual([0, 1]);
    expect(isDirty(merged)).toBe(false);
  });
  it("keeps local answers that were changed offline, and stays dirty so they get pushed", () => {
    const server = base({ answers: { stage: "idea" }, completed: true });
    const local = base({ answers: { stage: "y3plus" }, completed: true, dirty: { answers: true, modules: [] } });
    const merged = mergeState(server, local);
    expect(merged.answers.stage).toBe("y3plus");
    expect(merged.dirty).toEqual({ answers: true, modules: [] });
  });
  it("unions ticked steps for a step changed on two devices", () => {
    const server = base({ progress: { "setup-name": { steps: [0, 2] } } });
    const local = base({ progress: { "setup-name": { steps: [1] } }, dirty: { answers: false, modules: ["setup-name"] } });
    expect(mergeState(server, local).progress["setup-name"].steps).toEqual([0, 1, 2]);
  });
  it("never un-finishes a finished step, and keeps the earliest finish time", () => {
    const server = base({ progress: { "setup-name": { steps: [0, 1, 2, 3], doneAt: "2026-10-10T08:00:00.000Z" } } });
    const local = base({ progress: { "setup-name": { steps: [0], doneAt: "2026-10-11T08:00:00.000Z" } }, dirty: { answers: false, modules: ["setup-name"] } });
    expect(mergeState(server, local).progress["setup-name"].doneAt).toBe("2026-10-10T08:00:00.000Z");
    const localOnly = base({ progress: { "money-profit": { steps: [0, 1, 2, 3], doneAt: "2026-10-11T08:00:00.000Z" } }, dirty: { answers: false, modules: ["money-profit"] } });
    expect(mergeState(base(), localOnly).progress["money-profit"].doneAt).toBe("2026-10-11T08:00:00.000Z");
  });
  it("leaves modules changed only on the server alone", () => {
    const server = base({ progress: { "setup-name": { steps: [0] }, "setup-plan": { steps: [1] } } });
    const local = base({ progress: { "setup-name": { steps: [0, 3] } }, dirty: { answers: false, modules: ["setup-name"] } });
    const merged = mergeState(server, local);
    expect(merged.progress["setup-plan"]).toEqual({ steps: [1] });
    expect(merged.dirty?.modules).toEqual(["setup-name"]);
  });
  it("does not lose onboarding completion if either side completed it", () => {
    const merged = mergeState(base({ completed: true }), base({ answers: { stage: "idea" }, completed: false, dirty: { answers: true, modules: [] } }));
    expect(merged.completed).toBe(true);
  });
});
