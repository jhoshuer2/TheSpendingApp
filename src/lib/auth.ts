/**
 * PLACEHOLDER AUTH (Stage 1). Stores a session in localStorage so the flow can be built and tested.
 * It does NOT verify credentials and holds no password. Replace with the real backend in the auth stage.
 */
import { createContext, useContext } from "react";

export interface Session {
  name: string;
  email: string;
}

const KEY = "spal.session";

export function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function writeSession(s: Session | null): void {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable (private mode): session lasts for this page only */
  }
}

export interface AuthContextValue {
  session: Session | null;
  signIn: (s: Session) => void;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  session: null,
  signIn: () => {},
  signOut: () => {},
});

export const useAuth = () => useContext(AuthContext);
