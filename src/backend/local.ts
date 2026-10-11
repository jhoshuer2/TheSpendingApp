import type { AuthApi, AuthResult, Backend, Session } from "./types";

const KEY = "spal.session";
const listeners = new Set<(s: Session | null) => void>();

function read(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<Session>;
    if (!s.email || !s.name) return null;
    return { id: s.id ?? s.email, name: s.name, email: s.email };
  } catch {
    return null;
  }
}

function write(s: Session | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable (private mode): the session lasts for this page only */
  }
  listeners.forEach((cb) => cb(s));
}

const DEMO_ONLY: AuthResult = { ok: false, message: "Password reset isn't available in demo mode." };

/**
 * Demo mode, used when no Supabase project is configured. It verifies nothing and stores nothing
 * on a server, so the app can be built and tested without a backend. The UI says so.
 */
export const localAuth: AuthApi = {
  mode: "local",
  getSession: async () => read(),
  onChange(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  async signUp({ name, email }) {
    write({ id: email, name, email });
    return { ok: true };
  },
  async signIn({ email }) {
    write({ id: email, name: email.split("@")[0], email });
    return { ok: true };
  },
  async signOut() {
    write(null);
  },
  requestReset: async () => DEMO_ONLY,
  updatePassword: async () => DEMO_ONLY,
};

export const localBackend: Backend = { auth: localAuth, storeFor: () => null };
