import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { backend } from "../backend";
import { computeInsights, welcomeBack, type Insights, type WelcomeBack } from "../learning/insights";
import { dayKey, DAY_MS } from "../learning/time";
import type { RemoteStore } from "../backend/types";
import { useAuth } from "../lib/auth";
import { recommend } from "./recommend";
import { buildProfile } from "./scoring";
import { clearCache, EMPTY, isDirty, MAX_DAYS, mergeState, readCache, writeCache, type Progress, type StoredProfile } from "./state";
import type { Answers, Profile } from "./types";

export type { Progress, StoredProfile };

/** loading: first load with nothing cached. error: couldn't load and can't safely start empty. */
export type LoadStatus = "loading" | "ready" | "error";
/** idle: everything saved. saving: sending. offline: changes waiting for a connection. */
export type SyncStatus = "idle" | "saving" | "offline";

interface ProfileApi {
  status: LoadStatus;
  sync: SyncStatus;
  stored: StoredProfile;
  profile: Profile;
  done: ReadonlySet<string>;
  recs: ReturnType<typeof recommend>;
  insights: Insights;
  /** Set after a few days away, once per visit. */
  welcome: WelcomeBack | null;
  saveAnswers: (a: Answers) => void;
  completeOnboarding: () => void;
  /** Called when a step is opened: remembers when, and counts the day as active. */
  openModule: (moduleId: string) => void;
  /** Count today as an active day (used when the person records a sale or an expense). */
  markActive: () => void;
  /** Tick steps that completed themselves (for example "record a first sale"). Never un-ticks anything. */
  applyAuto: (moduleId: string, indices: number[]) => void;
  toggleStep: (moduleId: string, index: number) => void;
  finishModule: (moduleId: string) => void;
  /** "Not now": hide for a week. */
  snooze: (moduleId: string) => void;
  /** "Not for me": hide for good. */
  dismiss: (moduleId: string) => void;
  /** Bring a hidden or snoozed step back. */
  restore: (moduleId: string) => void;
  setLearning: (on: boolean) => void;
  /** Forget what SPAL has noticed (active days, when steps were opened). Finished steps and hidden steps are kept. */
  resetLearning: () => void;
  retry: () => void;
  /** Push anything unsent, then drop this person's cached data. Call before signing out. */
  prepareSignOut: () => Promise<void>;
}

const Ctx = createContext<ProfileApi | null>(null);

