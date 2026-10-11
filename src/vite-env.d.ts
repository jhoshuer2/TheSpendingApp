/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL. Leave unset to run in local demo mode. */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon (public) key. Safe in the browser: row-level security protects the data. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}
