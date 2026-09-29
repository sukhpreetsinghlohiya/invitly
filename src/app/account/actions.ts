"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut(): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) return { error: "We couldn’t sign you out. Please try again." };
  } catch {
    return { error: "We couldn’t reach the account service. Please try signing out again." };
  }
  redirect("/login");
}
