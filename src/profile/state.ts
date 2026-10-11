import { MODULES } from "./modules";
import { QUESTIONS } from "./questions";
import type { Answers } from "./types";

export interface Progress {
  /** Indices of the steps the person has ticked. */
  steps: number[];
  doneAt?: string;
}

/** What hasn't reached the server yet. Kept with the cache so a closed tab doesn't lose it. */
export interface Dirty {
  answers: boolean;
  modules: string[];
}

export interface StoredProfile {
  answers: Answers;
  completed: boolean;
  progress: Record<string, Progress>;
  dirty?: Dirty;
}

export const EMPTY: StoredProfile = { answers: {}, completed: false, progress: {} };

const MAX_STEP = 19;
const knownModules = new Set(MODULES.map((m) => m.id));

/** Keep only values the app understands, so bad or old data can never crash the UI. */
export function sanitizeAnswers(raw: unknown): Answers {
  const src = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const out: Record<string, unknown> = {};
  for (const q of QUESTIONS) {
    const allowed = new Set(q.options.map((o) => o.value));
    const v = src[q.id];
    if (q.multi) {
      if (Array.isArray(v)) out[q.id] = [...new Set(v.filter((x): x is string => typeof x === "string" && allowed.has(x)))];
    } else if (typeof v === "string" && allowed.has(v)) out[q.id] = v;
  }
  return out as Answers;
}

export function sanitizeProgress(steps: unknown, doneAt: unknown): Progress {
  const list = Array.isArray(steps) ? steps : [];
  const clean = [...new Set(list.filter((n): n is number => Number.isInteger(n) && n >= 0 && n <= MAX_STEP))].sort((a, b) => a - b);
  const done = typeof doneAt === "string" && !Number.isNaN(Date.parse(doneAt)) ? new Date(doneAt).toISOString() : undefined;
  return done ? { steps: clean, doneAt: done } : { steps: clean };
}

/** Validate a cached or remote blob into a StoredProfile. */
export function sanitizeStored(raw: unknown): StoredProfile {
  if (!raw || typeof raw !== "object") return EMPTY;
  const r = raw as Record<string, unknown>;
  const progress: Record<string, Progress> = {};
  if (r.progress && typeof r.progress === "object") {
    for (const [id, p] of Object.entries(r.progress as Record<string, { steps?: unknown; doneAt?: unknown }>)) {
      if (knownModules.has(id) && p && typeof p === "object") progress[id] = sanitizeProgress(p.steps, p.doneAt);
    }
  }
  const d = r.dirty as Partial<Dirty> | undefined;
  const dirty: Dirty | undefined = d && typeof d === "object"
    ? { answers: d.answers === true, modules: Array.isArray(d.modules) ? d.modules.filter((m): m is string => typeof m === "string" && knownModules.has(m)) : [] }
    : undefined;
  const out: StoredProfile = { answers: sanitizeAnswers(r.answers), completed: r.completed === true, progress };
  return dirty && (dirty.answers || dirty.modules.length) ? { ...out, dirty } : out;
}

export const isDirty = (s: StoredProfile): boolean => Boolean(s.dirty && (s.dirty.answers || s.dirty.modules.length));

const earliest = (a?: string, b?: string) => (a && b ? (a < b ? a : b) : (a ?? b));

/**
 * Combine the server's copy with local changes that never reached it (made offline, or just before closing).
 * No clocks involved: the person's local answers win; ticked steps are unioned; a finished step stays finished.
 * Anything not changed locally comes straight from the server. The result keeps the local dirty flags
 * so the merged result is pushed back.
 */
export function mergeState(server: StoredProfile, local: StoredProfile): StoredProfile {
  const dirty = local.dirty ?? { answers: false, modules: [] };
  const progress: Record<string, Progress> = { ...server.progress };
  for (const id of dirty.modules) {
    const l = local.progress[id];
    if (!l) continue;
    const s = server.progress[id];
    const doneAt = earliest(s?.doneAt, l.doneAt);
    const steps = [...new Set([...(s?.steps ?? []), ...l.steps])].sort((a, b) => a - b);
    progress[id] = doneAt ? { steps, doneAt } : { steps };
  }
  return {
    answers: dirty.answers ? local.answers : server.answers,
    completed: dirty.answers ? local.completed || server.completed : server.completed,
    progress,
    ...(isDirty(local) ? { dirty } : {}),
  };
}

const cacheKey = (userId: string) => `spal.profile.v1:${userId}`;

export function readCache(userId: string): StoredProfile | null {
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    return raw ? sanitizeStored(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function writeCache(userId: string, s: StoredProfile): void {
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify(s));
  } catch {
    /* storage unavailable: data lasts for this visit only (and the server copy, when online) */
  }
}

export function clearCache(userId: string): void {
  try {
    localStorage.removeItem(cacheKey(userId));
  } catch {
    /* nothing to clear */
  }
}
