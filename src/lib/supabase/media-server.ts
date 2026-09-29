import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseConfig } from "@/lib/env";
import type { Database } from "@/types/database";

// Only the private image proxy uses this client, after publication authorization.
// Never issue signed URLs: they would outlive an invitation being unpublished.
export function createMediaServiceClient() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("Published photos require the server-only media configuration.");
  return createClient<Database>(requireSupabaseConfig().url, secret, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
