import { DAY_KEY } from "../learning/time";
import { MODULES } from "./modules";
import { QUESTIONS } from "./questions";
import type { Answers } from "./types";

export interface Progress {
  /** Indices of the steps the person has ticked. */
  steps: number[];
  doneAt?: string;
  /** When they first opened the step. Used to learn how long steps take them. */
  openedAt?: string;
  /** "Not now": hidden until this time. */
  snoozedUntil?: string;
  /** "Not for me": hidden for good, until they restore it. */
  dismissed?: boolean;
}

/** The small amount of usage SPAL keeps. No event log: everything shown is worked out from this. */
export interface Activity {
  /** Local calendar days (YYYY-MM-DD) with a step action, newest last, at most 90. */
  days: string[];
  lastSeen?: string;
  /** Whether SPAL may adapt suggestions to how the person uses it. */
  learning: boolean;
}

/** What hasn't reached the server yet. Kept with the cache so a closed tab doesn't lose it. */
export interface Dirty {
  /** The profile row: answers, completed, and activity. */
  profile: boolean;
  modules: string[];
}

export interface StoredProfile {
  answers: Answers;
  completed: boolean;
  progress: Record<string, Progress>;
  activity: Activity;
  dirty?: Dirty;
}

export const EMPTY_ACTIVITY: Activity = { days: [], learning: true };
export const EMPTY: StoredProfile = { answers: {}, completed: false, progress: {}, activity: EMPTY_ACTIVITY };
export const MAX_DAYS = 90;

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
  const bn = typeof src.businessName === "string" ? src.businessName.trim().replace(/\s+/g, " ").slice(0, 60) : "";
  if (bn) out.businessName = bn;
  const line = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "");
  for (const [k, max] of [["about", 200], ["place", 100], ["hours", 100]] as const) {
    const v = line(src[k], max);
    if (v) out[k] = v;
  }
  const ig = line(src.instagram, 40).replace(/^@+/, "");
  if (/^[A-Za-z0-9._]{1,30}$/.test(ig)) out.instagram = ig;
  return out as Answers;
}

const isoOrUndefined = (v: unknown): string | undefined => (typeof v === "string" && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : undefined);

export function sanitizeProgress(raw: { steps?: unknown; doneAt?: unknown; openedAt?: unknown; snoozedUntil?: unknown; dismissed?: unknown }): Progress {
  const list = Array.isArray(raw.steps) ? raw.steps : [];
  const steps = [...new Set(list.filter((n): n is number => Number.isInteger(n) && n >= 0 && n <= MAX_STEP))].sort((a, b) => a - b);
  const out: Progress = { steps };
  const doneAt = isoOrUndefined(raw.doneAt);
  const openedAt = isoOrUndefined(raw.openedAt);
  const snoozedUntil = isoOrUndefined(raw.snoozedUntil);
  if (doneAt) out.doneAt = doneAt;
  if (openedAt) out.openedAt = openedAt;
  if (snoozedUntil) out.snoozedUntil = snoozedUntil;
  if (raw.dismissed === true) out.dismissed = true;
  return out;
}

const cleanDays = (v: unknown): string[] => {
  const list = Array.isArray(v) ? v : [];
  const ok = list.filter((d): d is string => typeof d === "string" && DAY_KEY.test(d) && !Number.isNaN(Date.parse(d)));
  return [...new Set(ok)].sort().slice(-MAX_DAYS);
};

export function sanitizeActivity(raw: unknown): Activity {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const lastSeen = isoOrUndefined(r.lastSeen);
  return { days: cleanDays(r.days), learning: r.learning !== false, ...(lastSeen ? { lastSeen } : {}) };
}

/** Validate a cached or remote blob into a StoredProfile. */
export function sanitizeStored(raw: unknown): StoredProfile {
  if (!raw || typeof raw !== "object") return EMPTY;
  const r = raw as Record<string, unknown>;
  const progress: Record<string, Progress> = {};
  if (r.progress && typeof r.progress === "object") {
    for (const [id, p] of Object.entries(r.progress as Record<string, object>)) {
      if (knownModules.has(id) && p && typeof p === "object") progress[id] = sanitizeProgress(p);
    }
  }
  // `answers` is the pre-learning name for the profile dirty flag; accept it so old caches still sync.
  const d = r.dirty as { profile?: unknown; answers?: unknown; modules?: unknown } | undefined;
  const dirty: Dirty | undefined =
    d && typeof d === "object"
      ? {
          profile: d.profile === true || d.answers === true,
          modules: Array.isArray(d.modules) ? d.modules.filter((m): m is string => typeof m === "string" && knownModules.has(m)) : [],
        }
      : undefined;
  const out: StoredProfile = { answers: sanitizeAnswers(r.answers), completed: r.completed === true, progress, activity: sanitizeActivity(r.activity) };
  return dirty && (dirty.profile || dirty.modules.length) ? { ...out, dirty } : out;
}

export const isDirty = (s: StoredProfile): boolean => Boolean(s.dirty && (s.dirty.profile || s.dirty.modules.length));

const earliest = (a?: string, b?: string) => (a && b ? (a < b ? a : b) : (a ?? b));
const latest = (a?: string, b?: string) => (a && b ? (a > b ? a : b) : (a ?? b));

/**
 * Combine the server's copy with local changes that never reached it (made offline, or just before closing).
 * No clocks decide who wins: the person's own local choices win; ticked steps and active days are unioned;
 * a finished step stays finished. Anything not changed locally comes straight from the server.
 * The result keeps the local dirty flags so the merged copy is pushed back.
 */
export function mergeState(server: StoredProfile, local: StoredProfile): StoredProfile {
  const dirty = local.dirty ?? { profile: false, modules: [] };
  const progress: Record<string, Progress> = { ...server.progress };
  for (const id of dirty.modules) {
    const l = local.progress[id];
    if (!l) continue;
    const s = server.progress[id];
    const doneAt = earliest(s?.doneAt, l.doneAt);
    const openedAt = earliest(s?.openedAt, l.openedAt);
    const merged: Progress = { steps: [...new Set([...(s?.steps ?? []), ...l.steps])].sort((a, b) => a - b) };
    if (doneAt) merged.doneAt = doneAt;
    if (openedAt) merged.openedAt = openedAt;
    // Hide / snooze are deliberate choices: this device's choice wins for a step it changed.
    if (l.snoozedUntil) merged.snoozedUntil = l.snoozedUntil;
    if (l.dismissed) merged.dismissed = true;
    progress[id] = merged;
  }
  const activity: Activity = dirty.profile
    ? {
        days: [...new Set([...server.activity.days, ...local.activity.days])].sort().slice(-MAX_DAYS),
        learning: local.activity.learning,
        ...(latest(server.activity.lastSeen, local.activity.lastSeen) ? { lastSeen: latest(server.activity.lastSeen, local.activity.lastSeen) } : {}),
      }
    : server.activity;
  return {
    answers: dirty.profile ? local.answers : server.answers,
    completed: dirty.profile ? local.completed || server.completed : server.completed,
    progress,
    activity,
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
