import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseConfig } from "@/lib/env";
import type { Database } from "@/types/database";

// Guest reads always use the public key without a host session. RLS decides
// which events are published, including when the visitor happens to be a host.
export function createPublicClient() {
  const { url, key } = requireSupabaseConfig();
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) } });
}
