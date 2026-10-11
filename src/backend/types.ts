import type { Answers } from "../profile/types";

export interface Session {
  /** Stable id: the Supabase user id, or the email in local demo mode. */
  id: string;
  name: string;
  email: string;
}

export type AuthResult = { ok: true; needsConfirmation?: boolean } | { ok: false; message: string };

export interface AuthApi {
  /** "supabase" = real accounts. "local" = demo mode: nothing is verified or sent anywhere. */
  readonly mode: "supabase" | "local";
  getSession(): Promise<Session | null>;
  /** Called whenever the signed-in person changes. `recovery` is set when arriving from a reset-password link. */
  onChange(cb: (s: Session | null, event?: "recovery") => void): () => void;
  signUp(input: { name: string; email: string; password: string }): Promise<AuthResult>;
  signIn(input: { email: string; password: string }): Promise<AuthResult>;
  signOut(): Promise<void>;
  requestReset(email: string): Promise<AuthResult>;
  updatePassword(password: string): Promise<AuthResult>;
}

export interface RemoteProgress {
  steps: number[];
  doneAt?: string;
}

export interface RemoteProfile {
  answers: Answers;
  completed: boolean;
  progress: Record<string, RemoteProgress>;
}

/** One person's data on the server. Methods throw when the server can't be reached. */
export interface RemoteStore {
  /** null when the person has no profile row yet. */
  load(): Promise<RemoteProfile | null>;
  saveAnswers(answers: Answers, completed: boolean): Promise<void>;
  saveProgress(moduleId: string, progress: RemoteProgress): Promise<void>;
}

export interface Backend {
  auth: AuthApi;
  /** Server storage for a person, or null in local demo mode. */
  storeFor(userId: string): RemoteStore | null;
}
