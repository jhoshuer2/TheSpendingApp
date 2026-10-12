import type { Activity, Progress } from "../profile/state";
import type { Expense, Product, Sale } from "../records/types";
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

export type RemoteProgress = Progress;

export interface RemoteProfile {
  answers: Answers;
  completed: boolean;
  activity: Activity;
  progress: Record<string, RemoteProgress>;
}

/** One person's data on the server. Methods throw when the server can't be reached. */
export interface RemoteStore {
  /** null when the person has no profile row yet. */
  load(): Promise<RemoteProfile | null>;
  saveProfile(p: { answers: Answers; completed: boolean; activity: Activity }): Promise<void>;
  saveProgress(moduleId: string, progress: RemoteProgress): Promise<void>;
}

/** The server refused this data and always will (a bad value, or a rule it breaks). Retrying can't help; a lost connection is different. */
export class PermanentError extends Error {}

export interface RecordsBatch {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
}

/** One person's books on the server. Methods throw when the server can't be reached. */
export interface RemoteRecords {
  /** Everything, or only what changed since `since` (the cursor from the last pull). */
  pull(since?: string): Promise<RecordsBatch & { cursor?: string }>;
  /** Save rows. Safe to repeat: rows are matched by id. */
  push(batch: RecordsBatch): Promise<void>;
}

/** The assistant on the server. Throws a ChatError when it can't answer. */
export interface RemoteAssistant {
  send(messages: unknown[]): Promise<{ content: { type: string; [k: string]: unknown }[]; stopReason: string | null }>;
}

export interface Backend {
  auth: AuthApi;
  /** Server storage for a person, or null in local demo mode. */
  storeFor(userId: string): RemoteStore | null;
  /** The person's books on the server, or null in local demo mode. */
  recordsFor(userId: string): RemoteRecords | null;
  /** The assistant, or null in local demo mode (it needs an account). */
  assistant(): RemoteAssistant | null;
}
