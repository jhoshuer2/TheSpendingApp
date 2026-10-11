import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { backend } from "../backend";
import type { RemoteStore } from "../backend/types";
import { useAuth } from "../lib/auth";
import { recommend } from "./recommend";
import { buildProfile } from "./scoring";
import { clearCache, EMPTY, isDirty, mergeState, readCache, writeCache, type Progress, type StoredProfile } from "./state";
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
  saveAnswers: (a: Answers) => void;
  completeOnboarding: () => void;
  toggleStep: (moduleId: string, index: number) => void;
  finishModule: (moduleId: string) => void;
  retry: () => void;
  /** Push anything unsent, then drop this person's cached data. Call before signing out. */
  prepareSignOut: () => Promise<void>;
}

const Ctx = createContext<ProfileApi | null>(null);

const FLUSH_DELAY_MS = 600;
const RETRY_MS = 20_000;
const REFRESH_AFTER_MS = 30_000;

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
          if (!d || (!d.answers && d.modules.length === 0)) break;
          setSync("saving");
          if (d.answers) {
            const sent = { answers: ref.current.answers, completed: ref.current.completed };
            await store.saveAnswers(sent.answers, sent.completed);
            const cur = ref.current;
            // Only mark clean if nothing changed while we were sending.
            if (same({ answers: cur.answers, completed: cur.completed }, sent) && cur.dirty) commit({ ...cur, dirty: { ...cur.dirty, answers: false } });
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
      const serverState: StoredProfile = server ? { answers: server.answers, completed: server.completed, progress: server.progress } : EMPTY;
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
    (fn: (s: StoredProfile) => StoredProfile, mark: { answers?: boolean; module?: string }) => {
      const cur = ref.current;
      let next = fn(cur);
      if (next === cur) return;
      if (remoteRef.current) {
        const d = cur.dirty ?? { answers: false, modules: [] };
        next = {
          ...next,
          dirty: {
            answers: d.answers || Boolean(mark.answers),
            modules: mark.module && !d.modules.includes(mark.module) ? [...d.modules, mark.module] : d.modules,
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

  const api = useMemo<ProfileApi>(() => {
    const profile = buildProfile(stored.answers);
    const done = new Set(Object.entries(stored.progress).filter(([, p]) => p.doneAt).map(([id]) => id));
    return {
      status,
      sync,
      stored,
      profile,
      done,
      recs: recommend(profile, stored.answers, done),
      saveAnswers: (answers) => mutate((s) => (same(s.answers, answers) ? s : { ...s, answers }), { answers: true }),
      completeOnboarding: () => mutate((s) => (s.completed ? s : { ...s, completed: true }), { answers: true }),
      toggleStep: (id, i) =>
        mutate(
          (s) => {
            const cur = s.progress[id] ?? { steps: [] };
            if (cur.doneAt) return s;
            const steps = cur.steps.includes(i) ? cur.steps.filter((x) => x !== i) : [...cur.steps, i].sort((a, b) => a - b);
            return { ...s, progress: { ...s.progress, [id]: { ...cur, steps } } };
          },
          { module: id },
        ),
      finishModule: (id) =>
        mutate((s) => ({ ...s, progress: { ...s.progress, [id]: { ...(s.progress[id] ?? { steps: [] }), doneAt: new Date().toISOString() } } }), { module: id }),
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
  }, [stored, status, sync, mutate, reconcile, flush]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProfile(): ProfileApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useProfile must be used inside ProfileProvider");
  return v;
}
