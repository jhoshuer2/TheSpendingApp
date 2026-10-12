// Supabase Edge Function (Deno): the SPAL assistant. See docs/ASSISTANT.md for how to deploy it.
// This file is only glue: it connects the real services to the logic in core.ts, which is what the tests cover.
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { handle, ModelError, readConfig, type Deps, type ModelParams } from "./core.ts";
import type { Block } from "../_shared/assistant-protocol.ts";

declare const Deno: { env: { get(name: string): string | undefined }; serve(handler: (req: Request) => Response | Promise<Response>): void };

const env = (n: string) => Deno.env.get(n);
const config = readConfig(env);

// Allowed callers. "*" is fine here: the function is protected by the person's sign-in token, not by cookies.
const cors = {
  "Access-Control-Allow-Origin": env("ASSISTANT_ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Created once and reused across requests while the function stays warm.
let anthropic: Anthropic | null = null;
const getAnthropic = () => (anthropic ??= new Anthropic({ apiKey: env("ANTHROPIC_API_KEY") }));
const db = createClient(env("SUPABASE_URL") ?? "", env("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });

const deps: Deps = {
  config,

  async authenticate(authorization) {
    const token = authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return null;
    const { data, error } = await db.auth.getUser(token);
    return error || !data.user ? null : { userId: data.user.id };
  },

  async takeQuota(userId) {
    const { data, error } = await db.rpc("assistant_take_quota", { p_user: userId, p_user_limit: config.dailyLimit, p_global_limit: config.globalDailyLimit });
    if (error) throw error; // can't count usage => don't spend money
    return data === "user_limit" || data === "global_limit" ? data : "ok";
  },

  async callModel(p: ModelParams) {
    try {
      const msg = await getAnthropic().beta.messages.create({
        model: p.model,
        max_tokens: p.maxTokens,
        system: p.system,
        tools: p.tools as unknown as Anthropic.Beta.BetaTool[],
        messages: p.messages as unknown as Anthropic.Beta.BetaMessageParam[],
        output_config: { effort: p.effort },
        cache_control: { type: "ephemeral" },
        // If a safety classifier declines, retry on a fallback model automatically.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      });
      return {
        content: msg.content as unknown as Block[],
        stopReason: msg.stop_reason,
        model: msg.model,
        usage: { input: msg.usage.input_tokens, output: msg.usage.output_tokens, cacheRead: msg.usage.cache_read_input_tokens ?? 0 },
      };
    } catch (e) {
      // Log what went wrong without logging anything the person said.
      console.error("assistant model error", e instanceof Anthropic.APIError ? e.status : String(e).slice(0, 80));
      if (e instanceof Anthropic.RateLimitError || (e instanceof Anthropic.APIError && typeof e.status === "number" && e.status >= 500)) throw new ModelError("busy");
      if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) throw new ModelError("config");
      throw new ModelError("failed");
    }
  },

  async recordUsage(userId, u) {
    await db.rpc("assistant_record_usage", { p_user: userId, p_input: u.input, p_output: u.output, p_cache_read: u.cacheRead });
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed", message: "Use POST." });
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    /* handled below as a bad request */
  }
  const result = await handle(body, req.headers.get("Authorization"), deps);
  return json(result.status, result.body);
});
