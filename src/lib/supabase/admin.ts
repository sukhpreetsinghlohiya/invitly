import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { requireSupabaseConfig } from "@/lib/env";

// Service-role client. Only call from server routes that have already
// authenticated the user and only to write server-controlled rows
// (user_plans, billing_events). Never expose the key to the browser.
export function getSupabaseServiceConfig() {
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!secret) return null;
  const { url } = requireSupabaseConfig();
  return { url, secret };
}

export function createAdminClient() {
  const config = getSupabaseServiceConfig();
  if (!config) throw new Error("Supabase secret key is not configured.");
  return createSupabaseClient<Database>(config.url, config.secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
