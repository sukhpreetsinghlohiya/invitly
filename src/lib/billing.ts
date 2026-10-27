import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const PLAN_IDS = ["free", "pro"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export type PlanDefinition = {
  id: PlanId;
  name: string;
  tagline: string;
  priceLabel: string;
  amountPaise: number;
  highlights: string[];
  cta: string;
  limitLabel: string;
};

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "First Looks",
    tagline: "Try Invitly, no payment needed.",
    priceLabel: "Free",
    amountPaise: 0,
    limitLabel: "2 invitations",
    highlights: [
      "Create up to 2 full invitations",
      "Every template, every occasion",
      "Guest RSVPs & live updates",
      "Share by WhatsApp link",
    ],
    cta: "Start free",
  },
  pro: {
    id: "pro",
    name: "The Full Celebration",
    tagline: "For the people who are planning the whole thing.",
    priceLabel: "₹999",
    amountPaise: 99900,
    limitLabel: "Unlimited invitations",
    highlights: [
      "Unlimited invitations for one year",
      "No Invitly watermark on your pages",
      "Priority support when it matters",
      "Early access to new templates",
    ],
    cta: "Upgrade to Pro",
  },
};

export const PRO_DURATION_DAYS = 365;

export type UserPlanRecord = {
  plan: PlanId;
  status: "inactive" | "active" | "expired" | "refunded";
  activatedAt: string | null;
  expiresAt: string | null;
};

export const DEFAULT_PLAN: UserPlanRecord = {
  plan: "free",
  status: "inactive",
  activatedAt: null,
  expiresAt: null,
};

export async function getUserPlan(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<UserPlanRecord> {
  const { data, error } = await client
    .from("user_plans")
    .select("plan, status, activated_at, expires_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return DEFAULT_PLAN;
  return {
    plan: (data.plan as PlanId) ?? "free",
    status: data.status as UserPlanRecord["status"],
    activatedAt: data.activated_at,
    expiresAt: data.expires_at,
  };
}

export function isPlanActive(plan: UserPlanRecord) {
  if (plan.plan !== "pro" || plan.status !== "active") return false;
  if (!plan.expiresAt) return true;
  return new Date(plan.expiresAt).getTime() > Date.now();
}
