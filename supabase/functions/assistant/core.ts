import { SYSTEM_PROMPT, TOOLS, validateRequest, type Block, type ChatMessage } from "../_shared/assistant-protocol.ts";

/** Everything the function needs from the outside world, so the logic can be tested without any of it. */
export interface ModelParams {
  model: string;
  maxTokens: number;
  effort: "low" | "medium" | "high";
  system: string;
  tools: typeof TOOLS;
  messages: ChatMessage[];
}
export interface ModelReply {
  content: Block[];
  stopReason: string | null;
  model: string;
  usage: { input: number; output: number; cacheRead: number };
}
/** Thrown by the model adapter. The reason is for us; the person only ever sees a friendly message. */
export class ModelError extends Error {
  constructor(public reason: "busy" | "config" | "failed") {
    super(reason);
  }
}

export type Quota = "ok" | "user_limit" | "global_limit";

export interface Deps {
  /** Who is calling, from their sign-in token. null = not signed in. */
  authenticate(authorization: string | null): Promise<{ userId: string } | null>;
  takeQuota(userId: string): Promise<Quota>;
  callModel(params: ModelParams): Promise<ModelReply>;
  recordUsage(userId: string, usage: ModelReply["usage"]): Promise<void>;
  config: { enabled: boolean; model: string; effort: "low" | "medium" | "high"; maxTokens: number };
}

export interface Result {
  status: number;
  body: Record<string, unknown>;
}

const fail = (status: number, error: string, message: string, extra: Record<string, unknown> = {}): Result => ({ status, body: { error, message, ...extra } });

/**
 * One request from the app: check who it is, check the request, check the limits, ask the model, record the cost.
 * Order matters: nothing costs money until the person is signed in, the request is valid and they are within limits.
 */
export async function handle(body: unknown, authorization: string | null, deps: Deps): Promise<Result> {
  if (!deps.config.enabled) return fail(503, "disabled", "The assistant is switched off for now.");

  const user = await deps.authenticate(authorization);
  if (!user) return fail(401, "unauthorized", "Please sign in again.");

  const v = validateRequest(body);
  if (!v.ok) return fail(v.status, v.error, v.message);

  const quota = await deps.takeQuota(user.userId);
  if (quota === "user_limit") return fail(429, "quota", "You've used all your assistant messages for today. They come back tomorrow.", { scope: "user" });
  if (quota === "global_limit") return fail(429, "quota", "The assistant is very busy right now. Please try again later.", { scope: "global" });

  try {
    const reply = await deps.callModel({
      model: deps.config.model,
      maxTokens: deps.config.maxTokens,
      effort: deps.config.effort,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages: v.messages,
    });
    // Recording the cost must never stop the person getting their answer.
    await deps.recordUsage(user.userId, reply.usage).catch(() => undefined);
    return { status: 200, body: { content: reply.content, stop_reason: reply.stopReason, model: reply.model, usage: reply.usage } };
  } catch (e) {
    const reason = e instanceof ModelError ? e.reason : "failed";
    if (reason === "busy") return fail(503, "busy", "The assistant is busy. Please try again in a moment.");
    if (reason === "config") return fail(500, "not_configured", "The assistant isn't set up properly yet.");
    return fail(502, "model_failed", "The assistant couldn't answer just now. Please try again.");
  }
}

const EFFORTS = ["low", "medium", "high"] as const;
const int = (v: string | undefined, fallback: number, min: number, max: number) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : fallback;
};

/** Settings come from the function's secrets. Bad or missing values fall back to safe defaults. */
export function readConfig(env: (name: string) => string | undefined) {
  const effort = EFFORTS.find((e) => e === env("ASSISTANT_EFFORT")) ?? "medium";
  return {
    enabled: env("ASSISTANT_ENABLED") !== "false",
    model: (env("ASSISTANT_MODEL") ?? "").trim() || "claude-opus-5-5",
    effort,
    maxTokens: int(env("ASSISTANT_MAX_TOKENS"), 4000, 1000, 16000),
    dailyLimit: int(env("ASSISTANT_DAILY_LIMIT"), 25, 1, 1000),
    globalDailyLimit: int(env("ASSISTANT_GLOBAL_DAILY_LIMIT"), 2000, 1, 1_000_000),
  };
}
