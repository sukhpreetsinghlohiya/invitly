import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { ALLOWANCE_UNAVAILABLE_MESSAGE, FREE_INVITATION_LIMIT } from "./invitation-plan";
import { getUserPlan, isPlanActive, type UserPlanRecord } from "./billing";

export type InvitationAllowance = {
  used: number;
  remaining: number;
  limitReached: boolean;
  unlimited: boolean;
  plan: UserPlanRecord;
};

export async function getInvitationAllowance(client: SupabaseClient<Database>, userId: string): Promise<InvitationAllowance> {
  const [{ data, error }, plan] = await Promise.all([
    client.from("invitation_allowances").select("invitations_used").eq("user_id", userId).maybeSingle(),
    getUserPlan(client, userId),
  ]);
  if (error) throw new Error(ALLOWANCE_UNAVAILABLE_MESSAGE);
  const used = data?.invitations_used ?? 0;
  const unlimited = isPlanActive(plan);
  if (unlimited) return { used, remaining: Number.POSITIVE_INFINITY, limitReached: false, unlimited, plan };
  return { used, remaining: Math.max(0, FREE_INVITATION_LIMIT - used), limitReached: used >= FREE_INVITATION_LIMIT, unlimited, plan };
}
