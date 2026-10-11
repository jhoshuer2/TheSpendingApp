import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { createAuth, createStore, friendlyAuthError } from "./supabase";

describe("friendlyAuthError", () => {
  const cases: [Parameters<typeof friendlyAuthError>[0], string][] = [
    [{ message: "Invalid login credentials", code: "invalid_credentials", status: 400 }, "That email and password don't match."],
    [{ message: "User already registered", code: "user_already_exists" }, "There's already an account with that email. Try logging in."],
    [{ message: "Email not confirmed", code: "email_not_confirmed" }, "Confirm your email first. Check your inbox for the link."],
    [{ message: "Password should be at least 6 characters", code: "weak_password" }, "Choose a stronger password."],
    [{ message: "email rate limit exceeded", code: "over_email_send_rate_limit", status: 429 }, "Too many tries. Wait a minute and try again."],
    [{ message: "New password should be different from the old password.", code: "same_password" }, "Choose a password you haven't used before."],
    [{ message: "Failed to fetch", name: "AuthRetryableFetchError", status: 0 }, "Couldn't reach the server. Check your connection and try again."],
    [{ message: "database exploded: secret internal detail" }, "Something went wrong. Please try again."],
  ];
  it.each(cases)("maps %j", (err, expected) => expect(friendlyAuthError(err)).toBe(expected));
  it("never leaks raw server text", () => {
    expect(friendlyAuthError({ message: "pg: relation public.secrets does not exist" })).not.toContain("secrets");
  });
});

const fakeAuthClient = (over: Record<string, unknown>) => ({ auth: over }) as unknown as SupabaseClient;

describe("signUp", () => {
  it("asks the person to confirm their email when no session comes back", async () => {
    const auth = createAuth(fakeAuthClient({ signUp: async () => ({ data: { user: { identities: [{}] }, session: null }, error: null }) }), "https://x");
    expect(await auth.signUp({ name: "Ada", email: "a@b.co", password: "12345678" })).toEqual({ ok: true, needsConfirmation: true });
  });
  it("signs straight in when confirmation is off", async () => {
    const auth = createAuth(fakeAuthClient({ signUp: async () => ({ data: { user: { identities: [{}] }, session: {} }, error: null }) }), "https://x");
    expect(await auth.signUp({ name: "Ada", email: "a@b.co", password: "12345678" })).toEqual({ ok: true, needsConfirmation: false });
  });
  it("spots a duplicate account that Supabase hides behind a fake user", async () => {
    const auth = createAuth(fakeAuthClient({ signUp: async () => ({ data: { user: { identities: [] }, session: null }, error: null }) }), "https://x");
    const r = await auth.signUp({ name: "Ada", email: "a@b.co", password: "12345678" });
    expect(r).toEqual({ ok: false, message: "There's already an account with that email. Try logging in." });
  });
  it("turns a thrown network error into a friendly message", async () => {
    const auth = createAuth(fakeAuthClient({ signIn: undefined, signInWithPassword: async () => { throw Object.assign(new Error("Failed to fetch"), { name: "AuthRetryableFetchError" }); } }), "https://x");
    const r = await auth.signIn({ email: "a@b.co", password: "12345678" });
    expect(r).toEqual({ ok: false, message: "Couldn't reach the server. Check your connection and try again." });
  });
  it("sends reset links back to this app", async () => {
    let seen: unknown;
    const auth = createAuth(fakeAuthClient({ resetPasswordForEmail: async (_e: string, o: unknown) => { seen = o; return { error: null }; } }), "https://spal.example");
    await auth.requestReset("a@b.co");
    expect(seen).toEqual({ redirectTo: "https://spal.example/reset-password" });
  });
});

describe("remote store", () => {
  const table = (rows: unknown) => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: rows, error: null }), then: undefined }) }) });
  it("cleans whatever the server sends", async () => {
    const client = {
      from: (t: string) =>
        t === "profiles"
          ? table({ answers: { stage: "idea", goal: "nonsense" }, completed: "yes" })
          : { select: () => ({ eq: async () => ({ data: [{ module_id: "setup-name", steps: [1, 1, 99], done_at: null }, { module_id: "gone", steps: [0], done_at: null }], error: null }) }) },
    } as unknown as SupabaseClient;
    const loaded = await createStore(client, "u1").load();
    expect(loaded).toEqual({ answers: { stage: "idea" }, completed: false, activity: { days: [], learning: true }, progress: { "setup-name": { steps: [1] } } });
  });
  it("returns null when the person has no profile row yet", async () => {
    const client = { from: (t: string) => (t === "profiles" ? table(null) : { select: () => ({ eq: async () => ({ data: [], error: null }) }) }) } as unknown as SupabaseClient;
    expect(await createStore(client, "u1").load()).toBeNull();
  });
  it("throws when the server errors, so callers can retry instead of assuming empty", async () => {
    const boom = { message: "network down" };
    const client = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: boom }), then: (r: (v: unknown) => void) => r({ data: [], error: null }) }) }) }) } as unknown as SupabaseClient;
    await expect(createStore(client, "u1").load()).rejects.toBeDefined();
  });
});
