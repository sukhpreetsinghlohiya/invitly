import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const CREDITS_PER_INVITATION = 100;
export const SIGNUP_CREDIT_GRANT = 200;

export const PACK_IDS = ["starter", "family", "studio", "atelier"] as const;
export type PackId = (typeof PACK_IDS)[number];

export type CreditPack = {
  id: PackId;
  name: string;
  tagline: string;
  credits: number;
  amountPaise: number;
  priceLabel: string;
  perInviteLabel: string;
  savingsLabel?: string;
  featured?: boolean;
};

export const PACKS: Record<PackId, CreditPack> = {
  starter: {
    id: "starter",
    name: "A small moment",
    tagline: "One beautiful invitation.",
    credits: 100,
    amountPaise: 4900,
    priceLabel: "₹49",
    perInviteLabel: "₹49 / invitation",
  },
  family: {
    id: "family",
    name: "A family affair",
    tagline: "For the full week of functions.",
    credits: 500,
    amountPaise: 19900,
    priceLabel: "₹199",
    perInviteLabel: "₹39 / invitation",
    savingsLabel: "Save ₹46",
    featured: true,
  },
  studio: {
    id: "studio",
    name: "A season of celebrations",
    tagline: "A dozen invitations, one wedding, every function.",
    credits: 1200,
    amountPaise: 39900,
    priceLabel: "₹399",
    perInviteLabel: "₹33 / invitation",
    savingsLabel: "Save ₹189",
  },
  atelier: {
    id: "atelier",
    name: "A studio year",
    tagline: "Hosts, planners, big families.",
    credits: 3000,
    amountPaise: 89900,
    priceLabel: "₹899",
    perInviteLabel: "₹30 / invitation",
    savingsLabel: "Save ₹571",
  },
};

export type CreditBalance = {
  balance: number;
  lifetimePurchased: number;
  invitationsAvailable: number;
};

export async function getUserCredits(client: SupabaseClient<Database>, userId: string): Promise<CreditBalance> {
  const { data } = await client
    .from("user_credits")
    .select("balance, lifetime_purchased")
    .eq("user_id", userId)
    .maybeSingle();
  const balance = data?.balance ?? 0;
  const lifetimePurchased = data?.lifetime_purchased ?? 0;
  return { balance, lifetimePurchased, invitationsAvailable: Math.floor(balance / CREDITS_PER_INVITATION) };
}

export type CreditTransaction = {
  id: string;
  delta: number;
  reason: Database["public"]["Tables"]["credit_transactions"]["Row"]["reason"];
  note: string | null;
  createdAt: string;
};

export async function getRecentCreditTransactions(
  client: SupabaseClient<Database>,
  userId: string,
  limit = 10,
): Promise<CreditTransaction[]> {
  const { data } = await client
    .from("credit_transactions")
    .select("id, delta, reason, note, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!data) return [];
  return data.map((row) => ({ id: row.id, delta: row.delta, reason: row.reason, note: row.note, createdAt: row.created_at }));
}
