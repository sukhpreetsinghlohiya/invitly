import "server-only";
import { redirect } from "next/navigation";
import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function redirectSignedInHost() {
  if (!getSupabaseConfig()) return;
  let signedIn = false;
  try {
    const client = await createClient();
    const { data, error } = await client.auth.getUser();
    signedIn = !error && Boolean(data.user);
  } catch { /* Keep auth forms available if the account service is down. */ }
  if (signedIn) redirect("/dashboard");
}
