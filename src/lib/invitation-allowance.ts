import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { ALLOWANCE_UNAVAILABLE_MESSAGE, FREE_INVITATION_LIMIT } from "./invitation-plan";

export async function getInvitationAllowance(client: SupabaseClient<Database>, userId: string) {
  const { data, error } = await client.from("invitation_allowances").select("invitations_used").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(ALLOWANCE_UNAVAILABLE_MESSAGE);
  const used = data?.invitations_used ?? 0;
  return { used, remaining: Math.max(0, FREE_INVITATION_LIMIT - used), limitReached: used >= FREE_INVITATION_LIMIT };
}
