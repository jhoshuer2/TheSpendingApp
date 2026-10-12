import type { AuthError, SupabaseClient, User } from "@supabase/supabase-js";
import { MODULES } from "../profile/modules";
import { sanitizeActivity, sanitizeAnswers, sanitizeProgress } from "../profile/state";
import type { AuthApi, AuthResult, Backend, RemoteProfile, RemoteStore, Session } from "./types";

const knownModules = new Set(MODULES.map((m) => m.id));

/** Turn a Supabase error into something a person can act on. Never show raw server text. */
export function friendlyAuthError(e: Pick<AuthError, "message"> & { code?: string; status?: number; name?: string }): string {
  const text = `${e.code ?? ""} ${e.message ?? ""}`.toLowerCase();
  if (text.includes("invalid login") || text.includes("invalid_credentials")) return "That email and password don't match.";
  if (text.includes("already") && (text.includes("registered") || text.includes("exists"))) return "There's already an account with that email. Try logging in.";
  if (text.includes("email_not_confirmed") || text.includes("not confirmed")) return "Confirm your email first. Check your inbox for the link.";
  if (text.includes("same_password") || text.includes("different from the old")) return "Choose a password you haven't used before.";
  if (text.includes("weak_password") || text.includes("password should")) return "Choose a stronger password.";
  if (text.includes("rate") || e.status === 429) return "Too many tries. Wait a minute and try again.";
  if (e.name === "AuthRetryableFetchError" || e.status === 0 || text.includes("fetch") || text.includes("network")) return "Couldn't reach the server. Check your connection and try again.";
  return "Something went wrong. Please try again.";
}

const toSession = (u: User | null | undefined): Session | null =>
  u?.email ? { id: u.id, email: u.email, name: String(u.user_metadata?.name ?? "").trim() || u.email.split("@")[0] } : null;

const fail = (e: unknown): AuthResult => ({
  ok: false,
  message: friendlyAuthError(e && typeof e === "object" ? (e as AuthError) : { message: String(e) }),
});

export function createAuth(client: SupabaseClient, redirectBase: string): AuthApi {
  const { auth } = client;
  return {
    mode: "supabase",
    async getSession() {
      const { data } = await auth.getSession();
      return toSession(data.session?.user);
    },
    onChange(cb) {
      const { data } = auth.onAuthStateChange((event, session) => cb(toSession(session?.user), event === "PASSWORD_RECOVERY" ? "recovery" : undefined));
      return () => data.subscription.unsubscribe();
    },
    async signUp({ name, email, password }) {
      try {
        const { data, error } = await auth.signUp({ email, password, options: { data: { name } } });
        if (error) return fail(error);
        // With email confirmation on, a duplicate signup returns a fake user with no identities instead of an error.
        if (data.user && (data.user.identities?.length ?? 1) === 0) return fail({ message: "User already registered" });
        return { ok: true, needsConfirmation: !data.session };
      } catch (e) {
        return fail(e);
      }
    },
    async signIn({ email, password }) {
      try {
        const { error } = await auth.signInWithPassword({ email, password });
        return error ? fail(error) : { ok: true };
      } catch (e) {
        return fail(e);
      }
    },
    async signOut() {
      try {
        await auth.signOut();
      } catch {
        /* offline: the local session is cleared anyway on the next load */
      }
    },
    async requestReset(email) {
      try {
        const { error } = await auth.resetPasswordForEmail(email, { redirectTo: `${redirectBase}/reset-password` });
        return error ? fail(error) : { ok: true };
      } catch (e) {
        return fail(e);
      }
    },
    async updatePassword(password) {
      try {
        const { error } = await auth.updateUser({ password });
        return error ? fail(error) : { ok: true };
      } catch (e) {
        return fail(e);
      }
    },
  };
}

export function createStore(client: SupabaseClient, userId: string): RemoteStore {
  return {
    async load() {
      const [profile, progress] = await Promise.all([
        client.from("profiles").select("answers, completed, learning, active_days, last_seen").eq("id", userId).maybeSingle(),
        client.from("step_progress").select("module_id, steps, done_at, opened_at, snoozed_until, dismissed").eq("user_id", userId),
      ]);
      if (profile.error) throw profile.error;
      if (progress.error) throw progress.error;
      if (!profile.data) return null;
      const byModule: RemoteProfile["progress"] = {};
      for (const r of progress.data ?? []) {
        if (knownModules.has(r.module_id)) {
          byModule[r.module_id] = sanitizeProgress({ steps: r.steps, doneAt: r.done_at, openedAt: r.opened_at, snoozedUntil: r.snoozed_until, dismissed: r.dismissed });
        }
      }
      return {
        answers: sanitizeAnswers(profile.data.answers),
        completed: profile.data.completed === true,
        activity: sanitizeActivity({ days: profile.data.active_days, lastSeen: profile.data.last_seen, learning: profile.data.learning }),
        progress: byModule,
      };
    },
    async saveProfile({ answers, completed, activity }) {
      const { error } = await client
        .from("profiles")
        .upsert({ id: userId, answers, completed, learning: activity.learning, active_days: activity.days, last_seen: activity.lastSeen ?? null });
      if (error) throw error;
    },
    async saveProgress(moduleId, p) {
      const { error } = await client.from("step_progress").upsert(
        {
          user_id: userId,
          module_id: moduleId,
          steps: p.steps,
          done_at: p.doneAt ?? null,
          opened_at: p.openedAt ?? null,
          snoozed_until: p.snoozedUntil ?? null,
          dismissed: p.dismissed === true,
        },
        { onConflict: "user_id,module_id" },
      );
      if (error) throw error;
    },
  };
}

export const createSupabaseBackend = (client: SupabaseClient, redirectBase: string): Backend => ({
  auth: createAuth(client, redirectBase),
  storeFor: (userId) => createStore(client, userId),
});