const FLUSH_DELAY_MS = 600;
const RETRY_MS = 20_000;
const REFRESH_AFTER_MS = 30_000;
const SEEN_EVERY_MS = 30 * 60_000;
const SNOOZE_DAYS = 7;

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * The person's profile and progress. The screen always reads a local copy (instant, works offline);
 * changes are saved to the server in the background and retried until they get through.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.id ?? null;

  const [stored, setStored] = useState<StoredProfile>(EMPTY);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [sync, setSync] = useState<SyncStatus>("idle");

  const ref = useRef<StoredProfile>(EMPTY);
  const idRef = useRef<string | null>(null);
  const remoteRef = useRef<RemoteStore | null>(null);
  const flushing = useRef<Promise<void> | null>(null);
  const flushTimer = useRef<number>();
  const retryTimer = useRef<number>();
  const loadSeq = useRef(0);
  const hadCache = useRef(false);
  const lastLoad = useRef(0);

  const commit = useCallback((next: StoredProfile) => {
    ref.current = next;
    setStored(next);
    if (idRef.current) writeCache(idRef.current, next);
  }, []);

  const flush = useCallback((): Promise<void> => {
    if (flushing.current) return flushing.current;
    const run = async () => {
      const store = remoteRef.current;
      if (!store) return;
      window.clearTimeout(retryTimer.current);
      try {
        for (;;) {
          const d = ref.current.dirty;
          if (!d || (!d.profile && d.modules.length === 0)) break;
          setSync("saving");
          if (d.profile) {
            const sent = { answers: ref.current.answers, completed: ref.current.completed, activity: ref.current.activity };
            await store.saveProfile(sent);
            const cur = ref.current;
            // Only mark clean if nothing changed while we were sending.
            if (same({ answers: cur.answers, completed: cur.completed, activity: cur.activity }, sent) && cur.dirty) commit({ ...cur, dirty: { ...cur.dirty, profile: false } });
          } else {
            const id = d.modules[0];
            const sent = ref.current.progress[id] ?? { steps: [] };
            await store.saveProgress(id, sent);
            const cur = ref.current;
            if (same(cur.progress[id] ?? { steps: [] }, sent) && cur.dirty) commit({ ...cur, dirty: { ...cur.dirty, modules: cur.dirty.modules.filter((m) => m !== id) } });
          }
        }
        setSync("idle");
      } catch {
        setSync("offline");
        retryTimer.current = window.setTimeout(() => void flush(), RETRY_MS);
      }
    };
    flushing.current = run().finally(() => {
      flushing.current = null;
    });
    return flushing.current;
  }, [commit]);

  const reconcile = useCallback(async () => {
    const store = remoteRef.current;
    const seq = ++loadSeq.current;
    if (!store) return;
    try {
      const server = await store.load();
      if (seq !== loadSeq.current) return; // someone else signed in meanwhile
      lastLoad.current = Date.now();
      const serverState: StoredProfile = server ? { answers: server.answers, completed: server.completed, progress: server.progress, activity: server.activity } : EMPTY;
      const local = ref.current;
      const merged = isDirty(local) ? mergeState(serverState, local) : serverState;
      commit(merged);
      setStatus("ready");
      if (isDirty(merged)) void flush();
    } catch {
      if (seq !== loadSeq.current) return;
      // With nothing cached we can't tell "new account" from "server unreachable". Don't guess, or we could overwrite real data.
      if (!hadCache.current) setStatus("error");
      else setSync(isDirty(ref.current) ? "offline" : "idle");
    }
  }, [commit, flush]);

  // Load whoever is signed in: cache first (instant), then the server.
  useEffect(() => {
    window.clearTimeout(flushTimer.current);
    window.clearTimeout(retryTimer.current);
    loadSeq.current++;
    idRef.current = userId;
    remoteRef.current = userId ? backend.storeFor(userId) : null;
    if (!userId) {
      ref.current = EMPTY;
      setStored(EMPTY);
      setStatus("loading");
      setSync("idle");
      return;
    }
    const cached = readCache(userId);
    hadCache.current = cached !== null;
    ref.current = cached ?? EMPTY;
    setStored(ref.current);
    setSync("idle");
    if (!remoteRef.current) {
      setStatus("ready");
      return;
    }
    setStatus(cached ? "ready" : "loading");
    void reconcile();
  }, [userId, reconcile]);

  // Come back online, or return to the app: send anything waiting, and pick up changes from other devices.
  useEffect(() => {
    const wake = () => {
      if (!remoteRef.current) return;
      if (isDirty(ref.current)) void flush();
      else if (document.visibilityState === "visible" && Date.now() - lastLoad.current > REFRESH_AFTER_MS) void reconcile();
    };
    window.addEventListener("online", wake);
    document.addEventListener("visibilitychange", wake);
    return () => {
      window.removeEventListener("online", wake);
      document.removeEventListener("visibilitychange", wake);
      window.clearTimeout(flushTimer.current);
      window.clearTimeout(retryTimer.current);
    };
  }, [flush, reconcile]);

  const mutate = useCallback(
    (fn: (s: StoredProfile) => StoredProfile, mark: { profile?: boolean; module?: string | string[] } = {}) => {
      const cur = ref.current;
      let next = fn(cur);
      if (next === cur) return;
      if (remoteRef.current) {
        const d = cur.dirty ?? { profile: false, modules: [] };
        const touched = mark.module === undefined ? [] : Array.isArray(mark.module) ? mark.module : [mark.module];
        next = {
          ...next,
          dirty: {
            // Activity lives on the profile row, so changing it dirties the profile too.
            profile: d.profile || Boolean(mark.profile) || next.activity !== cur.activity,
            modules: [...d.modules, ...touched.filter((m) => !d.modules.includes(m))],
          },
        };
      }
      commit(next);
      if (remoteRef.current) {
        window.clearTimeout(flushTimer.current);
        flushTimer.current = window.setTimeout(() => void flush(), FLUSH_DELAY_MS);
      }
    },
    [commit, flush],
  );

  const [returnedFrom, setReturnedFrom] = useState<string | undefined>();
  const seenFor = useRef<string | null>(null);

  // Once per visit, when the person's data is ready: note where they were, then note that they're here now.
  useEffect(() => {
    if (status !== "ready" || !userId || seenFor.current === userId) return;
    seenFor.current = userId;
    const act = ref.current.activity;
    setReturnedFrom(act.lastSeen);
    if (act.learning && (!act.lastSeen || Date.now() - Date.parse(act.lastSeen) > SEEN_EVERY_MS)) {
      mutate((s) => ({ ...s, activity: { ...s.activity, lastSeen: new Date().toISOString() } }));
    }
  }, [status, userId, mutate]);
  useEffect(() => {
    if (!userId) seenFor.current = null;
  }, [userId]);

  const api = useMemo<ProfileApi>(() => {
    const profile = buildProfile(stored.answers);
    const done = new Set(Object.entries(stored.progress).filter(([, p]) => p.doneAt).map(([id]) => id));
    const now = new Date();
    const learning = stored.activity.learning;

    /** Count today as an active day (only when learning is on). Returns the same object if nothing changes. */
    const withToday = (s: StoredProfile): StoredProfile => {
      if (!s.activity.learning) return s;
      const key = dayKey(new Date());
      if (s.activity.days.includes(key)) return s;
      return { ...s, activity: { ...s.activity, days: [...s.activity.days, key].sort().slice(-MAX_DAYS) } };
    };
    const edit = (s: StoredProfile, id: string, fn: (p: Progress) => Progress): StoredProfile => ({ ...s, progress: { ...s.progress, [id]: fn(s.progress[id] ?? { steps: [] }) } });
    const strip = (p: Progress, ...keys: (keyof Progress)[]): Progress => {
      const copy = { ...p };
      for (const k of keys) delete copy[k];
      return copy;
    };

    return {
      status,
      sync,
      stored,
      profile,
      done,
      recs: recommend(profile, stored.answers, done, { progress: stored.progress, now, learning }),
      insights: computeInsights(stored, profile, now),
      welcome: welcomeBack(returnedFrom, stored, now),
      saveAnswers: (answers) => mutate((s) => (same(s.answers, answers) ? s : { ...s, answers }), { profile: true }),
      completeOnboarding: () => mutate((s) => (s.completed ? s : { ...s, completed: true }), { profile: true }),
      openModule: (id) =>
        mutate(
          (s) => {
            const cur = s.progress[id];
            const stamp = s.activity.learning && !cur?.openedAt && !cur?.doneAt ? new Date().toISOString() : undefined;
            const base = stamp ? edit(s, id, (p) => ({ ...p, openedAt: stamp })) : s;
            return withToday(base);
          },
          { module: id },
        ),
      markActive: () => mutate((s) => withToday(s)),
      applyAuto: (id, indices) =>
        mutate(
          (s) => {
            const cur = s.progress[id] ?? { steps: [] };
            if (cur.doneAt) return s;
            const steps = [...new Set([...cur.steps, ...indices])].sort((a, b) => a - b);
            return steps.length === cur.steps.length ? s : edit(s, id, (p) => ({ ...p, steps }));
          },
          { module: id },
        ),
      toggleStep: (id, i) =>
        mutate(
          (s) => {
            const cur = s.progress[id] ?? { steps: [] };
            if (cur.doneAt) return s;
            const steps = cur.steps.includes(i) ? cur.steps.filter((x) => x !== i) : [...cur.steps, i].sort((a, b) => a - b);
            return withToday(edit(s, id, (p) => ({ ...p, steps })));
          },
          { module: id },
        ),
      finishModule: (id) => mutate((s) => withToday(edit(s, id, (p) => ({ ...p, doneAt: new Date().toISOString() }))), { module: id }),
      snooze: (id) => mutate((s) => edit(s, id, (p) => ({ ...p, snoozedUntil: new Date(Date.now() + SNOOZE_DAYS * DAY_MS).toISOString() })), { module: id }),
      dismiss: (id) => mutate((s) => edit(s, id, (p) => ({ ...strip(p, "snoozedUntil"), dismissed: true })), { module: id }),
      restore: (id) => mutate((s) => edit(s, id, (p) => strip(p, "snoozedUntil", "dismissed")), { module: id }),
      setLearning: (on) => mutate((s) => (s.activity.learning === on ? s : { ...s, activity: { ...s.activity, learning: on } }), { profile: true }),
      resetLearning: () =>
        mutate(
          (s) => {
            const withOpened = Object.entries(s.progress).filter(([, p]) => p.openedAt).map(([id]) => id);
            let next: StoredProfile = { ...s, activity: { days: [], learning: s.activity.learning } };
            for (const id of withOpened) next = edit(next, id, (p) => strip(p, "openedAt"));
            return next;
          },
          { profile: true, module: Object.entries(stored.progress).filter(([, p]) => p.openedAt).map(([id]) => id) },
        ),
      retry: () => {
        setStatus("loading");
        void reconcile();
      },
      prepareSignOut: async () => {
        window.clearTimeout(flushTimer.current);
        await flush();
        // Drop the cached copy only when everything reached the server; otherwise keep it so it syncs next sign-in.
        if (remoteRef.current && idRef.current && !isDirty(ref.current)) clearCache(idRef.current);
      },
    };
  }, [stored, status, sync, mutate, reconcile, flush, returnedFrom]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProfile(): ProfileApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useProfile must be used inside ProfileProvider");
  return v;
}
