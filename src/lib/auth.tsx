import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { backend, type AuthResult, type Session } from "../backend";

export type { Session };

export interface AuthContextValue {
  /** "loading" until we know whether someone is signed in. */
  status: "loading" | "ready";
  session: Session | null;
  /** "local" means demo mode: no real accounts, data stays in this browser. */
  mode: "supabase" | "local";
  signUp: (i: { name: string; email: string; password: string }) => Promise<AuthResult>;
  signIn: (i: { email: string; password: string }) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  requestReset: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  useEffect(() => {
    let alive = true;
    const apply = (s: Session | null) => {
      if (!alive) return;
      setSession(s);
      setStatus("ready");
    };
    const off = backend.auth.onChange((s) => apply(s));
    backend.auth.getSession().then(apply, () => apply(null));
    return () => {
      alive = false;
      off();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const a = backend.auth;
    return {
      status,
      session,
      mode: a.mode,
      signUp: (i) => a.signUp(i),
      signIn: (i) => a.signIn(i),
      signOut: () => a.signOut(),
      requestReset: (e) => a.requestReset(e),
      updatePassword: (p) => a.updatePassword(p),
    };
  }, [status, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const v = useContext(AuthContext);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
