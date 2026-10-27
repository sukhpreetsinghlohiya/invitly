import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { ALLOWANCE_UNAVAILABLE_MESSAGE } from "./invitation-plan";
import { CREDITS_PER_INVITATION, getUserCredits } from "./billing";

export type InvitationAllowance = {
  balance: number;
  invitationsAvailable: number;
  limitReached: boolean;
  lifetimePurchased: number;
};

export async function getInvitationAllowance(client: SupabaseClient<Database>, userId: string): Promise<InvitationAllowance> {
  const credits = await getUserCredits(client, userId).catch(() => {
    throw new Error(ALLOWANCE_UNAVAILABLE_MESSAGE);
  });
  return {
    balance: credits.balance,
    invitationsAvailable: credits.invitationsAvailable,
    limitReached: credits.balance < CREDITS_PER_INVITATION,
    lifetimePurchased: credits.lifetimePurchased,
  };
}
