import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "../lib/auth";
import { recommend } from "./recommend";
import { buildProfile } from "./scoring";
import type { Answers, Profile } from "./types";

export interface Progress {
  /** Indices of the steps the person has ticked. */
  steps: number[];
  doneAt?: string;
}

export interface StoredProfile {
  answers: Answers;
  completed: boolean;
  progress: Record<string, Progress>;
}

const EMPTY: StoredProfile = { answers: {}, completed: false, progress: {} };
const keyFor = (email: string) => `spal.profile.v1:${email}`;

function read(email: string): StoredProfile {
  try {
    const raw = localStorage.getItem(keyFor(email));
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<StoredProfile>) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function write(email: string, s: StoredProfile) {
  try {
    localStorage.setItem(keyFor(email), JSON.stringify(s));
  } catch {
    /* storage unavailable: progress lasts for this visit only */
  }
}

interface ProfileApi {
  stored: StoredProfile;
  profile: Profile;
  done: ReadonlySet<string>;
  recs: ReturnType<typeof recommend>;
  saveAnswers: (a: Answers) => void;
  completeOnboarding: () => void;
  toggleStep: (moduleId: string, index: number) => void;
  finishModule: (moduleId: string) => void;
}

const Ctx = createContext<ProfileApi | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const email = session?.email ?? "";
  // Re-read when the signed-in person changes, so accounts never see each other's data.
  const [loaded, setLoaded] = useState(() => ({ email, state: read(email) }));
  const stored = loaded.email === email ? loaded.state : read(email);
  if (loaded.email !== email) setLoaded({ email, state: stored });

  const update = useCallback(
    (fn: (s: StoredProfile) => StoredProfile) => {
      setLoaded((cur) => {
        const next = fn(cur.state);
        if (email) write(email, next);
        return { email, state: next };
      });
    },
    [email],
  );

  const api = useMemo<ProfileApi>(() => {
    const profile = buildProfile(stored.answers);
    const done = new Set(Object.entries(stored.progress).filter(([, p]) => p.doneAt).map(([id]) => id));
    return {
      stored,
      profile,
      done,
      recs: recommend(profile, stored.answers, done),
      saveAnswers: (answers) => update((s) => ({ ...s, answers })),
      completeOnboarding: () => update((s) => ({ ...s, completed: true })),
      toggleStep: (id, i) =>
        update((s) => {
          const cur = s.progress[id] ?? { steps: [] };
          if (cur.doneAt) return s;
          const steps = cur.steps.includes(i) ? cur.steps.filter((x) => x !== i) : [...cur.steps, i].sort((a, b) => a - b);
          return { ...s, progress: { ...s.progress, [id]: { ...cur, steps } } };
        }),
      finishModule: (id) =>
        update((s) => ({ ...s, progress: { ...s.progress, [id]: { ...(s.progress[id] ?? { steps: [] }), doneAt: new Date().toISOString() } } })),
    };
  }, [stored, update]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProfile(): ProfileApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useProfile must be used inside ProfileProvider");
  return v;
}
