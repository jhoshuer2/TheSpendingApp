import { createClient } from "@supabase/supabase-js";
import { localBackend } from "./local";
import { createSupabaseBackend } from "./supabase";
import type { Backend } from "./types";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Real accounts when a Supabase project is configured; otherwise local demo mode. */
export const backend: Backend =
  url && key
    ? createSupabaseBackend(createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }), window.location.origin)
    : localBackend;

export type { AuthResult, Session } from "./types";
